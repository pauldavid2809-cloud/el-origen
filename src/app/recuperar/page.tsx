"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { whatsappLink } from "@/lib/contact";
import {
  AuthHeading,
  AuthShell,
  FormAlert,
  Spinner,
  TextField,
  primaryButtonClass,
  secondaryButtonClass,
} from "../ingresar/_components/AuthUI";
import { FORGOT_COPY } from "./copy";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPasswordPage() {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Recuperar contraseña", en: "Reset your password" });
  const t = FORGOT_COPY[lang];
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  /** null = formulario; con resultado: enlace enviado, o aviso de WhatsApp si el sitio no tiene correo configurado. */
  const [result, setResult] = useState<{ mailEnabled: boolean; email: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError(t.errors.email);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/members/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, lang }),
      });
      const data = await res.json().catch(() => ({}));
      setResult({ mailEnabled: data.mailEnabled !== false, email: value });
    } catch {
      setError(t.errors.network);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell lang={lang} onLanguageChange={setLang} aside={<p>{t.aside}</p>}>
      {result ? (
        result.mailEnabled ? (
          <div role="status">
            <AuthHeading eyebrow={t.eyebrow} title={t.sentTitle} subtitle={t.sentText(result.email)} />
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/ingresar" className={`${primaryButtonClass} sm:w-auto`}>
                {t.back}
              </Link>
              <button type="button" onClick={() => setResult(null)} className={`${secondaryButtonClass} h-[52px]`}>
                {t.resend}
              </button>
            </div>
          </div>
        ) : (
          <div role="status">
            <AuthHeading eyebrow={t.eyebrow} title={t.noMailTitle} subtitle={t.noMailText} />
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappLink(t.whatsappMessage(result.email))}
                target="_blank"
                rel="noopener noreferrer"
                className={`${primaryButtonClass} sm:w-auto`}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chat</span>
                {t.whatsapp}
              </a>
              <Link href="/ingresar" className={`${secondaryButtonClass} h-[52px]`}>
                {t.back}
              </Link>
            </div>
          </div>
        )
      ) : (
        <>
          <AuthHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
          <form onSubmit={submit} noValidate className="space-y-5" aria-busy={loading}>
            {error && <FormAlert>{error}</FormAlert>}
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
              autoFocus
              invalid={Boolean(error)}
            />
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
            <p className="text-center">
              <Link
                href="/ingresar"
                className="inline-flex items-center gap-1 min-h-[44px] text-[14px] font-semibold text-primary-container underline-offset-4 hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
                {t.back}
              </Link>
            </p>
          </form>
        </>
      )}
    </AuthShell>
  );
}
