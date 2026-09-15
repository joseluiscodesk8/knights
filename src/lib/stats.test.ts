import { describe, expect, it } from "vitest";

import { computeLevel } from "@/lib/stats";

describe("computeLevel", () => {
  it("sube un nivel cada 3 victorias", () => {
    expect(computeLevel(0)).toBe(1);
    expect(computeLevel(2)).toBe(1);
    expect(computeLevel(3)).toBe(2);
    expect(computeLevel(5)).toBe(2);
    expect(computeLevel(6)).toBe(3);
    expect(computeLevel(9)).toBe(4);
  });
});