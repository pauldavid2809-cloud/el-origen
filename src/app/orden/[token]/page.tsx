"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PaymentDetails } from "@/components/PaymentDetails";
import { CONTACT, PAYMENT_ACCOUNTS, whatsappLink } from "@/lib/contact";
import type { PublicOrder } from "@/lib/orders";

interface RateInfo {
  rate: number;
  amountBs: number;
  updatedAt: string;
}

const VE_BANKS = [
  "Banco de Venezuela", "Banesco", "Mercantil", "BBVA Provincial", "BNC", "Bancamiga", "Banco del Tesoro",
  "Bicentenario", "Bancaribe", "Banco Exterior", "Banco Plaza", "Banplus", "BFC Fondo Común", "Banco Activo",
  "Venezolano de Crédito", "Sofitasa", "100% Banco", "Banco Caroní", "Bancrecer", "Mi Banco", "R4", "Del Sur", "Otro",
];

const STATUS_UI: Record<PublicOrder["status"], { label: string; tone: string }> = {
  pending_payment: { label: "Pendiente de pago", tone: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  in_review: { label: "Pago en revisión", tone: "bg-secondary-container text-on-secondary-container" },
  approved: { label: "Confirmada", tone: "bg-emerald-100 text-emerald-900" },
  rejected: { label: "Pago no verificado", tone: "bg-error-container text-on-error-container" },
  cancelled: { label: "Anulada", tone: "bg-surface-container-high text-on-surface-variant" },
};

const bs = (n: number) => n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OrderPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [rate, setRate] = useState<RateInfo | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${token}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) {
        setNotFound(true);
        return;
      }
      setOrder(data.order);
      setRate(data.rate);
      setHoldExpiresAt(data.holdExpiresAt);
    } catch {
      /* se reintenta en el siguiente ciclo */
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Mientras el pago está en revisión, consultar cada 20 s
  useEffect(() => {
    if (order?.status !== "in_review") return;
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [order?.status, load]);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow px-5 sm:px-8 lg:px-12 max-w-[1180px] mx-auto w-full pt-8 sm:pt-12 pb-24">
        {notFound ? (
          <div className="max-w-md mx-auto text-center py-24">
            <span className="material-symbols-outlined text-5xl text-primary-container/50">search_off</span>
            <h1 className="font-serif text-3xl mt-4">No encontramos esta orden</h1>
            <p className="text-on-surface-variant mt-3">Revise el enlace que recibió o escríbanos por WhatsApp.</p>
            <a href={whatsappLink()} className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded bg-primary-container text-white font-semibold">
              Atención al cliente
            </a>
          </div>
        ) : !order ? (
          <div className="py-32 flex justify-center text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Cargando su orden…
          </div>
        ) : (
          <>
            <header className="mb-8 sm:mb-10">
              <p className="eyebrow mb-3">Orden {order.code}</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-[2rem] sm:text-5xl leading-tight text-on-surface">
                  {order.status === "approved" ? "Su entrada" : "Su reserva"}
                </h1>
                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${STATUS_UI[order.status].tone}`}>
                  {STATUS_UI[order.status].label}
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-7 space-y-6 order-1">
                {order.status === "approved" && <ApprovedTicket order={order} token={token} />}
                {order.status === "in_review" && <InReview order={order} />}
                {(order.status === "pending_payment" || order.status === "rejected") && (
                  <PayAndReport order={order} token={token} rate={rate} holdExpiresAt={holdExpiresAt} onDone={load} />
                )}
                {order.status === "cancelled" && (
                  <Panel>
                    <h2 className="font-serif text-2xl">Esta reserva fue anulada</h2>
                    <p className="text-on-surface-variant mt-2">
                      Si cree que es un error, escríbanos a atención al cliente indicando el código {order.code}.
                    </p>
                  </Panel>
                )}
              </div>

              <aside className="lg:col-span-5 order-2 lg:sticky lg:top-28">
                <Summary order={order} />
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-8 ${className}`}>{children}</section>;
}

/* ─── Resumen ─── */

function Summary({ order }: { order: PublicOrder }) {
  const rows: [string, string][] = [
    ["Fecha", order.tastingDate],
    ["Hora", order.tastingTime],
    ["Lugar", order.tastingLocation],
    ["Cupos", `${order.spotsCount} persona${order.spotsCount === 1 ? "" : "s"}`],
    ["A nombre de", order.customerName],
  ];
  return (
    <Panel className="!p-0 overflow-hidden">
      <div className="bg-primary-container text-paper px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sun">Cata</p>
        <h2 className="font-serif text-2xl leading-snug mt-1">{order.tastingTitle}</h2>
      </div>
      <dl className="px-6 py-5 space-y-3 text-[14px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">{k}</dt>
            <dd className="text-right font-medium text-on-surface">{v}</dd>
          </div>
        ))}
        {order.addOns.length > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant">Adicionales</dt>
            <dd className="text-right font-medium text-on-surface">
              {order.addOns.map((a) => `${a.quantity}× ${a.title}`).join(", ")}
            </dd>
          </div>
        )}
        {order.discountUsd > 0 && (
          <div className="flex justify-between gap-4 text-emerald-800">
            <dt>Descuento {order.couponCode}</dt>
            <dd className="font-medium">−${order.discountUsd} USD</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-outline-variant pt-4">
          <dt className="font-semibold text-on-surface">Total</dt>
          <dd className="font-serif text-2xl text-primary-container">${order.totalUsd} USD</dd>
        </div>
      </dl>
    </Panel>
  );
}

