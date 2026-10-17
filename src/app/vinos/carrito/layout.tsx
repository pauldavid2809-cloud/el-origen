import type { Metadata } from "next";

/* El carrito es privado de cada visitante (vive en su navegador): no se indexa. */
export const metadata: Metadata = {
  title: "Tu carrito de vinos",
  robots: { index: false, follow: false },
};

export default function WineCartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
