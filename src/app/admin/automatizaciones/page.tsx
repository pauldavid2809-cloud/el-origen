"use client";

import React, { useState } from "react";
import { TerroirDivider } from "@/components/TerroirDivider";

export default function AdminAutomatizacionesPage() {
  const [testPhone, setTestPhone] = useState("+54 9 261 455-8822");
  const [testEmail, setTestEmail] = useState("cliente@ejemplo.com");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSendTestNotification = async (type: "whatsapp_confirmation" | "whatsapp_reminder" | "email_ticket" | "internal_sale_alert") => {
    setSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          recipient: type.startsWith("email") || type === "internal_sale_alert" ? testEmail : testPhone,
          reservationCode: "#EO-8492A",
          customMessage:
            type === "whatsapp_confirmation"
              ? "¡Reserva confirmada! Te esperamos el sábado para tu experiencia en Bodega El Origen."
              : type === "whatsapp_reminder"
              ? "¡Hola! Recordatorio: Te esperamos mañana para tu cata a las 18:00 hs. Ubicación: https://maps.google.com"
              : type === "email_ticket"
              ? "Entrada Oficial Bodega El Origen con QR adjunto e instrucciones de llegada."
              : "Nueva venta: 2 cupos para Cata Malbec Reserva ($90.000) por Carlos Mendoza.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`✓ Notificación [${type}] despachada exitosamente.`);
      }
    } catch {
      setStatusMessage("Error al despachar la notificación.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <header className="border-b border-surface-variant pb-6">
        <p className="text-xs uppercase font-bold tracking-[0.2em] text-secondary mb-1">
          Comunicaciones & Mensajería
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
          Automatizaciones & Notificaciones
        </h2>
      </header>

      {/* Stitch Main Showcase Area (Phone Mockups) */}
      <div className="bg-surface-container-low border border-surface-variant rounded-3xl p-8 sm:p-12 soft-shadow">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Text */}
          <div className="lg:w-1/3 text-center lg:text-left space-y-5">
            <span className="text-xs uppercase font-bold tracking-widest text-primary bg-primary-fixed-dim/30 px-3 py-1 rounded-full">
              Omnicanal
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-primary leading-tight">
              Conecta con tus clientes
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Nuestras notificaciones automatizadas aseguran que cada experiencia en El Origen sea fluida y memorable, desde la reserva hasta el brindis.
            </p>
            <div className="pt-2">
              <a
                href="#simulador"
                className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-xl hover:bg-primary-container transition-all shadow-md inline-block"
              >
                Probar Simulador en Vivo
              </a>
            </div>
          </div>

          {/* Right Phone Silhouettes (Stitch Exact Reproduction) */}
          <div className="lg:w-2/3 relative h-[560px] w-full flex justify-center items-center">
            {/* Phone Silhouette 1 (Back left) */}
            <div className="absolute left-4 lg:left-12 top-6 w-[220px] h-[480px] bg-surface rounded-[2.5rem] border-[7px] border-surface-variant mockup-shadow opacity-60 transform -rotate-6 scale-90 hidden sm:block">
              <div className="w-full h-full bg-surface-container-lowest rounded-[2rem] overflow-hidden p-3 pt-8">
                <div className="w-full h-4 bg-surface-container-highest rounded-full mb-3"></div>
                <div className="p-3 bg-surface rounded-xl border border-surface-variant text-[10px] text-secondary">
                  WhatsApp • Recordatorio 24h
                </div>
              </div>
            </div>

            {/* Phone Silhouette 2 (Back right) */}
            <div className="absolute right-4 lg:right-12 top-12 w-[220px] h-[480px] bg-surface rounded-[2.5rem] border-[7px] border-surface-variant mockup-shadow opacity-60 transform rotate-6 scale-90 hidden sm:block">
              <div className="w-full h-full bg-surface-container-lowest rounded-[2rem] overflow-hidden p-3 pt-8">
                <div className="w-full h-4 bg-surface-container-highest rounded-full mb-3"></div>
                <div className="p-3 bg-surface rounded-xl border border-surface-variant text-[10px] text-secondary">
                  Correo Electrónico • Ticket QR
                </div>
              </div>
            </div>

            {/* Main Phone Silhouette (Center Front) */}
            <div className="relative z-10 w-[290px] sm:w-[320px] h-[540px] bg-surface rounded-[3rem] border-[9px] border-surface-variant mockup-shadow flex flex-col overflow-hidden">
              {/* Notch area */}
              <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
                <div className="w-28 h-4 bg-surface-variant rounded-b-xl" />
              </div>

              {/* Screen Content */}
              <div className="flex-grow bg-surface-container-lowest p-4 pt-10 flex flex-col gap-4 relative">
                <div className="flex items-center justify-center pb-2 border-b border-surface-variant">
                  <span className="font-serif text-base font-bold text-primary">El Origen</span>
                </div>

                {/* Notification 1: WhatsApp Booking Confirmation */}
                <div className="bg-surface rounded-xl p-3.5 notification-shadow border border-surface-variant transform -translate-x-1 animate-fade-in-up">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[15px]">forum</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-secondary">
                        WhatsApp • Hace 5 min
                      </span>
                      <span className="font-bold text-xs text-on-surface">El Origen Bodega</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-tight">
                    ¡Reserva confirmada! Te esperamos el sábado para tu experiencia Malbec Reserva.
                  </p>
                </div>

                {/* Notification 2: Reminder */}
                <div className="bg-surface rounded-xl p-3.5 notification-shadow border border-surface-variant transform translate-x-2 animate-fade-in-up">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[15px]">notifications_active</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-secondary">
                        Recordatorio • Ahora
                      </span>
                      <span className="font-bold text-xs text-on-surface">Tu cata de vinos</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-tight">
                    ¡Hola! Te esperamos mañana para tu cata a las 6 PM en el Valle de Uco.
                  </p>
                </div>

                {/* Notification 3: Internal Sales Alert */}
                <div className="bg-surface rounded-xl p-3.5 notification-shadow border border-primary/20 transform -translate-x-1 mt-auto animate-fade-in-up">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-tertiary-container flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[15px]">mail</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-secondary">
                        Admin • Nueva Venta
                      </span>
                      <span className="font-bold text-xs text-on-surface">Sistema de Reservas</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-tight">
                    Nueva venta: 2 cupos para Cata Malbec Premium ($90.000).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TerroirDivider />

      {/* Simulator Test Panel */}
      <div id="simulador" className="bg-surface rounded-3xl border border-surface-variant p-6 sm:p-10 soft-shadow space-y-6">
        <div className="border-b border-surface-variant pb-4">
          <h3 className="font-serif text-xl font-bold text-on-surface">
            Simulador de Disparadores de Notificación en Vivo
          </h3>
          <p className="text-xs text-secondary mt-1">
            Prueba los triggers de WhatsApp Business API, plantillas de correo Resend y alertas internas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block uppercase font-bold text-secondary mb-1">
              Teléfono de Prueba (WhatsApp)
            </label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 font-mono text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block uppercase font-bold text-secondary mb-1">
              Correo Electrónico de Prueba (Email)
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleSendTestNotification("whatsapp_confirmation")}
            disabled={sending}
            className="bg-surface border border-outline-variant hover:border-primary text-on-surface text-xs font-bold uppercase py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">chat</span>
            Enviar WhatsApp Confirmación
          </button>

          <button
            onClick={() => handleSendTestNotification("whatsapp_reminder")}
            disabled={sending}
            className="bg-surface border border-outline-variant hover:border-primary text-on-surface text-xs font-bold uppercase py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-amber-700 text-[18px]">alarm</span>
            Enviar Recordatorio 24h
          </button>

          <button
            onClick={() => handleSendTestNotification("internal_sale_alert")}
            disabled={sending}
            className="bg-primary-container text-white text-xs font-bold uppercase py-3.5 px-4 rounded-xl hover:bg-primary transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            Disparar Alerta Interna
          </button>
        </div>

        {statusMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs rounded-xl font-semibold animate-fade-in-up">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}
