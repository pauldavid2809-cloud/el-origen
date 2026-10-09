"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader, SectionHeading } from "@/components/Brand";
import { PHOTOS } from "@/lib/photos";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { whatsappLink } from "@/lib/contact";
import type { PrivateEventType, PrivateGuestRange, PrivateRestaurant } from "@/lib/leads";
import {
  ChoiceGroup,
  EMAIL_RE,
  LeadFormShell,
  SelectField,
  SuccessPanel,
  TextAreaField,
  TextField,
  isPhone,
  primaryButtonClass,
  secondaryButtonClass,
  toOptions,
  useLeadForm,
  type FieldErrors,
} from "./_components/LeadForm";
import { FORM_COPY } from "./_components/copy";
import { PRIVADAS_COPY } from "./copy";

type Field = "fullName" | "company" | "phone" | "email" | "eventType" | "interest" | "guests" | "restaurant" | "message";

export default function PrivateEventsPage() {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Experiencias Privadas & Eventos Corporativos", en: "Private Experiences & Corporate Events" });
  const t = PRIVADAS_COPY[lang];
  const common = FORM_COPY[lang];

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState<PrivateEventType | "">("");
  const [interest, setInterest] = useState("");
  const [guests, setGuests] = useState<PrivateGuestRange | "">("");
  const [restaurant, setRestaurant] = useState<PrivateRestaurant | "">("");
  const [message, setMessage] = useState("");

  const form = useLeadForm<Field>({ endpoint: "/api/private-events", lang, idPrefix: "privada" });
  const whatsappHref = whatsappLink(t.whatsappMessage);

  const validate = (): FieldErrors<Field> => {
    const errs: FieldErrors<Field> = {};
    if (fullName.trim().length < 3) errs.fullName = t.errors.fullName;
    if (company.trim().length < 2) errs.company = t.errors.company;
    if (!isPhone(phone)) errs.phone = t.errors.phone;
    if (!EMAIL_RE.test(email.trim())) errs.email = t.errors.email;
    if (!eventType) errs.eventType = t.errors.eventType;
    if (interest.trim().length < 2) errs.interest = t.errors.interest;
    if (!guests) errs.guests = t.errors.guests;
    if (!restaurant) errs.restaurant = t.errors.restaurant;
    if (message.trim().length < 3) errs.message = t.errors.message;
    return errs;
  };

  const onSubmit = async () => {
    const ok = await form.submit(validate, {
      fullName,
      company,
      phone,
      email,
      eventType,
      interest,
      guests,
      restaurant,
      message,
    });
    if (ok) document.getElementById("solicitud")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startOver = () => {
    setEventType("");
    setGuests("");
    setRestaurant("");
    setInterest("");
    setMessage("");
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
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <a href="#solicitud" className={primaryButtonClass}>
              {t.cta}
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_downward</span>
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={secondaryButtonClass}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
              {t.whatsappCta}
            </a>
          </div>
        </PageHeader>

        {/* Narrativa de valor */}
        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-12 sm:pt-16 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-5">{t.narrativeEyebrow}</p>
            <h2 className="font-serif text-[2rem] sm:text-5xl leading-[1.1] text-on-surface text-balance">{t.narrativeTitle}</h2>
            <p className="mt-6 text-[16px] sm:text-[17px] text-on-surface-variant leading-relaxed max-w-2xl text-pretty">
              {t.narrativeText}
            </p>
            <div className="mt-10 relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface-container">
              <Image
                src={PHOTOS.mesaTerraza.src}
                alt={PHOTOS.mesaTerraza.alt[lang]}
                fill
                sizes="(min-width: 1320px) 680px, (min-width: 1024px) 55vw, 100vw"
                className="object-cover object-[center_60%]"
              />
            </div>
          </div>

          <dl className="lg:col-span-5 rounded-2xl bg-primary-container text-paper p-7 sm:p-10 space-y-8">
            <div>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.2em] text-sun flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">groups</span>
                {t.capacityLabel}
              </dt>
              <dd className="font-serif text-3xl sm:text-4xl mt-2">{t.capacityValue}</dd>
            </div>
            <div className="border-t border-paper/20 pt-8">
              <dt className="text-[12px] font-semibold uppercase tracking-[0.2em] text-sun flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">workspace_premium</span>
                {t.profileLabel}
              </dt>
              <dd className="mt-3 text-[16px] leading-relaxed text-paper/85">{t.profileValue}</dd>
            </div>
          </dl>
        </section>

        {/* Formulario de cotización */}
        <section
          id="solicitud"
          className="scroll-mt-24 bg-surface-container-low border-t border-outline-variant"
          aria-labelledby="solicitud-titulo"
        >
          <div className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionHeading
                eyebrow={t.formEyebrow}
                title={<span id="solicitud-titulo">{t.formTitle}</span>}
                subtitle={t.formSubtitle}
              />
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 min-h-[44px] text-[14px] font-semibold text-primary-container"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                {t.whatsappCta}
              </a>
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
                      <button type="button" onClick={startOver} className={secondaryButtonClass}>
                        {common.sendAnother}
                      </button>
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
                      {...form.bind("company", setCompany)}
                      label={t.company}
                      hint={t.companyHint}
                      value={company}
                      autoComplete="organization"
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
                    <SelectField
                      {...form.bind<PrivateEventType>("eventType", setEventType)}
                      label={t.eventType}
                      placeholder={t.eventTypePlaceholder}
                      options={toOptions(t.eventTypes)}
                      value={eventType}
                      required
                    />
                    <TextField
                      {...form.bind("interest", setInterest)}
                      label={t.interest}
                      placeholder={t.interestPlaceholder}
                      value={interest}
                      maxLength={200}
                      required
                    />
                  </div>

                  <ChoiceGroup
                    {...form.bind<PrivateGuestRange>("guests", setGuests)}
                    legend={t.guests}
                    options={toOptions(t.guestRanges)}
                    value={guests}
                    required
                  />

                  <ChoiceGroup
                    {...form.bind<PrivateRestaurant>("restaurant", setRestaurant)}
                    legend={t.restaurant}
                    options={toOptions(t.restaurants)}
                    value={restaurant}
                    columns={2}
                    required
                  />

                  <TextAreaField
                    {...form.bind("message", setMessage)}
                    label={t.message}
                    placeholder={t.messagePlaceholder}
                    value={message}
                    maxLength={2000}
                    required
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
