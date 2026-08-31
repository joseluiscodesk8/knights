import { Knight } from "@/types/knights";

import bronzeKnights from "@/data/bronce.json";
import goldKnights from "@/data/gold.json";

const data: Record<"bronze" | "gold", Knight[]> = {
  bronze: bronzeKnights as Knight[],
  gold: goldKnights as Knight[],
};

export function getBronzeKnights(): Knight[] {
  return data.bronze;
}

export function getGoldKnights(): Knight[] {
  return data.gold;
}

export function getAllKnights(): Knight[] {
  return [...data.bronze, ...data.gold];
}

export function getKnightById(id: number): Knight | undefined {
  return getAllKnights().find((knight) => knight.id === id);
}

export function getBronzeKnightById(id: number): Knight | undefined {
  return data.bronze.find((knight) => knight.id === id);
}

export function getGoldKnightById(id: number): Knight | undefined {
  return data.gold.find((knight) => knight.id === id);
}