import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const knightId = body?.knightId;

  if (typeof knightId !== "number") {
    return NextResponse.json({ error: "knightId inválido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("runs")
    .insert({ owner_id: user.id, knight_id: knightId })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "error de base de datos" }, { status: 500 });
  }

  await supabase.from("profiles").update({ knight_id: knightId }).eq("id", user.id);

  return NextResponse.json({ runId: data.id });
}