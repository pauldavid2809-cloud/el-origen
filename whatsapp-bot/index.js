/* ─────────────────────────────────────────────────────────────
   Bot de WhatsApp de El Origen
   Conecta un WhatsApp como "dispositivo vinculado" (Baileys) y envía
   las entradas aprobadas en el panel (una imagen con QR por persona). Funciona en MODO COLA: el bot
   consulta al sitio cada pocos segundos, así que no necesita túneles
   ni direcciones públicas. Basado en el bot del Congreso AMCJ.
   ───────────────────────────────────────────────────────────── */

import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import pino from "pino";
import QRCode from "qrcode";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const APP_URL = (process.env.APP_URL || "https://elorigenvzla.com").replace(/\/+$/, "");
const QUEUE_SECRET = process.env.WHATSAPP_QUEUE_SECRET || "";
// Cada 4 s por defecto (como el bot del congreso): la entrada sale casi al instante de aprobarla.
const POLL_MS = Math.max(3, Number(process.env.POLL_SECONDS || 4)) * 1000;
const AUTH_DIR = process.env.AUTH_DIR || path.join(__dirname, "auth_info");
// Vinculación sin pantalla (servidores como Railway, donde nadie ve el panel local): con PAIRING_PHONE
// (el número de El Origen con código de país, ej. 584141074007) el bot pide un código de 8 caracteres
// y se escribe en WhatsApp → Dispositivos vinculados → «Vincular con el número de teléfono».
// Panel con dirección pública (Railway): sin PANEL_TOKEN el panel solo abre en esta máquina (127.0.0.1).
// Con PANEL_TOKEN se publica y TODO exige la clave: se entra con  https://…/?key=<PANEL_TOKEN>  (queda en
// una cookie y se quita de la URL). Quien tenga el enlace puede ver el QR y vincular el WhatsApp: no lo comparta.
const PANEL_TOKEN = (process.env.PANEL_TOKEN || "").trim();
const PANEL_HOST = PANEL_TOKEN ? "0.0.0.0" : "127.0.0.1";
// Solo caracteres seguros en una URL (un "+" o "&" de una clave en base64 rompería el enlace).
if (PANEL_TOKEN && !/^[A-Za-z0-9_-]{24,}$/.test(PANEL_TOKEN)) {
  console.error("\n❌ PANEL_TOKEN: use solo letras, números, - y _ (mínimo 24). Ejemplo: openssl rand -hex 32\n");
  process.exit(1);
}
const PAIRING_PHONE = (process.env.PAIRING_PHONE || "").replace(/\D/g, "");
// Un código nuevo vale ~3 min; no se pide otro antes para no invalidar el que se está escribiendo.
const PAIRING_COOLDOWN_MS = 150_000;
// Cada código le avisa al teléfono con una notificación: tras unos intentos sin usarlo, se detiene
// (para pedir otro: reiniciar el servicio o «Generar un QR nuevo desde cero» en el panel).
const PAIRING_MAX_TRIES = 4;

/* libsignal imprime en consola las claves de cada sesión ("Closing session: SessionEntry {…privKey…}").
   En un servidor eso quedaría guardado en los logs: se descartan solo esos mensajes. */
const SIGNAL_NOISE = /^(Closing session|Opening session|Removing old closed session|Session already (closed|open))/;
for (const level of ["info", "warn"]) {
  const original = console[level].bind(console);
  console[level] = (...args) => {
    if (typeof args[0] === "string" && SIGNAL_NOISE.test(args[0])) return;
    original(...args);
  };
}

if (!QUEUE_SECRET) {
  console.error("\n❌ Falta WHATSAPP_QUEUE_SECRET en el archivo .env (debe ser igual al de Vercel).\n");
  process.exit(1);
}

/* ─── Estado ─── */

