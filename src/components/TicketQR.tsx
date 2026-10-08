"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import type { Language } from "@/lib/i18n";

/* Entrada individual (una por persona): QR, descarga en PNG, compartir y nombre opcional del asistente. */

/** Entrada tal como la devuelve `GET /api/orders/[token]` (solo órdenes aprobadas). */
export interface PublicTicket {
  number: number;
  token: string;
  code: string;
  attendeeName: string | null;
  checkedInAt: string | null;
}

const ATTENDEE_NAME_MAX = 80;

const COPY = {
  es: {
    ticketOf: (n: number, total: number) => `Entrada ${n} de ${total}`,
    valid: "Válida",
    used: "Utilizada",
    qrAlt: (code: string) => `Código QR de la entrada ${code}`,
    attendee: "Nombre del asistente (opcional)",
    attendeeHint: "Así sabremos quién usa cada entrada.",
    attendeePlaceholder: "Ej: Ana Pérez",
    save: "Guardar",
    saving: "Guardando…",
    saved: "Nombre guardado.",
    saveError: "No se pudo guardar el nombre.",
    download: "Descargar PNG",
    share: "Compartir",
    linkCopied: "Enlace copiado: envíalo a quien usará esta entrada.",
    shareError: "No se pudo compartir. Descarga la imagen y envíala.",
    shareText: (title: string, code: string) => `Tu entrada para «${title}» en El Origen (${code}). Preséntala en la puerta.`,
    live: "Ficha de cata en vivo",
    pngTicket: "ENTRADA",
    pngFooter: "Presenta este código en la puerta · Válido para 1 persona",
  },
  en: {
    ticketOf: (n: number, total: number) => `Ticket ${n} of ${total}`,
    valid: "Valid",
    used: "Used",
    qrAlt: (code: string) => `QR code for ticket ${code}`,
    attendee: "Guest name (optional)",
    attendeeHint: "So we know who uses each ticket.",
    attendeePlaceholder: "E.g. Ana Pérez",
    save: "Save",
    saving: "Saving…",
    saved: "Name saved.",
    saveError: "The name could not be saved.",
    download: "Download PNG",
    share: "Share",
    linkCopied: "Link copied: send it to whoever will use this ticket.",
    shareError: "Sharing failed. Download the image and send it instead.",
    shareText: (title: string, code: string) => `Your ticket for “${title}” at El Origen (${code}). Show it at the door.`,
    live: "Live tasting sheet",
    pngTicket: "TICKET",
    pngFooter: "Show this code at the door · Valid for 1 person",
  },
} as const;

const INK = "#2A1519";
const WINE = "#7D2A46";
const SUN = "#D9A35A";
const PAPER = "#F6F0E7";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Parte un texto en líneas que caben en `maxWidth` (máximo `maxLines`, con elipsis). */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

interface TicketPngInput {
  qrDataUrl: string;
  code: string;
  label: string;
  tastingTitle: string;
  when: string;
  attendeeName: string | null;
  ticketWord: string;
  footer: string;
}

