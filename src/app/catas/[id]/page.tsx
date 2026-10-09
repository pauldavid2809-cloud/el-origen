"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AvilaRidge, SunBurst } from "@/components/Brand";
import { PurchasePolicies } from "@/components/PurchasePolicies";
import { formatBs, formatUsd } from "@/components/PaymentDetails";
import { whatsappLink } from "@/lib/contact";
import { ADDON_OFFER_COPY, TERMS_CHECKBOX } from "@/lib/policies";
import { getTeamMember, instagramUrl, teamInitials, type TeamMember } from "@/lib/team";
import { useLang } from "@/lib/useLang";
import type { Language } from "@/lib/i18n";
import type { Tasting } from "@/types";
import { formatTastingDate } from "@/lib/dates";
import { venueForLocation } from "@/lib/venues";
import { TASTING_COPY } from "./copy";

/** Máximo de cupos por reserva (el servidor aplica el mismo límite). */
const MAX_SPOTS = 10;
const MAX_ADDON_QTY = 10;

type Step = 1 | 2 | 3;
type FieldKey = "name" | "docId" | "email" | "phone";
interface AppliedCoupon {
  code: string;
  discountPercent: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (v: string) => v.replace(/\D/g, "");
const round2 = (n: number) => Math.round(n * 100) / 100;

const inputClass =
  "w-full h-12 bg-surface-container-lowest border rounded px-3.5 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:outline-none transition-colors";
const labelClass = "block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-1.5";

export default function TastingDetailPage() {
  const params = useParams();
  const tastingId = params?.id as string;
  const [lang, setLang] = useLang();
  const t = TASTING_COPY[lang];

  const [tasting, setTasting] = useState<Tasting | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    if (!tastingId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/tastings/${encodeURIComponent(tastingId)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok || !data.success || !data.tasting) {
          setNotFound(true);
          return;
        }
        const found: Tasting = data.tasting;
        setTasting(found);

        // Monto en bolívares con la tasa BCV (USD o EUR) que el admin eligió para esta cata.
        const rates = await fetch("/api/rates")
          .then((r) => r.json())
          .catch(() => null);
        const value = Number(rates?.[found.rateCurrency ?? "USD"]?.rate);
        if (alive && value > 0) setRate(value);
      } catch {
        if (alive) setNotFound(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tastingId]);

  // El título de la cata llega del layout; solo el de "no disponible" depende del idioma.
  useEffect(() => {
    if (notFound) document.title = `${t.notFoundTitle} | El Origen Caracas`;
  }, [notFound, t.notFoundTitle]);

  if (notFound) {
    return (
      <Shell lang={lang} setLang={setLang}>
        <div className="max-w-md mx-auto text-center py-24">
          <span className="material-symbols-outlined text-5xl text-primary-container/50" aria-hidden="true">event_busy</span>
          <h1 className="font-serif text-3xl mt-4">{t.notFoundTitle}</h1>
          <p className="text-on-surface-variant mt-3">{t.notFoundText}</p>
          <Link href="/catas" className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded bg-primary-container text-white font-semibold">
            {t.notFoundCta}
          </Link>
        </div>
      </Shell>
    );
  }

  if (!tasting) {
    return (
      <Shell lang={lang} setLang={setLang}>
        <div className="flex items-center justify-center py-32 text-on-surface-variant" role="status">
          <span className="material-symbols-outlined animate-spin mr-2" aria-hidden="true">progress_activity</span>
          {t.loading}
        </div>
      </Shell>
    );
  }

  return (
    <Shell lang={lang} setLang={setLang}>
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-[13px] text-on-surface-variant">
        <Link href="/" className="hover:text-primary-container min-h-11 inline-flex items-center">{t.breadcrumb.home}</Link>
        <span aria-hidden="true">/</span>
        <Link href="/catas" className="hover:text-primary-container min-h-11 inline-flex items-center">{t.breadcrumb.tastings}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-primary-container font-semibold line-clamp-1" aria-current="page">{tasting.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-14 gap-y-10 items-start">
        <div className="lg:col-span-7 space-y-8 min-w-0">
          <Hero tasting={tasting} lang={lang} />
          <Facts tasting={tasting} lang={lang} />
        </div>

        {/* Fija en escritorio, pero nunca más alta que la pantalla: deja libre la franja del botón flotante de WhatsApp
            y, si no cabe, se desplaza por dentro para que el total y "Continuar" sigan a la vista. */}
        <aside
          id="reservar"
          className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto lg:overscroll-contain min-w-0 scroll-mt-24"
        >
          <Checkout tasting={tasting} rate={rate} lang={lang} />
        </aside>

        <div className="lg:col-span-7 space-y-12 min-w-0">
          <Products tasting={tasting} lang={lang} />
          <Pairings tasting={tasting} lang={lang} />
          <Sommeliers tasting={tasting} lang={lang} />
          <VenueReview tasting={tasting} lang={lang} />
          <Instagram tasting={tasting} lang={lang} />
        </div>
      </div>
    </Shell>
  );
}

function Shell({ lang, setLang, children }: { lang: Language; setLang: (l: Language) => void; children: React.ReactNode }) {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />
      <main className="flex-grow pt-8 sm:pt-12 pb-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">{children}</main>
      <Footer currentLang={lang} />
    </div>
  );
}

