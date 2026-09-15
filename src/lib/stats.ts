export function computeLevel(wins: number): number {
  return 1 + Math.floor(wins / 3);
}