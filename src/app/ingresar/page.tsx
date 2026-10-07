"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/useLang";
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
  useQueryParam,
  useRedirectIfSignedIn,
} from "./_components/AuthUI";
import { LOGIN_COPY } from "./copy";

export default function LoginPage() {
  const [lang, setLang] = useLang();
  const t = LOGIN_COPY[lang];
  const router = useRouter();
  const nextParam = useQueryParam("next");
  const next = safeNext(nextParam);
  useRedirectIfSignedIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(t.errors.missing);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        notifyMemberChange();
        router.replace(next);
        router.refresh();
        return;
      }
      setError(res.status === 429 ? t.errors.rateLimited : t.errors.invalid);
      setPassword("");
    } catch {
      setError(t.errors.network);
    } finally {
      setLoading(false);
    }
  };

  const registerHref = nextParam ? `/registro?next=${encodeURIComponent(next)}` : "/registro";

  return (
    <AuthShell lang={lang} onLanguageChange={setLang} aside={<p>{t.aside}</p>}>
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
          invalid={Boolean(error) && !loading}
        />
        <div>
          <PasswordField
            lang={lang}
            label={t.password}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            invalid={Boolean(error) && !loading}
          />
          <div className="flex justify-end">
            <Link
              href="/recuperar"
              className="inline-flex items-center min-h-[44px] text-[14px] font-semibold text-primary-container underline-offset-4 hover:underline"
            >
              {t.forgot}
            </Link>
          </div>
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

        <div className="border-t border-outline-variant pt-6 text-center">
          <p className="text-[14px] text-on-surface-variant">{t.noAccount}</p>
          <Link
            href={registerHref}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 h-12 px-5 rounded border border-primary-container text-primary-container text-[15px] font-semibold hover:bg-primary-container hover:text-white transition-colors"
          >
            {t.register}
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
