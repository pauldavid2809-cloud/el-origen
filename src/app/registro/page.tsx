"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { Language } from "@/lib/i18n";
import { REGISTER_TERMS_CHECKBOX } from "@/lib/policies";
import {
  AuthHeading,
  AuthShell,
  FormAlert,
  PasswordField,
  Spinner,
  TextField,
  notifyMemberChange,
  primaryButtonClass,
  safeNext,
  secondaryButtonClass,
  useQueryParam,
  useRedirectIfSignedIn,
} from "../ingresar/_components/AuthUI";
import { REGISTER_COPY } from "./copy";

const PASSWORD_MIN = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Field = "fullName" | "email" | "phone" | "password" | "terms";

interface WelcomeCoupon {
  code: string;
  discountPercent: number;
}

export default function RegisterPage() {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Crea tu Cuenta Origen", en: "Create your Origen Account" });
  const t = REGISTER_COPY[lang];
  const nextParam = useQueryParam("next");
  const next = nextParam ? safeNext(nextParam) : null;
  useRedirectIfSignedIn();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [invalid, setInvalid] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState<{ text: string; emailTaken?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState<{ name: string; coupon: WelcomeCoupon | null } | null>(null);

  const validate = (): Partial<Record<Field, string>> => {
    const errs: Partial<Record<Field, string>> = {};
    if (fullName.replace(/\s+/g, " ").trim().length < 3) errs.fullName = t.errors.fullName;
    if (!EMAIL_RE.test(email.trim())) errs.email = t.errors.email;
    if (phone.replace(/\D/g, "").length < 7) errs.phone = t.errors.phone;
    if (password.length < PASSWORD_MIN) errs.password = t.errors.password;
    if (!acceptTerms) errs.terms = t.errors.terms;
    return errs;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errs = validate();
    setInvalid(errs);
    if (Object.keys(errs).length) {
      setError({ text: Object.values(errs).length === 1 ? (Object.values(errs)[0] as string) : t.errors.summary });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/members/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password, acceptTerms, marketingOptIn }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        notifyMemberChange();
        setPassword("");
        setWelcome({ name: fullName.trim().split(/\s+/)[0], coupon: data.welcomeCoupon ?? null });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (data.code === "email_taken") {
        setInvalid({ email: t.errors.emailTaken });
        setError({ text: t.errors.emailTaken, emailTaken: true });
      } else if (data.code === "weak_password") {
        setInvalid({ password: t.errors.password });
        setError({ text: t.errors.password });
      } else if (res.status === 429) {
        setError({ text: t.errors.rateLimited });
      } else {
        // Los mensajes del servidor están en español; en inglés se muestra el genérico.
        setError({ text: lang === "es" && data.message ? data.message : t.errors.generic });
      }
    } catch {
      setError({ text: t.errors.network });
    } finally {
      setLoading(false);
    }
  };

  const aside = (
    <ul className="space-y-4">
      {t.benefits.map((b) => (
        <li key={b} className="flex gap-3">
          <span className="material-symbols-outlined text-sun text-[20px] mt-0.5" aria-hidden="true">check_circle</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );

  if (welcome) {
    return (
      <AuthShell lang={lang} onLanguageChange={setLang} aside={aside}>
        <Welcome lang={lang} name={welcome.name} coupon={welcome.coupon} next={next} />
      </AuthShell>
    );
  }

  const loginHref = next ? `/ingresar?next=${encodeURIComponent(next)}` : "/ingresar";

  return (
    <AuthShell lang={lang} onLanguageChange={setLang} aside={aside}>
      <AuthHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />

      <form onSubmit={submit} noValidate className="space-y-5" aria-busy={loading}>
        {error && (
          <FormAlert>
            {error.text}
            {error.emailTaken && (
              <>
                {" "}
                <Link href={loginHref} className="font-semibold underline underline-offset-2">
                  {t.errors.emailTakenAction}
                </Link>
              </>
            )}
          </FormAlert>
        )}

        <TextField
          label={t.fullName}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          maxLength={120}
          required
          invalid={Boolean(invalid.fullName)}
        />
        <TextField
          label={t.email}
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={200}
          required
          invalid={Boolean(invalid.email)}
        />
        <TextField
          label={t.phone}
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          maxLength={40}
          required
          hint={t.phoneHint}
          invalid={Boolean(invalid.phone)}
        />
        <PasswordField
          lang={lang}
          label={t.password}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          hint={t.passwordHint}
          invalid={Boolean(invalid.password)}
        />

        <div className="space-y-1 pt-1">
          <Checkbox checked={acceptTerms} onChange={setAcceptTerms} invalid={Boolean(invalid.terms)} required>
            <TermsLabel lang={lang} />
          </Checkbox>
          <Checkbox checked={marketingOptIn} onChange={setMarketingOptIn}>
            {t.marketing}
          </Checkbox>
        </div>

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? (
            <>
              <Spinner />
              {t.submitting}
            </>
          ) : (
            t.submit
          )}
        </button>

        <p className="text-center text-[14px] text-on-surface-variant">
          {t.haveAccount}{" "}
          <Link href={loginHref} className="inline-flex items-center min-h-[44px] font-semibold text-primary-container underline underline-offset-4">
            {t.login}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

/** "Soy mayor de 18 años y acepto los [Términos y Condiciones]." con el texto oficial de policies.ts. */
function TermsLabel({ lang }: { lang: Language }) {
  const t = REGISTER_COPY[lang];
  const text = REGISTER_TERMS_CHECKBOX[lang];
  const at = text.indexOf(t.termsLinkText);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <Link
        href="/terminos"
        target="_blank"
        rel="noopener"
        aria-label={t.termsLinkAria}
        className="font-semibold text-primary-container underline underline-offset-2"
        onClick={(e) => e.stopPropagation()}
      >
        {t.termsLinkText}
      </Link>
      {text.slice(at + t.termsLinkText.length)}
    </>
  );
}

function Checkbox({
  checked,
  onChange,
  invalid,
  required,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  invalid?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-start gap-3 min-h-[44px] py-2.5 px-3 -mx-3 rounded cursor-pointer text-[14px] leading-relaxed text-on-surface ${
        invalid ? "bg-error-container/60" : "hover:bg-surface-container-low"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        aria-invalid={invalid || undefined}
        className="mt-0.5 h-5 w-5 flex-shrink-0 accent-primary-container cursor-pointer"
      />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

function Welcome({ lang, name, coupon, next }: { lang: Language; name: string; coupon: WelcomeCoupon | null; next: string | null }) {
  const t = REGISTER_COPY[lang];
  const pct = lang === "es" ? `${coupon?.discountPercent} %` : `${coupon?.discountPercent}%`;
  return (
    <div role="status">
      <AuthHeading eyebrow={t.welcomeEyebrow} title={t.welcomeTitle(name)} subtitle={t.welcomeText} />

      {coupon && (
        <section className="rounded-2xl border border-dashed border-primary-container/50 bg-primary-fixed/40 p-6 sm:p-8 mb-8">
          <p className="eyebrow mb-3">{t.couponTitle}</p>
          <p className="font-serif text-4xl sm:text-5xl tracking-[0.08em] text-primary-container select-all">{coupon.code}</p>
          <p className="mt-3 text-[15px] text-on-surface leading-relaxed">{t.couponText(pct)}</p>
        </section>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {next ? (
          <Link href={next} className={`${primaryButtonClass} sm:w-auto`}>
            {t.continue}
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </Link>
        ) : (
          <Link href="/catas" className={`${primaryButtonClass} sm:w-auto`}>
            {t.seeTastings}
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </Link>
        )}
        <Link href="/mi-cuenta" className={`${secondaryButtonClass} h-[52px]`}>
          {t.goAccount}
        </Link>
      </div>
    </div>
  );
}
