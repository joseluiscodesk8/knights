import Image from "next/image";

import { createClient } from "@/lib/supabase/server";
import { getBronzeKnights } from "@/lib/knights";

import styles from "@/styles/index.module.scss";

const bronzeKnights = getBronzeKnights();

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <main className={styles.statsWrap}>
        <section className={styles.statsCard}>
          <h1 className={styles.statsTitle}>Configuración pendiente</h1>
          <p className={styles.statsEmpty}>
            Faltan las variables de entorno de Supabase. Revisa .env.local
          </p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: runs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("runs")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const knight = bronzeKnights.find((k) => k.id === profile?.knight_id) ?? null;

  return (
    <main className={styles.statsWrap}>
      <section className={styles.statsCard}>
        <h1 className={styles.statsTitle}>Mi progreso</h1>

        <div className={styles.statsProfile}>
          {knight ? (
            <Image
              className={styles.statsImage}
              src={knight.image}
              alt={knight.name}
              width={120}
              height={120}
            />
          ) : (
            <div className={styles.statsImagePlaceholder}>?</div>
          )}
          <div className={styles.statsNumbers}>
            <p className={styles.statsKnight}>{knight?.name ?? "Sin caballero"}</p>
            <p>
              <strong>{profile?.level ?? 1}</strong> Nivel
            </p>
            <p>
              <strong>{profile?.wins ?? 0}</strong> Victorias ·{" "}
              <strong>{profile?.losses ?? 0}</strong> Derrotas
            </p>
          </div>
        </div>
      </section>

      <section className={styles.statsCard}>
        <h2 className={styles.statsTitle}>Últimas campañas</h2>
        {!runs || runs.length === 0 ? (
          <p className={styles.statsEmpty}>Aún no has jugado ninguna campaña.</p>
        ) : (
          <ul className={styles.statsRuns}>
            {runs.map((run) => {
              const runKnight = bronzeKnights.find((k) => k.id === run.knight_id);
              const statusLabel =
                run.status === "won" ? "Victoria" : run.status === "lost" ? "Derrota" : "En juego";
              return (
                <li key={run.id} className={styles.statsRun}>
                  <span className={styles.statsRunKnight}>
                    {runKnight?.name ?? "Knight"}
                  </span>
                  <span className={`${styles.statsRunStatus} ${styles[`statsStatus${run.status}`]}`}>
                    {statusLabel}
                  </span>
                  <span>{run.golds_defeated}/12</span>
                  <span className={styles.statsRunDate}>
                    {new Date(run.created_at).toLocaleDateString("es")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}