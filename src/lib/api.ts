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

export async function startRun(knightId: number): Promise<StartRunResponse | null> {
  try {
    const res = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ knightId }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function recordBattle(payload: BattlePayload): Promise<boolean> {
  try {
    const res = await fetch(`/api/runs/${payload.runId}/battles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function endRun(
  runId: string,
  status: "won" | "lost"
): Promise<EndRunResponse | null> {
  try {
    const res = await fetch(`/api/runs/${runId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}