let sock = null;
let qrSvg = null; // QR vectorial (nítido a cualquier tamaño); se renueva cada ~20 s
let qrAt = 0;
let qrCount = 0; // QR emitidos por esta conexión: el 1.º vale ~60 s, los siguientes ~20 s
let pairingCode = null;
let pairingAt = 0;
let lastPairRequest = 0;
let pairingAskedAt = 0;
let pairingTries = 0;
let siteOk = null; // null = aún no se sabe; true/false = último resultado al consultar la cola
let connected = false;
let myPhone = null;
let draining = false;
let resetting = false;
const stats = { sent: 0, failed: 0, pending: 0, lastPoll: null, lastError: null, message: "Iniciando…" };
const log = [];

function remember(line) {
  const stamp = new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  log.unshift(`${stamp}  ${line}`);
  log.length = Math.min(log.length, 30);
  console.log(`[${stamp}] ${line}`);
}

/* ─── Utilidades ─── */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** 0414-123.45.67 → 584141234567@s.whatsapp.net */
function toJid(phone) {
  let d = String(phone).replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "58" + d.slice(1);
  if (d.length === 10 && d.startsWith("4")) d = "58" + d;
  return `${d}@s.whatsapp.net`;
}

/* ─── Simulación humana (anti-bloqueo) ───
   Igual que el congreso: abrir el chat, "escribiendo…", pausa, enviar. */

async function typeLikeHuman(jid, length = 120) {
  try {
    await sock.presenceSubscribe(jid);
    await sleep(jitter(700, 1400));
    await sock.sendPresenceUpdate("composing", jid);
    await sleep(Math.min(6500, Math.max(3000, length * 12 + jitter(600, 1800))));
    await sock.sendPresenceUpdate("paused", jid);
    await sleep(jitter(400, 750));
  } catch {
    /* si falla la presencia, se envía igual */
  }
}

/** Límite prudente del texto al pie de una imagen (la API oficial de WhatsApp admite 1024). */
const CAPTION_MAX = 1024;

function qrImage(data) {
  return QRCode.toBuffer(data, {
    width: 640,
    margin: 3,
    errorCorrectionLevel: "M",
    color: { dark: "#2A1519", light: "#FFFFFF" },
  });
}

/**
 * Envía las entradas de una orden: una imagen con QR por persona.
 * La primera lleva el mensaje completo y las políticas; las demás, "Entrada 2 de 3 · EO-XXXXX-2".
 * Si el texto no cabe al pie de la imagen, las políticas salen en un mensaje aparte.
 */
async function sendTicket(item) {
  const jid = toJid(item.phone);
  const [exists] = await sock.onWhatsApp(jid);
  if (!exists?.exists) throw new Error(`El número ${item.phone} no tiene WhatsApp`);

  // Compatibilidad con la cola anterior (una sola imagen por orden).
  const tickets = item.tickets?.length ? item.tickets : [{ qrData: item.qrData, code: item.code, number: 1 }];
  const label = (t) => t.caption || `Entrada ${t.number} de ${tickets.length} · ${t.code}`;
  // Con varias entradas, la primera imagen también dice cuál es ("Entrada 1 de 3 · …").
  const message = tickets.length > 1 ? `${label(tickets[0])}\n\n${item.message}` : item.message;
  const policies = item.policies ? String(item.policies) : "";
  const full = policies ? `${message}\n\n${policies}` : message;
  const policiesApart = full.length > CAPTION_MAX;

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const caption = i === 0 ? (policiesApart ? message : full) : label(ticket);
    if (i > 0) await sleep(jitter(1500, 3500));
    await typeLikeHuman(exists.jid, i === 0 ? caption.length : 40);
    await sock.sendMessage(exists.jid, { image: await qrImage(ticket.qrData), caption, mimetype: "image/png" });

    if (i === 0 && policiesApart) {
      await sleep(jitter(1200, 2500));
      await typeLikeHuman(exists.jid, policies.length);
      await sock.sendMessage(exists.jid, { text: policies });
    }
  }
  return tickets.length;
}

/* ─── Cola ─── */

