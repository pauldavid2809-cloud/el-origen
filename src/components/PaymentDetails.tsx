"use client";

import React, { useState } from "react";
import { PAYMENT_ACCOUNTS, CONTACT, whatsappLink } from "@/lib/contact";

interface PaymentDetailsProps {
  /** Monto en USD a mostrar como referencia (se paga en Bs a tasa BCV). */
  amountUsd?: number;
  className?: string;
}

export function PaymentDetails({ amountUsd, className = "" }: PaymentDetailsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {}
  };

  return (
    <div className={`rounded-xl border border-outline-variant bg-surface-container-lowest ${className}`}>
      <div className="px-4 pt-4 pb-3 border-b border-outline-variant">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-container">Datos para el pago</p>
        <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">
          {amountUsd !== undefined && (
            <>
              Monto: <strong className="text-on-surface">${amountUsd} USD</strong> en bolívares a tasa BCV del día.{" "}
            </>
          )}
          Envíe el comprobante por WhatsApp para confirmar su cupo.
        </p>
      </div>

      <ul className="divide-y divide-outline-variant">
        {PAYMENT_ACCOUNTS.map((acc, i) => (
          <li key={i} className="px-4 py-3">
            <p className="text-[13px] font-semibold text-on-surface">
              {acc.label} <span className="font-normal text-on-surface-variant">· {acc.bank}</span>
            </p>
            <dl className="mt-2 space-y-2">
              {acc.fields.map((f) => {
                const key = `${i}-${f.name}`;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">{f.name}</dt>
                      <button
                        type="button"
                        onClick={() => copy(key, f.copy ?? f.value)}
                        className="inline-flex items-center gap-1 h-8 -mr-1 px-2 rounded text-[12px] font-semibold text-primary-container hover:bg-primary-container/5"
                        aria-label={`Copiar ${f.name.toLowerCase()}`}
                      >
                        <span className="material-symbols-outlined text-[15px]">{copied === key ? "check" : "content_copy"}</span>
                        {copied === key ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <dd className="text-[15px] font-semibold tabular-nums text-on-surface">{f.value}</dd>
                  </div>
                );
              })}
            </dl>
          </li>
        ))}
      </ul>

      <a
        href={whatsappLink("Hola, adjunto el comprobante de pago de mi reserva en El Origen.")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 h-11 border-t border-outline-variant text-[13px] font-semibold text-primary-container hover:bg-primary-container/5 rounded-b-xl"
      >
        <span className="material-symbols-outlined text-[17px]">chat</span>
        Enviar comprobante · {CONTACT.phoneDisplay}
      </a>
    </div>
  );
}
