"use client";

import { useEffect, useRef } from "react";

import { Maze, Position } from "@/lib/maze";

import styles from "../../styles/index.module.scss";

const CELL = 44;

interface CoopPlayer {
  id: string;
  name: string;
  knightName: string;
  pos: Position;
  color: string;
}

interface CoopMapProps {
  maze: Maze;
  players: CoopPlayer[];
  myId: string;
  label?: string;
  status?: string;
  onMove: (dr: number, dc: number) => void;
}

export default function CoopMap({
  maze,
  players,
  myId,
  label,
  status,
  onMove,
}: CoopMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    ctx.font = "bold 11px sans-serif";
    for (const player of players) {
      const px = cx(player.pos.col);
      const py = cy(player.pos.row);
      const isMe = player.id === myId;
      const radius = isMe ? CELL * 0.34 : CELL * 0.28;

      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isMe) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = isMe ? "#fff" : "rgba(0,0,0,0.75)";
      ctx.fillText(player.name, px, py - radius - 6);
    }
  }, [maze, players, myId]);

  return (
    <div className={styles.mapWrap}>
      {label && <p className={styles.mapLabel}>{label}</p>}
      <canvas ref={canvasRef} className={styles.mapCanvas} />
      {status && <p className={styles.lobbyStatus}>{status}</p>}
      <div className={styles.mapControls}>
        <div className={styles.mapControlsRow}>
          <button onClick={() => onMove(-1, 0)} aria-label="Arriba">
            ↑
          </button>
        </div>
        <div className={styles.mapControlsRow}>
          <button onClick={() => onMove(0, -1)} aria-label="Izquierda">
            ←
          </button>
          <button onClick={() => onMove(0, 1)} aria-label="Derecha">
            →
          </button>
        </div>
        <div className={styles.mapControlsRow}>
          <button onClick={() => onMove(1, 0)} aria-label="Abajo">
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}