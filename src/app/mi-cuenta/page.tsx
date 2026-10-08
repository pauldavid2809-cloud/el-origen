"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTastingDate } from "@/lib/dates";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { Language } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/orders";
import { whatsappLink } from "@/lib/contact";
import { AuthShell, Panel, Spinner, notifyMemberChange, secondaryButtonClass } from "../ingresar/_components/AuthUI";
import { ACCOUNT_COPY } from "./copy";

interface AccountMember {
  fullName: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  createdAt: string;
}

interface AccountOrder {
  code: string;
  token: string;
  status: OrderStatus;
  tastingTitle: string;
  tastingDate: string;
  /** Fecha ISO de la cata (para mostrarla en inglés); `tastingDate` va en español. */
  tastingDateIso: string | null;
  tastingTime: string;
  spotsCount: number;
  totalUsd: number;
  createdAt: string;
  holdExpired: boolean;
}

interface AccountData {
  member: AccountMember;
  orders: AccountOrder[];
  welcomeCoupon: { code: string; discountPercent: number } | null;
}

const STATUS_TONE: Record<OrderStatus, string> = {
  pending_payment: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  in_review: "bg-secondary-container text-on-secondary-container",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-error-container text-on-error-container",
  cancelled: "bg-surface-container-high text-on-surface-variant",
};

