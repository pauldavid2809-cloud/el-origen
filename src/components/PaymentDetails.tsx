"use client";

import React, { useState } from "react";
import type { Language } from "@/lib/i18n";
import type { PaymentConfig } from "@/lib/settings";
import { whatsappLink } from "@/lib/contact";

/* Datos de pago de la configuración editable (Admin → Configuración de pagos). */

export type PaymentMethodId = "pago_movil" | "transferencia" | "binance_usdt" | "efectivo";

/** "$55 USD" / "$55.50 USD" */
export function formatUsd(n: number): string {
  return `$${Number.isInteger(n) ? n : n.toFixed(2)} USD`;
}

/** Bolívares con 2 decimales en el formato del idioma. */
export function formatBs(n: number, lang: Language = "es"): string {
  return n.toLocaleString(lang === "es" ? "es-VE" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Métodos que la configuración tiene activos, en el orden en que se ofrecen. */
export function availableMethods(cfg: PaymentConfig): PaymentMethodId[] {
  const methods: PaymentMethodId[] = [];
  if (cfg.pagoMovil.length) methods.push("pago_movil");
  if (cfg.transfers.length) methods.push("transferencia");
  if (cfg.binance.enabled) methods.push("binance_usdt");
  if (cfg.efectivo.enabled) methods.push("efectivo");
  return methods;
}

const COPY = {
  es: {
    heading: "Datos para el pago",
    choose: "Seleccione la cuenta a la que pagará:",
    bank: "Banco",
    phone: "Teléfono",
    docId: "Cédula",
    account: "Cuenta",
    holder: "Titular",
    payId: "Binance Pay ID",
    email: "Correo de Binance",
    copy: "Copiar",
    copied: "Copiado",
    copyAria: (field: string) => `Copiar ${field.toLowerCase()}`,
    binanceMissing: "Solicite los datos de Binance por WhatsApp antes de pagar.",
    binanceAsk: "Solicitar datos de Binance",
    binanceMessage: "Hola, quiero pagar mi reserva de El Origen con Binance USDT. ¿Me envían los datos?",
  },
  en: {
    heading: "Payment details",
    choose: "Select the account you will pay to:",
    bank: "Bank",
    phone: "Phone",
    docId: "ID number",
    account: "Account",
    holder: "Account holder",
    payId: "Binance Pay ID",
    email: "Binance email",
    copy: "Copy",
    copied: "Copied",
    copyAria: (field: string) => `Copy ${field.toLowerCase()}`,
    binanceMissing: "Request the Binance details via WhatsApp before paying.",
    binanceAsk: "Request Binance details",
    binanceMessage: "Hi, I'd like to pay my El Origen reservation with Binance USDT. Could you send me the details?",
  },
} as const;

const digits = (v: string) => v.replace(/\D/g, "");

interface Field {
  name: string;
  value: string;
  copy?: string;
}

interface Destination {
  id: string;
  title: string;
  fields: Field[];
}

interface PaymentDetailsProps {
  config: PaymentConfig;
  method: Exclude<PaymentMethodId, "efectivo">;
  lang: Language;
  /** Cuenta seleccionada (Pago Móvil / transferencia). */
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export function PaymentDetails({ config, method, lang, selectedId, onSelect, className = "" }: PaymentDetailsProps) {
  const t = COPY[lang];
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      // Portapapeles no disponible: el dato sigue visible para copiarlo a mano.
    }
  };

  const holder: Field[] = config.holderName ? [{ name: t.holder, value: config.holderName }] : [];

  let destinations: Destination[] = [];
  if (method === "pago_movil") {
    destinations = config.pagoMovil.map((a) => ({
      id: a.id,
      title: `Pago Móvil · ${a.bank}`,
      fields: [
        { name: t.phone, value: a.phone, copy: digits(a.phone) },
        { name: t.docId, value: a.docId, copy: digits(a.docId) },
        { name: t.bank, value: a.bank },
        ...holder,
      ],
    }));
  } else if (method === "transferencia") {
    destinations = config.transfers.map((a) => ({
      id: a.id,
      title: `${a.bank}${a.accountType ? ` · ${a.accountType}` : ""}`,
      fields: [
        { name: t.account, value: a.number, copy: digits(a.number) },
        { name: t.docId, value: a.docId, copy: digits(a.docId) },
        ...holder,
      ],
    }));
  } else {
    const b = config.binance;
    const fields: Field[] = [];
    if (b.payId) fields.push({ name: t.payId, value: b.payId });
    if (b.email) fields.push({ name: t.email, value: b.email });
    if (fields.length && b.holder) fields.push({ name: t.holder, value: b.holder });
    if (fields.length) destinations = [{ id: "binance", title: "Binance USDT", fields }];
  }

  const selectable = Boolean(onSelect) && destinations.length > 1;

  return (
    <div className={`rounded-xl border border-outline-variant bg-surface-container-lowest ${className}`}>
      <div className="px-4 pt-4 pb-3 border-b border-outline-variant">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-container">{t.heading}</p>
        {selectable && <p className="text-[12px] text-on-surface-variant mt-1">{t.choose}</p>}
      </div>

      {method === "binance_usdt" && destinations.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-[14px] text-on-surface-variant leading-relaxed">{t.binanceMissing}</p>
          <a
            href={whatsappLink(t.binanceMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 h-11 px-4 rounded border border-primary-container text-primary-container text-[13px] font-semibold hover:bg-primary-container/5"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
            {t.binanceAsk}
          </a>
        </div>
      ) : (
        <ul className="divide-y divide-outline-variant">
          {destinations.map((d) => {
            const active = selectedId === d.id;
            return (
              <li key={d.id} className={`px-4 py-3 transition-colors ${selectable && active ? "bg-primary-container/5" : ""}`}>
                {selectable ? (
                  <label className="flex items-center gap-3 min-h-11 cursor-pointer">
                    <input
                      type="radio"
                      name={`destination-${method}`}
                      value={d.id}
                      checked={active}
                      onChange={() => onSelect?.(d.id)}
                      className="h-4 w-4 accent-[#7D2A46]"
                    />
                    <span className="text-[14px] font-semibold text-on-surface">{d.title}</span>
                  </label>
                ) : (
                  <p className="text-[14px] font-semibold text-on-surface">{d.title}</p>
                )}
                <dl className="mt-2 space-y-2">
                  {d.fields.map((f) => {
                    const key = `${d.id}-${f.name}`;
                    return (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <dt className="text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">{f.name}</dt>
                          <dd className="text-[15px] font-semibold tabular-nums text-on-surface break-all">{f.value}</dd>
                        </div>
                        <button
                          type="button"
                          onClick={() => copy(key, f.copy ?? f.value)}
                          className="flex-shrink-0 inline-flex items-center gap-1 h-11 px-3 rounded text-[12px] font-semibold text-primary-container hover:bg-primary-container/5"
                          aria-label={t.copyAria(f.name)}
                        >
                          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                            {copied === key ? "check" : "content_copy"}
                          </span>
                          <span aria-live="polite">{copied === key ? t.copied : t.copy}</span>
                        </button>
                      </div>
                    );
                  })}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
