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
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-12 sm:py-20 px-4 sm:px-8 lg:px-16 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <span className="text-xs uppercase font-bold tracking-[0.2em] text-primary bg-primary-fixed-dim/30 px-3 py-1 rounded-full">
            Servicios B2B & Exclusivos
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-on-surface mt-3 mb-4">
            Catas Privadas & Eventos Corporativos
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Diseñamos experiencias enológicas a medida para empresas, reuniones de directorio, agasajos a clientes VIP y celebraciones privadas con la cava en exclusiva.
          </p>
        </div>

        {submitted ? (
          <div className="bg-surface border border-emerald-300 rounded-3xl p-8 sm:p-12 text-center soft-shadow animate-fade-in-up space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
              ¡Solicitud Recibida con Éxito!
            </h2>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              Gracias <strong>{companyOrName}</strong>. Nuestro equipo de hospitalidad corporativa se pondrá en contacto en menos de 24 horas con una propuesta personalizada y presupuesto detallado.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setSubmitted(false)}
                className="text-xs font-bold uppercase tracking-wider text-primary underline"
              >
                Enviar otra solicitud
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest border border-surface-variant rounded-3xl p-6 sm:p-10 soft-shadow space-y-6 animate-fade-in-up"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1.5">
                  Empresa o Nombre del Anfitrión *
                </label>
                <input
                  type="text"
                  required
                  value={companyOrName}
                  onChange={(e) => setCompanyOrName(e.target.value)}
                  placeholder="Ej: Estudio Jurídico / Familia Rossi"
                  className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1.5">
                  Tipo de Evento
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="corporate">Evento Corporativo / Directorio</option>
                  <option value="vip">Agasajo a Clientes VIP</option>
                  <option value="team_building">Team Building / Cata a Ciegas</option>
                  <option value="anniversary">Celebración Privada / Aniversario</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1.5">
                  Correo Electrónico de Contacto *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contacto@empresa.com"
                  className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1.5">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1.5">
                  Cantidad Estimada de Asistentes
                </label>
                <input
                  type="number"
                  min="4"
                  max="100"
                  value={estimatedGuests}
                  onChange={(e) => setEstimatedGuests(Number(e.target.value))}
                  className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1.5">
                  Fecha Tentativa Deseada
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs uppercase font-bold tracking-wider text-secondary">
                Servicios Adicionales Requeridos
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-surface-variant bg-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transportRequired}
                    onChange={(e) => setTransportRequired(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-on-surface">
                    Traslado privado en Van ejecutiva desde hotel / ciudad
                  </span>
                </label>

                <div className="space-y-1">
                  <select
                    value={pairingPreference}
                    onChange={(e) => setPairingPreference(e.target.value as any)}
                    className="w-full bg-surface border border-surface-variant rounded-xl p-3 text-xs font-medium focus:border-primary focus:outline-none"
                  >
                    <option value="standard">Maridaje Tradicional de Quesos & Fiambres</option>
                    <option value="premium">Menú Degustación 4 Pasos con Chef</option>
                    <option value="asado_cordillerano">Asado Criollo de Montaña & Brasas</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1.5">
                Requerimientos Específicos o Notas
              </label>
              <textarea
                rows={3}
                value={budgetNotes}
                onChange={(e) => setBudgetNotes(e.target.value)}
                placeholder="Indique si requiere botellas de autor grabadas con logo de la empresa, proyector para presentaciones, etc..."
                className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-primary transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    Enviando solicitud...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Solicitar Propuesta & Cotización
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <TerroirDivider className="my-14" />
      </main>

      <Footer />
    </div>
  );
}
