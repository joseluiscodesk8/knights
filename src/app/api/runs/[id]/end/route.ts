import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

function computeLevel(wins: number): number {
  return 1 + Math.floor(wins / 3);
}

export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient();
  const { id: runId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const {
    data: run,
    error: runError,
  } = await supabase
    .from("runs")
    .select("id, status")
    .eq("id", runId)
    .eq("owner_id", user.id)
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: "campaña no encontrada" }, { status: 404 });
  }

  if (run.status !== "active") {
    return NextResponse.json({ error: "la campaña ya terminó" }, { status: 409 });
  }

  const body = await request.json();
  const status = body?.status;
  if (status !== "won" && status !== "lost") {
    return NextResponse.json({ error: "status inválido" }, { status: 400 });
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("wins, losses")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const wins = (profile?.wins ?? 0) + (status === "won" ? 1 : 0);
  const losses = (profile?.losses ?? 0) + (status === "lost" ? 1 : 0);
  const level = computeLevel(wins);

  const { error: runUpdateError } = await supabase
    .from("runs")
    .update({ status, ended_at: new Date().toISOString() })
    .eq("id", runId)
    .eq("owner_id", user.id);

  if (runUpdateError) {
    return NextResponse.json({ error: runUpdateError.message }, { status: 500 });
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ wins, losses, level })
    .eq("id", user.id);

  if (profileUpdateError) {
    return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: { wins, losses, level } });
}