/** Imagen de la entrada (1080 × 1500) para guardar o compartir. */
async function buildTicketPng(input: TicketPngInput): Promise<Blob> {
  const W = 1080;
  const H = 1500;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  if (document.fonts?.ready) await document.fonts.ready;

  const serif = "Gelasio, Georgia, serif";
  const sans = "Figtree, system-ui, sans-serif";

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Cabecera vino con el nombre de la cata
  ctx.fillStyle = WINE;
  ctx.fillRect(0, 0, W, 300);
  ctx.textAlign = "center";
  ctx.fillStyle = SUN;
  ctx.font = `600 30px ${sans}`;
  ctx.fillText(`EL ORIGEN · ${input.ticketWord}`, W / 2, 84);
  ctx.fillStyle = PAPER;
  ctx.font = `600 54px ${serif}`;
  wrapLines(ctx, input.tastingTitle, W - 140, 2).forEach((line, i) => ctx.fillText(line, W / 2, 162 + i * 66));

  // QR
  const qr = await loadImage(input.qrDataUrl);
  const size = 700;
  const x = (W - size) / 2;
  const y = 360;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x - 20, y - 20, size + 40, size + 40);
  ctx.drawImage(qr, x, y, size, size);

  // Código y datos
  ctx.fillStyle = INK;
  ctx.font = `600 64px ${serif}`;
  ctx.fillText(input.code, W / 2, 1170);
  ctx.fillStyle = WINE;
  ctx.font = `600 32px ${sans}`;
  ctx.fillText(input.label, W / 2, 1222);
  ctx.fillStyle = INK;
  ctx.font = `400 32px ${sans}`;
  let line = 1290;
  if (input.attendeeName) {
    ctx.font = `600 36px ${sans}`;
    wrapLines(ctx, input.attendeeName, W - 160, 1).forEach((l) => ctx.fillText(l, W / 2, line));
    line += 52;
    ctx.font = `400 32px ${sans}`;
  }
  wrapLines(ctx, input.when, W - 160, 1).forEach((l) => ctx.fillText(l, W / 2, line));

  ctx.fillStyle = "#6A5650";
  ctx.font = `400 26px ${sans}`;
  ctx.fillText(input.footer, W / 2, H - 50);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/png")
  );
}

interface TicketQRProps {
  ticket: PublicTicket;
  /** Total de entradas de la orden. */
  total: number;
  /** Token de la orden (para guardar el nombre del asistente). */
  orderToken: string;
  tastingTitle: string;
  /** Fecha y hora legibles, ej. "Sábado, 24 de octubre de 2026 · 18:00 – 20:30". */
  when: string;
  lang: Language;
  onUpdated?: (ticket: PublicTicket) => void;
}

