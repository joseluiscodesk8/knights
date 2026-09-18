export type Cell = 0 | 1;

export interface Position {
  row: number;
  col: number;
}

export interface Maze {
  grid: Cell[][];
  rows: number;
  cols: number;
  start: Position;
  goal: Position;
  fakeGoal?: Position;
}

const ROWS = 11;
const COLS = 11;

const DIRECTIONS = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
];

function key(position: Position): string {
  return `${position.row},${position.col}`;
}

function positionFromKey(value: string): Position {
  const [row, col] = value.split(",").map(Number);
  return { row, col };
}

const CORNERS: Position[] = [
  { row: 0, col: 0 },
  { row: 0, col: COLS - 1 },
  { row: ROWS - 1, col: 0 },
  { row: ROWS - 1, col: COLS - 1 },
];

function oppositeCorner(position: Position): Position {
  return {
    row: ROWS - 1 - position.row,
    col: COLS - 1 - position.col,
  };
}

function carveCorner(grid: Cell[][], corner: Position): void {
  grid[corner.row][corner.col] = 0;
  grid[corner.row === 0 ? 1 : corner.row - 1][corner.col] = 0;
}

export function createMaze(): Maze {
  const grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array<Cell>(COLS).fill(1)
  );

  const rooms: Position[] = [];
  for (let r = 1; r < ROWS - 1; r += 2) {
    for (let c = 1; c < COLS - 1; c += 2) {
      rooms.push({ row: r, col: c });
      grid[r][c] = 0;
    }
  }

  const visited = new Set<string>();
  const startRoom = rooms[Math.floor(Math.random() * rooms.length)];
  visited.add(key(startRoom));
  const stack: Position[] = [startRoom];

  const directions = [
    { dr: -2, dc: 0 },
    { dr: 2, dc: 0 },
    { dr: 0, dc: -2 },
    { dr: 0, dc: 2 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const shuffled = directions.sort(() => Math.random() - 0.5);
    let advanced = false;

    for (const { dr, dc } of shuffled) {
      const next = { row: current.row + dr, col: current.col + dc };
      if (next.row < 1 || next.row > ROWS - 2) continue;
      if (next.col < 1 || next.col > COLS - 2) continue;
      if (visited.has(key(next))) continue;

      grid[current.row + dr / 2][current.col + dc / 2] = 0;
      visited.add(key(next));
      stack.push(next);
      advanced = true;
      break;
    }

    if (!advanced) stack.pop();
  }

  const start = CORNERS[Math.floor(Math.random() * CORNERS.length)];
  const goal = oppositeCorner(start);
  carveCorner(grid, start);
  carveCorner(grid, goal);

  return {
    grid,
    rows: ROWS,
    cols: COLS,
    start,
    goal,
  };
}

export function isWalkable(maze: Maze, position: Position): boolean {
  if (
    position.row < 0 ||
    position.col < 0 ||
    position.row >= maze.rows ||
    position.col >= maze.cols
  ) {
    return false;
  }
  return maze.grid[position.row][position.col] === 0;
}

export function reachGoal(maze: Maze, position: Position): boolean {
  return position.row === maze.goal.row && position.col === maze.goal.col;
}

export function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function isGoal(maze: Maze, position: Position): boolean {
  return samePosition(maze.goal, position);
}

export function isFakeGoal(maze: Maze, position: Position): boolean {
  return !!maze.fakeGoal && samePosition(maze.fakeGoal, position);
}

function shortestPath(maze: Maze): Position[] {
  const previous = new Map<string, string>();
  const visited = new Set<string>([key(maze.start)]);
  const queue: Position[] = [maze.start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (samePosition(current, maze.goal)) break;
    for (const { dr, dc } of DIRECTIONS) {
      const next = { row: current.row + dr, col: current.col + dc };
      if (!isWalkable(maze, next) || visited.has(key(next))) continue;
      visited.add(key(next));
      previous.set(key(next), key(current));
      queue.push(next);
    }
  }

  const path: Position[] = [];
  let cursor: string | undefined = key(maze.goal);
  while (cursor) {
    path.push(positionFromKey(cursor));
    cursor = previous.get(cursor);
  }
  return path;
}

export function createGeminiMaze(): Maze {
  const maze = createMaze();
  const onPath = new Set(shortestPath(maze).map(key));
  const candidates: Position[] = [];

  for (let row = 1; row < ROWS - 1; row += 2) {
    for (let col = 1; col < COLS - 1; col += 2) {
      const position = { row, col };
      if (onPath.has(key(position))) continue;
      if (samePosition(position, maze.start)) continue;
      candidates.push(position);
    }
  }

  const fakeGoal =
    candidates[Math.floor(Math.random() * candidates.length)] ?? maze.goal;
  return { ...maze, fakeGoal };
}