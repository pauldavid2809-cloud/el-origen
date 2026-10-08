"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Brand";

/* Pantalla de clave del panel. La sesión vive en una cookie httpOnly firmada por el servidor. */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d.authenticated)))
      .catch(() => setAuthed(false));
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) setAuthed(true);
      else setError(data.message || "Clave incorrecta.");
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-5">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-outline-variant bg-surface-container-lowest p-8">
          <Logo variant="full" className="w-32 mx-auto mb-6" />
          <h1 className="font-serif text-2xl text-center">Panel de administración</h1>
          <p className="text-[14px] text-on-surface-variant text-center mt-2 mb-6">Ingrese la clave para gestionar reservas y pagos.</p>
          <label htmlFor="pw" className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2">
            Clave
          </label>
          <div className="relative">
            <input
              id="pw"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full h-12 border border-outline-variant rounded px-3.5 pr-11 bg-surface-container-lowest focus:border-primary-container focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-on-surface-variant"
              aria-label={show ? "Ocultar clave" : "Mostrar clave"}
            >
              <span className="material-symbols-outlined text-[20px]">{show ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
          {error && <p role="alert" className="text-error text-[14px] mt-3">{error}</p>}
          <button disabled={loading} className="mt-5 w-full h-12 rounded bg-primary-container hover:bg-primary text-white font-semibold disabled:opacity-60">
            {loading ? "Verificando…" : "Entrar"}
          </button>
          <Link href="/" className="block text-center text-[13px] text-on-surface-variant mt-5 hover:text-primary-container">
            Volver al sitio
          </Link>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
