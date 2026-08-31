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
}

const STATIC_GRID: Cell[][] = [
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
  [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
];

const ROWS = STATIC_GRID.length;
const COLS = STATIC_GRID[0].length;

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

export function createMaze(): Maze {
  const start = CORNERS[Math.floor(Math.random() * CORNERS.length)];
  return {
    grid: STATIC_GRID,
    rows: ROWS,
    cols: COLS,
    start,
    goal: oppositeCorner(start),
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