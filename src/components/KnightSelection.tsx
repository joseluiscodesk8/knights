"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useState } from "react";

import KnightCarousel from "@/components/KnightCarousel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Knight } from "@/types/knights";

import styles from "../styles/index.module.scss";

interface KnightSelectionProps {
  knights: Knight[];
  onStart: (knight: Knight) => void;
  onBack?: () => void;
}

export default function KnightSelection({
  knights,
  onStart,
  onBack,
}: KnightSelectionProps) {
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = knights.find((knight) => knight.id === selectedId) ?? null;

  if (isMobile) {
    return <KnightCarousel knights={knights} onStart={onStart} onBack={onBack} />;
  }

  return (
    <section className={styles.selection}>
      <h1 className={styles.selectionTitle}>Selecciona tu caballero de bronce</h1>
      <div className={styles.selectionGrid}>
        {knights.map((knight, index) => (
          <motion.label
            key={knight.id}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.05,
              type: "spring",
              stiffness: 260,
              damping: 22,
            }}
            whileHover={{ y: -8, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
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
          </motion.label>
        ))}
      </div>
      <button
        className={styles.selectionButton}
        disabled={!selected}
        onClick={() => selected && onStart(selected)}
      >
        Empezar
      </button>
      {onBack && (
        <button className={styles.lobbyBackButton} onClick={onBack}>
          ← Atrás
        </button>
      )}
    </section>
  );
}