async function api(method, body) {
  const res = await fetch(`${APP_URL}/api/whatsapp/queue`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-queue-token": QUEUE_SECRET,
      "x-bot-connected": connected ? "1" : "0",
      "x-bot-phone": myPhone ?? "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new Error("Token rechazado: WHATSAPP_QUEUE_SECRET no coincide con Vercel");
  if (!res.ok) throw new Error(`El sitio respondió ${res.status}`);
  return res.json();
}

async function drainQueue() {
  if (draining) return;
  draining = true;
  try {
    const data = await api("GET");
    // Un solo aviso por cambio de estado (el panel local no se ve en un servidor: esto queda en los logs).
    if (siteOk !== true) remember("🟢 El sitio aceptó la clave del bot: cola conectada.");
    siteOk = true;
    stats.lastPoll = new Date();
    stats.lastError = null;
    const queue = connected ? data.queue ?? [] : [];
    stats.pending = (data.queue ?? []).length;
    stats.message = !connected
      ? "Esperando vinculación de WhatsApp…"
      : queue.length
        ? `Enviando ${queue.length} orden(es)…`
        : "Cola al día";

    for (let i = 0; i < queue.length; i++) {
      if (!connected) break;
      const item = queue[i];
      try {
        const count = await sendTicket(item);
        await api("POST", { orderId: item.orderId, status: "sent" });
        stats.sent++;
        remember(`✅ ${item.code}: ${count} entrada${count === 1 ? "" : "s"} enviada${count === 1 ? "" : "s"} a ${item.name} (+${item.phone})`);
      } catch (err) {
        stats.failed++;
        remember(`❌ ${item.code} (${item.name}): ${err.message}`);
        await api("POST", { orderId: item.orderId, status: "failed", error: err.message }).catch(() => {});
      }
      stats.pending = Math.max(0, queue.length - i - 1);

      if (i < queue.length - 1) {
        // Pausa aleatoria entre mensajes y descanso largo cada 4 envíos
        await sleep(jitter(5000, 9000));
        if ((i + 1) % 4 === 0) {
          remember("🧘 Pausa de descanso tras 4 envíos…");
          await sleep(jitter(15000, 25000));
        }
      }
    }
    if (queue.length) stats.message = "Cola al día";
  } catch (err) {
    if (siteOk !== false || stats.lastError !== err.message) remember(`🔴 Sin conexión con el sitio: ${err.message}`);
    siteOk = false;
    stats.lastError = err.message;
    stats.message = `Sin conexión con el sitio: ${err.message}`;
  } finally {
    draining = false;
  }
}

/* ─── Respuestas automáticas cordiales ───
   Leer los mensajes y contestar los "gracias" mejora la reputación del número. */

const repliedAt = new Map();
const THANKS = /gracias|recibid|listo|perfecto|excelente|genial|ok\b|👍|🙏/i;
const REPLIES = [
  "¡Con gusto! Nos vemos en la cata. 🍷",
  "¡Gracias a ti! Te esperamos. 🥂",
  "¡Un placer! Cualquier duda, aquí estamos. ✨",
];

async function onIncoming({ messages }) {
  for (const msg of messages ?? []) {
    try {
      if (!msg?.message || msg.key.fromMe || msg.key.remoteJid?.endsWith("@g.us")) continue;
      await sock.readMessages([msg.key]);
      const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
      const jid = msg.key.remoteJid;
      const last = repliedAt.get(jid) ?? 0;
      if (text && THANKS.test(text) && Date.now() - last > 6 * 3600_000) {
        repliedAt.set(jid, Date.now());
        await sleep(jitter(2000, 4500));
        await typeLikeHuman(jid, 40);
        await sock.sendMessage(jid, { text: REPLIES[jitter(0, REPLIES.length - 1)] });
      }
    } catch {
      /* ignorar */
    }
  }
}

/* ─── Conexión ─── */

/** Pide a WhatsApp un código de 8 caracteres para vincular con el número (alternativa al QR). */
async function requestPairing(digits) {
  if (!sock || sock.authState.creds.registered) throw new Error("WhatsApp no está listo para vincular");
  const raw = await sock.requestPairingCode(digits);
  pairingCode = (raw.match(/.{1,4}/g) ?? [raw]).join("-");
  pairingAt = Date.now();
  stats.message = `Escriba el código ${pairingCode} en WhatsApp → Dispositivos vinculados`;
  console.log("\n===================================================================");
  console.log(`🔑 CÓDIGO DE VINCULACIÓN: ${pairingCode}`);
  console.log(`   En el teléfono de +${digits}: WhatsApp → Ajustes → Dispositivos vinculados`);
  console.log("   → Vincular un dispositivo → «Vincular con el número de teléfono» y escríbalo.");
  console.log("   Vale unos 3 minutos.");
  console.log("===================================================================\n");
  return pairingCode;
}

async function connect() {
  try {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    let version;
    try {
      ({ version } = await fetchLatestBaileysVersion());
    } catch {
      /* usa la versión por defecto de la librería */
    }

    qrCount = 0;
    sock = makeWASocket({
      ...(version ? { version } : {}),
      auth: state,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Desktop"),
      syncFullHistory: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("messages.upsert", onIncoming);
    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        qrSvg = await QRCode.toString(qr, { type: "svg", margin: 4, errorCorrectionLevel: "L" });
        qrAt = Date.now();
        qrCount += 1;
        connected = false;
        stats.message = "Escanee el código QR desde WhatsApp → Dispositivos vinculados";
        console.log(
          PANEL_TOKEN
            ? "\n📱 Código QR listo: ábralo en el panel (enlace con su clave) y escanéelo.\n"
            : `\n📱 Código QR listo: abra http://localhost:${PORT} y escanéelo.\n`
        );
        if (PAIRING_PHONE && !sock.authState.creds.registered && Date.now() - pairingAskedAt > PAIRING_COOLDOWN_MS) {
          if (pairingTries >= PAIRING_MAX_TRIES) {
            if (pairingTries === PAIRING_MAX_TRIES) {
              pairingTries += 1;
              remember("⏸️ Código de vinculación sin usar tras varios intentos: reinicie el servicio para pedir otro.");
            }
          } else {
            pairingTries += 1;
            pairingAskedAt = Date.now();
            try {
              await requestPairing(PAIRING_PHONE);
            } catch (err) {
              remember(`⚠️ No se pudo pedir el código de vinculación: ${err?.message ?? err}`);
            }
          }
        }
      }
      if (connection === "open") {
        connected = true;
        qrSvg = null;
        pairingCode = null;
        myPhone = sock.user?.id?.split(":")[0]?.split("@")[0] ?? null;
        remember(`🟢 WhatsApp conectado (+${myPhone})`);
        setTimeout(drainQueue, 3000);
      }
      if (connection === "close") {
        connected = false;
        pairingCode = null; // el código pertenecía a esta conexión
        if (resetting) return;
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code === DisconnectReason.loggedOut) {
          remember("🔴 Sesión cerrada desde el teléfono. Generando un QR nuevo…");
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } else {
          remember(`🟠 Conexión perdida (${code ?? "?"}). Reconectando…`);
        }
        setTimeout(connect, 3000);
      }
    });
  } catch (err) {
    console.error("Error iniciando WhatsApp:", err);
    setTimeout(connect, 5000);
  }
}

