import type { Metadata } from "next";

/* La orden es privada (el enlace funciona como entrada): no se indexa. */
export const metadata: Metadata = {
  title: "Tu reserva",
  robots: { index: false, follow: false },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