/* ─── Detalle ─── */

function Hero({ tasting, lang }: { tasting: Tasting; lang: Language }) {
  const t = TASTING_COPY[lang];
  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden aspect-[16/10] w-full bg-primary-container">
        {tasting.imageUrl ? (
          // Las fotos se suben desde el admin (Supabase Storage o data URL en modo local).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tasting.imageUrl} alt={tasting.imageAlt || tasting.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-end text-sun" aria-hidden="true">
            <SunBurst className="absolute top-[18%] left-1/2 -translate-x-1/2 w-24 sm:w-32 opacity-80" />
            <AvilaRidge strokeWidth={1.5} className="h-20 sm:h-28 opacity-70" />
          </div>
        )}
        <span className="absolute top-4 left-4 bg-ink/80 text-paper text-[12px] font-semibold tracking-[0.12em] px-3.5 py-1.5 rounded-full">
          {tasting.dateDisplay}
        </span>
      </div>

      <div>
        <p className="eyebrow">{t.category[tasting.category] ?? t.category.degustacion}</p>
        <h1 className="mt-3 font-serif text-[2.2rem] leading-[1.08] sm:text-5xl text-on-surface text-balance">{tasting.title}</h1>
        {tasting.subtitle && <p className="mt-3 font-serif text-xl text-on-surface-variant text-pretty">{tasting.subtitle}</p>}
        {tasting.description && (
          <p className="mt-5 text-[15px] sm:text-base text-on-surface-variant leading-relaxed whitespace-pre-line text-pretty">
            {tasting.description}
          </p>
        )}
      </div>
    </div>
  );
}

function Facts({ tasting, lang }: { tasting: Tasting; lang: Language }) {
  const t = TASTING_COPY[lang];
  const time = [tasting.timeStart, tasting.timeEnd].filter(Boolean).join(" – ");
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6 text-[14px]">
      <Fact icon="calendar_today" label={t.date}>
        {formatTastingDate(tasting.date, lang, tasting.dateFull || tasting.dateDisplay)}
      </Fact>
      {time && (
        <Fact icon="schedule" label={t.time}>
          {time}
        </Fact>
      )}
      <Fact icon="location_on" label={t.place}>
        <span className="block">{tasting.location}</span>
        {tasting.locationAddress && <span className="block font-normal text-on-surface-variant mt-0.5">{tasting.locationAddress}</span>}
        {tasting.mapsUrl && (
          <a
            href={tasting.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 h-11 px-4 rounded border border-primary-container text-primary-container text-[13px] font-semibold hover:bg-primary-container/5"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">directions</span>
            {t.directions}
          </a>
        )}
      </Fact>
    </dl>
  );
}

function Fact({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px] text-primary-container" aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1.5 font-semibold text-on-surface break-words">{children}</dd>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-2xl sm:text-[1.75rem] text-on-surface flex items-center gap-2.5">
      <span className="material-symbols-outlined text-primary-container text-[26px]" aria-hidden="true">{icon}</span>
      {children}
    </h2>
  );
}

