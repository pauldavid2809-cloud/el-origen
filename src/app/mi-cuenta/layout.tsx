import type { Metadata } from "next";

/* Área privada del miembro: no se indexa. */
export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
