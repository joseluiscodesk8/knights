"use client";

import Image from "next/image";
import { useState } from "react";

import { Knight } from "@/types/knights";

import styles from "../styles/index.module.scss";

interface KnightSelectionProps {
  knights: Knight[];
  onStart: (knight: Knight) => void;
}

export default function KnightSelection({ knights, onStart }: KnightSelectionProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = knights.find((knight) => knight.id === selectedId) ?? null;

  return (
    <section className={styles.selection}>
      <h1 className={styles.selectionTitle}>Selecciona tu caballero de bronce</h1>
      <div className={styles.selectionGrid}>
        {knights.map((knight) => (
          <label
            key={knight.id}
            className={`${styles.selectionOption} ${
              selectedId === knight.id ? styles.selectionOptionActive : ""
            }`}
          >
            <Image
              className={styles.selectionImage}
              src={knight.image}
              alt={knight.name}
              width={200}
              height={200}
            />
            <span className={styles.selectionName}>{knight.name}</span>
            <input
              className={styles.selectionInput}
              type="radio"
              name="bronze-knight"
              checked={selectedId === knight.id}
              onChange={() => setSelectedId(knight.id)}
            />
          </label>
        ))}
      </div>
      <button
        className={styles.selectionButton}
        disabled={!selected}
        onClick={() => selected && onStart(selected)}
      >
        Empezar
      </button>
    </section>
  );
}