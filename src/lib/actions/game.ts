"use server";

import { z } from "zod";

import { computeLevel } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export interface StartRunResponse {
  runId: string;
}

export interface BattlePayload {
  runId: string;
  goldId: number;
  outcome: "win" | "loss";
  playerRoll: number;
  goldRoll: number;
  damage: number;
}

export interface EndRunResponse {
  ok: boolean;
  profile?: {
    wins: number;
    losses: number;
    level: number;
  };
}

const startRunSchema = z.object({
  knightId: z.number().int().positive(),
});

const recordBattleSchema = z.object({
  runId: z.string().min(1),
  goldId: z.number().int().nonnegative(),
  outcome: z.enum(["win", "loss"]),
  playerRoll: z.number().int().min(0).max(9),
  goldRoll: z.number().int().min(0).max(9),
  damage: z.number().int().min(0),
});

const endRunSchema = z.object({
  runId: z.string().min(1),
  status: z.enum(["won", "lost"]),
});

export async function startRun(knightId: number): Promise<StartRunResponse | null> {
  const parsed = startRunSchema.safeParse({ knightId });
  if (!parsed.success) return null;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("runs")
    .insert({ owner_id: user.id, knight_id: parsed.data.knightId })
    .select("id")
    .single();

  if (error || !data) {
    console.error("startRun:", error?.message);
    return null;
  }

  await supabase
    .from("profiles")
    .update({ knight_id: parsed.data.knightId })
    .eq("id", user.id);

  return { runId: data.id };
}

export async function recordBattle(payload: BattlePayload): Promise<boolean> {
  const parsed = recordBattleSchema.safeParse(payload);
  if (!parsed.success) return false;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { runId, outcome } = parsed.data;

  const { data: run, error: runError } = await supabase
    .from("runs")
    .select("id, status, golds_defeated")
    .eq("id", runId)
    .eq("owner_id", user.id)
    .single();

  if (runError || !run || run.status !== "active") return false;

  const { error } = await supabase.from("battles").insert({
    run_id: runId,
    gold_id: parsed.data.goldId,
    outcome,
    player_roll: parsed.data.playerRoll,
    gold_roll: parsed.data.goldRoll,
    damage: parsed.data.damage,
  });

  if (error) {
    console.error("recordBattle:", error.message);
    return false;
  }

  if (outcome === "win" && (run.golds_defeated ?? 0) < 12) {
    await supabase
      .from("runs")
      .update({ golds_defeated: (run.golds_defeated ?? 0) + 1 })
      .eq("id", runId)
      .eq("owner_id", user.id);
  }

  return true;
}

export async function endRun(
  runId: string,
  status: "won" | "lost"
): Promise<EndRunResponse | null> {
  const parsed = endRunSchema.safeParse({ runId, status });
  if (!parsed.success) return null;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: run, error: runError } = await supabase
    .from("runs")
    .select("id, status")
    .eq("id", parsed.data.runId)
    .eq("owner_id", user.id)
    .single();

  if (runError || !run || run.status !== "active") return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("wins, losses")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("endRun:", profileError.message);
    return null;
  }

  const wins = (profile?.wins ?? 0) + (parsed.data.status === "won" ? 1 : 0);
  const losses = (profile?.losses ?? 0) + (parsed.data.status === "lost" ? 1 : 0);
  const level = computeLevel(wins);

  const { error: runUpdateError } = await supabase
    .from("runs")
    .update({ status: parsed.data.status, ended_at: new Date().toISOString() })
    .eq("id", parsed.data.runId)
    .eq("owner_id", user.id);

  if (runUpdateError) {
    console.error("endRun:", runUpdateError.message);
    return null;
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ wins, losses, level })
    .eq("id", user.id);

  if (profileUpdateError) {
    console.error("endRun:", profileUpdateError.message);
    return null;
  }

  return { ok: true, profile: { wins, losses, level } };
}