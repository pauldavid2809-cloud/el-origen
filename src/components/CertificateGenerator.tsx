"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";
import type { Language } from "@/lib/i18n";
import { CONTACT } from "@/lib/contact";

/* Certificado de degustador: recuerdo simbólico de la cata (PDF A4 e imagen para historias 1080×1920). */

export interface CertificateSigner {
  name: string;
  role?: string;
}

interface CertificateGeneratorProps {
  lang: Language;
  attendeeName: string;
  tastingTitle: string;
  tastingDate: string;
  /** Promedio de las copas calificadas (null si aún no calificó ninguna). */
  averageScore: number | null;
  glassesRated: number;
  /** Aromas más marcados, ya traducidos. */
  featuredAromas: string[];
  certificateCode: string;
  /** Sommeliers de la cata (máx. 2 en el PDF). */
  signers: CertificateSigner[];
  /** Ficha de demostración: el certificado lo indica. */
  demo?: boolean;
}

const COPY = {
  es: {
    kicker: "Certificado de degustador",
    awardedTo: "Otorgado a",
    completed: "Por completar la experiencia de cata guiada",
    heldOn: (date: string) => `Celebrada el ${date}`,
    score: "Puntaje promedio",
    glasses: "Copas calificadas",
    aromas: "Aromas destacados",
    code: (code: string) => `Entrada ${code}`,
    disclaimer: "Recuerdo simbólico de la experiencia; no tiene validez oficial.",
    city: "Caracas · Venezuela",
    demo: "Ejemplo de demostración",
    downloadPdf: "Descargar PDF",
    shareImage: "Compartir imagen",
    downloadImage: "Descargar imagen",
    working: "Preparando…",
    imageError: "No se pudo crear la imagen. Inténtalo de nuevo.",
    shareText: (title: string) => `Viví la cata «${title}» en El Origen.`,
    previewLabel: "Vista previa del certificado",
    fileName: "Certificado-El-Origen",
  },
  en: {
    kicker: "Taster certificate",
    awardedTo: "Awarded to",
    completed: "For completing the guided tasting experience",
    heldOn: (date: string) => `Held on ${date}`,
    score: "Average score",
    glasses: "Glasses rated",
    aromas: "Featured aromas",
    code: (code: string) => `Ticket ${code}`,
    disclaimer: "Symbolic keepsake of the experience; it has no official validity.",
    city: "Caracas · Venezuela",
    demo: "Demo example",
    downloadPdf: "Download PDF",
    shareImage: "Share image",
    downloadImage: "Download image",
    working: "Preparing…",
    imageError: "The image could not be created. Please try again.",
    shareText: (title: string) => `I enjoyed the "${title}" tasting at El Origen.`,
    previewLabel: "Certificate preview",
    fileName: "El-Origen-Certificate",
  },
};

const WINE = "#5A1C31";
const GOLD = "#C08A3E";
const CREAM = "#F6DDB6";

