"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

import styles from "@/styles/index.module.scss";

type Mode = "login" | "signup";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!isSupabaseConfigured()) {
      setError("Configuración pendiente: faltan las variables de entorno de Supabase.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (!data.session) {
        setMessage("Revisa tu email para confirmar tu cuenta antes de entrar.");
      } else {
        router.push("/");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <main className={styles.loginWrap}>
      <section className={styles.loginCard}>
        <h1 className={styles.loginTitle}>Knights</h1>
        <p className={styles.loginSubtitle}>
          Entra para guardar tus victorias, derrotas y nivel.
        </p>

        <div className={styles.loginTabs}>
          <button
            type="button"
            className={mode === "login" ? styles.loginTabActive : ""}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === "signup" ? styles.loginTabActive : ""}
            onClick={() => setMode("signup")}
          >
            Registrarse
          </button>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <input
            className={styles.loginInput}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
          <input
            className={styles.loginInput}
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {error && <p className={styles.loginError}>{error}</p>}
          {message && <p className={styles.loginMessage}>{message}</p>}
          <button className={styles.selectionButton} type="submit" disabled={loading}>
            {loading ? "Espera..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <Link href="/" className={styles.loginGuest}>
          O juega como invitado (no se guarda nada)
        </Link>
      </section>
    </main>
  );
}