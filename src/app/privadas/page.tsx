"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";

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

  const included = [
    { icon: "wine_bar", title: "Sommelier dedicado", text: "Guía la velada y adapta la selección al perfil de sus invitados." },
    { icon: "restaurant", title: "Maridaje de autor", text: "Con nuestros aliados gastronómicos de Caracas." },
    { icon: "inventory_2", title: "Llave en mano", text: "Cristalería, montaje, fichas de cata y co-branding opcional." },
    { icon: "groups", title: "De 4 a 100 personas", text: "Directorios, clientes VIP, equipos y celebraciones." },
  ];

  const field =
    "w-full h-12 bg-surface-container-lowest border border-outline-variant rounded px-3.5 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:outline-none transition-colors";
  const labelCls = "block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2";

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <PageHeader
          eyebrow="Servicios B2B & exclusivos"
          title={<>Catas privadas & <em className="italic font-normal text-primary-container">eventos corporativos</em></>}
          subtitle="Diseñamos experiencias enológicas a medida para empresas, reuniones de directorio, agasajos a clientes VIP y celebraciones privadas."
        />

        <div className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-10 sm:pt-14 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <aside className="lg:col-span-4">
            <p className="eyebrow mb-6">Qué incluye</p>
            <ul className="border-t border-outline-variant">
              {included.map((it) => (
                <li key={it.title} className="flex gap-4 py-5 border-b border-outline-variant">
                  <span className="material-symbols-outlined text-primary-container text-[22px] mt-0.5">{it.icon}</span>
                  <span>
                    <span className="block font-serif text-lg text-on-surface">{it.title}</span>
                    <span className="block text-[14px] text-on-surface-variant leading-relaxed mt-0.5">{it.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="https://wa.me/584141074007?text=Hola%20El%20Origen,%20quisiera%20cotizar%20una%20cata%20privada"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-primary-container"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              ¿Prefiere conversarlo? Escríbanos por WhatsApp
            </a>
          </aside>

          <div className="lg:col-span-8">
        {submitted ? (
          <div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-10 sm:p-14 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <h2 className="font-serif text-3xl text-on-surface">
                ¡Solicitud Recibida!
              </h2>
              <p className="text-[13px] sm:text-sm text-on-surface-variant/80 max-w-md mx-auto leading-relaxed">
                Gracias <strong>{companyOrName}</strong>. Nuestro equipo de hospitalidad corporativa se pondrá en contacto en menos de 24 horas con una propuesta personalizada.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-[14px] font-semibold text-primary-container underline underline-offset-4"
                >
                  Enviar otra solicitud
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <form
              onSubmit={handleSubmit}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-10 space-y-7 animate-fade-in"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
                <div>
                  <label className={labelCls}>
                    Empresa o Nombre del Anfitrión *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyOrName}
                    onChange={(e) => setCompanyOrName(e.target.value)}
                    placeholder="Ej: Estudio Jurídico / Familia Rossi"
                    className={field}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Tipo de Evento
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className={field}
                  >
                    <option value="corporate">Evento Corporativo / Directorio</option>
                    <option value="vip">Agasajo a Clientes VIP</option>
                    <option value="team_building">Team Building / Cata a Ciegas</option>
                    <option value="anniversary">Celebración Privada / Aniversario</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>
                    Correo Electrónico de Contacto *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contacto@empresa.com"
                    className={field}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+58 414 123-4567"
                    className={field}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Cantidad Estimada de Asistentes
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="100"
                    value={estimatedGuests}
                    onChange={(e) => setEstimatedGuests(Number(e.target.value))}
                    className={field}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Fecha Tentativa
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className={field}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className={labelCls}>
                  Servicios Adicionales Requeridos
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 h-12 px-3.5 rounded border border-outline-variant bg-surface-container-lowest cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transportRequired}
                      onChange={(e) => setTransportRequired(e.target.checked)}
                      className="h-4 w-4 accent-[#7D2A46]"
                    />
                    <span className="text-[14px] text-on-surface">
                      Servicio de traslado privado en Caracas
                    </span>
                  </label>

                  <select
                    value={pairingPreference}
                    onChange={(e) => setPairingPreference(e.target.value as any)}
                    className={field}
                  >
                    <option value="standard">Maridaje de Quesos Sowi & Charcutería</option>
                    <option value="premium">Menú Degustación con Maratea Trattoria</option>
                    <option value="asado_cordillerano">Experiencia de Alta Cocina & Vinos Gran Reserva</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Requerimientos Específicos o Notas
                </label>
                <textarea
                  rows={4}
                  value={budgetNotes}
                  onChange={(e) => setBudgetNotes(e.target.value)}
                  placeholder="Indique si requiere botellas grabadas con logo corporativo, proyector para presentaciones, etc..."
                  className={`${field} h-auto py-3`}
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 h-14 bg-primary-container hover:bg-primary text-white text-[15px] font-semibold rounded transition-colors disabled:opacity-50"
                >
                  {loading ? "Enviando solicitud..." : "Solicitar cotización y propuesta"}
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </form>
          </div>
        )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
