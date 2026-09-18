"use client";

import { useEffect, useRef, useState } from "react";

import { isFakeGoal, isGoal, isWalkable, Maze, Position } from "@/lib/maze";

import styles from "../styles/index.module.scss";

const CELL = 44;

interface GameMapProps {
  maze: Maze;
  avatar?: string;
  label?: string;
  onComplete: (position: Position) => void;
}

export default function GameMap({ maze, avatar, label, onComplete }: GameMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState<Position>(maze.start);
  const [active, setActive] = useState(true);
  const [avatarImg, setAvatarImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!avatar) return;
    const img = new Image();
    img.src = avatar;
    img.onload = () => setAvatarImg(img);
  }, [avatar]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = maze.cols * CELL;
    canvas.height = maze.rows * CELL;

    for (let r = 0; r < maze.rows; r++) {
      for (let c = 0; c < maze.cols; c++) {
        const x = c * CELL;
        const y = r * CELL;
        ctx.fillStyle = maze.grid[r][c] === 0 ? "#f5f0e1" : "#2b2b2b";
        ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.strokeRect(x, y, CELL, CELL);
      }
    }

    const cx = (c: number) => c * CELL + CELL / 2;
    const cy = (r: number) => r * CELL + CELL / 2;

    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(56, 142, 60, 0.55)";
    ctx.fillRect(maze.start.col * CELL, maze.start.row * CELL, CELL, CELL);
    ctx.fillStyle = "#fff";
    ctx.fillText("O", cx(maze.start.col), cy(maze.start.row));

    ctx.fillStyle = "rgba(198, 40, 40, 0.55)";
    ctx.fillRect(maze.goal.col * CELL, maze.goal.row * CELL, CELL, CELL);
    ctx.fillStyle = "#fff";
    ctx.fillText("X", cx(maze.goal.col), cy(maze.goal.row));

    if (maze.fakeGoal) {
      ctx.fillStyle = "rgba(198, 40, 40, 0.55)";
      ctx.fillRect(
        maze.fakeGoal.col * CELL,
        maze.fakeGoal.row * CELL,
        CELL,
        CELL
      );
      ctx.fillStyle = "#fff";
      ctx.fillText("X", cx(maze.fakeGoal.col), cy(maze.fakeGoal.row));
    }

    if (!active) return;

    const px = cx(position.col);
    const py = cy(position.row);

    if (avatarImg) {
      const height = CELL;
      const width = height * (avatarImg.width / avatarImg.height);
      ctx.drawImage(avatarImg, px - width / 2, py - height / 2, width, height);
    } else {
      ctx.fillStyle = "#b87333";
      ctx.beginPath();
      ctx.arc(px, py, CELL * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [maze, position, active, avatarImg]);

  function move(dr: number, dc: number) {
    if (!active) return;
    const next = { row: position.row + dr, col: position.col + dc };
    if (!isWalkable(maze, next)) return;
    setPosition(next);
    if (isGoal(maze, next) || isFakeGoal(maze, next)) {
      setActive(false);
      onComplete(next);
    }
  }

  return (
    <div className={styles.mapWrap}>
      {label && <p className={styles.mapLabel}>{label}</p>}
      <canvas ref={canvasRef} className={styles.mapCanvas} />
      <div className={styles.mapControls}>
        <button onClick={() => move(0, -1)} aria-label="Izquierda">
          ←
        </button>
        <button onClick={() => move(-1, 0)} aria-label="Arriba">
          ↑
        </button>
        <button onClick={() => move(1, 0)} aria-label="Abajo">
          ↓
        </button>
        <button onClick={() => move(0, 1)} aria-label="Derecha">
          →
        </button>
      </div>
    </div>
  );
}