/* ─── Panel local (solo en esta computadora) ─── */

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // detrás del proxy de Railway: req.secure según x-forwarded-proto

const sameSecret = (a, b) =>
  crypto.timingSafeEqual(crypto.createHash("sha256").update(String(a)).digest(), crypto.createHash("sha256").update(String(b)).digest());
const readCookie = (req, name) =>
  (req.headers.cookie ?? "")
    .split(";")
    .map((c) => c.trim().split("="))
    .find(([k]) => k === name)?.slice(1).join("=");

// Nada del panel se guarda en caché ni se indexa; con PANEL_TOKEN, nada responde sin la clave.
app.use((req, res, next) => {
  res.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" });
  if (!PANEL_TOKEN) return next();
  const cookie = readCookie(req, "eo_panel");
  let cookieValue = "";
  try {
    cookieValue = cookie ? decodeURIComponent(cookie) : "";
  } catch {
    /* cookie mal formada: se trata como ausente */
  }
  if (cookieValue && sameSecret(cookieValue, PANEL_TOKEN)) return next();
  const rawKey = req.method === "GET" ? req.query.key : undefined;
  // Al copiar el enlace de un chat suelen quedar pegados un punto, una coma, un paréntesis o un espacio al final.
  const key = typeof rawKey === "string" ? rawKey.trim().replace(/[^A-Za-z0-9_-]+$/, "") : undefined;
  if (typeof key === "string" && sameSecret(key, PANEL_TOKEN)) {
    res.cookie("eo_panel", PANEL_TOKEN, { httpOnly: true, sameSite: "lax", secure: req.secure, maxAge: 12 * 3600_000, path: "/" });
    return res.redirect("/"); // la clave no queda en la barra de direcciones ni en el historial
  }
  // Quien trae una clave (pero equivocada o cortada) merece saber qué pasó; quien no trae ninguna recibe un 404 liso.
  if (typeof rawKey === "string") {
    return res
      .status(404)
      .type("text/plain; charset=utf-8")
      .send("Enlace incompleto o con la clave equivocada.\nPida el enlace de nuevo y ábralo tal cual, completo, en una sola línea (sin espacios ni signos al final).");
  }
  res.status(404).type("text/plain").send("Not found");
});

