import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BattleArena from "@/components/BattleArena";
import { getBronzeKnights, getGoldKnights } from "@/lib/knights";

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    animate: (
      _from: number,
      to: number,
      options?: { onUpdate?: (value: number) => void; onComplete?: () => void }
    ) => {
      options?.onUpdate?.(to);
      options?.onComplete?.();
      return { stop: () => {} };
    },
  };
});

function baseProps() {
  const player = getBronzeKnights()[0];
  const enemy = getGoldKnights()[0];
  return {
    player,
    playerHp: 10,
    enemy,
    enemyHp: enemy.vida,
    lastRound: null,
    dodge: null,
    onAttack: vi.fn(),
    onDodgeHit: vi.fn(),
    onDodgeEnd: vi.fn(),
  };
}

describe("BattleArena", () => {
  it("muestra a los dos luchadores y sus ataques", () => {
    const props = baseProps();
    render(<BattleArena {...props} />);

    expect(screen.getByText(props.player.name)).toBeInTheDocument();
    expect(screen.getByText(props.enemy.name)).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(
      props.player.attacks.length
    );
  });

  it("llama a onAttack con el índice del ataque pulsado", () => {
    const props = baseProps();
    render(<BattleArena {...props} />);

    fireEvent.click(
      screen.getByRole("button", { name: props.player.attacks[1] })
    );
    expect(props.onAttack).toHaveBeenCalledWith(1);
  });

  it("muestra los números flotantes de la última ronda", async () => {
    const props = baseProps();
    render(
      <BattleArena
        {...props}
        lastRound={{
          playerRoll: 8,
          enemyRoll: 2,
          playerAttack: props.player.attacks[0],
          enemyAttack: props.enemy.attacks[0],
          damage: 6,
          heal: 3,
          winner: "player",
        }}
      />
    );

    expect(await screen.findByText("8", {}, { timeout: 400 })).toBeInTheDocument();
    expect(await screen.findByText("2", {}, { timeout: 400 })).toBeInTheDocument();
  });

  it("aplica daño al bronce cuando un rayo real impacta", async () => {
    vi.useFakeTimers();
    const props = baseProps();
    render(
      <BattleArena
        {...props}
        dodge={{ count: 1 }}
        lastRound={{
          playerRoll: 1,
          enemyRoll: 9,
          playerAttack: props.player.attacks[0],
          enemyAttack: props.enemy.attacks[0],
          damage: 8,
          heal: 0,
          winner: "enemy",
        }}
      />
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(props.onDodgeHit).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });
});