import { describe, expect, it } from "vitest";

import { getAllKnights, getBronzeKnights, getGoldKnights } from "@/lib/knights";

describe("getBronzeKnights", () => {
  it("tiene 5 caballeros con vida 10 y ataques", () => {
    const knights = getBronzeKnights();
    expect(knights).toHaveLength(5);
    knights.forEach((knight) => {
      expect(knight.vida).toBe(10);
      expect(knight.attacks.length).toBeGreaterThan(0);
      expect(knight.image).toMatch(/^\//);
    });
  });

  it("los ids son únicos y van de 1 a 5", () => {
    const ids = getBronzeKnights().map((knight) => knight.id).sort();
    expect(ids).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("getGoldKnights", () => {
  it("tiene 12 caballeros de oro con ids únicos y ataques", () => {
    const gold = getGoldKnights();
    expect(gold).toHaveLength(12);
    const ids = new Set(gold.map((knight) => knight.id));
    expect(ids.size).toBe(12);
    gold.forEach((knight) => {
      expect(knight.attacks.length).toBeGreaterThan(0);
      expect(knight.vida).toBeGreaterThan(0);
    });
  });
});

describe("getAllKnights", () => {
  it("une bronces y golds en un solo listado", () => {
    expect(getAllKnights()).toHaveLength(17);
  });
});