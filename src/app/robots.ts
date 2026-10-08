import { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://el-origen-two.vercel.app").replace(/\/+$/, "");

/** Rutas privadas o de un solo cliente (órdenes, entradas, cuentas, puerta): fuera del índice. */
const PRIVATE_PATHS = [
  "/admin",
  "/api/",
  "/orden/",
  "/verificar/",
  "/cata-en-vivo/",
  "/mi-cuenta",
  "/ingresar",
  "/recuperar",
  "/restablecer",
  "/puerta",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE_PATHS }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
