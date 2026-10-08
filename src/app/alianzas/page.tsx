"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader, SectionHeading, SunBurst } from "@/components/Brand";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { whatsappLink } from "@/lib/contact";
import type { BrandObjective } from "@/lib/leads";
import {
  CheckboxField,
  EMAIL_RE,
  LeadFormShell,
  SelectField,
  SuccessPanel,
  TextAreaField,
  TextField,
  isBlank,
  isPhone,
  primaryButtonClass,
  secondaryButtonClass,
  toOptions,
  useLeadForm,
  type FieldErrors,
} from "../privadas/_components/LeadForm";
import { RichText } from "../privadas/_components/RichText";
import { FORM_COPY } from "../privadas/_components/copy";
import { ALIANZAS_COPY } from "./copy";

type Field = "company" | "brand" | "contactName" | "phone" | "email" | "objective";

export default function AlianzasPage() {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Alianzas Comerciales & Marcas Aliadas", en: "Business Partnerships & Partner Brands" });
  const t = ALIANZAS_COPY[lang];
  const common = FORM_COPY[lang];

  const [company, setCompany] = useState("");
  const [brand, setBrand] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [objective, setObjective] = useState<BrandObjective | "">("");
  const [message, setMessage] = useState("");
  const [wantsToSendSamples, setWantsToSendSamples] = useState(false);

  const form = useLeadForm<Field>({ endpoint: "/api/brand-leads", lang, idPrefix: "marca" });

  const validate = (): FieldErrors<Field> => {
    const errs: FieldErrors<Field> = {};
    if (isBlank(company)) errs.company = t.errors.company;
    if (isBlank(brand)) errs.brand = t.errors.brand;
    if (contactName.trim().length < 3) errs.contactName = t.errors.contactName;
    if (!isPhone(phone)) errs.phone = t.errors.phone;
    if (!EMAIL_RE.test(email.trim())) errs.email = t.errors.email;
    if (!objective) errs.objective = t.errors.objective;
    return errs;
  };

  const onSubmit = async () => {
    const ok = await form.submit(validate, {
      company,
      brand,
      contactName,
      contactRole,
      phone,
      email,
      objective,
      message,
      wantsToSendSamples,
    });
    if (ok) document.getElementById("dossier")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startOver = () => {
    setBrand("");
    setObjective("");
    setMessage("");
    setWantsToSendSamples(false);
    form.reset();
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
        >
          <div className="mt-9">
            <a href="#dossier" className={`${primaryButtonClass} w-full sm:w-auto`}>
              {t.cta}
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_downward</span>
            </a>
          </div>
        </PageHeader>

        {/* Narrativa de valor */}
        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-12 sm:pt-16 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-5">{t.narrativeEyebrow}</p>
            <h2 className="font-serif text-[2rem] sm:text-5xl leading-[1.1] text-on-surface text-balance">{t.narrativeTitle}</h2>
          </div>
          <div className="lg:col-span-7 space-y-5 text-[16px] sm:text-[17px] text-on-surface-variant leading-relaxed text-pretty lg:pt-10">
            {t.narrative.map((p, i) => (
              <p key={i}>
                <RichText text={p} />
              </p>
            ))}
          </div>
        </section>

        {/* Razones para aliarse */}
        <section className="bg-surface-container-low border-y border-outline-variant">
          <div className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full py-20 sm:py-28">
            <SectionHeading eyebrow={t.reasonsEyebrow} title={t.reasonsTitle} />
            <ol className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {t.reasons.map((r, i) => (
                <li key={r.title} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-7 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="w-11 h-11 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{r.icon}</span>
                    </span>
                    <span className="font-serif italic text-tertiary text-lg tabular-nums" aria-hidden="true">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-serif text-xl leading-snug text-on-surface text-balance">{r.title}</h3>
                  <p className="mt-3 text-[15px] text-on-surface-variant leading-relaxed">
                    <RichText text={r.text} />
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Modalidades de participación */}
        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full py-20 sm:py-28">
          <SectionHeading eyebrow={t.modesEyebrow} title={t.modesTitle} />
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {t.modes.map((m, i) => (
              <article
                key={m.letter}
                className={`rounded-2xl p-7 sm:p-9 flex flex-col ${
                  i === 0 ? "bg-primary-container text-paper" : "border border-outline-variant bg-surface-container-lowest"
                }`}
              >
                <span
                  className={`font-serif text-5xl leading-none ${i === 0 ? "text-sun" : "text-primary-container"}`}
                  aria-hidden="true"
                >
                  {m.letter}
                </span>
                <h3 className={`mt-5 font-serif text-2xl leading-snug text-balance ${i === 0 ? "text-paper" : "text-on-surface"}`}>
                  <span className="sr-only">{m.letter}. </span>
                  {m.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {m.points.map((p) => (
                    <li
                      key={p}
                      className={`flex gap-3 text-[15px] leading-relaxed ${i === 0 ? "text-paper/85" : "text-on-surface-variant"}`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0 ${i === 0 ? "text-sun" : "text-primary-container"}`}
                        aria-hidden="true"
                      >
                        check
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Formulario + micro-copy de cierre */}
        <section id="dossier" className="scroll-mt-24 bg-surface-container-low border-t border-outline-variant" aria-labelledby="dossier-titulo">
          <div className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <SunBurst className="w-14 text-sun mb-6" />
              <p className="eyebrow mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">handshake</span>
                {t.formEyebrow}
              </p>
              <h2 id="dossier-titulo" className="font-serif text-[2rem] sm:text-4xl leading-[1.15] text-on-surface text-balance">
                {t.closingTitle}
              </h2>
              <p className="mt-5 text-[16px] text-on-surface-variant leading-relaxed text-pretty">{t.closingText}</p>
            </div>

            <div className="lg:col-span-8 min-w-0">
              {form.status === "sent" ? (
                <SuccessPanel
                  title={t.successTitle}
                  actions={
                    <>
                      <a
                        href={whatsappLink(t.whatsappMessage(brand.trim()))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={primaryButtonClass}
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                        {common.whatsapp}
                      </a>
                      <button type="button" onClick={startOver} className={secondaryButtonClass}>
                        {common.sendAnother}
                      </button>
                    </>
                  }
                >
                  <p>{t.successText(brand.trim())}</p>
                  {wantsToSendSamples && <p>{t.successSamples}</p>}
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
                      {...form.bind("company", setCompany)}
                      label={t.company}
                      value={company}
                      autoComplete="organization"
                      maxLength={160}
                      required
                    />
                    <TextField {...form.bind("brand", setBrand)} label={t.brand} value={brand} maxLength={160} required />
                    <TextField
                      {...form.bind("contactName", setContactName)}
                      label={t.contactName}
                      value={contactName}
                      autoComplete="name"
                      maxLength={120}
                      required
                    />
                    <TextField
                      id="marca-contactRole"
                      lang={lang}
                      label={t.contactRole}
                      value={contactRole}
                      onChange={setContactRole}
                      autoComplete="organization-title"
                      maxLength={120}
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
                      required
                    />
                  </div>

                  <SelectField
                    {...form.bind<BrandObjective>("objective", setObjective)}
                    label={t.objective}
                    placeholder={t.objectivePlaceholder}
                    options={toOptions(t.objectives)}
                    value={objective}
                    required
                  />

                  <TextAreaField
                    id="marca-message"
                    lang={lang}
                    label={t.message}
                    value={message}
                    onChange={setMessage}
                    maxLength={3000}
                    rows={5}
                  />

                  <CheckboxField id="marca-samples" checked={wantsToSendSamples} onChange={setWantsToSendSamples}>
                    {t.samples}
                  </CheckboxField>
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
