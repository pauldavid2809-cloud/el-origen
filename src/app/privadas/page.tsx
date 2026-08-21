"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerroirDivider } from "@/components/TerroirDivider";

export default function PrivateEventsPage() {
  const [companyOrName, setCompanyOrName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [estimatedGuests, setEstimatedGuests] = useState(12);
  const [preferredDate, setPreferredDate] = useState("");
  const [eventType, setEventType] = useState<"corporate" | "anniversary" | "vip" | "team_building">("corporate");
  const [pairingPreference, setPairingPreference] = useState<"standard" | "premium" | "asado_cordillerano">("premium");
  const [transportRequired, setTransportRequired] = useState(true);
  const [budgetNotes, setBudgetNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/private-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyOrName,
          contactEmail,
          contactPhone,
          estimatedGuests: Number(estimatedGuests),
          preferredDate,
          eventType,
          pairingPreference,
          transportRequired,
          budgetNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      }
    } catch {
      alert("Error al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary/10 selection:text-primary">
      <Navbar />

      <main className="flex-grow py-16 sm:py-24 px-5 sm:px-8 lg:px-12 max-w-4xl mx-auto w-full">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Servicios B2B & Exclusivos
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-on-surface tracking-tight mb-4">
            Catas Privadas & Eventos Corporativos
          </h1>

          <p className="text-[14px] sm:text-base text-on-surface-variant/80 max-w-xl mx-auto leading-relaxed">
            Diseñamos experiencias enológicas a medida para empresas, reuniones de directorio, agasajos a clientes VIP y celebraciones privadas con la cava en exclusiva.
          </p>
        </div>

        {submitted ? (
          <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
            <div className="bg-white rounded-[calc(2.5rem-0.625rem)] p-10 sm:p-14 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface">
                ¡Solicitud Recibida!
              </h2>
              <p className="text-[13px] sm:text-sm text-on-surface-variant/80 max-w-md mx-auto leading-relaxed">
                Gracias <strong>{companyOrName}</strong>. Nuestro equipo de hospitalidad corporativa se pondrá en contacto en menos de 24 horas con una propuesta personalizada.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-[12px] font-semibold text-primary underline"
                >
                  Enviar otra solicitud
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-[calc(2.5rem-0.625rem)] p-8 sm:p-12 shadow-[0_8px_32px_rgba(122,32,72,0.03)] space-y-6 animate-fade-in text-[13px]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                    Empresa o Nombre del Anfitrión *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyOrName}
                    onChange={(e) => setCompanyOrName(e.target.value)}
                    placeholder="Ej: Estudio Jurídico / Familia Rossi"
                    className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                    Tipo de Evento
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="corporate">Evento Corporativo / Directorio</option>
                    <option value="vip">Agasajo a Clientes VIP</option>
                    <option value="team_building">Team Building / Cata a Ciegas</option>
                    <option value="anniversary">Celebración Privada / Aniversario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                    Correo Electrónico de Contacto *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                    Cantidad Estimada de Asistentes
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="100"
                    value={estimatedGuests}
                    onChange={(e) => setEstimatedGuests(Number(e.target.value))}
                    className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                    Fecha Tentativa
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70">
                  Servicios Adicionales Requeridos
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-black/[0.06] bg-surface-container-low cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transportRequired}
                      onChange={(e) => setTransportRequired(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-[12px] font-medium text-on-surface">
                      Traslado privado en Van ejecutiva
                    </span>
                  </label>

                  <select
                    value={pairingPreference}
                    onChange={(e) => setPairingPreference(e.target.value as any)}
                    className="w-full bg-surface-container-low border border-black/[0.06] rounded-2xl p-3.5 text-[12px] font-medium focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="standard">Maridaje Tradicional de Quesos & Fiambres</option>
                    <option value="premium">Menú Degustación 4 Pasos con Chef</option>
                    <option value="asado_cordillerano">Asado Criollo de Montaña & Brasas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                  Requerimientos Específicos o Notas
                </label>
                <textarea
                  rows={3}
                  value={budgetNotes}
                  onChange={(e) => setBudgetNotes(e.target.value)}
                  placeholder="Indique si requiere botellas grabadas con logo corporativo, proyector para presentaciones, etc..."
                  className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-between pl-7 pr-2 py-2.5 bg-primary-container hover:bg-primary text-white text-[13px] font-semibold rounded-full transition-all duration-300 shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  <span>{loading ? "Enviando solicitud..." : "Solicitar Cotización y Propuesta"}</span>
                  <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        <TerroirDivider className="my-20" />
      </main>

      <Footer />
    </div>
  );
}
