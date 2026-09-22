import { describe, expect, it, vi } from "vitest";

import type { Maze } from "@/lib/maze";

import {
  cloneState,
  disconnectPlayer,
  dodgeEnd,
  dodgeHit,
  goldCount,
  movePlayer,
  resolveAttack,
  startPlayState,
} from "./gameplay";
import type { RoomPlayer, RoomState } from "./types";

function testMaze(): Maze {
  return {
    grid: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    rows: 3,
    cols: 3,
    start: { row: 1, col: 1 },
    goal: { row: 0, col: 0 },
    fakeGoal: { row: 2, col: 2 },
  };
}

function player(id: string, overrides: Partial<RoomPlayer> = {}): RoomPlayer {
  return {
    id,
    name: id,
    knightId: 1,
    knightName: "Seiya",
    knightImage: "/seiya.png",
    attacks: ["Meteoro"],
    hp: 10,
    maxHp: 10,
    pos: { row: 1, col: 1 },
    alive: true,
    goldIndex: 0,
    inDuel: false,
    dodgeCount: null,
    ...overrides,
  };
}

function stateWith(
  players: RoomPlayer[],
  mazes: Record<number, Maze>
): RoomState {
  return { phase: "play", players, mazes, duels: {}, message: undefined };
}

function toFakeGoal(state: RoomState, playerId: string): void {
  movePlayer(state, playerId, { row: 2, col: 1 });
  movePlayer(state, playerId, { row: 2, col: 2 });
}

describe("gameplay multiplayer", () => {
  it("startPlayState prepara el mapa inicial de la etapa 0", () => {
    const state: RoomState = {
      phase: "lobby",
      players: [player("a")],
      mazes: {},
      duels: {},
      message: "hola",
    };
    const next = startPlayState(cloneState(state));
    expect(next.phase).toBe("play");
    expect(next.mazes[0]).toBeDefined();
    expect(next.players[0].goldIndex).toBe(0);
    expect(next.players[0].pos).toEqual(next.mazes[0].start);
  });

  it("moverse sin tocar una X no crea duelo", () => {
    const state = stateWith([player("a")], { 0: testMaze() });
    movePlayer(state, "a", { row: 0, col: 1 });
    expect(state.players[0].pos).toEqual({ row: 0, col: 1 });
    expect(Object.keys(state.duels)).toHaveLength(0);
  });

  it("en Géminis la X real adelanta y la falsa desata el duelo", () => {
    const state = stateWith(
      [
        player("a", { goldIndex: 2 }),
        player("b", { goldIndex: 2 }),
        player("c", { goldIndex: 2 }),
      ],
      { 2: testMaze() }
    );

    movePlayer(state, "a", { row: 0, col: 1 });
    movePlayer(state, "a", { row: 0, col: 0 });
    expect(state.players[0].goldIndex).toBe(3);
    expect(state.players[0].inDuel).toBe(false);
    expect(state.duels[2]).toBeUndefined();

    toFakeGoal(state, "b");
    expect(state.players[1].inDuel).toBe(true);
    expect(state.duels[2]).toBeDefined();
    expect(state.duels[2].turn).toBe(-1);

    toFakeGoal(state, "c");
    expect(state.duels[2].memberIds).toEqual(["b", "c"]);
    expect(state.duels[2].turn).toBe(0);
  });

  it("ganar el duelo promociona a los vivos y elimina el duelo", () => {
    const state = stateWith(
      [player("a", { goldIndex: 2 }), player("b", { goldIndex: 2 })],
      { 2: testMaze() }
    );
    toFakeGoal(state, "a");
    toFakeGoal(state, "b");
    expect(state.duels[2].turn).toBe(0);

    state.duels[2].goldHp = 7;
    const turnId = state.duels[2].memberIds[0];
    const actorIndex = state.players.findIndex((item) => item.id === turnId);

    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.95).mockReturnValueOnce(0.26);
    const next = resolveAttack(state, actorIndex, 0);
    spy.mockRestore();

    expect(next.players[0].goldIndex).toBe(3);
    expect(next.players[1].goldIndex).toBe(3);
    expect(next.players.every((item) => !item.inDuel)).toBe(true);
    expect(next.duels[2]).toBeUndefined();
  });

  it("si todo el grupo cae esquivando → gameover", () => {
    const state = stateWith(
      [
        player("a", { goldIndex: 2, hp: 1 }),
        player("b", { goldIndex: 2, hp: 1 }),
      ],
      { 2: testMaze() }
    );
    toFakeGoal(state, "a");
    toFakeGoal(state, "b");

    const spy = vi.spyOn(Math, "random");
    spy
      .mockReturnValueOnce(0.05)
      .mockReturnValueOnce(0.05)
      .mockReturnValueOnce(0.95)
      .mockReturnValueOnce(0.05)
      .mockReturnValueOnce(0.05)
      .mockReturnValueOnce(0.95);

    resolveAttack(state, 0, 0);
    expect(state.players[0].dodgeCount).toBe(9);
    expect(state.players[0].alive).toBe(true);
    dodgeHit(state, "a");
    expect(state.players[0].alive).toBe(false);
    dodgeEnd(state, "a");

    resolveAttack(state, 1, 0);
    expect(state.players[1].dodgeCount).toBe(9);
    dodgeHit(state, "b");
    expect(state.players[1].alive).toBe(false);
    dodgeEnd(state, "b");
    spy.mockRestore();

    expect(state.phase).toBe("end");
    expect(state.result).toBe("gameover");
  });

  it("golpe del Gold entra en esquiva y dodgeEnd rota turno y reduce HP por impacto", () => {
    const state = stateWith([player("a"), player("b")], { 0: testMaze() });
    movePlayer(state, "a", { row: 0, col: 1 });
    movePlayer(state, "a", { row: 0, col: 0 });
    movePlayer(state, "b", { row: 0, col: 1 });
    movePlayer(state, "b", { row: 0, col: 0 });
    expect(state.duels[0].turn).toBe(0);

    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValueOnce(0.05).mockReturnValueOnce(0.05).mockReturnValueOnce(0.95);

    resolveAttack(state, 0, 0);
    expect(state.players[0].dodgeCount).toBe(9);
    expect(state.players[0].hp).toBe(10);
    expect(state.duels[0].turn).toBe(0);

    dodgeHit(state, "a");
    expect(state.players[0].hp).toBe(9);

    dodgeEnd(state, "a");
    expect(state.players[0].dodgeCount).toBeNull();
    expect(state.duels[0].turn).toBe(1);

    spy.mockRestore();
  });

  it("desconectar a un jugador pendiente desbloquea el duelo", () => {
    const state = stateWith(
      [player("a", { goldIndex: 2 }), player("b", { goldIndex: 2 })],
      { 2: testMaze() }
    );
    toFakeGoal(state, "a");
    expect(state.duels[2].turn).toBe(-1);
    disconnectPlayer(state, "b");
    expect(state.duels[2].turn).toBe(0);
  });

  it("cuando no queda nadie vivo pero otro llegó al final → victoria", () => {
    const state = stateWith(
      [player("a", { goldIndex: 12 }), player("b", { goldIndex: 1 })],
      {}
    );
    disconnectPlayer(state, "b");
    expect(state.phase).toBe("end");
    expect(state.result).toBe("victory");
  });

  it("goldCount devuelve los 12 Gold", () => {
    expect(goldCount()).toBe(12);
  });
});