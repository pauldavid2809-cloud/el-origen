"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
interface ScanSummary {
  code: string;
  customerName: string;
  spotsCount: number;
  tastingTitle: string;
  dietaryRestrictions: string | null;
  status: string;
}

export default function AdminScannerPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    order?: ScanSummary;
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
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#7D2A46", "#C08A3E", "#5A1C31"],
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

  return (
    <div className="p-6 sm:p-10 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <header className="text-center border-b border-black/[0.05] pb-6">
        <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
          <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface">
          Escáner de Check-in en Puerta
        </h2>
        <p className="text-[12px] text-on-surface-variant/70 mt-1">
          Validación inmediata de entradas y control de asistencia en recepción
        </p>
      </header>

      {/* Double-Bezel Card */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-black/[0.02] border border-black/[0.05]">
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(125,42,70,0.04)] space-y-6">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-2">
                Ingrese código de ticket o token escaneado
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Ej: EO-7KQ2M o enlace del QR"
                  className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3.5 text-base font-mono uppercase text-on-surface focus:border-primary focus:outline-none transition-colors"
                  autoFocus
                />
                {tokenInput && (
                  <button
                    type="button"
                    onClick={() => setTokenInput("")}
                    className="absolute right-3.5 top-3.5 text-on-surface-variant/50 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="group w-full flex items-center justify-between pl-6 pr-2 py-2 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold rounded-full transition-all duration-300 shadow-sm disabled:opacity-50 active:scale-[0.98]"
            >
              <span>{loading ? "Validando ticket..." : "Registrar Check-in"}</span>
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              </span>
            </button>
          </form>

          {/* Result Card with Micro-Animation Recipe */}
          {result && (
            <div
              className={`p-5 rounded-2xl border animate-scale-in ${
                result.success
                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                  : "bg-red-50/80 border-red-300 text-red-950"
              }`}
            >
              <div className="flex items-center gap-2 mb-2 font-semibold text-[13px]">
                <span className="material-symbols-outlined text-[18px]">
                  {result.success ? "check_circle" : "error"}
                </span>
                <span>{result.success ? "¡Check-in exitoso!" : "Entrada no válida"}</span>
              </div>

              <p className="text-[12px] leading-relaxed mb-3">{result.message}</p>

              {result.order && (
                <div className="bg-white/95 rounded-xl p-4 text-[12px] space-y-1.5 text-on-surface">
                  <p className="font-serif text-base font-semibold text-primary">{result.order.customerName}</p>
                  <p>
                    <strong>Cata:</strong> {result.order.tastingTitle}
                  </p>
                  <p>
                    <strong>Cupos:</strong> {result.order.spotsCount} personas ({result.order.code})
                  </p>
                  {result.order.dietaryRestrictions && (
                    <p className="text-amber-800">
                      <strong>Dieta:</strong> {result.order.dietaryRestrictions}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
