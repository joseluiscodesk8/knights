import { resolveRound, rollAttack } from "@/lib/battle";
import { getBronzeKnightById, getGoldKnights } from "@/lib/knights";
import {
  createGeminiMaze,
  createMaze,
  isFakeGoal,
  isGoal,
  isWalkable,
  type Maze,
  type Position,
} from "@/lib/maze";

import type { RoomPlayer, RoomState } from "./types";

export const GEMINI_INDEX = 2;

const goldKnights = getGoldKnights();

export function cloneState(state: RoomState): RoomState {
  return {
    ...state,
    players: state.players.map((player) => ({ ...player, pos: { ...player.pos } })),
    mazes: { ...state.mazes },
    duels: Object.fromEntries(
      Object.entries(state.duels).map(([key, duel]) => [
        key,
        {
          ...duel,
          memberIds: [...duel.memberIds],
          lastRound: duel.lastRound ? { ...duel.lastRound } : null,
        },
      ])
    ),
  };
}

function ensureMaze(state: RoomState, goldIndex: number): Maze {
  const existing = state.mazes[goldIndex];
  if (existing) return existing;
  const maze = goldIndex === GEMINI_INDEX ? createGeminiMaze() : createMaze();
  state.mazes[goldIndex] = maze;
  if (goldIndex === GEMINI_INDEX) {
    state.message =
      "¡Géminis tiene DOS X! Una es real (te adelanta) y la otra es falsa (desata la pelea). Elegid bien.";
  }
  return maze;
}

function playerById(state: RoomState, id: string): RoomPlayer | undefined {
  return state.players.find((player) => player.id === id);
}

function memberPlayers(state: RoomState, memberIds: string[]): RoomPlayer[] {
  return memberIds
    .map((id) => playerById(state, id))
    .filter((player): player is RoomPlayer => Boolean(player));
}

function rotateTurn(state: RoomState, duelIndex: number): void {
  const duel = state.duels[duelIndex];
  const members = memberPlayers(state, duel.memberIds);
  const aliveMembers = members.filter((player) => player.alive);
  if (aliveMembers.length === 0) return;
  const turnId = duel.memberIds[duel.turn];
  let start = turnId ? duel.memberIds.indexOf(turnId) : 0;
  if (start === -1) start = 0;
  let next = start;
  for (let i = 0; i < duel.memberIds.length; i++) {
    const candidate = playerById(state, duel.memberIds[next]);
    if (candidate?.alive) break;
    next = (next + 1) % duel.memberIds.length;
  }
  duel.turn = next;
}

function maybeStartDuels(state: RoomState): void {
  for (const key of Object.keys(state.duels)) {
    const goldIndex = Number(key);
    const duel = state.duels[goldIndex];
    if (duel.turn !== -1) continue;
    const pending = state.players.some(
      (player) =>
        player.alive && player.goldIndex === goldIndex && !player.inDuel
    );
    if (pending) continue;
    duel.turn = 0;
    const gold = goldKnights[goldIndex] ?? goldKnights[0];
    const first = memberPlayers(state, duel.memberIds)[0];
    state.message = `¡${gold.name} os espera! Ataca primero ${first?.name ?? "alguien del grupo"}.`;
  }
}

function advancePlayer(state: RoomState, player: RoomPlayer): void {
  player.goldIndex += 1;
  player.inDuel = false;
  const maze = ensureMaze(state, player.goldIndex);
  player.pos = { ...maze.start };
}

function checkEnd(state: RoomState): RoomState {
  const alive = state.players.filter((player) => player.alive);
  if (alive.length === 0) {
    state.phase = "end";
    state.result = "gameover";
    state.message = "Todo el equipo ha caído.";
    return state;
  }
  if (alive.every((player) => player.goldIndex >= goldKnights.length)) {
    state.phase = "end";
    state.result = "victory";
    state.message = "¡Habéis derrotado a los 12 Gold!";
    return state;
  }
  return state;
}

function joinDuel(state: RoomState, player: RoomPlayer): void {
  player.inDuel = true;
  const goldIndex = player.goldIndex;
  let duel = state.duels[goldIndex];
  if (!duel) {
    const gold = goldKnights[goldIndex] ?? goldKnights[0];
    duel = {
      memberIds: [],
      goldHp: gold.vida,
      goldMaxHp: gold.vida,
      turn: -1,
      lastRound: null,
    };
    state.duels[goldIndex] = duel;
  }
  if (!duel.memberIds.includes(player.id)) {
    duel.memberIds.push(player.id);
  }
  const pending = state.players.some(
    (item) => item.alive && item.goldIndex === goldIndex && !item.inDuel
  );
  state.message = pending
    ? `${player.name} llegó a la X. Esperando al resto del grupo…`
    : `${player.name} llegó a la X. ¡La pelea comienza!`;
  maybeStartDuels(state);
}

