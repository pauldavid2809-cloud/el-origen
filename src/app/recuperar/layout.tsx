import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false, follow: true },
};

export default function RecuperarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
