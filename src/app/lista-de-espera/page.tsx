"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader, SectionHeading } from "@/components/Brand";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { whatsappLink } from "@/lib/contact";
import { formatTastingDate } from "@/lib/dates";
import { WAITLIST_MAX_SPOTS } from "@/lib/waitlist";
import type { Tasting } from "@/types";
import {
  EMAIL_RE,
  LeadFormShell,
  SelectField,
  SuccessPanel,
  TextAreaField,
  TextField,
  isPhone,
  primaryButtonClass,
  secondaryButtonClass,
  useLeadForm,
  type FieldErrors,
  type Option,
} from "../privadas/_components/LeadForm";
import { FORM_COPY } from "../privadas/_components/copy";
import { WAITLIST_COPY } from "./copy";

type Field = "fullName" | "phone" | "email" | "tasting" | "spots" | "message";

/** Opción «La próxima cata que haya»: se envía como cata vacía. */
const NEXT_TASTING = "proxima";

const SPOT_VALUES = Array.from({ length: WAITLIST_MAX_SPOTS }, (_, i) => String(i + 1));

export default function WaitlistPage() {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Lista de espera", en: "Waiting list" });
  const t = WAITLIST_COPY[lang];
  const common = FORM_COPY[lang];

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tasting, setTasting] = useState("");
  const [spots, setSpots] = useState("1");
  const [message, setMessage] = useState("");
  const [tastings, setTastings] = useState<Tasting[]>([]);

  const form = useLeadForm<Field>({ endpoint: "/api/waitlist", lang, idPrefix: "espera" });
  const whatsappHref = whatsappLink(t.whatsappMessage);

  // Catas publicadas; si el enlace trae ?cata=<id o slug>, esa queda elegida.
  useEffect(() => {
    let alive = true;
    const wanted = new URLSearchParams(window.location.search).get("cata")?.trim() ?? "";
    fetch("/api/tastings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !Array.isArray(d?.tastings)) return;
        const list = d.tastings as Tasting[];
        setTastings(list);
        const match = wanted && list.find((x) => x.id === wanted || x.slug === wanted);
        if (match) setTasting((cur) => cur || match.id);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const tastingOptions: Option[] = [
    { value: NEXT_TASTING, label: t.nextTasting },
    ...tastings.map((x) => ({
      value: x.id,
      label: `${x.title} · ${formatTastingDate(x.date, lang, x.dateDisplay)}${x.status === "sold_out" ? ` (${t.soldOut})` : ""}`,
    })),
  ];
  const spotOptions: Option[] = SPOT_VALUES.map((v) => ({ value: v, label: t.spotsOption(Number(v)) }));

  const validate = (): FieldErrors<Field> => {
    const errs: FieldErrors<Field> = {};
    if (fullName.trim().length < 3) errs.fullName = t.errors.fullName;
    if (!isPhone(phone)) errs.phone = t.errors.phone;
    if (email.trim() && !EMAIL_RE.test(email.trim())) errs.email = t.errors.email;
    if (!tasting) errs.tasting = t.errors.tasting;
    if (!SPOT_VALUES.includes(spots)) errs.spots = t.errors.spots;
    return errs;
  };

  const onSubmit = async () => {
    const ok = await form.submit(validate, {
      fullName,
      phone,
      email,
      tastingId: tasting === NEXT_TASTING ? "" : tasting,
      spots: Number(spots),
      message,
    });
    if (ok) document.getElementById("anotarme")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        <PageHeader
          eyebrow={t.eyebrow}
          title={
            <>
              {t.titleMain} <em className="italic font-normal text-primary-container">{t.titleHighlight}</em>
            </>
          }
          subtitle={t.subtitle}
        />

        <section
          id="anotarme"
          className="scroll-mt-24 bg-surface-container-low border-t border-outline-variant"
          aria-labelledby="anotarme-titulo"
        >
          <div className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionHeading
                eyebrow={t.formEyebrow}
                title={<span id="anotarme-titulo">{t.formTitle}</span>}
                subtitle={t.formSubtitle}
              />
              <Link
                href="/#catas"
                className="mt-6 inline-flex items-center gap-2 min-h-[44px] text-[14px] font-semibold text-primary-container"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">wine_bar</span>
                {t.seeTastings}
              </Link>
            </div>

            <div className="lg:col-span-8 min-w-0">
              {form.status === "sent" ? (
                <SuccessPanel
                  title={t.successTitle}
                  actions={
                    <>
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={primaryButtonClass}>
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                        {common.whatsapp}
                      </a>
                      <Link href="/#catas" className={secondaryButtonClass}>
                        {t.seeTastings}
                      </Link>
                    </>
                  }
                >
                  <p>{t.successText(fullName.trim().split(/\s+/)[0] ?? "")}</p>
                </SuccessPanel>
              ) : (
                <LeadFormShell
                  lang={lang}
                  onSubmit={onSubmit}
                  alert={form.alert}
                  honeypot={form.honeypot}
                  onHoneypotChange={form.setHoneypot}
                  sending={form.status === "sending"}
                  submitLabel={t.submit}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
                    <TextField
                      {...form.bind("fullName", setFullName)}
                      label={t.fullName}
                      value={fullName}
                      autoComplete="name"
                      maxLength={120}
                      required
                    />
                    <TextField
                      {...form.bind("phone", setPhone)}
                      label={t.phone}
                      hint={t.phoneHint}
                      value={phone}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={40}
                      required
                    />
                    <TextField
                      {...form.bind("email", setEmail)}
                      label={t.email}
                      value={email}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={200}
                    />
                    <SelectField
                      {...form.bind("spots", setSpots)}
                      label={t.spots}
                      placeholder={t.tastingPlaceholder}
                      options={spotOptions}
                      value={spots}
                      required
                    />
                  </div>

                  <SelectField
                    {...form.bind("tasting", setTasting)}
                    label={t.tasting}
                    placeholder={t.tastingPlaceholder}
                    options={tastingOptions}
                    value={tasting}
                    required
                  />

                  <TextAreaField
                    {...form.bind("message", setMessage)}
                    label={t.message}
                    placeholder={t.messagePlaceholder}
                    value={message}
                    maxLength={1000}
                    rows={3}
                  />
                </LeadFormShell>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
