import type { Metadata } from "next";

import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Entrar / Registrarse",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}