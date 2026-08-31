import type { Maze, Position } from "@/lib/maze";
import type { RoundResult } from "@/lib/battle";

export type MpPhase = "lobby" | "map" | "battle" | "end";

export const MAX_PLAYERS = 5;
export const ROOM_PREFIX = "knights-mp-";
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const PLAYER_COLORS = [
  "#d4a017",
  "#3b82f6",
  "#22c55e",
  "#e11d48",
  "#8b5cf6",
];

export function generateRoomCode(len = 4): string {
  let code = "";
  for (let i = 0; i < len; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export interface RoomPlayer {
  id: string;
  name: string;
  knightId: number;
  knightName: string;
  knightImage: string;
  attacks: string[];
  hp: number;
  maxHp: number;
  pos: Position;
  alive: boolean;
}

export interface RoomState {
  phase: MpPhase;
  players: RoomPlayer[];
  maze: Maze | null;
  goldIndex: number;
  goldHp: number;
  goldMaxHp: number;
  turn: number;
  lastRound: RollEvent | null;
  message?: string;
  result?: "victory" | "gameover";
}

export type RollEvent = RoundResult & { actorName: string };

export type MpMessage =
  | { type: "hello"; payload: { name: string; knightId: number } }
  | { type: "room"; payload: RoomState }
  | { type: "move"; payload: Position }
  | { type: "attack"; payload: { attackIndex: number } }
  | { type: "error"; payload: { message: string } };