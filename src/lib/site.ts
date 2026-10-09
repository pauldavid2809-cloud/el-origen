/** Dirección pública del sitio (sin "/" final). En producción la define NEXT_PUBLIC_APP_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://elorigenvzla.com").replace(/\/+$/, "");
