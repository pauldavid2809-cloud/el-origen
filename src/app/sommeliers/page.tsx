"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader, SectionHeading } from "@/components/Brand";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { SommelierSpecialty } from "@/lib/leads";
import {
  EMAIL_RE,
  FormSection,
  LeadFormShell,
  MultiChoiceGroup,
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
import { FORM_COPY } from "../privadas/_components/copy";
import { SOMMELIERS_COPY } from "./copy";

type Field = "fullName" | "phone" | "email" | "instagram" | "certification" | "specialties" | "years" | "cvUrl" | "memorable";

/* Las mismas reglas que aplica el servidor (src/lib/leads.ts), para avisar antes de enviar. */

function validInstagram(v: string): boolean {
  const handle = v
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle);
}

function validUrl(v: string): boolean {
  const s = v.trim();
  if (!s) return true;
  try {
    return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`).hostname.includes(".");
  } catch {
    return false;
  }
}

function validYears(v: string): boolean {
  if (!/^\d{1,2}$/.test(v.trim())) return false;
  const n = Number(v);
  return n >= 0 && n <= 70;
}

export default function SommeliersPage() {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Únete a nuestra red de sommeliers & directores de cata", en: "Join our network of sommeliers & tasting directors" });
  const t = SOMMELIERS_COPY[lang];
  const common = FORM_COPY[lang];

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [certification, setCertification] = useState("");
  const [specialties, setSpecialties] = useState<SommelierSpecialty[]>([]);
  const [years, setYears] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [memorable, setMemorable] = useState("");

  const form = useLeadForm<Field>({ endpoint: "/api/sommelier-applications", lang, idPrefix: "sommelier" });

  const validate = (): FieldErrors<Field> => {
    const errs: FieldErrors<Field> = {};
    if (fullName.trim().length < 3) errs.fullName = t.errors.fullName;
    if (!isPhone(phone)) errs.phone = t.errors.phone;
    if (!EMAIL_RE.test(email.trim())) errs.email = t.errors.email;
    if (!validInstagram(instagram)) errs.instagram = t.errors.instagram;
    if (isBlank(certification)) errs.certification = t.errors.certification;
    if (!specialties.length) errs.specialties = t.errors.specialties;
    if (!validYears(years)) errs.years = t.errors.years;
    if (!validUrl(cvUrl)) errs.cvUrl = t.errors.cvUrl;
    if (isBlank(memorable)) errs.memorable = t.errors.memorable;
    return errs;
  };

  const onSubmit = async () => {
    const ok = await form.submit(validate, {
      fullName,
      phone,
      email,
      instagram,
      certification,
      specialties,
      yearsExperience: Number(years.trim()),
      cvUrl,
      memorableExperience: memorable,
    });
    if (ok) document.getElementById("postulacion")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        >
          <div className="mt-9">
            <a href="#postulacion" className={`${primaryButtonClass} w-full sm:w-auto`}>
              {t.cta}
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_downward</span>
            </a>
          </div>
        </PageHeader>

        {/* Presentación + qué ofrecemos */}
        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-12 sm:pt-16 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7 space-y-5 text-[16px] sm:text-[18px] text-on-surface-variant leading-relaxed text-pretty">
            {t.intro.map((p, i) => (
              <p key={i} className={i === 0 ? "font-serif text-[1.35rem] sm:text-[1.6rem] leading-snug text-on-surface" : ""}>
                {p}
              </p>
            ))}
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-primary-container text-paper p-7 sm:p-10">
            <h2 className="font-serif text-2xl sm:text-3xl">{t.offerTitle}</h2>
            <ul className="mt-6 space-y-6">
              {t.offer.map((o) => (
                <li key={o.icon} className="flex gap-4">
                  <span className="w-10 h-10 rounded-full border border-paper/25 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px] text-sun" aria-hidden="true">{o.icon}</span>
                  </span>
                  <span className="text-[15px] sm:text-[16px] leading-relaxed text-paper/90 pt-1.5">{o.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Formulario de postulación */}
        <section
          id="postulacion"
          className="scroll-mt-24 bg-surface-container-low border-t border-outline-variant"
          aria-labelledby="postulacion-titulo"
        >
          <div className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionHeading eyebrow={t.formEyebrow} title={<span id="postulacion-titulo">{t.formTitle}</span>} />
            </div>

            <div className="lg:col-span-8 min-w-0">
              {form.status === "sent" ? (
                <SuccessPanel
                  title={t.successTitle}
                  actions={
                    <>
                      <Link href="/nosotros" className={primaryButtonClass}>
                        {t.backToAbout}
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
                      </Link>
                      <Link href="/catas" className={secondaryButtonClass}>
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
                  submitIcon="wine_bar"
                  className="space-y-10"
                >
                  <FormSection title={`1. ${t.sectionContact}`}>
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
                        required
                      />
                      <TextField
                        {...form.bind("instagram", setInstagram)}
                        label={t.instagram}
                        hint={t.instagramHint}
                        placeholder={t.instagramPlaceholder}
                        value={instagram}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        maxLength={200}
                        required
                      />
                    </div>
                  </FormSection>

                  <FormSection title={`2. ${t.sectionProfile}`}>
                    <TextField
                      {...form.bind("certification", setCertification)}
                      label={t.certification}
                      hint={t.certificationHint}
                      value={certification}
                      maxLength={200}
                      required
                    />
                    <MultiChoiceGroup
                      id={form.idFor("specialties")}
                      lang={lang}
                      error={form.errors.specialties}
                      legend={t.specialties}
                      hint={t.specialtiesHint}
                      options={toOptions(t.specialtyOptions)}
                      value={specialties}
                      onChange={(v) => {
                        setSpecialties(v);
                        form.clearError("specialties");
                      }}
                      required
                    />
                    <div className="sm:max-w-[50%]">
                      <TextField
                        {...form.bind("years", setYears)}
                        label={t.years}
                        longLabel
                        value={years}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={2}
                        required
                      />
                    </div>
                  </FormSection>

                  <FormSection title={`3. ${t.sectionExperience}`}>
                    <TextField
                      {...form.bind("cvUrl", setCvUrl)}
                      label={t.cvUrl}
                      placeholder={t.cvUrlPlaceholder}
                      value={cvUrl}
                      type="url"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={500}
                    />
                    <TextAreaField
                      {...form.bind("memorable", setMemorable)}
                      label={t.memorable}
                      longLabel
                      value={memorable}
                      rows={5}
                      maxLength={3000}
                      required
                    />
                  </FormSection>
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