const safeFileName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "certificado";

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function CertificateGenerator({
  lang,
  attendeeName,
  tastingTitle,
  tastingDate,
  averageScore,
  glassesRated,
  featuredAromas,
  certificateCode,
  signers,
  demo = false,
}: CertificateGeneratorProps) {
  const t = COPY[lang];
  const [busy, setBusy] = useState<"pdf" | "image" | null>(null);
  const [error, setError] = useState("");
  const [canShareFiles, setCanShareFiles] = useState(false);
  const aromas = featuredAromas.slice(0, 3);

  useEffect(() => {
    try {
      const probe = new File([new Blob()], "probe.png", { type: "image/png" });
      setCanShareFiles(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShareFiles(false);
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 }, colors: ["#7D2A46", GOLD, WINE, "#E8BE7E"] });
    } catch {
      // Sin animación.
    }
  }, []);

  /* ─── PDF A4 ─── */
  const downloadPdf = () => {
    setBusy("pdf");
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const center = (text: string, y: number) => doc.text(text, 105, y, { align: "center" });

      doc.setFillColor(250, 246, 240);
      doc.rect(0, 0, 210, 297, "F");
      doc.setDrawColor(125, 42, 70);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, 190, 277);
      doc.setDrawColor(192, 138, 62);
      doc.setLineWidth(0.5);
      doc.rect(14, 14, 182, 269);

      doc.setTextColor(125, 42, 70);
      doc.setFont("times", "bold");
      doc.setFontSize(30);
      center("EL ORIGEN", 40);
      doc.setTextColor(110, 98, 90);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      center(t.city.toUpperCase(), 48);

      doc.setTextColor(192, 138, 62);
      doc.setFontSize(14);
      center(t.kicker.toUpperCase(), 66);
      if (demo) {
        doc.setFontSize(10);
        center(`(${t.demo})`, 73);
      }

      doc.setTextColor(42, 21, 25);
      doc.setFont("times", "italic");
      doc.setFontSize(14);
      center(t.awardedTo, 88);

      doc.setTextColor(90, 28, 49);
      doc.setFont("times", "bold");
      let nameSize = 26;
      doc.setFontSize(nameSize);
      while (nameSize > 16 && doc.getTextWidth(attendeeName) > 165) doc.setFontSize(--nameSize);
      center(attendeeName, 104);

      doc.setTextColor(106, 86, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      center(t.completed, 120);

      doc.setTextColor(125, 42, 70);
      doc.setFont("times", "bold");
      doc.setFontSize(18);
      const titleLines: string[] = doc.splitTextToSize(`"${tastingTitle}"`, 160).slice(0, 3);
      titleLines.forEach((line, i) => center(line, 132 + i * 8));
      let y = 132 + titleLines.length * 8;

      doc.setTextColor(110, 98, 90);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      if (tastingDate) center(t.heldOn(tastingDate), y + 2);

      y += 14;
      doc.setDrawColor(218, 205, 188);
      doc.line(40, y, 170, y);
      if (averageScore !== null) {
        doc.setTextColor(90, 28, 49);
        doc.setFont("times", "bold");
        doc.setFontSize(22);
        center(`${averageScore} / 100`, y + 13);
        doc.setTextColor(110, 98, 90);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        center(`${t.score} · ${t.glasses}: ${glassesRated}`, y + 20);
      }
      if (aromas.length) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        center(`${t.aromas}: ${aromas.join(", ")}`, y + 28);
      }
      doc.line(40, y + 35, 170, y + 35);

      const signatures = signers.slice(0, 2);
      const lines = signatures.length ? signatures : [{ name: "El Origen", role: "" }];
      const xs = lines.length === 2 ? [65, 145] : [105];
      lines.forEach((s, i) => {
        doc.setDrawColor(110, 98, 90);
        doc.line(xs[i] - 30, 228, xs[i] + 30, 228);
        doc.setTextColor(42, 21, 25);
        doc.setFont("times", "italic");
        doc.setFontSize(13);
        doc.text(s.name, xs[i], 235, { align: "center" });
        if (s.role) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(110, 98, 90);
          doc.text(doc.splitTextToSize(s.role, 70).slice(0, 2), xs[i], 241, { align: "center" });
        }
      });

      doc.setTextColor(110, 98, 90);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      center(`${t.code(certificateCode)} · ${CONTACT.instagramHandle}`, 262);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      center(t.disclaimer, 270);

      doc.save(`${t.fileName}-${safeFileName(attendeeName)}.pdf`);
    } finally {
      setBusy(null);
    }
  };

  /* ─── Imagen para historias ─── */
  const renderImage = async (): Promise<Blob> => {
    await Promise.all(
      ["600 96px Gelasio", "italic 400 44px Gelasio", "600 32px Figtree", "400 30px Figtree"].map((f) =>
        document.fonts?.load(f).catch(() => [])
      )
    );
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    const serif = "Gelasio, Georgia, serif";
    const sans = "Figtree, system-ui, sans-serif";

    ctx.fillStyle = WINE;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = GOLD;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, W - 96, H - 96);
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const text = (value: string, y: number, font: string, color: string) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.fillText(value, W / 2, y);
    };
    const block = (value: string, y: number, font: string, color: string, lineHeight: number, maxLines: number) => {
      ctx.font = font;
      const lines = wrapLines(ctx, value, W - 220).slice(0, maxLines);
      lines.forEach((line, i) => text(line, y + i * lineHeight, font, color));
      return y + lines.length * lineHeight;
    };

    text(t.kicker.toUpperCase(), 220, `600 30px ${sans}`, GOLD);
    text("EL ORIGEN", 330, `600 96px ${serif}`, "#FFFFFF");
    text(t.city.toUpperCase(), 390, `400 28px ${sans}`, "rgba(255,255,255,0.65)");
    if (demo) text(t.demo.toUpperCase(), 450, `600 26px ${sans}`, CREAM);

    text(t.awardedTo, 640, `italic 400 44px ${serif}`, "rgba(255,255,255,0.8)");
    let y = block(attendeeName, 740, `600 84px ${serif}`, CREAM, 96, 2);

    y = block(tastingTitle, y + 70, `600 46px ${serif}`, "#FFFFFF", 58, 3);
    if (tastingDate) text(tastingDate, y + 10, `400 32px ${sans}`, "rgba(255,255,255,0.7)");

    const boxTop = y + 80;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(140, boxTop, W - 280, 230);
    if (averageScore !== null) {
      text(t.score.toUpperCase(), boxTop + 62, `600 26px ${sans}`, GOLD);
      text(`${averageScore} / 100`, boxTop + 150, `600 80px ${serif}`, "#FFFFFF");
      text(`${t.glasses}: ${glassesRated}`, boxTop + 200, `400 28px ${sans}`, "rgba(255,255,255,0.7)");
    } else {
      text(t.completed, boxTop + 125, `400 32px ${sans}`, "rgba(255,255,255,0.85)");
    }
    if (aromas.length) {
      text(t.aromas.toUpperCase(), boxTop + 310, `600 26px ${sans}`, GOLD);
      block(aromas.join(" · "), boxTop + 360, `400 34px ${sans}`, CREAM, 44, 2);
    }

    text(t.code(certificateCode), H - 250, `600 28px ${sans}`, "rgba(255,255,255,0.75)");
    text(CONTACT.instagramHandle, H - 200, `400 28px ${sans}`, "rgba(255,255,255,0.6)");
    block(t.disclaimer, H - 140, `italic 400 26px ${serif}`, "rgba(255,255,255,0.6)", 34, 2);

    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png"));
  };

  const shareImage = async () => {
    setBusy("image");
    setError("");
    try {
      const blob = await renderImage();
      const file = new File([blob], `${t.fileName}-${safeFileName(attendeeName)}.png`, { type: "image/png" });
      if (canShareFiles && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "El Origen", text: t.shareText(tastingTitle) }).catch(() => {});
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } catch {
      setError(t.imageError);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <figure
        aria-label={t.previewLabel}
        className="relative w-full aspect-[9/16] overflow-hidden rounded-2xl bg-primary text-white p-7 sm:p-9 flex flex-col text-center shadow-xl"
      >
        <div className="absolute inset-3 rounded-xl border border-gold/50 pointer-events-none" aria-hidden="true" />
        <div className="relative pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{t.kicker}</p>
          <p className="font-serif text-3xl mt-2">EL ORIGEN</p>
          <p className="text-[10px] uppercase tracking-widest text-white/65 mt-1">{t.city}</p>
          {demo && <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-tertiary-fixed">{t.demo}</p>}
        </div>

        <div className="relative my-auto space-y-4">
          <div>
            <p className="font-serif italic text-[13px] text-white/80">{t.awardedTo}</p>
            <p className="font-serif text-[26px] sm:text-3xl leading-tight text-tertiary-fixed mt-1 break-words">{attendeeName}</p>
          </div>
          <div>
            <p className="font-serif text-[16px] leading-snug break-words">{tastingTitle}</p>
            {tastingDate && <p className="text-[12px] text-white/70 mt-1">{tastingDate}</p>}
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            {averageScore !== null ? (
              <>
                <p className="text-[9px] uppercase tracking-widest text-gold">{t.score}</p>
                <p className="font-serif text-3xl">{averageScore} / 100</p>
                <p className="text-[11px] text-white/70">
                  {t.glasses}: {glassesRated}
                </p>
              </>
            ) : (
              <p className="text-[12px] text-white/85">{t.completed}</p>
            )}
          </div>
          {aromas.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-1.5" aria-label={t.aromas}>
              {aromas.map((a) => (
                <li key={a} className="rounded-full border border-gold/50 bg-gold/20 px-2.5 py-0.5 text-[10px] text-tertiary-fixed">
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>

        <figcaption className="relative border-t border-white/15 pt-3 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-white/70 font-mono">{t.code(certificateCode)}</p>
          <p className="text-[10px] italic text-white/60 leading-snug">{t.disclaimer}</p>
        </figcaption>
      </figure>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        <button
          type="button"
          onClick={downloadPdf}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">picture_as_pdf</span>
          {busy === "pdf" ? t.working : t.downloadPdf}
        </button>
        <button
          type="button"
          onClick={shareImage}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded border border-outline-variant bg-surface-container-lowest hover:border-primary-container text-[14px] font-semibold disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[20px] text-primary-container ${busy === "image" ? "animate-spin" : ""}`} aria-hidden="true">
            {busy === "image" ? "progress_activity" : canShareFiles ? "ios_share" : "download"}
          </span>
          {busy === "image" ? t.working : canShareFiles ? t.shareImage : t.downloadImage}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-[14px] text-error">
          {error}
        </p>
      )}
      <p className="mt-4 text-[13px] text-on-surface-variant text-center">{t.disclaimer}</p>
    </div>
  );
}
