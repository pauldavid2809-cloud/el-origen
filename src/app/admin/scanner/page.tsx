"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Reservation } from "@/types";

export default function AdminScannerPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    reservation?: Reservation;
    message: string;
  } | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenInput.trim(),
          action: "checkin",
          checkedInBy: "Sommelier de Recepción",
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch {
      setResult({
        success: false,
        message: "Error de conexión al verificar el ticket.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCode = (code: string) => {
    setTokenInput(code);
  };

  return (
    <div className="p-6 sm:p-10 max-w-2xl mx-auto space-y-8">
      <header className="text-center border-b border-surface-variant pb-6">
        <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center mx-auto mb-2 shadow-md">
          <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
          Escáner de Check-in en Puerta
        </h2>
        <p className="text-xs text-secondary mt-1">
          Validación inmediata de entradas y control de asistencia en recepción
        </p>
      </header>

      {/* Input Box */}
      <div className="bg-surface rounded-3xl border border-surface-variant p-6 sm:p-8 soft-shadow space-y-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-2">
              Ingrese código de ticket o token escaneado
            </label>
            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Ej: #EO-8492A o token UUID..."
                className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-4 text-base font-mono uppercase text-on-surface focus:border-primary focus:outline-none"
                autoFocus
              />
              {tokenInput && (
                <button
                  type="button"
                  onClick={() => setTokenInput("")}
                  className="absolute right-4 top-4 text-secondary hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">cancel</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="w-full bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-primary transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                Validando ticket...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                Registrar Check-in
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Tags */}
        <div className="pt-4 border-t border-surface-variant">
          <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-2">
            Tickets de prueba para recepción:
          </p>
          <div className="flex flex-wrap gap-2">
            {["#EO-8492A", "#EO-7193B", "#EO-6204C"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleQuickCode(c)}
                className="text-xs font-mono bg-surface-container hover:bg-surface-variant text-primary px-3 py-1.5 rounded-lg border border-outline-variant font-semibold"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Result Card */}
        {result && (
          <div
            className={`p-5 rounded-2xl border animate-fade-in-up ${
              result.success
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-red-50 border-red-300 text-red-950"
            }`}
          >
            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
              <span className="material-symbols-outlined">
                {result.success ? "check_circle" : "error"}
              </span>
              <span>{result.success ? "¡Check-in Exitoso!" : "Entrada Ya Utilizada o Inválida"}</span>
            </div>

            <p className="text-xs leading-relaxed mb-3">{result.message}</p>

            {result.reservation && (
              <div className="bg-white/90 rounded-xl p-4 text-xs space-y-1.5 text-on-surface">
                <p className="text-sm font-bold text-primary">{result.reservation.customerName}</p>
                <p>
                  <strong>Cata:</strong> {result.reservation.tastingTitle}
                </p>
                <p>
                  <strong>Cupos:</strong> {result.reservation.spotsCount} personas ({result.reservation.code})
                </p>
                <p>
                  <strong>Pago:</strong> {result.reservation.paymentStatus === "paid" ? "Pagado ✓" : "Pendiente"}
                </p>
                {result.reservation.dietaryRestrictions && (
                  <p className="text-amber-800">
                    <strong>Dieta:</strong> {result.reservation.dietaryRestrictions}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
