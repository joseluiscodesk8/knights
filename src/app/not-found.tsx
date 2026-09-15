import styles from "@/styles/index.module.scss";

export default function NotFound() {
  return (
    <main className={styles.endScreen}>
      <h1 className={styles.endTitle}>404 · No encontrado</h1>
      <p className={styles.endText}>Esa página no existe.</p>
    </main>
  );
}