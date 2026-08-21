"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";

interface CertificateGeneratorProps {
  attendeeName: string;
  tastingTitle: string;
  tastingDate: string;
  averageScore?: number;
  featuredAromas?: string[];
  certificateCode: string;
}

export function CertificateGenerator({
  attendeeName,
  tastingTitle,
  tastingDate,
  averageScore = 94,
  featuredAromas = ["Ciruela Negra", "Violetas", "Roble Tostado", "Grafito"],
  certificateCode,
}: CertificateGeneratorProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Launch celebratory confetti with brand colors
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#7A2048", "#C9A84C", "#5C0531", "#E8DC9E"],
      });
    } catch {
      // ignore
    }
  }, []);

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Background color
    doc.setFillColor(250, 248, 247);
    doc.rect(0, 0, 210, 297, "F");

    // Luxury Border
    doc.setDrawColor(122, 32, 72);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 190, 277);
    doc.setDrawColor(201, 168, 76);
    doc.setLineWidth(0.5);
    doc.rect(14, 14, 182, 269);

    // Title & Header
    doc.setTextColor(122, 32, 72);
    doc.setFont("times", "bold");
    doc.setFontSize(28);
    doc.text("EL ORIGEN", 105, 38, { align: "center" });

    doc.setTextColor(107, 105, 102);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("EXPERIENCIA DE CATA & MARIDAJE • CARACAS", 105, 46, { align: "center" });

    doc.setTextColor(201, 168, 76);
    doc.setFontSize(14);
    doc.text("★  CERTIFICADO DE DEGUSTADOR HONORÍFICO  ★", 105, 62, { align: "center" });

    // Body text
    doc.setTextColor(26, 26, 26);
    doc.setFont("times", "italic");
    doc.setFontSize(14);
    doc.text("Por cuanto se hace constar que", 105, 82, { align: "center" });

    // Attendee Name
    doc.setTextColor(92, 5, 49);
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.text(attendeeName || "Catador Distinguido", 105, 102, { align: "center" });

    // Experience text
    doc.setTextColor(100, 88, 92);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Ha completado con distinción la experiencia de cata sensorial`, 105, 120, { align: "center" });

    doc.setTextColor(122, 32, 72);
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text(`"${tastingTitle}"`, 105, 132, { align: "center" });

    doc.setTextColor(107, 105, 102);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Celebrada el ${tastingDate} en El Origen Caracas`, 105, 142, { align: "center" });

    // Scores & Aromas
    doc.setDrawColor(221, 210, 213);
    doc.setLineWidth(0.5);
    doc.line(40, 155, 170, 155);

    doc.setTextColor(92, 5, 49);
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text(`${averageScore} / 100 PUNTOS`, 105, 168, { align: "center" });

    doc.setTextColor(107, 105, 102);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(`Descriptores sensoriales dominantes: ${featuredAromas.join(", ")}`, 105, 178, { align: "center" });

    doc.line(40, 190, 170, 190);

    // Signatures
    doc.setTextColor(26, 26, 26);
    doc.setFont("times", "italic");
    doc.setFontSize(13);
    doc.text("Belkis Croquer", 65, 225, { align: "center" });
    doc.text("Jaifred Pastran", 145, 225, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 105, 102);
    doc.text("Head Sommelier", 65, 232, { align: "center" });
    doc.text("Sommelier Anfitrión", 145, 232, { align: "center" });

    // Certificate ID & Date
    doc.setFontSize(8);
    doc.text(`Certificado N° ${certificateCode} • Emitido en Caracas, Venezuela`, 105, 260, { align: "center" });

    doc.save(`Certificado-El-Origen-${attendeeName.replace(/\s+/g, "_")}.pdf`);
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: "Mi Certificado en El Origen",
        text: `¡Completé la cata en El Origen con ${averageScore} puntos!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full animate-fade-in-up">
      {/* Story / Instagram Canvas Preview (9:16 Aspect Ratio in Double-Bezel Frame) */}
      <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-black/[0.03] border border-black/[0.05] w-full">
        <div
          id="instagram-certificate"
          className="w-full aspect-[9/16] bg-[#5C0531] text-white rounded-[calc(2.5rem-0.625rem)] p-8 sm:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-[#C9A84C]/40"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
            <svg className="w-full h-full stroke-white" fill="none" viewBox="0 0 100 100">
              <path d="M0 80 L30 30 L50 60 L75 15 L100 80" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Top Branding */}
          <div className="text-center relative z-10 pt-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C9A84C] block mb-1">
              Wine Tasting Diploma
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              EL ORIGEN
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-white/60 mt-0.5">
              Caracas • Venezuela
            </p>
          </div>

          {/* Center Content */}
          <div className="text-center relative z-10 my-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full border border-[#C9A84C]/60 flex items-center justify-center bg-black/20 shadow-inner">
              <span className="material-symbols-outlined text-[#C9A84C] text-2xl">wine_bar</span>
            </div>

            <div>
              <p className="text-[12px] italic text-white/80 font-serif">
                Certificado de Degustador otorgado a
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FFE088] mt-1">
                {attendeeName || "Sommelier Distinguido"}
              </h2>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <p className="text-[13px] font-semibold text-white/95">
                {tastingTitle}
              </p>
              <p className="text-[11px] text-white/70 mt-0.5">
                {tastingDate}
              </p>

              <div className="mt-3 pt-3 border-t border-white/15 flex justify-around items-center">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-[#C9A84C] block">Puntaje</span>
                  <span className="font-serif text-2xl font-semibold">{averageScore} pts</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-[#C9A84C] block">Rango</span>
                  <span className="text-[12px] font-semibold">Gran Reserva</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {featuredAromas.slice(0, 3).map((a) => (
                <span
                  key={a}
                  className="text-[10px] bg-[#C9A84C]/20 border border-[#C9A84C]/40 px-2.5 py-0.5 rounded-full text-[#FFE088]"
                >
                  #{a}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center relative z-10 border-t border-white/15 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-white/60 font-mono">
              Pase Oficial N° {certificateCode}
            </p>
            <p className="text-[9px] text-white/40 mt-0.5">
              @elorigen.wines • www.elorigen.com
            </p>
          </div>
        </div>
      </div>

      {/* Download & Share Actions (Button-in-Button pattern) */}
      <div className="w-full flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={handleDownloadPDF}
          className="group flex-1 flex items-center justify-between pl-6 pr-2 py-2 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold rounded-full transition-all duration-300 shadow-sm active:scale-[0.98]"
        >
          <span>Descargar PDF Oficial</span>
          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
          </span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 bg-white border border-black/[0.08] hover:border-primary/40 text-on-surface text-[12px] font-semibold py-3 px-5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">share</span>
          <span>{copied ? "¡Enlace Copiado!" : "Compartir Diploma"}</span>
        </button>
      </div>
    </div>
  );
}
