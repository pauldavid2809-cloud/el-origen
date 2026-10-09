/* Arma el paquete del bot de WhatsApp para el cliente (como el del congreso): una carpeta lista para usar
   y su .zip en dist/. El cliente solo extrae el .zip y hace doble clic en INICIAR-BOT.bat; no edita nada.

   Uso:   npm run empaquetar-bot -- --secret=<WHATSAPP_QUEUE_SECRET> [--url=https://elorigenvzla.com]
   Sin --secret se usa WHATSAPP_QUEUE_SECRET del entorno o de .env.local.

   El paquete lleva esa clave en su archivo .env: comparta el .zip solo con el cliente (dist/ no se sube a git). */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "whatsapp-bot");
const NAME = "Bot-WhatsApp-ElOrigen";
const outDir = path.join(root, "dist");
const dest = path.join(outDir, NAME);
const zip = path.join(outDir, `${NAME}.zip`);

const arg = (key) => process.argv.slice(2).find((a) => a.startsWith(`--${key}=`))?.slice(key.length + 3).trim();

/** Valor de una variable en .env.local o .env del sitio (KEY=valor, con o sin comillas). */
function fromEnvFiles(key) {
  for (const file of [".env.local", ".env"]) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const line = fs.readFileSync(full, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
    const value = line?.slice(key.length + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
    if (value) return value;
  }
  return "";
}

const secret = arg("secret") || process.env.WHATSAPP_QUEUE_SECRET || fromEnvFiles("WHATSAPP_QUEUE_SECRET");
const url = (arg("url") || "https://elorigenvzla.com").replace(/\/+$/, "");

if (!secret || secret.length < 16) {
  console.error(
    "\n❌ Falta la clave del bot (mínimo 16 caracteres).\n" +
      "   Use: npm run empaquetar-bot -- --secret=<la misma WHATSAPP_QUEUE_SECRET de Vercel>\n"
  );
  process.exit(1);
}
if (!/^https:\/\/[^/]+$/.test(url)) {
  console.error(`\n❌ La dirección del sitio debe ser https://dominio (recibido: ${url}).\n`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.rmSync(zip, { force: true });
fs.mkdirSync(dest, { recursive: true });

for (const file of ["index.js", "package.json", "package-lock.json", "LEEME-PRIMERO.txt", "README.md"]) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}
// cmd.exe falla con etiquetas y goto si el .bat tiene saltos de línea LF: se asegura CRLF.
const bat = fs.readFileSync(path.join(src, "INICIAR-BOT.bat"), "utf8").replace(/\r?\n/g, "\r\n");
fs.writeFileSync(path.join(dest, "INICIAR-BOT.bat"), bat);
fs.writeFileSync(
  path.join(dest, ".env"),
  [
    "# Configuración del bot de El Origen (generada por scripts/empaquetar-bot.mjs).",
    `APP_URL=${url}`,
    `WHATSAPP_QUEUE_SECRET=${secret}`,
    "PORT=3001",
    "POLL_SECONDS=4",
    "",
  ].join("\r\n")
);

// bsdtar crea .zip con -a según la extensión. En Windows se usa el del sistema: el `tar` de Git (GNU) no hace .zip.
const TAR = process.platform === "win32" ? path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe") : "tar";
try {
  execFileSync(TAR, ["-a", "-c", "-f", zip, "-C", outDir, NAME], { stdio: "inherit" });
} catch {
  // GNU tar (Linux) no crea .zip: se usa zip.
  execFileSync("zip", ["-rq", zip, NAME], { cwd: outDir, stdio: "inherit" });
}

console.log(`\n✅ Paquete listo para el cliente:\n   ${zip}\n   Sitio: ${url}\n   Compártalo solo con el cliente: incluye la clave del bot.\n`);