function duelWon(state: RoomState, goldIndex: number): void {
  const duel = state.duels[goldIndex];
  const members = memberPlayers(state, duel.memberIds);
  const winners = members.filter((player) => player.alive);
  winners.forEach((player) => advancePlayer(state, player));
  const gold = goldKnights[goldIndex] ?? goldKnights[0];
  if (winners.length > 0) {
    state.message = `${winners.map((player) => player.name).join(", ")} derrotó a ${
      gold.name
    }. ¡A la siguiente batalla!`;
  }
  delete state.duels[goldIndex];
  checkEnd(state);
  maybeStartDuels(state);
}

export function movePlayer(
  state: RoomState,
  playerId: string,
  intent: Position
): RoomState {
  const me = playerById(state, playerId);
  if (!me || !me.alive || me.inDuel) return state;
  const maze = state.mazes[me.goldIndex];
  if (!maze) return state;
  if (
    Math.abs(intent.row - me.pos.row) + Math.abs(intent.col - me.pos.col) !== 1
  ) {
    return state;
  }
  if (!isWalkable(maze, intent)) return state;
  me.pos = intent;

  const atReal = isGoal(maze, intent);
  if (me.goldIndex === GEMINI_INDEX && atReal) {
    const gold = goldKnights[GEMINI_INDEX];
    advancePlayer(state, me);
    state.message = `${me.name} alcanzó la X real de ${
      gold.name
    } y se adelantó a la próxima batalla.`;
    maybeStartDuels(state);
    return state;
  }

  if (atReal || isFakeGoal(maze, intent)) {
    joinDuel(state, me);
    return state;
  }

  return state;
}

export function resolveAttack(
  state: RoomState,
  actorIndex: number,
  attackIndex: number
): RoomState {
  if (state.phase !== "play") return state;
  const player = state.players[actorIndex];
  if (!player || !player.alive || !player.inDuel) return state;
  const goldIndex = player.goldIndex;
  const duel = state.duels[goldIndex];
  if (!duel || duel.turn < 0) return state;
  const memberIndex = duel.memberIds.indexOf(player.id);
  if (memberIndex === -1 || memberIndex !== duel.turn) return state;

  const bronze = getBronzeKnightById(player.knightId);
  if (!bronze) return state;
  const gold = goldKnights[goldIndex] ?? goldKnights[0];
  const playerAttack = bronze.attacks[attackIndex] ?? bronze.attacks[0];
  const enemyAttack =
    gold.attacks[Math.floor(Math.random() * gold.attacks.length)];
  const result = resolveRound(
    rollAttack(),
    rollAttack(),
    playerAttack,
    enemyAttack
  );
  duel.lastRound = { ...result, actorName: player.name };

  if (result.winner === "player") {
    duel.goldHp -= result.damage;
    player.hp = Math.min(player.maxHp, player.hp + result.heal);
  } else if (result.winner === "enemy") {
    player.hp = Math.max(0, player.hp - result.damage);
  }
  player.alive = player.hp > 0;

  if (duel.goldHp <= 0) {
    duelWon(state, goldIndex);
    return state;
  }

  const aliveMembers = memberPlayers(state, duel.memberIds).filter(
    (item) => item.alive
  );
  if (aliveMembers.length === 0) {
    delete state.duels[goldIndex];
    state.message = `El grupo contra ${gold.name} cayó en combate.`;
    checkEnd(state);
    return state;
  }

  duel.turn = (memberIndex + 1) % duel.memberIds.length;
  rotateTurn(state, goldIndex);
  return state;
}

export function disconnectPlayer(state: RoomState, playerId: string): RoomState {
  const player = playerById(state, playerId);
  if (!player || !player.alive) return state;
  player.alive = false;
  player.inDuel = false;
  player.name = `${player.name} (desconectado)`;

  const goldIndex = player.goldIndex;
  const duel = state.duels[goldIndex];
  if (duel && duel.memberIds.includes(playerId)) {
    duel.memberIds = duel.memberIds.filter((id) => id !== playerId);
    const aliveMembers = memberPlayers(state, duel.memberIds).filter(
      (item) => item.alive
    );
    if (aliveMembers.length === 0) {
      delete state.duels[goldIndex];
      const gold = goldKnights[goldIndex] ?? goldKnights[0];
      state.message = `El grupo contra ${gold.name} quedó solo contra el destino.`;
    } else if (duel.turn >= 0) {
      rotateTurn(state, goldIndex);
    }
  }

  maybeStartDuels(state);
  checkEnd(state);
  return state;
}

export function startPlayState(state: RoomState): RoomState {
  state.mazes = {};
  state.duels = {};
  state.result = undefined;
  state.phase = "play";
  for (const player of state.players) {
    player.goldIndex = 0;
    player.inDuel = false;
    const maze = ensureMaze(state, player.goldIndex);
    player.pos = { ...maze.start };
  }
  state.message = "Cada uno elige su camino hacia la X. ¡La batalla os espera!";
  return state;
}

export function goldCount(): number {
  return goldKnights.length;
}