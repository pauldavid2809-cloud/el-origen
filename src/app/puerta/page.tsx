"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Brand";
import { DoorScanner } from "@/components/QRScannerModal";
import { useLang } from "@/lib/useLang";
import type { Language } from "@/lib/i18n";
import { DOOR_COPY } from "./copy";

type Role = "admin" | "puerta";
type AuthState = { status: "loading" } | { status: "login"; notice?: string } | { status: "ready"; role: Role };

/* Puerta del evento: clave propia (sin acceso al resto del panel) y escáner a pantalla completa para tablet o teléfono. */
export default function DoorPage() {
  const [lang, setLang] = useLang();
  const t = DOOR_COPY[lang];
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/door/auth", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuth(d.authenticated ? { status: "ready", role: d.role === "admin" ? "admin" : "puerta" } : { status: "login" }))
      .catch(() => setAuth({ status: "login" }));
  }, []);

  const onUnauthorized = useCallback(() => setAuth({ status: "login", notice: "expired" }), []);

  const langButton = (tone: "light" | "dark") => (
    <button
      type="button"
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className={`h-11 min-w-11 px-3 rounded-full border text-[13px] font-semibold ${
        tone === "dark" ? "border-white/30 hover:bg-white/10" : "border-outline-variant text-on-surface-variant hover:text-on-surface"
      }`}
      aria-label={t.switchLang}
    >
      {lang === "es" ? "EN" : "ES"}
    </button>
  );

  if (auth.status === "loading") {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-background text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin" role="status" aria-label={t.loading}>
          progress_activity
        </span>
      </main>
    );
  }

  if (auth.status === "login") {
    return (
      <DoorLogin
        lang={lang}
        notice={auth.notice === "expired" ? t.sessionExpired : undefined}
        langButton={langButton("light")}
        onSuccess={() => setAuth({ status: "ready", role: "puerta" })}
      />
    );
  }

  return (
    <DoorStation
      lang={lang}
      role={auth.role}
      langButton={langButton("dark")}
      onUnauthorized={onUnauthorized}
      onLogout={() => setAuth({ status: "login" })}
    />
  );
}

/* ─── Clave de puerta ─── */

function DoorLogin({
  lang,
  notice,
  langButton,
  onSuccess,
}: {
  lang: Language;
  notice?: string;
  langButton: React.ReactNode;
  onSuccess: () => void;
}) {
  const t = DOOR_COPY[lang];
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/door/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        onSuccess();
        return;
      }
      setError(res.status === 429 ? t.tooMany : res.status === 503 ? t.notConfigured : t.wrongPassword);
    } catch {
      setError(t.connectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] flex items-center justify-center bg-background px-5 py-12">
      <div className="absolute top-4 right-4">{langButton}</div>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface-container-lowest p-8">
        <Logo variant="full" className="w-32 mx-auto mb-6" priority />
        <h1 className="font-serif text-2xl text-center">{t.loginTitle}</h1>
        <p className="text-[14px] text-on-surface-variant text-center mt-2 mb-6 leading-relaxed">{t.loginText}</p>
        {notice && (
          <p role="status" className="mb-4 rounded bg-tertiary-fixed px-3 py-2 text-[14px] text-on-tertiary-fixed">
            {notice}
          </p>
        )}
        <label htmlFor="door-password" className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
          {t.password}
        </label>
        <div className="relative">
          <input
            id="door-password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            autoComplete="current-password"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "door-error" : undefined}
            className="w-full h-12 border border-outline-variant rounded px-3.5 pr-12 bg-surface-container-lowest text-[16px] focus:border-primary-container focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-on-surface-variant"
            aria-label={show ? t.hidePassword : t.showPassword}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {show ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        {error && (
          <p id="door-error" role="alert" className="text-error text-[14px] mt-3">
            {error}
          </p>
        )}
        <button
          disabled={loading || !password}
          className="mt-5 w-full h-12 rounded bg-primary-container hover:bg-primary text-white font-semibold disabled:opacity-60"
        >
          {loading ? t.entering : t.enter}
        </button>
        <Link href="/" className="flex items-center justify-center min-h-11 text-[13px] text-on-surface-variant mt-3 hover:text-primary-container">
          {t.backToSite}
        </Link>
      </form>
    </main>
  );
}

/* ─── Escáner a pantalla completa ─── */

function DoorStation({
  lang,
  role,
  langButton,
  onUnauthorized,
  onLogout,
}: {
  lang: Language;
  role: Role;
  langButton: React.ReactNode;
  onUnauthorized: () => void;
  onLogout: () => void;
}) {
  const t = DOOR_COPY[lang];
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    action.catch(() => {});
  };

  const logout = async () => {
    await fetch("/api/door/auth", { method: "DELETE" }).catch(() => {});
    onLogout();
  };

  return (
    <div className="min-h-[100dvh] md:h-[100dvh] flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 bg-ink text-paper px-4 sm:px-6 h-16 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Logo tone="white" variant="mark" className="w-12 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-serif text-lg leading-tight truncate">{t.title}</p>
            <p className="text-[12px] text-paper/70 truncate">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {langButton}
          {canFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-white/10"
              aria-label={isFullscreen ? t.exitFullscreen : t.fullscreen}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </span>
            </button>
          )}
          {role === "admin" ? (
            <Link
              href="/admin"
              className="h-11 px-3 inline-flex items-center gap-1.5 rounded-full hover:bg-white/10 text-[13px] font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">dashboard</span>
              <span className="hidden sm:inline">{t.panel}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="h-11 px-3 inline-flex items-center gap-1.5 rounded-full hover:bg-white/10 text-[13px] font-semibold"
              aria-label={t.logout}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 p-3 sm:p-5 lg:p-6">
        <div className="h-full max-w-[1400px] mx-auto">
          <DoorScanner lang={lang} layout="fullscreen" onUnauthorized={onUnauthorized} />
        </div>
      </main>
    </div>
  );
}
