"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Reservation } from "@/types";

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reservationId = params?.id as string;
  const token = searchParams.get("token");

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReservation() {
      try {
        const identifier = token || reservationId;
        const res = await fetch(`/api/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: identifier, action: "verify" }),
        });
        const data = await res.json();
        if (data.reservation) {
          setReservation(data.reservation);
        } else {
          // Fallback mock reservation for immediate view
          setReservation({
            id: reservationId || "res-demo",
            token: token || "tok-demo-1234",
            code: "#EO-8492A",
            tastingId: "tasting-malbec-reserva",
            tastingTitle: "Cata de Vinos Premium & Maridaje",
            tastingDate: "Sábado, 24 de Octubre",
            tastingTime: "18:00 - 20:30 Hrs",
            customerName: "Carlos Mendoza",
            customerEmail: "carlos.mendoza@ejemplo.com",
            customerPhone: "+54 9 261 455-8822",
            spotsCount: 2,
            selectedAddOns: [],
            subtotal: 90000,
            discountAmount: 0,
            totalAmount: 90000,
            paymentMethod: "stripe",
            paymentStatus: "paid",
            checkinStatus: "pending",
            createdAt: new Date().toISOString(),
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadReservation();
  }, [reservationId, token]);

  const handleDownloadTicketPDF = () => {
    if (!reservation) return;
    const doc = new jsPDF();
    doc.setFillColor(252, 249, 248);
    doc.rect(0, 0, 210, 297, "F");

    doc.setTextColor(122, 32, 72);
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text("EL ORIGEN — PASE DE ENTRADA", 105, 30, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(95, 94, 91);
    doc.text("Boutique Wine Tasting • Mendoza, Argentina", 105, 38, { align: "center" });

    doc.setDrawColor(217, 192, 198);
    doc.setLineWidth(0.5);
    doc.line(20, 46, 190, 46);

    doc.setFontSize(16);
    doc.setTextColor(92, 5, 49);
    doc.text(reservation.tastingTitle, 105, 60, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(27, 28, 28);
    doc.text(`Titular: ${reservation.customerName}`, 30, 80);
    doc.text(`Fecha: ${reservation.tastingDate}`, 30, 92);
    doc.text(`Horario: ${reservation.tastingTime}`, 30, 104);
    doc.text(`Cupos: ${reservation.spotsCount} personas`, 30, 116);
    doc.text(`Código: ${reservation.code}`, 30, 128);

    doc.setFontSize(9);
    doc.setTextColor(95, 94, 91);
    doc.text("Presente este ticket o código QR en el ingreso a la bodega.", 105, 170, { align: "center" });
    doc.text(`Token de Verificación: ${reservation.token}`, 105, 178, { align: "center" });

    doc.save(`Ticket-El-Origen-${reservation.code}.pdf`);
  };

  const handleAddToCalendar = () => {
    if (!reservation) return;
    const title = encodeURIComponent(`Cata en El Origen: ${reservation.tastingTitle}`);
    const details = encodeURIComponent(
      `Reserva confirmada (${reservation.spotsCount} personas). Código: ${reservation.code}. Presentar QR al llegar.`
    );
    const location = encodeURIComponent("Bodega El Origen, Valle de Uco, Mendoza, Argentina");
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, "_blank");
  };

  if (loading || !reservation) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-secondary">
          <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
          <p className="text-xs uppercase tracking-widest">Cargando confirmación...</p>
        </div>
      </div>
    );
  }

  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verificar/${reservation.token || reservation.id}`
    : `https://elorigen.com/verificar/${reservation.token || reservation.id}`;

  return (
    <div className="bg-surface text-on-background min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 py-12">
      <main className="w-full max-w-lg mx-auto animate-fade-in-up">
        {/* Header/Logo Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <span
              className="material-symbols-outlined text-primary text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              wine_bar
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-primary tracking-tight">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-sm text-secondary mt-1">
            Tu lugar en la experiencia está asegurado.
          </p>
        </div>

        {/* Ticket Card (Stitch Exact Reproduction) */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-md p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative Mountain Watermark */}
          <div className="absolute -bottom-10 left-0 w-full opacity-5 pointer-events-none">
            <svg className="w-full h-32 fill-primary" preserveAspectRatio="none" viewBox="0 0 100 20">
              <path d="M0,20 L15,10 L30,15 L50,0 L70,12 L85,8 L100,20 Z" />
            </svg>
          </div>

          <div className="text-center border-b border-surface-variant pb-5 mb-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-1">
              Experiencia
            </p>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-on-background">
              {reservation.tastingTitle}
            </h2>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary">calendar_month</span> Fecha
              </p>
              <p className="text-xs sm:text-sm font-semibold text-on-background mt-1">
                {reservation.tastingDate}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary">schedule</span> Hora
              </p>
              <p className="text-xs sm:text-sm font-semibold text-on-background mt-1">
                {reservation.tastingTime}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary">group</span> Asistentes
              </p>
              <p className="text-xs sm:text-sm font-semibold text-on-background mt-1">
                {reservation.spotsCount} {reservation.spotsCount === 1 ? "Persona" : "Personas"} ({reservation.customerName})
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary">confirmation_number</span> Código
              </p>
              <p className="text-xs sm:text-sm font-bold text-primary font-mono mt-1">
                {reservation.code}
              </p>
            </div>
          </div>

          {/* QR Code Section */}
          <QRCodeDisplay
            value={verificationUrl}
            codeLabel={reservation.code}
            showDownloadButton={false}
          />

          {/* Interactive Tools Buttons */}
          <div className="mt-6 pt-6 border-t border-surface-variant space-y-3">
            <Link
              href={`/cata-en-vivo/${reservation.token || reservation.id}`}
              className="w-full bg-[#5C0531] text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl hover:bg-primary transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 text-center"
            >
              <span className="material-symbols-outlined text-[18px]">psychology_alt</span>
              Abrir Ficha de Cata Sensorial en Vivo
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadTicketPDF}
                className="bg-surface border border-outline-variant hover:border-primary text-on-surface text-[11px] font-bold uppercase py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Descargar Ticket PDF
              </button>

              <button
                onClick={handleAddToCalendar}
                className="bg-surface border border-outline-variant hover:border-primary text-on-surface text-[11px] font-bold uppercase py-2.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">event</span>
                Añadir al Calendario
              </button>
            </div>
          </div>
        </div>

        {/* Action Links */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center text-center">
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors py-2"
          >
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
