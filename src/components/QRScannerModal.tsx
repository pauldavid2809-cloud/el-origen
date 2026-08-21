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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-surface-variant rounded-2xl max-w-md w-full p-6 soft-shadow relative animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-on-surface">
              Escáner de Check-in
            </h3>
            <p className="text-xs text-secondary">Control de acceso y validación de cupos</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1.5">
              Código de Ticket o Token
            </label>
            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Ej: #EO-8492A o token UUID..."
                className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-sm font-mono text-on-surface focus:border-primary focus:outline-none uppercase"
                autoFocus
              />
              {tokenInput && (
                <button
                  type="button"
                  onClick={() => setTokenInput("")}
                  className="absolute right-3 top-3 text-secondary hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-sm">cancel</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="flex-1 bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="mt-4 pt-4 border-t border-surface-variant">
          <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-2">
            Códigos de prueba en bodega:
          </p>
          <div className="flex flex-wrap gap-2">
            {["#EO-8492A", "#EO-7193B", "#EO-6204C"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleQuickDemoCode(c)}
                className="text-[11px] font-mono bg-surface-container hover:bg-surface-variant text-primary px-2.5 py-1 rounded-md border border-outline-variant"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`mt-6 p-4 rounded-xl border animate-fade-in-up ${
              result.success
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-red-50 border-red-300 text-red-950"
            }`}
          >
            <div className="flex items-center gap-2 mb-2 font-bold text-sm">
              <span className="material-symbols-outlined">
                {result.success ? "check_circle" : "error"}
              </span>
              <span>{result.success ? "¡Entrada Válida!" : "Alerta de Ingreso"}</span>
            </div>

            <p className="text-xs leading-relaxed mb-3">{result.message}</p>

            {result.reservation && (
              <div className="bg-white/80 rounded-lg p-3 text-xs space-y-1 text-on-surface">
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
