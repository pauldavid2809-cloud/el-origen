import { Metadata } from "next";

const TITLE = "Próximas catas guiadas";
const DESCRIPTION =
  "Reserva tu cupo en catas guiadas de vinos, destilados y licores de alta gama con sommeliers y maridaje de autor en Caracas. Una entrada QR por persona.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/catas",
  },
  openGraph: {
    title: `${TITLE} | El Origen Caracas`,
    description: DESCRIPTION,
    url: "/catas",
  },
};

export default function CatasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
