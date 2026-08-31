import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
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
    .select("id, status, golds_defeated")
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
  const outcome = body?.outcome;
  if (outcome !== "win" && outcome !== "loss") {
    return NextResponse.json({ error: "outcome inválido" }, { status: 400 });
  }

  const { error } = await supabase.from("battles").insert({
    run_id: runId,
    gold_id: typeof body?.goldId === "number" ? body.goldId : null,
    outcome,
    player_roll: typeof body?.playerRoll === "number" ? body.playerRoll : null,
    gold_roll: typeof body?.goldRoll === "number" ? body.goldRoll : null,
    damage: typeof body?.damage === "number" ? body.damage : null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (outcome === "win" && run.golds_defeated < 12) {
    await supabase
      .from("runs")
      .update({ golds_defeated: run.golds_defeated + 1 })
      .eq("id", runId)
      .eq("owner_id", user.id);
  }

  return NextResponse.json({ ok: true });
}