/* ─── Pago y reporte ─── */

function PayAndReport({
  order,
  token,
  rate,
  holdExpiresAt,
  onDone,
}: {
  order: PublicOrder;
  token: string;
  rate: RateInfo | null;
  holdExpiresAt: string | null;
  onDone: () => void;
}) {
  const [account, setAccount] = useState(PAYMENT_ACCOUNTS[0].bank);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(rate ? bs(rate.amountBs) : "");
  const [payerBank, setPayerBank] = useState("");
  const [payerDocId, setPayerDocId] = useState(order.customerDocId);
  const [payerPhone, setPayerPhone] = useState(order.customerPhone);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (rate && !amount) setAmount(bs(rate.amountBs));
  }, [rate, amount]);

  const selected = PAYMENT_ACCOUNTS.find((a) => a.bank === account)!;
  const isPagoMovil = selected.label === "Pago Móvil";
  const expired = holdExpiresAt ? new Date(holdExpiresAt).getTime() < Date.now() : false;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Adjunte la captura o PDF del comprobante.");
      return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      fd.set("paymentMethod", isPagoMovil ? "pago_movil" : "transferencia");
      fd.set("paymentBank", account);
      fd.set("paymentReference", reference);
      fd.set("paymentAmountBs", amount);
      fd.set("payerBank", payerBank);
      fd.set("payerDocId", payerDocId);
      fd.set("payerPhone", payerPhone);
      fd.set("file", file);
      const res = await fetch(`/api/orders/${token}/proof`, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      onDone();
    } catch (err) {
      setError((err as Error).message || "No se pudo enviar el comprobante.");
    } finally {
      setSending(false);
    }
  };

  const field =
    "w-full h-12 bg-surface-container-lowest border border-outline-variant rounded px-3.5 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:outline-none";
  const label = "block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2";

  return (
    <>
      {order.status === "rejected" && (
        <div className="rounded-xl border border-error/30 bg-error-container/60 p-5 text-on-error-container">
          <p className="font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            No pudimos verificar su pago
          </p>
          {order.rejectionReason && <p className="mt-1 text-[14px]">Motivo: {order.rejectionReason}</p>}
          <p className="mt-2 text-[14px]">Revise los datos y vuelva a reportarlo abajo, o escríbanos a atención al cliente.</p>
        </div>
      )}

      {expired && order.status === "pending_payment" && (
        <div className="rounded-xl border border-tertiary/30 bg-tertiary-fixed/60 p-4 text-[14px] text-on-tertiary-fixed-variant">
          El tiempo de apartado de sus cupos terminó. Aún puede pagar y reportar: confirmaremos según disponibilidad.
        </div>
      )}

      {/* Paso 1 */}
      <Panel>
        <p className="eyebrow mb-4">Paso 1 · Pague</p>
        <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-outline-variant">
          <div>
            <p className="text-[13px] text-on-surface-variant">Monto a pagar</p>
            {rate ? (
              <>
                <p className="font-serif text-4xl text-on-surface mt-1">Bs {bs(rate.amountBs)}</p>
                <p className="text-[13px] text-on-surface-variant mt-1">
                  ${order.totalUsd} USD × tasa BCV {bs(rate.rate)}
                </p>
              </>
            ) : (
              <>
                <p className="font-serif text-4xl text-on-surface mt-1">${order.totalUsd} USD</p>
                <p className="text-[13px] text-on-surface-variant mt-1">En bolívares a la tasa oficial BCV del día.</p>
              </>
            )}
          </div>
          {holdExpiresAt && !expired && (
            <p className="text-[13px] text-on-surface-variant">
              Cupos apartados hasta las{" "}
              <strong className="text-on-surface">
                {new Date(holdExpiresAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
              </strong>
            </p>
          )}
        </div>
        <PaymentDetails
          className="mt-5"
          showWhatsApp={false}
          intro="Use cualquiera de estas cuentas. Toque «Copiar» para pegar los datos en su banco."
        />
      </Panel>

      {/* Paso 2 */}
      <Panel>
        <p className="eyebrow mb-1">Paso 2 · Reporte su pago</p>
        <p className="text-[14px] text-on-surface-variant mb-6">
          Le enviaremos su entrada con código QR por correo y WhatsApp apenas verifiquemos el pago.
        </p>

        <form onSubmit={submit} className="space-y-6">
          <fieldset>
            <legend className={label}>¿A qué cuenta pagó?</legend>
            <div className="grid gap-2">
              {PAYMENT_ACCOUNTS.map((acc) => (
                <label
                  key={acc.bank}
                  className={`flex items-center gap-3 min-h-12 px-4 py-3 rounded border cursor-pointer transition-colors ${
                    account === acc.bank ? "border-primary-container bg-primary-container/5" : "border-outline-variant hover:border-outline"
                  }`}
                >
                  <input
                    type="radio"
                    name="account"
                    value={acc.bank}
                    checked={account === acc.bank}
                    onChange={() => setAccount(acc.bank)}
                    className="h-4 w-4 accent-[#7D2A46]"
                  />
                  <span className="text-[14px]">
                    <strong className="font-semibold">{acc.label}</strong>{" "}
                    <span className="text-on-surface-variant">· {acc.bank}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
            <div>
              <label className={label} htmlFor="ref">Número de referencia *</label>
              <input id="ref" required inputMode="numeric" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Últimos dígitos o completo" className={field} />
            </div>
            <div>
              <label className={label} htmlFor="amt">Monto pagado (Bs) *</label>
              <input id="amt" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className={field} />
            </div>
            <div>
              <label className={label} htmlFor="bank">Banco desde el que pagó *</label>
              <select id="bank" required value={payerBank} onChange={(e) => setPayerBank(e.target.value)} className={field}>
                <option value="" disabled>Seleccione…</option>
                {VE_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="doc">Cédula del titular *</label>
              <input id="doc" required value={payerDocId} onChange={(e) => setPayerDocId(e.target.value)} placeholder="V-12345678" className={field} />
            </div>
            {isPagoMovil && (
              <div className="sm:col-span-2">
                <label className={label} htmlFor="tel">Teléfono desde el que pagó</label>
                <input id="tel" type="tel" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} placeholder="0414-123-4567" className={field} />
              </div>
            )}
          </div>

          <div>
            <span className={label}>Comprobante *</span>
            <label
              htmlFor="proof"
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${
                file ? "border-primary-container bg-primary-container/5" : "border-outline-variant hover:border-primary-container/60"
              }`}
            >
              <span className="material-symbols-outlined text-3xl text-primary-container">{file ? "task" : "upload_file"}</span>
              <span className="text-[14px] font-semibold text-on-surface">{file ? file.name : "Toque para subir la captura o PDF"}</span>
              <span className="text-[12px] text-on-surface-variant">JPG, PNG, WEBP, HEIC o PDF · máximo 8 MB</span>
            </label>
            <input
              id="proof"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && (
            <p role="alert" className="text-[14px] text-error flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full h-14 flex items-center justify-center gap-2 rounded bg-primary-container hover:bg-primary text-white text-[15px] font-semibold transition-colors disabled:opacity-60"
          >
            {sending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Enviando…
              </>
            ) : (
              <>
                Enviar comprobante
                <span className="material-symbols-outlined text-[18px]">send</span>
              </>
            )}
          </button>
        </form>
      </Panel>
    </>
  );
}

/* ─── En revisión ─── */

function InReview({ order }: { order: PublicOrder }) {
  return (
    <Panel>
      <div className="flex items-start gap-4">
        <span className="w-12 h-12 flex-shrink-0 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[26px] text-primary-container">hourglass_top</span>
        </span>
        <div>
          <h2 className="font-serif text-2xl">Recibimos su comprobante</h2>
          <p className="text-on-surface-variant mt-2 leading-relaxed">
            Estamos verificando el pago. Cuando lo confirmemos le enviaremos su entrada con código QR a{" "}
            <strong className="text-on-surface">{order.customerEmail}</strong> y por WhatsApp. Esta página se actualiza sola.
          </p>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-outline-variant pt-5 text-[14px]">
        <div>
          <dt className="text-on-surface-variant">Referencia</dt>
          <dd className="font-semibold tabular-nums">{order.paymentReference}</dd>
        </div>
        <div>
          <dt className="text-on-surface-variant">Monto reportado</dt>
          <dd className="font-semibold tabular-nums">Bs {order.paymentAmountBs != null ? bs(order.paymentAmountBs) : "—"}</dd>
        </div>
      </dl>
      <a href={whatsappLink(`Hola, reporté el pago de mi reserva ${order.code} en El Origen.`)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-primary-container">
        <span className="material-symbols-outlined text-[18px]">chat</span>
        ¿Dudas? Atención al cliente · {CONTACT.phoneDisplay}
      </a>
    </Panel>
  );
}

/* ─── Entrada aprobada ─── */

function ApprovedTicket({ order, token }: { order: PublicOrder; token: string }) {
  const [qr, setQr] = useState("");
  const value = useMemo(() => (typeof window !== "undefined" ? `${window.location.origin}/verificar/${token}` : ""), [token]);

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, { width: 560, margin: 2, errorCorrectionLevel: "M", color: { dark: "#2A1519", light: "#FFFFFF" } }).then(setQr);
  }, [value]);

  const download = () => {
    const a = document.createElement("a");
    a.href = qr;
    a.download = `entrada-${order.code}.png`;
    a.click();
  };

  return (
    <Panel className="text-center">
      {order.checkedInAt ? (
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high text-[13px] font-semibold text-on-surface-variant mb-5">
          <span className="material-symbols-outlined text-[18px]">done_all</span>
          Entrada utilizada
        </p>
      ) : (
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-[13px] font-semibold text-emerald-900 mb-5">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          Pago verificado
        </p>
      )}
      <div className="mx-auto w-full max-w-[300px] aspect-square rounded-xl border border-outline-variant bg-white p-3">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`Código QR de la entrada ${order.code}`} className="w-full h-full" />
        ) : (
          <div className="w-full h-full animate-pulse bg-surface-container rounded" />
        )}
      </div>
      <p className="mt-5 font-serif text-3xl tracking-wider text-on-surface">{order.code}</p>
      <p className="mt-1 text-[15px] text-on-surface-variant">
        Válida para <strong className="text-on-surface">{order.spotsCount} persona{order.spotsCount === 1 ? "" : "s"}</strong>. Preséntela al llegar.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={download} disabled={!qr} className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Guardar QR
        </button>
        <Link href="/catas" className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded border border-outline-variant hover:border-primary-container text-[14px] font-semibold">
          Ver otras catas
        </Link>
      </div>
      <p className="mt-6 text-[13px] text-on-surface-variant">
        Guarde este enlace: es su entrada. También se la enviamos a {order.customerEmail}.
      </p>
    </Panel>
  );
}
