import { describe, expect, it } from "vitest";

import { createMaze, isWalkable, reachGoal, Position } from "@/lib/maze";

describe("createMaze", () => {
  it("crea un laberinto 11x11", () => {
    const maze = createMaze();
    expect(maze.rows).toBe(11);
    expect(maze.cols).toBe(11);
    expect(maze.grid.length).toBe(11);
    maze.grid.forEach((row) => expect(row.length).toBe(11));
  });

  it("empieza en una esquina y la meta es la opuesta", () => {
    const maze = createMaze();
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: 10 },
      { row: 10, col: 0 },
      { row: 10, col: 10 },
    ];
    expect(corners).toContainEqual(maze.start);
    expect(maze.goal).toEqual({
      row: 10 - maze.start.row,
      col: 10 - maze.start.col,
    });
  });

  it("es solucionable: la meta es alcanzable desde la salida", () => {
    const maze = createMaze();
    const reachable = new Set<string>();
    const queue: Position[] = [maze.start];
    reachable.add(`${maze.start.row},${maze.start.col}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const { dr, dc } of [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ]) {
        const next = { row: current.row + dr, col: current.col + dc };
        const nextKey = `${next.row},${next.col}`;
        if (reachable.has(nextKey) || !isWalkable(maze, next)) continue;
        reachable.add(nextKey);
        queue.push(next);
      }
    }

    expect(reachable.has(`${maze.goal.row},${maze.goal.col}`)).toBe(true);
  });

  it("genera laberintos distintos en cada llamada", () => {
    const first = createMaze();
    const second = createMaze();
    expect(first.grid).not.toEqual(second.grid);
  });
});

describe("isWalkable", () => {
  it("rechaza posiciones fuera del mapa", () => {
    const maze = createMaze();
    expect(isWalkable(maze, { row: -1, col: 0 })).toBe(false);
    expect(isWalkable(maze, { row: 0, col: 11 })).toBe(false);
  });

  it("la posición de salida siempre es transitable", () => {
    const maze = createMaze();
    expect(isWalkable(maze, maze.start)).toBe(true);
  });
});

describe("reachGoal", () => {
  it("compara con la meta exacta", () => {
    const maze = createMaze();
    expect(reachGoal(maze, maze.goal)).toBe(true);
    expect(reachGoal(maze, maze.start)).toBe(false);
  });
});