"use client";

import React, { useState, useEffect } from "react";
import { PrivateEventInquiry } from "@/types";

export default function AdminPrivadasPage() {
  const [inquiries, setInquiries] = useState<PrivateEventInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial mock inquiries
    setInquiries([
      {
        id: "inq-1",
        companyOrName: "Estudio Jurídico & Asociados",
        contactEmail: "eventos@estudiojuridico.com",
        contactPhone: "+54 9 11 4455-8899",
        estimatedGuests: 18,
        preferredDate: "2026-11-20",
        eventType: "corporate",
        pairingPreference: "asado_cordillerano",
        transportRequired: true,
        budgetNotes: "Requerimos sommelier bilingüe y 2 cajas de regalo grabadas.",
        status: "new",
        createdAt: "Hoy, 09:30 hs",
      },
      {
        id: "inq-2",
        companyOrName: "Tech Summit Mendoza",
        contactEmail: "speakers@techsummit.io",
        contactPhone: "+54 9 261 778-9900",
        estimatedGuests: 35,
        preferredDate: "2026-12-05",
        eventType: "vip",
        pairingPreference: "premium",
        transportRequired: true,
        budgetNotes: "Cata de cierre exclusiva para oradores internacionales.",
        status: "quoted",
        createdAt: "Ayer",
      },
    ]);
    setLoading(false);
  }, []);

  const handleStatusChange = (id: string, newStatus: PrivateEventInquiry["status"]) => {
    setInquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
      <header className="border-b border-surface-variant pb-6">
        <p className="text-xs uppercase font-bold tracking-[0.2em] text-secondary mb-1">
          B2B & Alianzas Corporativas
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
          Solicitudes de Catas Privadas
        </h2>
      </header>

      <div className="space-y-4">
        {inquiries.map((inq) => (
          <div
            key={inq.id}
            className="bg-surface rounded-2xl border border-surface-variant p-6 soft-shadow space-y-4 text-xs"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-surface-variant pb-3">
              <div>
                <span className="font-serif text-lg font-bold text-on-surface">{inq.companyOrName}</span>
                <span className="ml-2 text-secondary font-mono">{inq.contactEmail} • {inq.contactPhone}</span>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] ${
                    inq.status === "new"
                      ? "bg-blue-100 text-blue-900"
                      : inq.status === "quoted"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {inq.status === "new" ? "Nueva Solicitud" : inq.status === "quoted" ? "Cotizada" : "Confirmada"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-on-surface">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary block">Fecha Tentativa</span>
                <span className="font-semibold">{inq.preferredDate}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary block">Invitados</span>
                <span className="font-semibold">{inq.estimatedGuests} personas</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary block">Tipo de Menú</span>
                <span className="font-semibold capitalize">{inq.pairingPreference.replace("_", " ")}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary block">Traslado Requerido</span>
                <span className="font-semibold">{inq.transportRequired ? "Sí (Van Ejecutiva)" : "No"}</span>
              </div>
            </div>

            {inq.budgetNotes && (
              <div className="p-3 bg-surface-container-low rounded-xl border border-surface-variant text-on-surface-variant italic">
                "{inq.budgetNotes}"
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-surface-variant">
              <span className="text-secondary text-[11px]">Recibido: {inq.createdAt}</span>
              <div className="flex gap-2">
                <a
                  href={`mailto:${inq.contactEmail}?subject=Propuesta%20Cata%20Privada%20El%20Origen`}
                  className="bg-primary-container text-white px-4 py-2 rounded-xl font-bold uppercase hover:bg-primary transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">mail</span>
                  Enviar Presupuesto
                </a>
                <button
                  onClick={() => handleStatusChange(inq.id, "confirmed")}
                  className="bg-surface border border-emerald-600 text-emerald-800 px-3 py-2 rounded-xl font-bold uppercase hover:bg-emerald-50 transition-all"
                >
                  ✓ Confirmar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
