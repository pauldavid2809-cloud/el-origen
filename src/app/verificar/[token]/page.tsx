"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Reservation } from "@/types";

export default function VerifyTicketPage() {
  const params = useParams();
  const token = params?.token as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function checkToken() {
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action: "verify" }),
        });
        const data = await res.json();
        setSuccess(data.success);
        setMessage(data.message);
        if (data.reservation) {
          setReservation(data.reservation);
        }
      } catch {
        setMessage("Error al conectar con el servidor de validación.");
      } finally {
        setLoading(false);
      }
    }
    if (token) checkToken();
  }, [token]);

  const handlePerformCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action: "checkin",
          checkedInBy: "Sommelier de Puerta",
        }),
      });
      const data = await res.json();
      setSuccess(data.success);
      setMessage(data.message);
      if (data.reservation) {
        setReservation(data.reservation);
      }
      if (data.success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch {
      alert("Error al registrar el check-in.");
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center p-4 text-secondary">
        <span className="material-symbols-outlined animate-spin text-2xl mr-2">progress_activity</span>
        Validando entrada en el sistema...
      </div>
    );
  }

  const isCheckedIn = reservation?.checkinStatus === "checked_in";

  return (
    <div className="bg-surface text-on-background min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 py-12">
      <main className="w-full max-w-md mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-white mb-2 shadow-md">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            Control de Acceso
          </h1>
          <p className="text-xs text-secondary">Bodega El Origen • Recepción de Catas</p>
        </div>

        {/* Status Card */}
        <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-md p-6 relative overflow-hidden">
          {/* Badge */}
          <div
            className={`p-4 rounded-xl text-center mb-6 border ${
              isChecked
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : success
                ? "bg-blue-50 border-blue-300 text-blue-950"
                : "bg-red-50 border-red-300 text-red-950"
            }`}
          >
            <span className="material-symbols-outlined text-3xl mb-1">
              {isChecked ? "how_to_reg" : success ? "check_circle" : "warning"}
            </span>
            <h2 className="font-serif text-lg font-bold">
              {isChecked
                ? "Check-in Realizado"
                : success
                ? "Entrada Válida"
                : "Entrada No Válida / Ya Usada"}
            </h2>
            <p className="text-xs mt-1">{message}</p>
          </div>

          {reservation ? (
            <div className="space-y-4 text-xs">
              <div className="border-b border-surface-variant pb-3">
                <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block">
                  Asistente Titular
                </span>
                <span className="font-serif text-xl font-bold text-on-surface">
                  {reservation.customerName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block">
                    Experiencia
                  </span>
                  <span className="font-bold text-on-surface">{reservation.tastingTitle}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block">
                    Cupos Totales
                  </span>
                  <span className="font-bold text-primary font-serif text-base">
                    {reservation.spotsCount} personas
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block">
                    Código de Ticket
                  </span>
                  <span className="font-mono font-bold text-on-surface">{reservation.code}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block">
                    Estado de Pago
                  </span>
                  <span className="font-bold text-emerald-700 uppercase">
                    {reservation.paymentStatus === "paid" ? "Pagado ✓" : "Pendiente de Transferencia"}
                  </span>
                </div>
              </div>

              {reservation.dietaryRestrictions && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold block text-[10px] uppercase tracking-wider">
                    Restricción / Dieta:
                  </span>
                  <span>{reservation.dietaryRestrictions}</span>
                </div>
              )}

              {/* Action Button */}
              {!isChecked && success && (
                <div className="pt-4">
                  <button
                    onClick={handlePerformCheckIn}
                    disabled={checkingIn}
                    className="w-full bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-emerald-800 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {checkingIn ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        Registrando ingreso...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                        Marcar Check-in de Ingreso
                      </>
                    )}
                  </button>
                </div>
              )}

              {isChecked && (
                <div className="pt-2 text-center text-secondary">
                  <p className="text-[11px]">
                    Ingreso registrado a las {new Date(reservation.checkedInAt || "").toLocaleTimeString("es-CL")} hs.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-secondary">
              <p>No se encontró ninguna reserva asociada al código provisto.</p>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="mt-6 flex flex-col gap-2 text-center text-xs">
          {reservation && (
            <Link
              href={`/cata-en-vivo/${reservation.token || token}`}
              className="font-bold text-primary hover:underline"
            >
              Abrir Ficha de Cata Sensorial para este Asistente →
            </Link>
          )}
          <Link href="/admin" className="text-secondary hover:text-primary transition-colors">
            Volver al Panel de Administración
          </Link>
        </div>
      </main>
    </div>
  );
}
