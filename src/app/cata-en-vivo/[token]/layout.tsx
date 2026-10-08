import type { Metadata } from "next";

/* Ficha de cata personal (el enlace lleva el token de la entrada): no se indexa. */
export const metadata: Metadata = {
  title: "Ficha de cata en vivo",
  robots: { index: false, follow: false },
};

export default function LiveTastingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
