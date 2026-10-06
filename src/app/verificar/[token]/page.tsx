"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Brand";

interface Summary {
  code: string;
  customerName: string;
  customerDocId: string;
  spotsCount: number;
  tastingTitle: string;
  tastingDate: string;
  tastingTime: string;
  dietaryRestrictions: string | null;
  status: string;
  checkedInAt: string | null;
}

/* Al escanear el QR con la cámara del teléfono:
   - el personal con sesión de admin ve la validación y el botón de check-in;
   - cualquier otra persona ve un aviso y el enlace a su entrada. */
export default function VerifyTicketPage() {
  const { token } = useParams<{ token: string }>();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string; order?: Summary } | null>(null);
  const [busy, setBusy] = useState(false);

  const call = useCallback(
    async (action: "verify" | "checkin") => {
      setBusy(true);
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action }),
        });
        setResult(await res.json());
      } catch {
        setResult({ success: false, message: "Error de conexión." });
      } finally {
        setBusy(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((d) => {
        setAdmin(Boolean(d.authenticated));
        if (d.authenticated) call("verify");
      })
      .catch(() => setAdmin(false));
  }, [call]);

  const o = result?.order;
  const used = Boolean(o?.checkedInAt);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
      <Logo variant="full" className="w-36 mb-10" />

      {admin === null ? (
        <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
      ) : !admin ? (
        <div className="max-w-sm text-center">
          <h1 className="font-serif text-3xl">Entrada de El Origen</h1>
          <p className="text-on-surface-variant mt-3 leading-relaxed">
            Este código lo valida el personal en la puerta. Si es su entrada, puede verla completa aquí:
          </p>
          <Link href={`/orden/${token}`} className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded bg-primary-container text-white font-semibold">
            Ver mi entrada
          </Link>
          <p className="mt-8 text-[13px] text-on-surface-variant">
            ¿Personal de El Origen? <Link href="/admin" className="underline underline-offset-4">Inicie sesión</Link> y vuelva a escanear.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div
            className={`rounded-2xl border-2 p-6 text-center ${
              !result ? "border-outline-variant" : result.success ? "border-emerald-600 bg-emerald-50" : "border-error bg-error-container/50"
            }`}
          >
            <span className={`material-symbols-outlined text-5xl ${result?.success ? "text-emerald-700" : "text-error"}`}>
              {!result ? "hourglass_top" : result.success ? (used ? "done_all" : "verified") : "block"}
            </span>
            <p className="font-semibold text-lg mt-2">{result?.message ?? "Verificando…"}</p>
            {o && (
              <dl className="mt-5 text-left text-[15px] space-y-2 border-t border-black/10 pt-4">
                <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">Nombre</dt><dd className="font-semibold text-right">{o.customerName}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">Cédula</dt><dd className="font-semibold">{o.customerDocId}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">Personas</dt><dd className="font-semibold text-2xl">{o.spotsCount}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">Cata</dt><dd className="font-semibold text-right">{o.tastingTitle}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">Código</dt><dd className="font-semibold">{o.code}</dd></div>
                {o.dietaryRestrictions && (
                  <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">Dieta</dt><dd className="font-semibold text-right">{o.dietaryRestrictions}</dd></div>
                )}
              </dl>
            )}
          </div>
          {result?.success && !used && o?.status === "approved" && (
            <button
              onClick={() => call("checkin")}
              disabled={busy}
              className="mt-5 w-full h-14 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[16px] font-semibold disabled:opacity-60"
            >
              {busy ? "Registrando…" : `Registrar ingreso (${o.spotsCount})`}
            </button>
          )}
          <Link href="/admin/scanner" className="mt-4 flex items-center justify-center h-12 rounded border border-outline-variant font-semibold text-[14px]">
            Ir al escáner
          </Link>
        </div>
      )}
    </main>
  );
}
