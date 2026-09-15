import styles from "@/styles/index.module.scss";

export default function Loading() {
  return (
    <main className={styles.endScreen}>
      <div className={styles.loadingSpinner} aria-hidden="true" />
      <p className={styles.loadingText}>Cargando…</p>
    </main>
  );
}