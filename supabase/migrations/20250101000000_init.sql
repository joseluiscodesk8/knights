-- Knights: esquema inicial (profiles, runs, battles + RLS)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  knight_id int,
  wins int not null default 0,
  losses int not null default 0,
  level int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  knight_id int not null,
  status text not null default 'active'
    check (status in ('active', 'won', 'lost')),
  golds_defeated int not null default 0,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs (id) on delete cascade,
  gold_id int not null,
  outcome text not null check (outcome in ('win', 'loss')),
  player_roll int,
  gold_roll int,
  damage int,
  created_at timestamptz not null default now()
);

create index if not exists runs_owner_id_idx on public.runs (owner_id);
create index if not exists battles_run_id_idx on public.battles (run_id);

-- Trigger: crear el perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: cada usuario solo accede a sus propios datos
alter table public.profiles enable row level security;
alter table public.runs enable row level security;
alter table public.battles enable row level security;

-- Grants (la API pública usa la key anon)
revoke all on table public.profiles from anon;
revoke all on table public.runs from anon;
revoke all on table public.battles from anon;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.runs to authenticated;
grant select, insert, delete on table public.battles to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can read own runs" on public.runs;
create policy "Users can read own runs"
  on public.runs for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own runs" on public.runs;
create policy "Users can insert own runs"
  on public.runs for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own runs" on public.runs;
create policy "Users can update own runs"
  on public.runs for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can delete own runs" on public.runs;
create policy "Users can delete own runs"
  on public.runs for delete
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Users can read own battles" on public.battles;
create policy "Users can read own battles"
  on public.battles for select
  to authenticated
  using (
    exists (
      select 1 from public.runs r
      where r.id = battles.run_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own battles" on public.battles;
create policy "Users can insert own battles"
  on public.battles for insert
  to authenticated
  with check (
    exists (
      select 1 from public.runs r
      where r.id = run_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own battles" on public.battles;
create policy "Users can delete own battles"
  on public.battles for delete
  to authenticated
  using (
    exists (
      select 1 from public.runs r
      where r.id = battles.run_id and r.owner_id = auth.uid()
    )
  );