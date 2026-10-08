import type { Metadata } from "next";

/* La URL lleva el enlace de recuperación: no se indexa ni se envía como referer. */
export const metadata: Metadata = {
  title: "Nueva contraseña",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function RestablecerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
