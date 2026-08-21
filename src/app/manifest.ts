import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "El Origen | Boutique Wine Tasting Experience",
    short_name: "El Origen",
    description: "Experiencias boutique de cata de vino en Mendoza, Argentina. Reserva de cupos online y maridajes de altura.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F7",
    theme_color: "#5C0531",
    icons: [
      {
        src: "/images/logo-color.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo-color.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