const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)} USD`;

function formatDate(iso: string, lang: Language): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang === "es" ? "es-VE" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Caracas",
  });
}

export default function MyAccountPage() {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Mi cuenta", en: "My account" });
  const t = ACCOUNT_COPY[lang];
  const router = useRouter();
  const [data, setData] = useState<AccountData | null>(null);
  const [failed, setFailed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const res = await fetch("/api/members/me", { cache: "no-store" });
      const d = await res.json();
      if (!d?.success) throw new Error();
      if (!d.member) {
        router.replace("/ingresar?next=/mi-cuenta");
        return;
      }
      setData({ member: d.member, orders: d.orders ?? [], welcomeCoupon: d.welcomeCoupon ?? null });
    } catch {
      setFailed(true);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/members/logout", { method: "POST" });
    } finally {
      notifyMemberChange();
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <AuthShell lang={lang} onLanguageChange={setLang} width="wide">
      {failed ? (
        <div className="max-w-md mx-auto text-center py-24" role="alert">
          <span className="material-symbols-outlined text-5xl text-primary-container/50" aria-hidden="true">cloud_off</span>
          <p className="text-on-surface-variant mt-4">{t.error}</p>
          <button type="button" onClick={load} className={`${secondaryButtonClass} h-12 mt-6`}>
            {t.retry}
          </button>
        </div>
      ) : !data ? (
        <div className="py-32 flex justify-center items-center gap-2 text-on-surface-variant" role="status">
          <Spinner />
          {t.loading}
        </div>
      ) : (
        <>
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 sm:mb-10">
            <div className="min-w-0">
              <p className="eyebrow flex items-center gap-3 mb-4">
                <span className="h-px w-8 bg-primary-container/40" aria-hidden="true" />
                {t.eyebrow}
              </p>
              <h1 className="font-serif text-[2.2rem] sm:text-5xl leading-[1.08] text-on-surface break-words">
                {t.greeting(data.member.fullName.split(" ")[0])}
              </h1>
              <p className="mt-3 text-[15px] sm:text-base text-on-surface-variant">{t.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className={`${secondaryButtonClass} h-12 self-start sm:self-auto flex-shrink-0 disabled:opacity-60`}
            >
              {loggingOut ? <Spinner /> : <span className="material-symbols-outlined text-[18px]" aria-hidden="true">logout</span>}
              {loggingOut ? t.loggingOut : t.logout}
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            <div className="lg:col-span-7 space-y-6 min-w-0">
              {data.welcomeCoupon && <WelcomeCoupon lang={lang} coupon={data.welcomeCoupon} />}
              <Bookings lang={lang} orders={data.orders} />
            </div>
            <aside className="lg:col-span-5 min-w-0">
              <Profile lang={lang} member={data.member} />
            </aside>
          </div>
        </>
      )}
    </AuthShell>
  );
}

function WelcomeCoupon({ lang, coupon }: { lang: Language; coupon: { code: string; discountPercent: number } }) {
  const t = ACCOUNT_COPY[lang];
  const pct = lang === "es" ? `${coupon.discountPercent} %` : `${coupon.discountPercent}%`;
  return (
    <section className="rounded-2xl border border-dashed border-primary-container/50 bg-primary-fixed/40 p-5 sm:p-7">
      <p className="eyebrow mb-2">{t.couponTitle}</p>
      <p className="font-serif text-3xl sm:text-4xl tracking-[0.08em] text-primary-container select-all">{coupon.code}</p>
      <p className="mt-2 text-[14px] sm:text-[15px] text-on-surface leading-relaxed">{t.couponText(pct)}</p>
    </section>
  );
}

function Bookings({ lang, orders }: { lang: Language; orders: AccountOrder[] }) {
  const t = ACCOUNT_COPY[lang];
  return (
    <Panel>
      <h2 className="font-serif text-2xl">{t.bookingsTitle}</h2>
      <p className="text-[14px] text-on-surface-variant mt-1">{t.bookingsHint}</p>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-outline-variant px-5 py-10 text-center">
          <span className="material-symbols-outlined text-4xl text-primary-container/50" aria-hidden="true">wine_bar</span>
          <p className="font-serif text-xl mt-3">{t.noBookingsTitle}</p>
          <p className="text-[14px] text-on-surface-variant mt-2 max-w-sm mx-auto">{t.noBookingsText}</p>
          <Link
            href="/catas"
            className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold transition-colors"
          >
            {t.seeTastings}
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => (
            <li key={o.code}>
              <OrderCard lang={lang} order={o} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function OrderCard({ lang, order: o }: { lang: Language; order: AccountOrder }) {
  const t = ACCOUNT_COPY[lang];
  const expired = o.status === "pending_payment" && o.holdExpired;
  const action =
    o.status === "approved" ? t.viewTickets(o.spotsCount) : o.status === "pending_payment" || o.status === "rejected" ? t.payNow : t.viewOrder;
  return (
    <article className="rounded-xl border border-outline-variant bg-paper/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${STATUS_TONE[o.status]}`}>{t.status[o.status]}</span>
        {expired && (
          <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-surface-container-high text-on-surface-variant">
            {t.holdExpired}
          </span>
        )}
      </div>
      <h3 className="font-serif text-xl leading-snug mt-3 break-words">{o.tastingTitle}</h3>
      <p className="text-[14px] text-on-surface-variant mt-1">
        {[formatTastingDate(o.tastingDateIso, lang, o.tastingDate), o.tastingTime].filter(Boolean).join(" · ")}
      </p>
      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
        <div className="flex gap-1.5">
          <dt className="text-on-surface-variant">{t.code}</dt>
          <dd className="font-semibold tracking-wider text-primary-container">{o.code}</dd>
        </div>
        <div>
          <dt className="sr-only">{t.persons(o.spotsCount)}</dt>
          <dd className="text-on-surface">{t.persons(o.spotsCount)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-on-surface-variant">{t.total}</dt>
          <dd className="font-semibold text-on-surface">{usd(o.totalUsd)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[12px] text-on-surface-variant">{t.bookedOn(formatDate(o.createdAt, lang))}</p>
        <Link
          href={`/orden/${encodeURIComponent(o.token)}`}
          className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded text-[14px] font-semibold transition-colors ${
            o.status === "approved"
              ? "bg-primary-container hover:bg-primary text-white"
              : "border border-outline-variant text-on-surface hover:border-primary-container hover:text-primary-container"
          }`}
        >
          {o.status === "approved" && (
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">qr_code_2</span>
          )}
          {action}
        </Link>
      </div>
    </article>
  );
}

function Profile({ lang, member }: { lang: Language; member: AccountMember }) {
  const t = ACCOUNT_COPY[lang];
  const rows: [string, string][] = [
    [t.fullName, member.fullName],
    [t.email, member.email],
    [t.phone, member.phone],
    [t.memberSince, formatDate(member.createdAt, lang)],
    [t.marketing, member.marketingOptIn ? t.marketingYes : t.marketingNo],
  ];
  return (
    <Panel>
      <h2 className="font-serif text-2xl">{t.profileTitle}</h2>
      <dl className="mt-5 divide-y divide-outline-variant/70 text-[14px]">
        {rows.map(([k, v]) => (
          <div key={k} className="py-3 first:pt-0">
            <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{k}</dt>
            <dd className="mt-1 text-on-surface font-medium break-words">{v || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 pt-5 border-t border-outline-variant space-y-3">
        <p className="text-[13px] text-on-surface-variant">{t.changeData}</p>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
          <a
            href={whatsappLink(t.changeDataMessage(member.email))}
            target="_blank"
            rel="noopener noreferrer"
            className={`${secondaryButtonClass} h-11`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
            {t.writeUs}
          </a>
          <Link href="/recuperar" className={`${secondaryButtonClass} h-11`}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">key</span>
            {t.changePassword}
          </Link>
        </div>
      </div>
    </Panel>
  );
}
