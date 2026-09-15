"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSession } from "@/hooks/useSession";
import { useHeaderVisibility } from "@/components/HeaderVisibility";
import { createClient } from "@/lib/supabase/client";

import styles from "../styles/index.module.scss";

export default function Header() {
  const { user, loading } = useSession();
  const { hidden } = useHeaderVisibility();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  if (hidden) return null;

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.headerBrand}>
        Knights
      </Link>
      <nav className={styles.headerNav}>
        <Link href="/">Jugar</Link>
        <Link href="/stats">Stats</Link>
        {!loading &&
          (user ? (
            <>
              <span className={styles.headerUser}>{user.email}</span>
              <button className={styles.headerButton} onClick={handleSignOut}>
                Salir
              </button>
            </>
          ) : (
            <Link href="/auth/login" className={styles.headerButton}>
              Entrar / Registrarse
            </Link>
          ))}
      </nav>
    </header>
  );
}