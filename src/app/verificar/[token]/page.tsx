"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { Logo } from "@/components/Brand";
import type { Language } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { VERIFY_COPY } from "./copy";

/** Respuesta de `POST /api/verify` por entrada (`number` = 0 si el QR es de una orden completa antigua). */
interface VerifiedTicket {
  code: string;
  number: number;
  attendeeName: string | null;
  customerName: string;
  customerDocId: string;
  tastingTitle: string;
  tastingDate: string;
  tastingTime: string;
  dietaryRestrictions: string | null;
  checkedInAt: string | null;
  orderSpots: number;
  orderCheckedIn: number;
}

interface VerifyResult {
  success: boolean;
  message: string;
  ticket?: VerifiedTicket;
}

/** Datos públicos de la entrada (`GET /api/tickets/[token]`), para el visitante. */
interface PublicTicketInfo {
  code: string;
  number: number;
  attendeeName: string | null;
  tastingTitle: string;
}

/* Al escanear el QR con la cámara del teléfono:
   - el personal con sesión de puerta o de admin ve la validación y el botón de check-in;
   - cualquier otra persona ve su código para presentarlo en la puerta. */
export default function VerifyTicketPage() {
  const { token } = useParams<{ token: string }>();
  const [lang, setLang] = useLang();
  const t = VERIFY_COPY[lang];
  const [mode, setMode] = useState<"loading" | "staff" | "guest">("loading");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [checkedInNow, setCheckedInNow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scannerHref, setScannerHref] = useState("/puerta");

  const call = useCallback(
    async (action: "verify" | "checkin") => {
      setBusy(true);
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action }),
        });
        if (res.status === 401 || res.status === 403) {
          setMode("guest");
          return;
        }
        const data: VerifyResult = await res.json();
        setResult(data);
        setCheckedInNow(action === "checkin" && data.success);
        setMode("staff");
      } catch {
        setResult({ success: false, message: "" });
        setMode("staff");
      } finally {
        setBusy(false);
      }
    },
    [token]
  );

  useEffect(() => {
    call("verify");
  }, [call]);

  // El escáner del panel es para admin; la puerta tiene el suyo.
  useEffect(() => {
    if (mode !== "staff") return;
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((d) => setScannerHref(d.authenticated ? "/admin/scanner" : "/puerta"))
      .catch(() => {});
  }, [mode]);

  const langToggle = (
    <button
      type="button"
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className="absolute top-4 right-4 h-11 min-w-11 px-3 rounded-full border border-outline-variant text-[13px] font-semibold text-on-surface-variant hover:text-on-surface"
      aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
    >
      {lang === "es" ? "EN" : "ES"}
    </button>
  );

  return (
    <main className="relative min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
      {langToggle}
      <Link href="/" aria-label="El Origen">
        <Logo variant="full" className="w-36 mb-10" />
      </Link>

      {mode === "loading" ? (
        <span className="material-symbols-outlined animate-spin text-on-surface-variant" role="status" aria-label={t.verifying}>
          progress_activity
        </span>
      ) : mode === "guest" ? (
        <GuestView token={token} lang={lang} />
      ) : (
        <StaffView
          result={result}
          checkedInNow={checkedInNow}
          busy={busy}
          scannerHref={scannerHref}
          lang={lang}
          onCheckin={() => call("checkin")}
        />
      )}
    </main>
  );
}

/* ─── Visitante: muestra su código para presentarlo en la puerta ─── */

