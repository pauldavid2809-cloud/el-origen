"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SensoryWheel, aromaLabel, type LiveTastingNote, type SensoryData } from "@/components/SensoryWheel";
import { AudioGuidePlayer } from "@/components/AudioGuidePlayer";
import { CertificateGenerator, type CertificateSigner } from "@/components/CertificateGenerator";
import { formatTastingDate } from "@/lib/dates";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { getTeamMember } from "@/lib/team";
import type { Tasting, TastingProduct } from "@/types";
import { LIVE_COPY } from "./copy";

/** `GET /api/tickets/[token]`. */
interface TicketInfo {
  code: string;
  number: number;
  attendeeName: string | null;
  tastingId: string;
  tastingTitle: string;
  tastingDate: string;
  /** Fecha ISO de la cata (para mostrarla en inglés); `tastingDate` va en español. */
  tastingDateIso?: string | null;
  customerName: string;
}

type LoadState = "loading" | "ready" | "not_found" | "error";

/** Enlace de demostración de la portada: la ficha funciona pero no guarda nada. */
const isDemoToken = (token: string) => token.startsWith("tok-demo");

export default function LiveTastingPage() {
  const { token } = useParams<{ token: string }>();
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Ficha de cata en vivo", en: "Live tasting sheet" });
  const t = LIVE_COPY[lang];
  const demo = isDemoToken(token);

  const [state, setState] = useState<LoadState>("loading");
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [tasting, setTasting] = useState<Tasting | null>(null);
  const [notes, setNotes] = useState<Record<number, LiveTastingNote>>({});
  const [current, setCurrent] = useState(0);
  const [view, setView] = useState<"sheet" | "certificate">("sheet");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [certName, setCertName] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (demo) {
      setTicket({
        code: "EO-DEMO-1",
        number: 1,
        attendeeName: null,
        tastingId: "",
        tastingTitle: "",
        tastingDate: "",
        customerName: "",
      });
      setState("ready");
      return;
    }

    let cancelled = false;
    setState("loading");
    (async () => {
      try {
        const res = await fetch(`/api/tickets/${encodeURIComponent(token)}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) setState("not_found");
          return;
        }
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);
        const info: TicketInfo = data.ticket;

        const [tastingRes, notesRes] = await Promise.all([
          fetch(`/api/tastings/${encodeURIComponent(info.tastingId)}?ticket=${encodeURIComponent(token)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(`/api/tasting-notes?token=${encodeURIComponent(token)}`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        if (cancelled) return;

        const latest: Record<number, LiveTastingNote> = {};
        for (const note of (notesRes?.notes ?? []) as LiveTastingNote[]) latest[note.productIndex] = note;

        setTicket(info);
        setTasting(tastingRes?.success ? tastingRes.tasting : null);
        setNotes(latest);
        setCertName(info.attendeeName || (info.number === 1 ? info.customerName : ""));
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, demo, attempt]);

  const products: TastingProduct[] = useMemo(() => {
    if (demo) return t.demoProducts.map((p) => ({ ...p, vintage: "", aromaProfile: [] }));
    if (tasting?.wines.length) return tasting.wines;
    return ticket ? [{ name: ticket.tastingTitle, vintage: "", type: "", description: "", aromaProfile: [] }] : [];
  }, [demo, t.demoProducts, tasting, ticket]);

  const guides: (CertificateSigner & { photoUrl?: string })[] = useMemo(
    () =>
      (tasting?.sommelierIds ?? [])
        .map((id) => getTeamMember(id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .map((m) => ({ name: m.name, role: m.role[lang], photoUrl: m.photoUrl })),
    [tasting, lang]
  );

  const ratedCount = Object.keys(notes).length;
  const summary = useMemo(() => {
    const list = Object.values(notes);
    if (!list.length) return { average: null, aromas: [] as string[] };
    const average = Math.round(list.reduce((sum, n) => sum + n.score, 0) / list.length);
    const counts = new Map<string, number>();
    list.forEach((n) => n.aromas.forEach((a) => counts.set(a, (counts.get(a) ?? 0) + 1)));
    const aromas = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => aromaLabel(id, lang));
    return { average, aromas };
  }, [notes, lang]);

  const saveNote = useCallback(
    async (data: SensoryData) => {
      const product = products[current];
      if (!product || !ticket) return;
      const note: LiveTastingNote = { ...data, tastingId: ticket.tastingId, productIndex: current, productName: product.name };
      setSaving(true);
      setNotice(null);
      try {
        if (!demo) {
          const res = await fetch("/api/tasting-notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, note }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok || !body.success) throw new Error(body.message);
        }
        const next = { ...notes, [current]: note };
        setNotes(next);
        setNotice({ tone: "ok", text: t.saved });
        const pending = products.findIndex((_, i) => !next[i]);
        if (pending === -1) setView("certificate");
        else setCurrent(pending);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        setNotice({ tone: "error", text: t.saveError });
      } finally {
        setSaving(false);
      }
    },
    [current, demo, notes, products, t.saveError, t.saved, ticket, token]
  );

  const shell = (children: React.ReactNode) => (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />
      <main className="flex-grow w-full max-w-3xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 pb-16">{children}</main>
      <Footer currentLang={lang} />
    </div>
  );

  if (state === "loading") {
    return shell(
      <p className="flex items-center justify-center gap-2 py-24 text-on-surface-variant" role="status">
        <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
        {t.loading}
      </p>
    );
  }

  if (state !== "ready" || !ticket) {
    const notFound = state === "not_found";
    return shell(
      <div className="py-16 text-center max-w-md mx-auto">
        <span className="material-symbols-outlined text-5xl text-primary-container" aria-hidden="true">
          {notFound ? "confirmation_number" : "wifi_off"}
        </span>
        <h1 className="font-serif text-3xl mt-4">{notFound ? t.notFoundTitle : t.errorTitle}</h1>
        <p className="mt-3 text-on-surface-variant leading-relaxed">{notFound ? t.notFoundText : t.errorText}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {!notFound && (
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold"
            >
              {t.retry}
            </button>
          )}
          <Link href="/" className="h-12 px-6 rounded border border-outline-variant inline-flex items-center justify-center text-[14px] font-semibold">
            {t.home}
          </Link>
        </div>
      </div>
    );
  }

  const product = products[current];
  const guide = guides[0];
  const story = product?.audioStory || product?.description || "";
  const title = demo ? t.demoTitle : ticket.tastingTitle;
  const dateLabel = demo ? "" : formatTastingDate(ticket.tastingDateIso ?? tasting?.date, lang, ticket.tastingDate);
  const taster = demo ? t.demoGuest : ticket.attendeeName || (ticket.number === 1 ? ticket.customerName : "");

  return shell(
    <>
      <header className="text-center">
        <p className="eyebrow">{t.badge}</p>
        <h1 className="font-serif text-3xl sm:text-4xl mt-3 text-balance">{title}</h1>
        <p className="mt-2 text-[14px] text-on-surface-variant">
          {taster && (
            <>
              {t.taster}: <strong className="text-on-surface">{taster}</strong> ·{" "}
            </>
          )}
          {t.ticket} <span className="font-mono">{ticket.code}</span>
        </p>
        {dateLabel && <p className="text-[13px] text-on-surface-variant">{dateLabel}</p>}
      </header>

      {demo && (
        <p className="mt-6 rounded-xl border border-tertiary-container bg-tertiary-fixed/50 px-4 py-3 text-[14px] text-on-tertiary-fixed-variant">
          {t.demoBanner}
        </p>
      )}

      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`mt-6 rounded-xl px-4 py-3 text-[14px] ${
            notice.tone === "ok" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-error-container text-on-error-container"
          }`}
        >
          {notice.text}
        </p>
      )}

      {view === "sheet" ? (
        <div className="mt-8 space-y-6">
          {products.length > 1 && (
            <nav aria-label={t.glassesLabel} className="-mx-5 px-5 sm:mx-0 sm:px-0 overflow-x-auto">
              <ol className="flex gap-2 w-max sm:w-auto sm:flex-wrap sm:justify-center">
                {products.map((p, i) => (
                  <li key={`${i}-${p.name}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrent(i);
                        setNotice(null);
                      }}
                      aria-current={current === i ? "step" : undefined}
                      className={`h-11 px-4 rounded-full border text-[13px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap ${
                        current === i
                          ? "bg-primary-container border-primary-container text-white"
                          : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {notes[i] && (
                        <span className="material-symbols-outlined text-[16px]" aria-label={t.rated}>
                          check_circle
                        </span>
                      )}
                      {t.glass(i + 1)}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {product && story && (
            <AudioGuidePlayer
              lang={lang}
              title={product.name}
              storyText={story}
              guideName={guide?.name}
              guideRole={guide?.role}
              guidePhotoUrl={guide?.photoUrl}
              textLang={demo ? lang : "es"}
            />
          )}

          {product && product.aromaProfile.length > 0 && (
            <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
              <p className="text-[13px] font-semibold">{t.sommelierNotes}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.aromaProfile.map((a) => (
                  <li key={a} className="rounded-full bg-surface-container-lowest border border-outline-variant px-3 py-1 text-[13px]">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product && (
            <SensoryWheel
              key={`${current}-${notes[current] ? "saved" : "new"}`}
              lang={lang}
              productName={product.name}
              productVintage={product.vintage}
              productType={product.type}
              glassNumber={current + 1}
              initialData={notes[current]}
              saving={saving}
              onSave={saveNote}
            />
          )}

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[14px] text-on-surface-variant">{t.progress(ratedCount, products.length)}</p>
            <button
              type="button"
              disabled={ratedCount === 0}
              onClick={() => {
                setView("certificate");
                setNotice(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full sm:w-auto h-12 px-5 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">workspace_premium</span>
              {t.seeCertificate}
            </button>
          </div>
          <p className="mt-3 pt-3 border-t border-outline-variant text-[12px] leading-relaxed text-on-surface-variant flex gap-2">
            <span className="material-symbols-outlined text-[16px] flex-shrink-0" aria-hidden="true">info</span>
            {t.certificateNote}
          </p>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <h2 className="font-serif text-2xl sm:text-3xl">{t.certificateTitle}</h2>
            <p className="mt-2 text-[14px] text-on-surface-variant max-w-md mx-auto">{t.certificateText}</p>
          </div>

          <div className="max-w-md mx-auto">
            <label htmlFor="cert-name" className="block text-[13px] font-semibold mb-1.5">
              {t.certificateName}
            </label>
            <input
              id="cert-name"
              type="text"
              value={certName}
              maxLength={80}
              onChange={(e) => setCertName(e.target.value)}
              placeholder={t.certificateNamePlaceholder}
              aria-describedby="cert-name-hint"
              className="w-full h-12 rounded border border-outline-variant bg-surface-container-lowest px-3.5 text-[16px] focus:border-primary-container focus:outline-none"
            />
            <p id="cert-name-hint" className="mt-1 text-[12px] text-on-surface-variant">
              {t.certificateNameHint}
            </p>
          </div>

          <CertificateGenerator
            lang={lang}
            attendeeName={certName.trim() || t.certificateNamePlaceholder}
            tastingTitle={title}
            tastingDate={dateLabel}
            averageScore={summary.average}
            glassesRated={ratedCount}
            featuredAromas={summary.aromas}
            certificateCode={ticket.code}
            signers={guides}
            demo={demo}
          />

          <div className="text-center">
            <button
              type="button"
              onClick={() => setView("sheet")}
              className="inline-flex items-center gap-1 min-h-11 text-[14px] font-semibold text-on-surface-variant hover:text-primary-container"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
              {t.backToSheet}
            </button>
          </div>
        </div>
      )}

      {!demo && (
        <div className="mt-12 pt-6 border-t border-outline-variant flex flex-col sm:flex-row justify-between gap-2 text-[14px] font-semibold">
          <Link href={`/verificar/${token}`} className="inline-flex items-center gap-1.5 min-h-11 hover:text-primary-container">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">qr_code_2</span>
            {t.myTicket}
          </Link>
          <Link href={`/recuerdos/${encodeURIComponent(ticket.tastingId)}`} className="inline-flex items-center gap-1.5 min-h-11 hover:text-primary-container">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">photo_library</span>
            {t.photos}
          </Link>
        </div>
      )}
    </>
  );
}
