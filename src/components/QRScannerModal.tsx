"use client";

import React, { useState } from "react";
import { Reservation } from "@/types";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckInSuccess?: (reservation: Reservation) => void;
}

export function QRScannerModal({ isOpen, onClose, onCheckInSuccess }: QRScannerModalProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    reservation?: Reservation;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

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
      if (data.success && data.reservation && onCheckInSuccess) {
        onCheckInSuccess(data.reservation);
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

  const handleQuickDemoCode = (code: string) => {
    setTokenInput(code);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-outline-variant/40 rounded-2xl max-w-md w-full p-6 sm:p-7 mockup-shadow relative animate-scale-in"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant/60 hover:text-primary transition-colors duration-200 p-1 rounded-full hover:bg-surface-container"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-on-surface">
              Escáner de Check-in
            </h3>
            <p className="text-[12px] text-on-surface-variant/70">Validación de entradas y control de acceso</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-on-surface-variant/70 mb-1.5 uppercase tracking-wider">
              Código de Ticket o Token
            </label>
            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Ej: #EO-8492A o token UUID..."
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-[13px] font-mono text-on-surface focus:border-primary focus:outline-none uppercase transition-colors"
                autoFocus
              />
              {tokenInput && (
                <button
                  type="button"
                  onClick={() => setTokenInput("")}
                  className="absolute right-3 top-3 text-on-surface-variant/50 hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="flex-1 bg-primary-container text-white text-[12px] font-semibold py-3 rounded-xl hover:bg-primary transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  Verificando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  Validar Entrada
                </>
              )}
            </button>
          </div>
        </form>

        {/* Demo Fast Tags */}
        <div className="mt-4 pt-4 border-t border-outline-variant/30">
          <p className="text-[10px] font-medium text-on-surface-variant/60 mb-2">
            Códigos de prueba:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["#EO-8492A", "#EO-7193B", "#EO-6204C"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleQuickDemoCode(c)}
                className="text-[11px] font-mono bg-surface-container hover:bg-primary-fixed/40 text-primary px-2.5 py-1 rounded-lg border border-outline-variant/30 transition-all duration-150 active:scale-95"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`mt-5 p-4 rounded-xl border animate-fade-in ${
              result.success
                ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                : "bg-red-50/80 border-red-300 text-red-950"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 font-semibold text-[13px]">
              <span className="material-symbols-outlined text-[18px]">
                {result.success ? "check_circle" : "error"}
              </span>
              <span>{result.success ? "¡Entrada Válida!" : "Alerta de Ingreso"}</span>
            </div>

            <p className="text-[12px] leading-relaxed mb-2.5">{result.message}</p>

            {result.reservation && (
              <div className="bg-white/90 rounded-lg p-3 text-[12px] space-y-1 text-on-surface">
                <p>
                  <strong>Asistente:</strong> {result.reservation.customerName}
                </p>
                <p>
                  <strong>Cata:</strong> {result.reservation.tastingTitle}
                </p>
                <p>
                  <strong>Cupos:</strong> {result.reservation.spotsCount} personas
                </p>
                <p>
                  <strong>Código:</strong> <span className="font-mono">{result.reservation.code}</span>
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
