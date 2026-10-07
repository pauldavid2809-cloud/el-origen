"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

/* Estado de los envíos automáticos: correo (Gmail/Resend) y WhatsApp (bot o API de Meta). Datos de /api/admin/whatsapp. */

interface DeliveryInfo {
  provider: "meta" | "bot" | "none";
  bot: { phone: string | null; connected: boolean; running: boolean; online: boolean; lastSeen: string } | null;
  queued: number;
  mail: "gmail" | "resend" | "none";
}

const REFRESH_MS = 15_000;
const MAIL_LABEL: Record<DeliveryInfo["mail"], string> = { gmail: "Gmail", resend: "Resend", none: "Sin configurar" };

const when = (iso: string) =>
  new Date(iso).toLocaleString("es-VE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });

type Tone = "ok" | "warn" | "off";

const TONE: Record<Tone, { box: string; dot: string }> = {
  ok: { box: "border-emerald-300 bg-emerald-50 text-emerald-950", dot: "bg-emerald-600" },
  warn: { box: "border-tertiary/50 bg-tertiary-fixed/60 text-on-tertiary-fixed-variant", dot: "bg-tertiary" },
  off: { box: "border-error/40 bg-error-container/50 text-on-error-container", dot: "bg-error" },
};

export default function AdminDeliveryStatusPage() {
  const [info, setInfo] = useState<DeliveryInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setInfo(data);
      setError(null);
      setCheckedAt(new Date());
    } catch (err) {
      setError((err as Error).message || "No se pudo consultar el estado.");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Panel</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Correo y WhatsApp</h1>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Al aprobar un pago, cada persona recibe su entrada con QR por correo y por WhatsApp.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="h-11 px-4 rounded border border-outline-variant text-[14px] font-semibold inline-flex items-center gap-2 hover:border-primary-container self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
          Actualizar
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-error/40 bg-error-container/50 p-4 text-[14px] text-on-error-container">
          {error}
        </div>
      )}

      {!info ? (
        !error && (
          <div className="py-20 text-center text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
            <span className="sr-only">Cargando…</span>
          </div>
        )
      ) : (
        <div className="space-y-4" aria-live="polite">
          <WhatsAppCard info={info} />
          <MailCard mail={info.mail} />
          {checkedAt && <p className="text-[12px] text-on-surface-variant">Revisado a las {checkedAt.toLocaleTimeString("es-VE")} · se actualiza cada 15 s.</p>}
        </div>
      )}

      <p className="text-[14px] text-on-surface-variant">
        El estado de envío de cada entrada y el botón «Reenviar QR» están en{" "}
        <Link href="/admin/reservas" className="font-semibold text-primary-container hover:underline">
          Reservas y pagos
        </Link>
        .
      </p>
    </div>
  );
}

function StatusCard({ tone, icon, title, children }: { tone: Tone; icon: string; title: string; children?: React.ReactNode }) {
  return (
    <section className={`rounded-xl border p-5 space-y-2 text-[14px] ${TONE[tone].box}`}>
      <h2 className="flex items-center gap-2 font-semibold text-[15px]">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
        <span className={`w-2.5 h-2.5 rounded-full ${TONE[tone].dot}`} aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function WhatsAppCard({ info }: { info: DeliveryInfo }) {
  const queued = `${info.queued} ${info.queued === 1 ? "mensaje" : "mensajes"} en cola`;

  if (info.provider === "meta") {
    return (
      <StatusCard tone="ok" icon="forum" title="WhatsApp: API oficial de Meta">
        <p>Las entradas se envían directamente desde la API de WhatsApp Business.</p>
      </StatusCard>
    );
  }
  if (info.provider === "none") {
    return (
      <StatusCard tone="off" icon="forum" title="WhatsApp sin configurar">
        <p>
          Defina <code>WHATSAPP_QUEUE_SECRET</code> en el servidor y encienda el bot (carpeta <code>whatsapp-bot/</code>) en la computadora con el
          WhatsApp Business de El Origen. Mientras tanto, las entradas solo salen por correo.
        </p>
      </StatusCard>
    );
  }

  const bot = info.bot;
  if (bot?.online) {
    return (
      <StatusCard tone="ok" icon="forum" title={`Bot de WhatsApp conectado${bot.phone ? ` (+${bot.phone})` : ""}`}>
        <p>{queued}. Último contacto: {when(bot.lastSeen)}.</p>
      </StatusCard>
    );
  }
  if (bot?.running) {
    return (
      <StatusCard tone="warn" icon="forum" title="Bot encendido, sin WhatsApp vinculado">
        <p>{queued}.</p>
        <p>
          Abra el panel del bot en esa computadora (<code>http://localhost:3001</code>) y escanee el QR con el teléfono de El Origen: WhatsApp →
          Dispositivos vinculados → Vincular un dispositivo.
        </p>
      </StatusCard>
    );
  }
  return (
    <StatusCard tone="off" icon="forum" title="Bot de WhatsApp apagado">
      <p>{queued}{bot ? ` · última conexión: ${when(bot.lastSeen)}` : " · nunca se ha conectado"}.</p>
      <p>Encienda el bot en la computadora para que envíe los mensajes pendientes; la cola se conserva mientras tanto.</p>
    </StatusCard>
  );
}

function MailCard({ mail }: { mail: DeliveryInfo["mail"] }) {
  if (mail === "none") {
    return (
      <StatusCard tone="off" icon="mail" title="Correo sin configurar">
        <p>
          Defina <code>GMAIL_USER</code> y <code>GMAIL_APP_PASSWORD</code> (contraseña de aplicación de Google, con la verificación en dos pasos
          activa) para enviar las entradas, los avisos de rechazo y las alertas de comprobantes.
        </p>
      </StatusCard>
    );
  }
  return (
    <StatusCard tone="ok" icon="mail" title={`Correo activo: ${MAIL_LABEL[mail]}`}>
      <p>Las entradas con QR, los rechazos y las alertas de comprobantes se envían por {MAIL_LABEL[mail]}.</p>
    </StatusCard>
  );
}
