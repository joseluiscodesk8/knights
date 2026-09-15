import { describe, expect, it } from "vitest";

import { resolveRound, rollAttack } from "@/lib/battle";

describe("rollAttack", () => {
  it("devuelve un número entre 0 y 9", () => {
    for (let i = 0; i < 500; i++) {
      const roll = rollAttack();
      expect(roll).toBeGreaterThanOrEqual(0);
      expect(roll).toBeLessThan(10);
      expect(Number.isInteger(roll)).toBe(true);
    }
  });
});

describe("resolveRound", () => {
  const playerAttack = "Meteor";
  const enemyAttack = "Galaxian";

  it("gana el jugador: resta la diferencia y cura la mitad redondeada", () => {
    const result = resolveRound(7, 3, playerAttack, enemyAttack);
    expect(result.winner).toBe("player");
    expect(result.damage).toBe(4);
    expect(result.heal).toBe(2);
    expect(result.playerAttack).toBe(playerAttack);
    expect(result.enemyAttack).toBe(enemyAttack);
  });

  it("gana el enemigo: resta la diferencia y no cura", () => {
    const result = resolveRound(2, 8, playerAttack, enemyAttack);
    expect(result.winner).toBe("enemy");
    expect(result.damage).toBe(6);
    expect(result.heal).toBe(0);
  });

  it("empate: sin daño ni curación", () => {
    const result = resolveRound(5, 5, playerAttack, enemyAttack);
    expect(result.winner).toBe("tie");
    expect(result.damage).toBe(0);
    expect(result.heal).toBe(0);
  });

  it("curación impar se redondea hacia arriba", () => {
    const result = resolveRound(6, 1, playerAttack, enemyAttack);
    expect(result.winner).toBe("player");
    expect(result.damage).toBe(5);
    expect(result.heal).toBe(3);
  });
});