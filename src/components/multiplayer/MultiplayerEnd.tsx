"use client";

import styles from "../../styles/index.module.scss";

interface MultiplayerEndProps {
  result: "victory" | "gameover";
  goldIndex: number;
  playerName: string;
  onExit: () => void;
}

export default function MultiplayerEnd({
  result,
  goldIndex,
  playerName,
  onExit,
}: MultiplayerEndProps) {
  const victory = result === "victory";

  return (
    <section className={styles.endScreen}>
      <div className={styles.endContent}>
        <h1 className={styles.endTitle}>
          {victory ? "¡Victoria!" : "Derrota del equipo"}
        </h1>
        <p className={styles.endMessage}>
          {victory
            ? `Los 12 Gold Knights han caído en equipo. ¡Gran victoria, ${playerName}!`
            : `El equipo fue derrotado por el Gold ${
                Math.min(goldIndex + 1, 12)
              }. ¡Inténtalo de nuevo!`}
        </p>
        <button className={styles.primaryButton} onClick={onExit}>
          Volver al inicio
        </button>
      </div>
    </section>
  );
}