function Products({ tasting, lang }: { tasting: Tasting; lang: Language }) {
  const t = TASTING_COPY[lang];
  if (!tasting.wines?.length) return null;
  return (
    <section className="space-y-4">
      <SectionTitle icon="wine_bar">{t.products}</SectionTitle>
      <ul className="space-y-3">
        {tasting.wines.map((p, i) => (
          <li key={`${p.name}-${i}`} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="font-serif text-lg text-on-surface">{p.name}</h3>
              {p.vintage && (
                <span className="text-[12px] font-semibold text-primary-container">
                  {t.vintage} {p.vintage}
                </span>
              )}
              {p.type && <span className="text-[12px] text-on-surface-variant">{p.type}</span>}
            </div>
            {p.description && <p className="mt-1.5 text-[14px] text-on-surface-variant leading-relaxed">{p.description}</p>}
            {p.aromaProfile?.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {p.aromaProfile.map((a) => (
                  <li key={a} className="text-[12px] bg-surface-container px-2.5 py-1 rounded-full text-on-surface-variant">
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Pairings({ tasting, lang }: { tasting: Tasting; lang: Language }) {
  const t = TASTING_COPY[lang];
  if (!tasting.pairings?.length) return null;
  return (
    <section className="space-y-4">
      <SectionTitle icon="restaurant">{t.pairings}</SectionTitle>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px] text-on-surface">
        {tasting.pairings.map((p, i) => (
          <li key={`${p}-${i}`} className="flex items-start gap-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <span className="material-symbols-outlined text-primary-container text-[18px] mt-px" aria-hidden="true">check_circle</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface SommelierView {
  key: string;
  name: string;
  role: string;
  bio: string;
  instagram?: string;
  photoUrl?: string;
}

function Sommeliers({ tasting, lang }: { tasting: Tasting; lang: Language }) {
  const t = TASTING_COPY[lang];
  const people: SommelierView[] = useMemo(() => {
    const team = (tasting.sommelierIds ?? [])
      .map((id) => getTeamMember(id))
      .filter((m): m is TeamMember => Boolean(m))
      .map((m) => ({ key: m.id, name: m.name, role: m.role[lang], bio: m.bio[lang], instagram: m.instagram, photoUrl: m.photoUrl }));
    if (team.length) return team;
    // Catas antiguas: solo traen el sommelier principal.
    const s = tasting.sommelier;
    return s?.name ? [{ key: s.name, name: s.name, role: s.role, bio: s.bio, photoUrl: s.avatarUrl || undefined }] : [];
  }, [tasting.sommelierIds, tasting.sommelier, lang]);

  if (!people.length) return null;
  return (
    <section className="space-y-4">
      <SectionTitle icon="person">{t.sommeliers(people.length)}</SectionTitle>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {people.map((p) => (
          <SommelierCard key={p.key} person={p} lang={lang} />
        ))}
      </ul>
    </section>
  );
}

function SommelierCard({ person, lang }: { person: SommelierView; lang: Language }) {
  const t = TASTING_COPY[lang];
  const [open, setOpen] = useState(false);
  const bioId = `bio-${person.key}`;
  return (
    <li className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
      <div className="flex items-center gap-3.5">
        {person.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
        ) : (
          <span
            className="w-14 h-14 rounded-full bg-primary-container text-paper font-serif text-lg flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            {teamInitials(person.name)}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-serif text-lg leading-snug text-on-surface">{person.name}</h3>
          {person.role && <p className="text-[12px] text-on-surface-variant">{person.role}</p>}
        </div>
      </div>
      {person.bio && (
        <p id={bioId} className={`mt-3 text-[13.5px] text-on-surface-variant leading-relaxed ${open ? "" : "line-clamp-3"}`}>
          {person.bio}
        </p>
      )}
      {(person.bio || person.instagram) && (
        <div className="mt-1 flex flex-wrap items-center gap-x-5">
          {person.bio && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={bioId}
              className="min-h-11 text-[13px] font-semibold text-primary-container underline-offset-4 hover:underline"
            >
              {open ? t.readLess : t.readMore}
            </button>
          )}
          {person.instagram && (
            <a
              href={instagramUrl(person.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.instagramAria(person.instagram)}
              className="inline-flex items-center gap-1.5 min-h-11 text-[13px] font-semibold text-on-surface hover:text-primary-container"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">photo_camera</span>
              {person.instagram}
            </a>
          )}
        </div>
      )}
    </li>
  );
}

/** Reseña del restaurante aliado donde se hace la cata (si el lugar es uno de ellos). */
function VenueReview({ tasting, lang }: { tasting: Tasting; lang: Language }) {
  const t = TASTING_COPY[lang];
  const venue = venueForLocation(tasting.location);
  if (!venue) return null;
  return (
    <section className="space-y-4">
      <SectionTitle icon="restaurant">{t.venue}</SectionTitle>
      <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={venue.logoUrl} alt="" width={56} height={56} className="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-outline-variant" />
          <div className="min-w-0">
            <h3 className="font-serif text-lg leading-snug text-on-surface">{venue.name}</h3>
            <p className="text-[12px] text-on-surface-variant">{venue.kind[lang]}</p>
          </div>
        </div>
        <p className="mt-3 text-[14px] text-on-surface-variant leading-relaxed">{venue.review[lang]}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-5">
          {(tasting.locationAddress || venue.address) && (
            <span className="inline-flex items-center gap-1.5 min-h-11 text-[13px] text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-primary-container" aria-hidden="true">location_on</span>
              {tasting.locationAddress || venue.address}
            </span>
          )}
          <a
            href={instagramUrl(venue.instagram)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.instagramAria(venue.instagram)}
            className="inline-flex items-center gap-1.5 min-h-11 text-[13px] font-semibold text-on-surface hover:text-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">photo_camera</span>
            {venue.instagram}
          </a>
        </div>
      </article>
    </section>
  );
}

function Instagram({ tasting, lang }: { tasting: Tasting; lang: Language }) {
  const t = TASTING_COPY[lang];
  if (!tasting.instagram?.length) return null;
  return (
    <section className="space-y-4">
      <SectionTitle icon="photo_camera">{t.instagram}</SectionTitle>
      <ul className="flex flex-wrap gap-2">
        {tasting.instagram.map((ig) => (
          <li key={ig.handle}>
            <a
              href={instagramUrl(ig.handle)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.instagramAria(ig.handle)}
              className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full border border-outline-variant bg-surface-container-lowest hover:border-primary-container text-[14px]"
            >
              <span className="font-semibold text-on-surface">{ig.handle}</span>
              {ig.label && <span className="text-on-surface-variant">· {ig.label}</span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ─── Compra ─── */

function Checkout({ tasting, rate, lang }: { tasting: Tasting; rate: number | null; lang: Language }) {
  const router = useRouter();
  const t = TASTING_COPY[lang];
  const offer = ADDON_OFFER_COPY[lang];
  const priceUsd = tasting.priceUsd ?? tasting.price;
  const maxSpots = Math.max(0, Math.min(MAX_SPOTS, tasting.availableSpots));
  const soldOut = tasting.status === "sold_out" || maxSpots < 1;

  const [step, setStep] = useState<Step>(1);
  const [spots, setSpots] = useState(1);
  const [addOnQty, setAddOnQty] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ name: "", docId: "", email: "", phone: "", dietary: "" });
  const [showErrors, setShowErrors] = useState(false);
  const [memberPrefilled, setMemberPrefilled] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean; membersOnly?: boolean } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Prellenado con la Cuenta Origen si hay sesión de miembro.
  useEffect(() => {
    let alive = true;
    fetch("/api/members/me?orders=0", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const m = data?.member;
        if (!alive || !m) return;
        setForm((f) => ({
          ...f,
          name: f.name || m.fullName || "",
          email: f.email || m.email || "",
          phone: f.phone || m.phone || "",
        }));
        setMemberPrefilled(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setSpots((n) => Math.max(1, Math.min(n, maxSpots || 1)));
  }, [maxSpots]);

  const addOnsTotal = tasting.addOns.reduce((sum, a) => sum + a.priceUsd * (addOnQty[a.id] ?? 0), 0);
  const spotsTotal = priceUsd * spots;
  const subtotal = round2(spotsTotal + addOnsTotal);
  const discount = coupon ? Math.round(subtotal * coupon.discountPercent) / 100 : 0;
  const total = Math.max(0, round2(subtotal - discount));
  const bs = (usd: number) => (rate ? t.bsApprox(formatBs(round2(usd * rate), lang)) : null);

  const errors: Partial<Record<FieldKey, string>> = {};
  if (form.name.trim().length < 3) errors.name = t.errRequired;
  if (digits(form.docId).length < 5) errors.docId = form.docId.trim() ? t.errDocId : t.errRequired;
  if (!EMAIL_RE.test(form.email.trim())) errors.email = form.email.trim() ? t.errEmail : t.errRequired;
  if (digits(form.phone).length < 10) errors.phone = form.phone.trim() ? t.errPhone : t.errRequired;
  const dataValid = Object.keys(errors).length === 0;

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    // El cupón se validó con el correo anterior (los cupones de miembros dependen de él).
    if (key === "email" && coupon) {
      setCoupon(null);
      setCouponMsg(null);
    }
  };

  const formRef = useRef<HTMLFormElement>(null);
  const revealOnStep = useRef(false);
  const [errorFocus, setErrorFocus] = useState(0);

  const changeStep = (next: Step) => {
    revealOnStep.current = true;
    setStep(next);
  };

  const goTo = (next: Step) => {
    if (next === 3 && !dataValid) {
      setShowErrors(true);
      setStep(2);
      setErrorFocus((n) => n + 1);
      return;
    }
    changeStep(next);
  };

  // Al cambiar de paso, el inicio del formulario vuelve a la vista: en móvil el paso nuevo puede ser más corto
  // y quedar por encima de la pantalla; en escritorio la tarjeta fija se desplaza por dentro.
  useEffect(() => {
    if (!revealOnStep.current) return;
    revealOnStep.current = false;
    const form = formRef.current;
    if (!form) return;
    const box = form.closest("aside");
    if (box && box.scrollHeight > box.clientHeight + 1) {
      if (box.scrollTop > 0) box.scrollTo({ top: 0, behavior: "smooth" });
    } else if (form.getBoundingClientRect().top < 0) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  // Con datos inválidos, el foco va al primer campo marcado (el navegador lo trae a la vista).
  useEffect(() => {
    if (!errorFocus) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errorFocus]);

  const setAddOn = (id: string, qty: number) =>
    setAddOnQty((prev) => ({ ...prev, [id]: Math.max(0, Math.min(MAX_ADDON_QTY, qty)) }));

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCheckingCoupon(true);
    setCouponMsg(null);
    try {
      const qs = new URLSearchParams({ code, email: form.email.trim() });
      const res = await fetch(`/api/coupons?${qs}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.coupon) {
        const applied = { code: String(data.coupon.code), discountPercent: Number(data.coupon.discountPercent) || 0 };
        setCoupon(applied);
        setCouponInput(applied.code);
        setCouponMsg({ text: t.couponApplied(applied.code, applied.discountPercent), ok: true });
      } else {
        const reason = typeof data.reason === "string" ? data.reason : typeof data.code === "string" ? data.code : "";
        setCoupon(null);
        setCouponMsg({
          text: t.couponErrors[reason] ?? data.message ?? t.couponError,
          ok: false,
          membersOnly: reason === "members_only",
        });
      }
    } catch {
      setCouponMsg({ text: t.couponError, ok: false });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponMsg(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!dataValid) {
      goTo(3);
      return;
    }
    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tastingId: tasting.id,
          customerName: form.name.trim(),
          customerEmail: form.email.trim(),
          customerPhone: form.phone.trim(),
          customerDocId: form.docId.trim(),
          spotsCount: spots,
          dietaryRestrictions: form.dietary.trim() || undefined,
          selectedAddOns: Object.entries(addOnQty)
            .filter(([, qty]) => qty > 0)
            .map(([id, quantity]) => ({ id, quantity })),
          couponCode: coupon?.code,
          acceptedTerms: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }
      setSubmitError(data.message || t.submitError);
    } catch {
      setSubmitError(t.connectionError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-card overflow-hidden">
      {/* Precio */}
      <div className="bg-primary-container text-paper px-5 sm:px-7 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary-fixed">{t.checkoutEyebrow}</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <h2 className="font-serif text-2xl">{t.checkoutTitle}</h2>
          <div className="text-right">
            <p className="font-serif text-3xl leading-none">
              {formatUsd(priceUsd)}
              <span className="ml-1.5 text-[12px] font-sans text-paper/75">{t.perPerson}</span>
            </p>
            <p className="mt-1 text-[12px] text-paper/80">
              {bs(priceUsd) ?? t.noRate}
              {rate && <span className="block text-paper/75">{t.rateNote(tasting.rateCurrency ?? "USD")}</span>}
            </p>
          </div>
        </div>
      </div>

      {soldOut ? (
        <div className="p-5 sm:p-7">
          <p className="font-serif text-xl text-on-surface">{t.soldOutTitle}</p>
          <p className="mt-2 text-[14px] text-on-surface-variant leading-relaxed">{t.soldOutText}</p>
          <Link
            href={`/lista-de-espera?cata=${encodeURIComponent(tasting.id)}`}
            className="mt-5 w-full h-12 inline-flex items-center justify-center gap-2 rounded bg-primary-container hover:bg-primary text-white text-[15px] font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">hourglass_top</span>
            {t.soldOutCta}
          </Link>
          <a
            href={whatsappLink(t.soldOutMessage(tasting.title))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 w-full h-12 inline-flex items-center justify-center gap-2 rounded border border-outline-variant hover:border-primary-container text-on-surface text-[15px] font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
            {t.soldOutWhatsapp}
          </a>
        </div>
      ) : (
        <form ref={formRef} onSubmit={submit} noValidate className="p-5 sm:p-7 scroll-mt-24">
          {/* Pasos */}
          <ol className="grid grid-cols-3 gap-1 mb-6 rounded-full bg-surface-container p-1 text-[13px] font-semibold">
            {t.steps.map((label, i) => {
              const n = (i + 1) as Step;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => goTo(n)}
                    aria-current={step === n ? "step" : undefined}
                    aria-label={t.stepAria(n, label)}
                    className={`w-full h-11 rounded-full transition-colors ${
                      step === n ? "bg-primary-container text-white" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {n}. {label}
                  </button>
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className={labelClass} id="spots-label">{t.spotsLabel}</span>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2">
                  <span className="text-[15px] font-semibold text-on-surface" aria-live="polite">{t.persons(spots)}</span>
                  <Stepper
                    value={spots}
                    min={1}
                    max={maxSpots}
                    onChange={setSpots}
                    lessLabel={t.fewer}
                    moreLabel={t.more}
                    labelledBy="spots-label"
                  />
                </div>
                <p className="mt-2 text-[12px] text-on-surface-variant">
                  {t.available(tasting.availableSpots)} {t.maxPerOrder(MAX_SPOTS)}
                </p>
              </div>

              {tasting.addOns.length > 0 && (
                <div className="rounded-xl border border-sun/50 bg-tertiary-fixed/30 p-4">
                  <p className="font-serif text-lg text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[20px]" aria-hidden="true">redeem</span>
                    {offer.title}
                  </p>
                  <p className="mt-1 text-[13px] text-on-surface-variant leading-relaxed">{offer.text}</p>
                  <ul className="mt-4 space-y-3">
                    {tasting.addOns.map((a) => {
                      const qty = addOnQty[a.id] ?? 0;
                      const labelId = `addon-${a.id}`;
                      return (
                        <li
                          key={a.id}
                          className={`rounded-lg border bg-surface-container-lowest p-3.5 transition-colors ${
                            qty > 0 ? "border-primary-container" : "border-outline-variant"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p id={labelId} className="text-[14px] font-semibold text-on-surface">{a.title}</p>
                              {a.description && <p className="mt-0.5 text-[12.5px] text-on-surface-variant">{a.description}</p>}
                              <p className="mt-1 text-[13px] font-semibold text-primary-container">
                                {formatUsd(a.priceUsd)}
                                {rate && (
                                  <>
                                    {" "}
                                    <span className="font-normal text-on-surface-variant whitespace-nowrap">{bs(a.priceUsd)}</span>
                                  </>
                                )}
                              </p>
                            </div>
                            <Stepper
                              value={qty}
                              min={0}
                              max={MAX_ADDON_QTY}
                              onChange={(v) => setAddOn(a.id, v)}
                              lessLabel={t.addOnLess(a.title)}
                              moreLabel={t.addOnMore(a.title)}
                              labelledBy={labelId}
                              className="self-end sm:self-auto"
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 text-[12px] text-on-surface-variant leading-relaxed">{offer.note}</p>
                </div>
              )}

              <TotalLine label={t.total} usd={total} bs={bs(total)} />
              <PrimaryButton onClick={() => goTo(2)}>{t.next}</PrimaryButton>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              {memberPrefilled && (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[13px] text-emerald-900">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_check</span>
                  {t.memberPrefilled}
                </p>
              )}
              <TextField
                id="name"
                label={t.name}
                value={form.name}
                onChange={(v) => update("name", v)}
                placeholder={t.namePlaceholder}
                autoComplete="name"
                error={showErrors ? errors.name : undefined}
              />
              <TextField
                id="docId"
                label={t.docId}
                value={form.docId}
                onChange={(v) => update("docId", v)}
                placeholder={t.docIdPlaceholder}
                autoComplete="off"
                error={showErrors ? errors.docId : undefined}
              />
              <TextField
                id="email"
                type="email"
                label={t.email}
                hint={t.emailHint}
                value={form.email}
                onChange={(v) => update("email", v)}
                placeholder="nombre@ejemplo.com"
                autoComplete="email"
                error={showErrors ? errors.email : undefined}
              />
              <TextField
                id="phone"
                type="tel"
                label={t.phone}
                hint={t.phoneHint}
                value={form.phone}
                onChange={(v) => update("phone", v)}
                placeholder={t.phonePlaceholder}
                autoComplete="tel"
                error={showErrors ? errors.phone : undefined}
              />
              <TextField
                id="dietary"
                label={t.dietary}
                value={form.dietary}
                onChange={(v) => update("dietary", v)}
                placeholder={t.dietaryPlaceholder}
                maxLength={500}
              />
              {showErrors && !dataValid && (
                <p role="alert" className="text-[13px] text-error">{t.errFix}</p>
              )}
              <div className="flex gap-3 pt-2">
                <SecondaryButton onClick={() => changeStep(1)}>{t.back}</SecondaryButton>
                <PrimaryButton onClick={() => goTo(3)}>{t.review}</PrimaryButton>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              {/* Cupón */}
              <div>
                <label htmlFor="coupon" className={labelClass}>{t.coupon}</label>
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCoupon();
                      }
                    }}
                    readOnly={Boolean(coupon)}
                    placeholder={t.couponPlaceholder}
                    autoComplete="off"
                    aria-describedby={couponMsg ? "coupon-msg" : undefined}
                    className={`${inputClass} border-outline-variant uppercase tracking-wider min-w-0 flex-1`}
                  />
                  {coupon ? (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="h-12 px-4 rounded border border-outline-variant text-[13px] font-semibold text-on-surface-variant hover:text-on-surface"
                    >
                      {t.removeCoupon}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={checkingCoupon || !couponInput.trim()}
                      className="h-12 px-4 rounded border border-primary-container text-primary-container text-[13px] font-semibold hover:bg-primary-container/5 disabled:opacity-50"
                    >
                      {checkingCoupon ? t.applying : t.apply}
                    </button>
                  )}
                </div>
                {couponMsg && (
                  <p id="coupon-msg" role="status" className={`mt-2 text-[13px] ${couponMsg.ok ? "text-emerald-800" : "text-error"}`}>
                    {couponMsg.text}
                    {couponMsg.membersOnly && (
                      <>
                        {" "}
                        <Link href="/registro" target="_blank" className="font-semibold underline underline-offset-4">
                          {t.couponMembersCta}
                        </Link>
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Resumen */}
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-2 text-[14px]">
                <SummaryRow label={t.lineSpots(spots, formatUsd(priceUsd))} value={formatUsd(round2(spotsTotal))} />
                {addOnsTotal > 0 && <SummaryRow label={t.lineAddOns} value={`+${formatUsd(round2(addOnsTotal))}`} />}
                {discount > 0 && coupon && (
                  <SummaryRow label={t.lineDiscount(coupon.code)} value={`−${formatUsd(discount)}`} tone="text-emerald-800" />
                )}
                <div className="pt-2 border-t border-outline-variant">
                  <TotalLine label={t.total} usd={total} bs={bs(total)} />
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant p-4 text-[13px] leading-relaxed text-on-surface-variant">
                <p className="font-semibold text-on-surface flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-[18px] text-primary-container" aria-hidden="true">account_balance_wallet</span>
                  {t.howToPayTitle}
                </p>
                {t.howToPay(tasting.paymentMethods ?? [], tasting.rateCurrency ?? "USD")}
              </div>

              <PurchasePolicies lang={lang} bare className="border-t border-outline-variant pt-6" />

              {/* Términos */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer min-h-11">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (e.target.checked) setTermsError(false);
                    }}
                    required
                    aria-invalid={termsError}
                    aria-describedby={termsError ? "terms-error" : undefined}
                    className="mt-0.5 h-5 w-5 flex-shrink-0 accent-[#7D2A46]"
                  />
                  <span className="text-[14px] text-on-surface leading-relaxed">
                    <TermsText lang={lang} />
                  </span>
                </label>
                {termsError && (
                  <p id="terms-error" role="alert" className="mt-1.5 text-[13px] text-error">{t.termsRequired}</p>
                )}
              </div>

              {submitError && (
                <p role="alert" className="flex items-start gap-2 text-[14px] text-error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
                  {submitError}
                </p>
              )}

              <div className="flex gap-3">
                <SecondaryButton onClick={() => changeStep(2)}>{t.back}</SecondaryButton>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-[52px] inline-flex items-center justify-center gap-2 rounded bg-primary-container hover:bg-primary text-white text-[15px] font-semibold transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>
                      {t.submitting}
                    </>
                  ) : (
                    <>
                      {t.submit}
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

/** Texto literal de la casilla de términos, con enlaces a /terminos y /privacidad. */
function TermsText({ lang }: { lang: Language }) {
  const { terms, privacy } = TASTING_COPY[lang].termsLinks;
  const text = TERMS_CHECKBOX[lang];
  const parts = text.split(new RegExp(`(${terms}|${privacy})`));
  return (
    <>
      {parts.map((part, i) =>
        part === terms || part === privacy ? (
          <Link
            key={i}
            href={part === terms ? "/terminos" : "/privacidad"}
            target="_blank"
            className="font-semibold text-primary-container underline underline-offset-4"
          >
            {part}
          </Link>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

/* ─── Piezas del formulario ─── */

function Stepper({
  value,
  min,
  max,
  onChange,
  lessLabel,
  moreLabel,
  labelledBy,
  className = "",
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  lessLabel: string;
  moreLabel: string;
  labelledBy: string;
  className?: string;
}) {
  const btn =
    "w-11 h-11 rounded-full border border-outline-variant bg-surface-container-lowest text-primary-container flex items-center justify-center hover:border-primary-container disabled:opacity-35 disabled:hover:border-outline-variant transition-colors";
  return (
    <div className={`flex items-center gap-2 flex-shrink-0 ${className}`} role="group" aria-labelledby={labelledBy}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={lessLabel}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">remove</span>
      </button>
      <span className="w-6 text-center font-serif text-lg text-on-surface tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={moreLabel}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
      </button>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  type = "text",
  autoComplete,
  maxLength = 160,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`${inputClass} ${error ? "border-error" : "border-outline-variant"}`}
      />
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-[12px] text-on-surface-variant">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-[12px] text-error">{error}</p>}
    </div>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 w-full h-[52px] inline-flex items-center justify-center gap-2 rounded bg-primary-container hover:bg-primary text-white text-[15px] font-semibold transition-colors"
    >
      {children}
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
    </button>
  );
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[52px] px-5 rounded border border-outline-variant text-[14px] font-semibold text-on-surface-variant hover:text-on-surface hover:border-outline transition-colors"
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value, tone = "text-on-surface-variant" }: { label: string; value: string; tone?: string }) {
  return (
    <p className={`flex justify-between gap-4 ${tone}`}>
      <span>{label}</span>
      <span className="font-medium tabular-nums text-right">{value}</span>
    </p>
  );
}

function TotalLine({ label, usd, bs }: { label: string; usd: number; bs: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-semibold text-on-surface">{label}</span>
      <span className="text-right">
        <span className="block font-serif text-2xl text-primary-container tabular-nums">{formatUsd(usd)}</span>
        {bs && <span className="block text-[12px] text-on-surface-variant tabular-nums">{bs}</span>}
      </span>
    </div>
  );
}
