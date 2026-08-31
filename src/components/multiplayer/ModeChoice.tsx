"use client";

import styles from "../../styles/index.module.scss";

interface ModeChoiceProps {
  knightName: string;
  onSolo: () => void;
  onMultiplayer: () => void;
  onBack: () => void;
}

export default function ModeChoice({
  knightName,
  onSolo,
  onMultiplayer,
  onBack,
}: ModeChoiceProps) {
  return (
    <section className={styles.lobby}>
      <h1 className={styles.selectionTitle}>¿Cómo quieres jugar?</h1>
      <p className={styles.lobbyTips}>
        Tu caballero {knightName.toUpperCase()} está listo.
      </p>
      <div className={styles.lobbyActions}>
        <button className={styles.selectionButton} onClick={onSolo}>
          Modo solitario
        </button>
        <button
          className={`${styles.selectionButton} ${styles.lobbySecondaryButton}`}
          onClick={onMultiplayer}
        >
          Multijugador
        </button>
      </div>
      <button className={styles.lobbyBackButton} onClick={onBack}>
        ← Cambiar caballero
      </button>
    </section>
  );
}