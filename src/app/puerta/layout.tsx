import type { Metadata, Viewport } from "next";

/* Escáner de la puerta (personal de El Origen): no se indexa. */
export const metadata: Metadata = {
  title: "Puerta",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#2A1519",
};

export default function DoorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
