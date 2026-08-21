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
    doc.setFillColor(250, 248, 247);
    doc.rect(0, 0, 210, 297, "F");

    doc.setTextColor(92, 5, 49);
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text("EL ORIGEN — PASE DE ENTRADA", 105, 30, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 105, 102);
    doc.text("Experiencia de Catas • Caracas, Venezuela", 105, 38, { align: "center" });

    doc.setDrawColor(221, 210, 213);
    doc.setLineWidth(0.5);
    doc.line(25, 46, 185, 46);

    doc.setFontSize(16);
    doc.setTextColor(92, 5, 49);
    doc.text(reservation.tastingTitle, 105, 60, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text(`Titular: ${reservation.customerName}`, 30, 80);
    doc.text(`Fecha: ${reservation.tastingDate}`, 30, 92);
    doc.text(`Horario: ${reservation.tastingTime}`, 30, 104);
    doc.text(`Cupos: ${reservation.spotsCount} personas`, 30, 116);
    doc.text(`Código: ${reservation.code}`, 30, 128);

    doc.setFontSize(9);
    doc.setTextColor(107, 105, 102);
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
    const location = encodeURIComponent("El Origen, Caracas, Venezuela");
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, "_blank");
  };

  if (loading || !reservation) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-on-surface-variant/60 text-xs">
          <span className="material-symbols-outlined animate-spin text-2xl mb-2">progress_activity</span>
          <p className="font-semibold uppercase tracking-widest">Cargando confirmación...</p>
        </div>
      </div>
    );
  }

  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verificar/${reservation.token || reservation.id}`
    : `https://elorigen.com/verificar/${reservation.token || reservation.id}`;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col justify-center items-center p-5 sm:p-8 py-16 selection:bg-primary/10 selection:text-primary">
      <main className="w-full max-w-lg mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              wine_bar
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-primary tracking-tight">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-[13px] text-on-surface-variant/70 mt-1">
            Tu lugar en la experiencia está asegurado.
          </p>
        </div>

        {/* Double-Bezel Ticket Card */}
        <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
          <div className="bg-white rounded-[calc(2.5rem-0.625rem)] p-7 sm:p-9 shadow-[0_8px_32px_rgba(122,32,72,0.04)] relative overflow-hidden">
            <div className="text-center border-b border-black/[0.05] pb-5 mb-6">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60 block mb-1">
                Experiencia Seleccionada
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-on-surface">
                {reservation.tastingTitle}
              </h2>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-6 text-[13px]">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60 block">
                  Fecha
                </span>
                <p className="font-semibold text-on-surface mt-0.5">
                  {reservation.tastingDate}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60 block">
                  Hora
                </span>
                <p className="font-semibold text-on-surface mt-0.5">
                  {reservation.tastingTime}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60 block">
                  Asistentes
                </span>
                <p className="font-semibold text-on-surface mt-0.5">
                  {reservation.spotsCount} pers. ({reservation.customerName})
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60 block">
                  Código de Ticket
                </span>
                <p className="font-semibold text-primary font-mono mt-0.5">
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

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-black/[0.05] space-y-3">
              <Link
                href={`/cata-en-vivo/${reservation.token || reservation.id}`}
                className="group w-full flex items-center justify-between pl-5 pr-2 py-2 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold rounded-full transition-all duration-300 shadow-sm"
              >
                <span>Abrir Ficha de Cata en Vivo</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <span className="material-symbols-outlined text-[16px]">psychology_alt</span>
                </span>
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadTicketPDF}
                  className="bg-surface-container-low hover:bg-black/[0.04] text-on-surface text-[11px] font-semibold py-2.5 px-3 rounded-full transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  Ticket PDF
                </button>

                <button
                  onClick={handleAddToCalendar}
                  className="bg-surface-container-low hover:bg-black/[0.04] text-on-surface text-[11px] font-semibold py-2.5 px-3 rounded-full transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">event</span>
                  Calendario
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/70 hover:text-primary transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