function GuestView({ token, lang }: { token: string; lang: Language }) {
  const t = VERIFY_COPY[lang];
  const [qr, setQr] = useState("");
  const [info, setInfo] = useState<PublicTicketInfo | null>(null);

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/verificar/${token}`, {
      width: 560,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#2A1519", light: "#FFFFFF" },
    })
      .then(setQr)
      .catch(() => setQr(""));
    fetch(`/api/tickets/${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.success && d.ticket && setInfo(d.ticket))
      .catch(() => {});
  }, [token]);

  return (
    <div className="w-full max-w-sm text-center">
      <p className="eyebrow">{t.guestTitle}</p>
      <h1 className="font-serif text-3xl mt-3 text-balance">{t.guestPresent}</h1>
      {info && (
        <p className="mt-2 text-on-surface-variant">
          {info.tastingTitle}
          {info.attendeeName ? ` · ${info.attendeeName}` : ""}
        </p>
      )}

      <div className="mt-6 mx-auto w-full max-w-[280px] aspect-square rounded-xl border border-outline-variant bg-white p-3">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={t.qrAlt(info?.code ?? "")} className="w-full h-full" />
        ) : (
          <div className="w-full h-full animate-pulse bg-surface-container rounded" />
        )}
      </div>
      {info && (
        <>
          <p className="mt-4 font-serif text-2xl tracking-wider text-on-surface">{info.code}</p>
          <p className="text-[13px] text-on-surface-variant">{t.ticketOf(info.number)}</p>
        </>
      )}
      <p className="mt-4 text-[14px] text-on-surface-variant leading-relaxed">{t.guestText}</p>

      {info && (
        <Link
          href={`/cata-en-vivo/${token}`}
          className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">wine_bar</span>
          {t.live}
        </Link>
      )}

      <p className="mt-10 text-[13px] text-on-surface-variant">
        {t.staff}{" "}
        <Link href="/puerta" className="underline underline-offset-4">
          {t.staffLogin}
        </Link>{" "}
        {t.staffAfter}
      </p>
    </div>
  );
}

/* ─── Personal de puerta / admin ─── */

function StaffView({
  result,
  checkedInNow,
  busy,
  scannerHref,
  lang,
  onCheckin,
}: {
  result: VerifyResult | null;
  checkedInNow: boolean;
  busy: boolean;
  scannerHref: string;
  lang: Language;
  onCheckin: () => void;
}) {
  const t = VERIFY_COPY[lang];
  const ticket = result?.ticket;
  const ok = Boolean(result?.success);
  const canCheckin = ok && !checkedInNow && ticket && !ticket.checkedInAt;
  const pendingInOrder = ticket ? Math.max(0, ticket.orderSpots - ticket.orderCheckedIn) : 0;

  const rows: [string, string][] = [];
  if (ticket) {
    if (ticket.attendeeName) rows.push([t.attendee, ticket.attendeeName]);
    rows.push([t.buyer, ticket.customerName], [t.docId, ticket.customerDocId], [t.tasting, ticket.tastingTitle]);
    rows.push([t.when, [ticket.tastingDate, ticket.tastingTime].filter(Boolean).join(" · ")]);
    rows.push([t.code, ticket.code]);
    if (ticket.orderSpots > 1) rows.push([t.group, t.groupProgress(ticket.orderCheckedIn, ticket.orderSpots)]);
    if (ticket.dietaryRestrictions) rows.push([t.diet, ticket.dietaryRestrictions]);
  }

  return (
    <div className="w-full max-w-md">
      <div
        className={`rounded-2xl border-2 p-6 text-center ${
          !result ? "border-outline-variant" : ok ? "border-emerald-600 bg-emerald-50" : "border-error bg-error-container/50"
        }`}
        role="status"
        aria-live="polite"
      >
        <span className={`material-symbols-outlined text-5xl ${ok ? "text-emerald-700" : "text-error"}`} aria-hidden="true">
          {!result ? "hourglass_top" : ok ? (checkedInNow ? "how_to_reg" : "verified") : "block"}
        </span>
        <p className="font-semibold text-lg mt-2 text-balance">{!result ? t.verifying : result.message || t.connectionError}</p>
        {ticket && ticket.number > 0 && (
          <p className="mt-1 font-serif text-4xl text-on-surface tabular-nums">
            {ticket.number}
            <span className="text-xl text-on-surface-variant">/{ticket.orderSpots}</span>
          </p>
        )}
        {rows.length > 0 && (
          <dl className="mt-5 text-left text-[15px] space-y-2 border-t border-black/10 pt-4">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-on-surface-variant flex-shrink-0">{k}</dt>
                <dd className="font-semibold text-right break-words min-w-0">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {canCheckin && (
        <button
          type="button"
          onClick={onCheckin}
          disabled={busy}
          className="mt-5 w-full h-14 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[16px] font-semibold disabled:opacity-60"
        >
          {busy ? t.checkingIn : ticket.number === 0 && pendingInOrder > 1 ? t.checkinMany(pendingInOrder) : t.checkin}
        </button>
      )}
      <Link
        href={scannerHref}
        className="mt-4 flex items-center justify-center gap-2 h-12 rounded border border-outline-variant font-semibold text-[14px]"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">qr_code_scanner</span>
        {t.scanner}
      </Link>
    </div>
  );
}
