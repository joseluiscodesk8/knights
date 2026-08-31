# Knights

Juego web en equipo: eliges un caballero de bronce y debes recorrer un mapa en canvas para enfrentarte en batalla por turnos a los 12 caballeros de oro. Cada ataque es un botón; jugador y máquina sacan un número al azar (0-9), el mayor gana y la diferencia se resta a la vida del perdedor (el bronce además se cura la mitad redondeada del daño que inflige).

Tiene **dos modos**: solitario (progreso guardado si te registras) y **multijugador** P2P (hasta 5 bronces en una partida conjunta contra los 12 gold, sin pasar datos por servidores propios).

## Stack

- **Next.js 16** (App Router) + React + SCSS Modules
- **Supabase** — PostgreSQL, Auth (email/password) y Row Level Security
- **Vercel** — frontend + backend serverless (route handlers)

## Características

- Jugar sin cuenta (invitado, sin guardado) o registrarse para persistir progreso
- Sesión mantenida con cookies (`@supabase/ssr` + middleware)
- Guardado simple: perfil con victorias, derrotas y nivel
- Cada campaña (`runs`) y cada pelea contra un gold (`battles`) quedan en la base de datos
- Página `/stats` con RLS: cada usuario solo lee lo suyo
- **Multijugador P2P (PeerJS/WebRTC)**: el anfitrión crea una sala con un código de
  4 letras, comparte el enlace y hasta 5 bronces cooperan en el mismo mapa y en una
  batalla conjunta por turnos contra los 12 gold. El host es la autoridad (valida
  movimientos y resuelve asaltos); la partida no se guarda en la base de datos.

Regla de nivel: `level = 1 + floor(victorias / 3)`.

**Producción:** https://knights-ten.vercel.app

## Setup

### 1. Variables de entorno

```bash
cp .env.example .env.local
```

Crea un proyecto en [supabase.com](https://supabase.com) (plan Free). Ve a
`Settings -> API Keys` y pega en `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 2. Base de datos (migraciones)

Instala la CLI de Supabase y aplica las migraciones:

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref TU_PROJECT_REF   # ref = subdominio del proyecto
supabase db push
```

Esto crea las tablas `profiles`, `runs` y `battles`, el trigger que crea el perfil al
registrarse, y las políticas RLS. (Auth con email/password es gratis y viene activo
por defecto; si quieres desactivar el correo de confirmación, búscalo en
`Authentication -> Providers -> Email`.)

### 3. Correr en local

```bash
npm install
npm run dev
```

### 4. Deploy a Vercel

```bash
npm i -g vercel
vercel
```

Al importar el proyecto a [vercel.com](https://vercel.com) añade las dos variables de
entorno anteriores y cada push a `main` se desplegará automáticamente.

## Estructura

```
src/
  app/
    page.tsx                    # juega (client)
    auth/login/page.tsx         # entrar / registrarse
    stats/page.tsx              # progreso (Server Component + RLS)
    api/runs/route.ts           # POST crear campaña
    api/runs/[id]/battles/route.ts
    api/runs/[id]/end/route.ts
  components/
    Game.tsx                    # máquina de estados del juego (modo solitario/multi)
    ModeChoice.tsx              # elegir modo después de escoger caballero
    KnightSelection.tsx         # elegir caballero de bronce
    GameMap.tsx                 # canvas + movimiento por botones
    BattleArena.tsx             # batalla por turnos
    Header.tsx                  # sesión / navegación
    multiplayer/
      MultiplayerGame.tsx       # orquestador host/guest (autoridad = host)
      LobbyView.tsx             # crear/unirse a sala con código
      CoopMap.tsx               # mapa en equipo (todos los jugadores)
      CoopBattle.tsx            # batalla conjunta por turnos
      MultiplayerEnd.tsx        # resultado de la partida en equipo
  lib/
    battle.ts                   # lógica del asalto (rolls + daño + curación)
    maze.ts                     # mapa y esquinas O/X
    knights.ts                  # extracción de datos de los JSON
    api.ts                      # llamadas al backend
    supabase/{client,server}.ts
    multiplayer/
      types.ts                  # protocolo, estados y mensajes compartidos
      transport.ts              # PeerJS (host/guest): conexión y envío
  data/
    bronce.json                 # los 5 caballeros de bronce
    gold.json                   # los 12 caballeros de oro
supabase/migrations/            # esquema + RLS (versionado)
```

## Roadmap

- [x] Multiplayer P2P (WebRTC/PeerJS): hasta 5 bronce en una partida en equipo
      contra los 12 gold, sin pasar datos por el servidor (misma WiFi o internet)
- [ ] Mapa dinámico: laberinto generado al azar cada vez
- [ ] Imágenes y sonidos reales en el canvas y en las batallas

## Notas de seguridad / decisiones

- Los knights viven en JSON estáticos (datos de juego, no de usuario).
- La base de datos guarda solo datos de usuario y nunca se expone la key de servicio.
- RLS por fila (`auth.uid() = owner_id`) protege todos los accesos, incluso desde el
  cliente con la key `anon`.