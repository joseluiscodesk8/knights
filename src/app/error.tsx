"use client";

import { useEffect } from "react";

import styles from "@/styles/index.module.scss";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.endScreen}>
      <h1 className={styles.endTitle}>Algo salió mal</h1>
      <p className={styles.endText}>Vuelve a intentarlo o recarga la página.</p>
      <button className={styles.primaryButton} onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}