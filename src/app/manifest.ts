import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "El Origen | Experiencias de Cata en Caracas",
    short_name: "El Origen",
    description: "Experiencias boutique de cata de vinos de colección y maridaje de autor en Caracas, Venezuela.",
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