// Los formularios del panel (POST) se leen solo con la clave ya validada y con tamaño mínimo.
app.use(express.urlencoded({ extended: false, limit: "2kb" }));

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

app.get("/", (req, res) => {
  const notice = req.query.ok ? `<p class="ok">${esc(req.query.ok)}</p>` : req.query.error ? `<p class="err">${esc(req.query.error)}</p>` : "";
  const steps = (last) =>
    `<ol><li>Abra <strong>WhatsApp</strong> en el teléfono de El Origen.</li><li>Toque <strong>⋮ / Ajustes → Dispositivos vinculados</strong>.</li><li>Toque <strong>Vincular un dispositivo</strong> y ${last}</li></ol>`;
  const qrBlock = qrSvg
    ? `${steps("escanee este código con el lector que se abre dentro de WhatsApp (no con la cámara normal del teléfono):")}
       <div id="qrbox" class="qrbox" data-age="${Math.max(0, Math.round((Date.now() - qrAt) / 1000))}" data-ttl="${qrCount <= 1 ? 60 : 20}">${qrSvg}</div>
       <p id="qrage" class="muted"></p>`
    : `<p class="muted">Conectando con WhatsApp…</p>`;
  const codeBlock = pairingCode
    ? `<div class="paircode"><strong>Código de vinculación</strong>
       <p class="code">${esc(pairingCode)}</p>
       <p class="muted">En el teléfono: <strong>Dispositivos vinculados → Vincular un dispositivo → «Vincular con el número de teléfono»</strong> y escriba este código. Vale unos 3 minutos${pairingAt ? ` (pedido hace ${Math.round((Date.now() - pairingAt) / 1000)} s)` : ""}.</p></div>`
    : "";
  const pairForm = `<details${pairingCode ? " open" : ""}><summary class="muted">¿No le funciona el QR? Vincular con el número de teléfono</summary>
       <form method="post" action="/pair" class="row" style="margin-top:10px"><input name="phone" inputmode="tel" placeholder="Número de El Origen, ej. 0414-107-4007" value="${esc(PAIRING_PHONE)}" required><button>Pedir código</button></form>
       <p class="muted" style="margin-top:8px">WhatsApp le mostrará una notificación en ese teléfono; entre al aviso o escriba el código que sale aquí.</p></details>`;
  const body = connected
    ? `<div class="state on"><span class="dot"></span><div><strong>WhatsApp conectado</strong><br>Número: +${esc(myPhone)}</div></div>
       <dl class="stats">
         <div><dt>Órdenes enviadas</dt><dd>${stats.sent}</dd></div>
         <div><dt>Fallidas</dt><dd>${stats.failed}</dd></div>
         <div><dt>En cola</dt><dd>${stats.pending}</dd></div>
       </dl>
       <p class="muted">${esc(stats.message)}${stats.lastPoll ? ` · última revisión ${stats.lastPoll.toLocaleTimeString("es-VE")}` : ""}</p>
       <form method="post" action="/drain-now"><button>Revisar la cola ahora</button></form>
       <form method="post" action="/test-send" class="row"><input name="phone" placeholder="Su número, ej. 0414-123-4567" required><button>Enviar prueba</button></form>
       <form method="post" action="/reset-session" onsubmit="return confirm('¿Desvincular este WhatsApp del bot?')"><button class="ghost">Desvincular / usar otro número</button></form>`
    : `${codeBlock}${qrBlock}${pairForm}
       <form method="post" action="/reset-session"><button class="ghost">Generar un QR nuevo desde cero</button></form>`;

  res.send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bot de WhatsApp · El Origen</title>
<style>
  :root{--wine:#7D2A46;--paper:#F6F0E7;--ink:#2A1519;--line:#DACDBC;--muted:#6A5650;--sun:#D9A35A}
  *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--paper);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;padding:16px}
  main{width:100%;max-width:440px;background:#FFFCF7;border:1px solid var(--line);border-radius:14px;overflow:hidden}
  header{background:var(--wine);color:var(--paper);padding:20px 24px}header h1{margin:0;font:700 22px Georgia,serif;letter-spacing:3px}header p{margin:4px 0 0;color:var(--sun);font-size:12px;letter-spacing:2px;text-transform:uppercase}
  section{padding:22px 24px;display:grid;gap:14px}
  .state{display:flex;gap:12px;align-items:center;padding:14px;border-radius:10px}.state.on{background:#E7F5EC;color:#14532D}
  .dot{width:12px;height:12px;border-radius:50%;background:#16A34A;flex:none;box-shadow:0 0 0 4px #16A34A33}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0}.stats div{border:1px solid var(--line);border-radius:8px;padding:10px;text-align:center}.stats dt{font-size:12px;color:var(--muted)}.stats dd{margin:0;font:600 22px Georgia,serif}
  .muted{color:var(--muted);font-size:13px;margin:0}
  button{width:100%;height:44px;border:0;border-radius:6px;background:var(--wine);color:#fff;font-weight:600;font-size:14px;cursor:pointer}button.ghost{background:transparent;color:var(--muted);border:1px solid var(--line)}
  .row{display:flex;gap:8px}.row input{flex:1;height:44px;border:1px solid var(--line);border-radius:6px;padding:0 12px;font-size:14px}.row button{width:auto;padding:0 16px}
  .code{margin:0;text-align:center;font:700 34px ui-monospace,Menlo,Consolas,monospace;letter-spacing:4px;color:var(--wine)}
  ol{margin:0;padding-left:20px}
  .qrbox{width:min(100%,360px);margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:10px;padding:4px;transition:opacity .3s}.qrbox svg{display:block;width:100%;height:auto;shape-rendering:crispEdges}
  .paircode{background:#FBF3E4;border:1px solid var(--sun);border-radius:10px;padding:14px;display:grid;gap:6px;text-align:center}
  details summary{cursor:pointer}
  .ok,.err{margin:0;padding:10px 12px;border-radius:6px;font-size:14px}.ok{background:#E7F5EC;color:#14532D}.err{background:#F9DEDC;color:#8C1D18}
  pre{margin:0;max-height:180px;overflow:auto;background:#F2EADF;border-radius:8px;padding:10px;font-size:12px;white-space:pre-wrap}
</style></head><body><main>
<header><h1>EL ORIGEN</h1><p>Bot de WhatsApp</p></header>
<section>${notice}${body}${stats.lastError ? `<p class="err">${esc(stats.lastError)}</p>` : ""}
${log.length ? `<details><summary class="muted">Actividad reciente</summary><pre>${esc(log.join("\n"))}</pre></details>` : ""}</section>
</main><script>
(function () {
  var box = document.getElementById("qrbox"), msg = document.getElementById("qrage");
  var age0 = box ? Number(box.getAttribute("data-age")) : 0, ttl = box ? Number(box.getAttribute("data-ttl")) : 20, t0 = Date.now();
  function tick() {
    if (!box) return;
    var s = age0 + Math.floor((Date.now() - t0) / 1000), old = s > ttl;
    box.style.opacity = old ? "0.2" : "1";
    msg.textContent = old ? "Este código ya venció: espere, se está actualizando…" : "Código generado hace " + s + " s · vale unos " + ttl + " s";
  }
  tick(); setInterval(tick, 1000);
  // Recarga sola (QR nuevo / estado), salvo que se esté escribiendo o el formulario de respaldo esté abierto.
  function reload() {
    var typing = document.activeElement && document.activeElement.tagName === "INPUT";
    if (typing || document.querySelector("details[open]")) return setTimeout(reload, 4000);
    location.replace("/");
  }
  setTimeout(reload, ${connected ? 15000 : 3000});
})();
</script></body></html>`);
});

app.get("/status", (_req, res) => {
  res.json({ connected, phone: myPhone, stats, log: log.slice(0, 10) });
});

app.post("/drain-now", (_req, res) => {
  drainQueue();
  res.redirect("/?ok=" + encodeURIComponent("Revisando la cola…"));
});

app.post("/test-send", async (req, res) => {
  if (!connected) return res.redirect("/?error=" + encodeURIComponent("WhatsApp no está conectado"));
  try {
    const jid = toJid(req.body.phone);
    const [exists] = await sock.onWhatsApp(jid);
    if (!exists?.exists) throw new Error("Ese número no tiene WhatsApp");
    const text = "¡Hola! 🍷 Este es un mensaje de prueba del bot de *El Origen*. Todo funciona correctamente.";
    await typeLikeHuman(exists.jid, text.length);
    await sock.sendMessage(exists.jid, { text });
    remember(`🧪 Prueba enviada a ${req.body.phone}`);
    res.redirect("/?ok=" + encodeURIComponent("Mensaje de prueba enviado"));
  } catch (err) {
    res.redirect("/?error=" + encodeURIComponent(err.message));
  }
});

app.post("/pair", async (req, res) => {
  const fail = (m) => res.redirect("/?error=" + encodeURIComponent(m));
  if (connected) return fail("WhatsApp ya está conectado");
  let digits = "";
  try {
    digits = toJid(String(req.body?.phone ?? "")).split("@")[0];
  } catch {
    /* se valida abajo */
  }
  if (!/^\d{10,15}$/.test(digits)) return fail("Escriba el número con código de país, ej. 0414-107-4007");
  // Cada código le manda una notificación al teléfono: un solo pedido por minuto.
  if (Date.now() - lastPairRequest < 60_000) return fail("Espere un minuto antes de pedir otro código");
  lastPairRequest = Date.now();
  try {
    await requestPairing(digits);
    remember(`🔑 Código de vinculación pedido para +${digits}`);
    res.redirect("/?ok=" + encodeURIComponent("Código listo: escríbalo en el teléfono"));
  } catch (err) {
    remember(`⚠️ No se pudo pedir el código de vinculación: ${err?.message ?? err}`);
    fail("No se pudo pedir el código: " + (err?.message ?? "intente de nuevo"));
  }
});

app.post("/reset-session", async (_req, res) => {
  resetting = true;
  try {
    await sock?.logout();
  } catch {
    /* ya estaba cerrada */
  }
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  connected = false;
  myPhone = null;
  qrSvg = null;
  pairingCode = null;
  pairingAskedAt = 0;
  pairingTries = 0;
  remember("🔄 Sesión reiniciada: escanee el nuevo QR.");
  setTimeout(() => {
    resetting = false;
    connect();
  }, 1000);
  res.redirect("/");
});

// Último recurso: ningún error revela trazas ni que hay Express detrás (todo es un 404 simple).
app.use((_err, _req, res, _next) => {
  res.status(404).type("text/plain").send("Not found");
});

// Sin PANEL_TOKEN solo escucha en esta computadora: el panel no queda expuesto a internet.
app.listen(PORT, PANEL_HOST, () => {
  console.log("===================================================================");
  console.log("   BOT DE WHATSAPP · EL ORIGEN");
  console.log(PANEL_TOKEN ? `   Panel: público en el puerto ${PORT}, protegido con PANEL_TOKEN` : `   Panel: http://localhost:${PORT}`);
  console.log(`   Sitio: ${APP_URL} (revisa la cola cada ${POLL_MS / 1000} s)`);
  console.log("===================================================================");
  connect();
  setInterval(drainQueue, POLL_MS);
});
