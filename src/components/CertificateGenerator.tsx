"use client";

import React, { useEffect } from "react";
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
  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#7a2048", "#d4af37", "#5c0531", "#e9c349"],
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
    doc.setFillColor(252, 249, 248);
    doc.rect(0, 0, 210, 297, "F");

    // Luxury Border
    doc.setDrawColor(122, 32, 72);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, 190, 277);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.rect(14, 14, 182, 269);

    // Title & Header
    doc.setTextColor(122, 32, 72);
    doc.setFont("times", "bold");
    doc.setFontSize(28);
    doc.text("EL ORIGEN", 105, 38, { align: "center" });

    doc.setTextColor(95, 94, 91);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("BOUTIQUE WINE TASTING EXPERIENCE • MENDOZA", 105, 46, { align: "center" });

    doc.setTextColor(212, 175, 55);
    doc.setFontSize(14);
    doc.text("★  CERTIFICADO DE DEGUSTADOR HONORÍFICO  ★", 105, 62, { align: "center" });

    // Body text
    doc.setTextColor(27, 28, 28);
    doc.setFont("times", "italic");
    doc.setFontSize(14);
    doc.text("Por cuanto se hace constar que", 105, 82, { align: "center" });

    // Attendee Name
    doc.setTextColor(92, 5, 49);
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.text(attendeeName || "Catador Distinguido", 105, 102, { align: "center" });

    // Experience text
    doc.setTextColor(84, 66, 71);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Ha completado con distinción la experiencia de cata sensorial`, 105, 120, { align: "center" });

    doc.setTextColor(122, 32, 72);
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text(`"${tastingTitle}"`, 105, 132, { align: "center" });

    doc.setTextColor(95, 94, 91);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Celebrada el ${tastingDate} en Bodega El Origen`, 105, 142, { align: "center" });

    // Scores & Aromas
    doc.setDrawColor(217, 192, 198);
    doc.setLineWidth(0.5);
    doc.line(40, 155, 170, 155);

    doc.setTextColor(92, 5, 49);
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text(`${averageScore} / 100 PUNTOS`, 105, 168, { align: "center" });

    doc.setTextColor(95, 94, 91);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(`Descriptores sensoriales dominantes: ${featuredAromas.join(", ")}`, 105, 178, { align: "center" });

    doc.line(40, 190, 170, 190);

    // Signatures
    doc.setTextColor(27, 28, 28);
    doc.setFont("times", "italic");
    doc.setFontSize(13);
    doc.text("Mariana Silva", 65, 225, { align: "center" });
    doc.text("Alejandro Morales", 145, 225, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(95, 94, 91);
    doc.text("Head Sommelier", 65, 232, { align: "center" });
    doc.text("Enólogo Principal", 145, 232, { align: "center" });

    // Certificate ID & Date
    doc.setFontSize(8);
    doc.text(`Certificado N° ${certificateCode} • Emitido en Mendoza, Argentina`, 105, 260, { align: "center" });

    doc.save(`Certificado-El-Origen-${attendeeName.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto">
      {/* Story / Instagram Canvas Preview (9:16 Aspect Ratio) */}
      <div
        id="instagram-certificate"
        className="w-full aspect-[9/16] bg-gradient-to-b from-[#3E001F] via-[#5C0531] to-[#1B030E] text-white rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden border-4 border-[#D4AF37]/40"
      >
        {/* Background Mountain Motif */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <svg className="w-full h-full stroke-white" fill="none" viewBox="0 0 100 100">
            <path d="M0 80 L30 30 L50 60 L75 15 L100 80" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Top Branding */}
        <div className="text-center relative z-10 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-1">
            Wine Tasting Diploma
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-wider text-white">
            EL ORIGEN
          </h1>
          <p className="text-[9px] uppercase tracking-widest text-white/70 mt-1">
            Mendoza • Argentina
          </p>
        </div>

        {/* Center Content */}
        <div className="text-center relative z-10 my-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full border border-[#D4AF37] flex items-center justify-center bg-black/30 shadow-inner">
            <span className="material-symbols-outlined text-[#D4AF37] text-3xl">wine_bar</span>
          </div>

          <div>
            <p className="text-xs italic text-white/80 font-serif">
              Certificado de Degustador otorgado a
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFE088] mt-1">
              {attendeeName || "Sommelier Distinguido"}
            </h2>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <p className="text-xs font-semibold text-white/90">
              {tastingTitle}
            </p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {tastingDate}
            </p>

            <div className="mt-3 pt-3 border-t border-white/15 flex justify-around items-center">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] block">Puntaje</span>
                <span className="font-serif text-xl font-bold">{averageScore} pts</span>
              </div>
              <div className="h-6 w-px bg-white/20"></div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] block">Rango</span>
                <span className="text-xs font-bold">Gran Reserva</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {featuredAromas.slice(0, 3).map((a) => (
              <span key={a} className="text-[10px] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2 py-0.5 rounded-full text-[#FFE088]">
                #{a}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center relative z-10 border-t border-white/20 pt-4">
          <p className="text-[9px] uppercase tracking-widest text-white/60">
            Pase Oficial N° {certificateCode}
          </p>
          <p className="text-[8px] text-white/40 mt-1">
            @elorigen.wines • www.elorigen.com
          </p>
        </div>
      </div>

      {/* Download Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={handleDownloadPDF}
          className="flex-1 bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl hover:bg-primary shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          Descargar PDF Oficial
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "Mi Certificado en El Origen",
                text: `¡Completé la cata en El Origen con ${averageScore} puntos!`,
                url: window.location.href,
              }).catch(() => {});
            } else {
              alert("Puedes hacer captura de pantalla para tu historia de Instagram.");
            }
          }}
          className="bg-surface border border-primary text-primary text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl hover:bg-surface-variant transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
          Compartir en Instagram
        </button>
      </div>
    </div>
  );
}