export function TicketQR({ ticket, total, orderToken, tastingTitle, when, lang, onUpdated }: TicketQRProps) {
  const t = COPY[lang];
  const [qr, setQr] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");
  const [name, setName] = useState(ticket.attendeeName ?? "");
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  const used = Boolean(ticket.checkedInAt);
  const label = t.ticketOf(ticket.number, total);
  const savedName = ticket.attendeeName ?? "";
  const dirty = name.trim() !== savedName;

  useEffect(() => {
    setName(ticket.attendeeName ?? "");
  }, [ticket.attendeeName]);

  useEffect(() => {
    const url = `${window.location.origin}/verificar/${ticket.token}`;
    setVerifyUrl(url);
    QRCode.toDataURL(url, { width: 640, margin: 2, errorCorrectionLevel: "M", color: { dark: INK, light: "#FFFFFF" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [ticket.token]);

  // La imagen se prepara de antemano: así "Compartir" llama a navigator.share dentro del mismo toque
  // (Safari exige que la llamada ocurra durante la activación del usuario).
  const [pngBlob, setPngBlob] = useState<Blob | null>(null);
  useEffect(() => {
    if (!qr) return;
    let alive = true;
    buildTicketPng({
      qrDataUrl: qr,
      code: ticket.code,
      label,
      tastingTitle,
      when,
      attendeeName: ticket.attendeeName,
      ticketWord: t.pngTicket,
      footer: t.pngFooter,
    })
      .then((blob) => alive && setPngBlob(blob))
      .catch(() => alive && setPngBlob(null));
    return () => {
      alive = false;
    };
  }, [qr, ticket.code, ticket.attendeeName, label, tastingTitle, when, t.pngTicket, t.pngFooter]);

  const fileName = `entrada-${ticket.code}.png`;

  const download = () => {
    setNotice(null);
    const href = pngBlob ? URL.createObjectURL(pngBlob) : qr;
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (pngBlob) setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const share = async () => {
    setNotice(null);
    const text = t.shareText(tastingTitle, ticket.code);
    const file = pngBlob ? new File([pngBlob], fileName, { type: "image/png" }) : null;
    setSharing(true);
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: label, text });
      } else if (typeof navigator.share === "function") {
        await navigator.share({ title: label, text, url: verifyUrl });
      } else {
        await navigator.clipboard.writeText(verifyUrl);
        setNotice({ text: t.linkCopied, tone: "ok" });
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") setNotice({ text: t.shareError, tone: "error" });
    } finally {
      setSharing(false);
    }
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderToken)}/tickets/${ticket.number}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeName: name.trim().slice(0, ATTENDEE_NAME_MAX) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message);
      const updated: PublicTicket = { ...ticket, ...(data.ticket ?? {}), attendeeName: data.ticket?.attendeeName ?? (name.trim() || null) };
      onUpdated?.(updated);
      setNotice({ text: t.saved, tone: "ok" });
    } catch (err) {
      setNotice({ text: (err as Error).message || t.saveError, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  const inputId = `attendee-${ticket.number}`;

  return (
    <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6" aria-label={`${label} · ${ticket.code}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">{label}</p>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${
            used ? "bg-surface-container-high text-on-surface-variant" : "bg-emerald-100 text-emerald-900"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{used ? "done_all" : "verified"}</span>
          {used ? t.used : t.valid}
        </span>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-5 sm:items-start">
        <div className="mx-auto sm:mx-0 w-full max-w-[240px] sm:w-[200px] aspect-square flex-shrink-0 rounded-xl border border-outline-variant bg-white p-2.5">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={t.qrAlt(ticket.code)} className={`w-full h-full ${used ? "opacity-40" : ""}`} />
          ) : (
            <div className="w-full h-full animate-pulse bg-surface-container rounded" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-serif text-2xl tracking-wider text-on-surface text-center sm:text-left">{ticket.code}</p>

          <form onSubmit={saveName} className="mt-4">
            <label htmlFor={inputId} className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-1.5">
              {t.attendee}
            </label>
            <div className="flex gap-2">
              <input
                id={inputId}
                value={name}
                maxLength={ATTENDEE_NAME_MAX}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.attendeePlaceholder}
                disabled={used}
                autoComplete="name"
                aria-describedby={`${inputId}-hint`}
                className="min-w-0 flex-1 h-11 bg-surface-container-lowest border border-outline-variant rounded px-3 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={saving || used || !dirty}
                className="h-11 px-4 rounded border border-primary-container text-primary-container text-[13px] font-semibold hover:bg-primary-container/5 disabled:opacity-40"
              >
                {saving ? t.saving : t.save}
              </button>
            </div>
            <p id={`${inputId}-hint`} className="mt-1 text-[12px] text-on-surface-variant">{t.attendeeHint}</p>
          </form>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={download}
              disabled={!qr}
              className="inline-flex items-center justify-center gap-1.5 h-12 px-3 rounded bg-primary-container hover:bg-primary text-white text-[13px] font-semibold disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
              {t.download}
            </button>
            <button
              type="button"
              onClick={share}
              disabled={!qr || sharing}
              className="inline-flex items-center justify-center gap-1.5 h-12 px-3 rounded border border-outline-variant hover:border-primary-container text-on-surface text-[13px] font-semibold disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] ${sharing ? "animate-spin" : ""}`} aria-hidden="true">
                {sharing ? "progress_activity" : "ios_share"}
              </span>
              {t.share}
            </button>
          </div>

          <Link
            href={`/cata-en-vivo/${ticket.token}`}
            className="mt-3 inline-flex items-center gap-1.5 min-h-11 text-[13px] font-semibold text-primary-container underline-offset-4 hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">wine_bar</span>
            {t.live}
          </Link>

          {notice && (
            <p role="status" className={`mt-2 text-[13px] ${notice.tone === "ok" ? "text-emerald-800" : "text-error"}`}>
              {notice.text}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
