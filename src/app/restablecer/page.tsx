"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/useLang";
import {
  AuthHeading,
  AuthShell,
  FormAlert,
  PasswordField,
  Spinner,
  notifyMemberChange,
  primaryButtonClass,
} from "../ingresar/_components/AuthUI";
import { RESET_COPY } from "./copy";

const PASSWORD_MIN = 8;

type Stage = "checking" | "invalid" | "form" | "done";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  );
}

function ResetPassword() {
  const [lang, setLang] = useLang();
  const t = RESET_COPY[lang];
  const tokenParam = useSearchParams().get("token") ?? "";
  const [token] = useState(tokenParam);

  const [stage, setStage] = useState<Stage>(token ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    // El enlace queda solo en memoria: se quita de la barra de direcciones y del historial.
    window.history.replaceState(null, "", window.location.pathname);
    fetch(`/api/members/reset?token=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setStage(d?.valid ? "form" : "invalid"))
      // Si no se pudo verificar, se deja intentar: el servidor valida de nuevo al guardar.
      .catch(() => setStage("form"));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < PASSWORD_MIN) {
      setError(t.errors.password);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/members/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        notifyMemberChange();
        setPassword("");
        setStage("done");
        return;
      }
      if (data.code === "invalid_token") setStage("invalid");
      else if (data.code === "weak_password") setError(t.errors.password);
      else setError(res.status === 429 ? t.errors.rateLimited : t.errors.generic);
    } catch {
      setError(t.errors.network);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell lang={lang} onLanguageChange={setLang} aside={<p>{t.aside}</p>}>
      {stage === "checking" && (
        <div className="py-24 flex justify-center items-center gap-2 text-on-surface-variant" role="status">
          <Spinner />
          {t.checking}
        </div>
      )}

      {stage === "invalid" && (
        <div role="status">
          <AuthHeading eyebrow={t.eyebrow} title={t.invalidTitle} subtitle={t.invalidText} />
          <Link href="/recuperar" className={`${primaryButtonClass} sm:w-auto`}>
            {t.requestNew}
          </Link>
        </div>
      )}

      {stage === "done" && (
        <div role="status">
          <AuthHeading eyebrow={t.eyebrow} title={t.doneTitle} subtitle={t.doneText} />
          <Link href="/mi-cuenta" className={`${primaryButtonClass} sm:w-auto`}>
            {t.goAccount}
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>
      )}

      {stage === "form" && (
        <>
          <AuthHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
          <form onSubmit={submit} noValidate className="space-y-5" aria-busy={loading}>
            {error && <FormAlert>{error}</FormAlert>}
            <PasswordField
              lang={lang}
              label={t.password}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
              hint={t.passwordHint}
              invalid={Boolean(error)}
              autoFocus
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
          </form>
        </>
      )}
    </AuthShell>
  );
}
