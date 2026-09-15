import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BattleArena from "@/components/BattleArena";
import { getBronzeKnights, getGoldKnights } from "@/lib/knights";

describe("BattleArena", () => {
  it("muestra a los dos luchadores y sus ataques", () => {
    const player = getBronzeKnights()[0];
    const enemy = getGoldKnights()[0];
    render(
      <BattleArena
        player={player}
        playerHp={10}
        enemy={enemy}
        enemyHp={enemy.vida}
        lastRound={null}
        onAttack={vi.fn()}
      />
    );

    expect(screen.getByText(player.name)).toBeInTheDocument();
    expect(screen.getByText(enemy.name)).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(
      player.attacks.length
    );
  });

  it("llama a onAttack con el índice del ataque pulsado", () => {
    const player = getBronzeKnights()[0];
    const enemy = getGoldKnights()[0];
    const onAttack = vi.fn();
    render(
      <BattleArena
        player={player}
        playerHp={10}
        enemy={enemy}
        enemyHp={enemy.vida}
        lastRound={null}
        onAttack={onAttack}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: player.attacks[1] }));
    expect(onAttack).toHaveBeenCalledWith(1);
  });

  it("muestra el log de la última ronda", () => {
    const player = getBronzeKnights()[0];
    const enemy = getGoldKnights()[0];
    render(
      <BattleArena
        player={player}
        playerHp={10}
        enemy={enemy}
        enemyHp={enemy.vida}
        lastRound={{
          playerRoll: 8,
          enemyRoll: 2,
          playerAttack: player.attacks[0],
          enemyAttack: enemy.attacks[0],
          damage: 6,
          heal: 3,
          winner: "player",
        }}
        onAttack={vi.fn()}
      />
    );

    expect(screen.getByText(/Enemigo −6/)).toBeInTheDocument();
    expect(screen.getByText(/te recuperas \+3/)).toBeInTheDocument();
  });
});