"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TerroirDivider } from "@/components/TerroirDivider";
import { QRScannerModal } from "@/components/QRScannerModal";
import { Tasting, Reservation } from "@/types";

export default function AdminDashboardPage() {
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tRes, rRes] = await Promise.all([
          fetch("/api/tastings"),
          fetch("/api/verify?all=true").catch(() => null),
        ]);
        const tData = await tRes.json();
        if (tData.success) {
          setTastings(tData.tastings);
        }

        // Mock reservations if api not returning all
        setReservations([
          {
            id: "res-1",
            token: "tok-carlos-mendoza-8492",
            code: "#EO-8492A",
            tastingId: "tasting-malbec-reserva",
            tastingTitle: "Cata Malbec Reserva",
            tastingDate: "24 OCT",
            tastingTime: "18:00",
            customerName: "Carlos Mendoza",
            customerEmail: "carlos@ejemplo.com",
            customerPhone: "+54 9 261 455-8822",
            spotsCount: 2,
            selectedAddOns: [],
            subtotal: 90000,
            discountAmount: 0,
            totalAmount: 90000,
            paymentMethod: "stripe",
            paymentStatus: "paid",
            checkinStatus: "checked_in",
            createdAt: "Hace 2 horas",
          },
          {
            id: "res-2",
            token: "tok-lucia-ferreyra-7193",
            code: "#EO-7193B",
            tastingId: "tasting-atardecer-vinedo",
            tastingTitle: "Atardecer en el Viñedo",
            tastingDate: "28 OCT",
            tastingTime: "17:30",
            customerName: "Lucía Ferreyra",
            customerEmail: "lucia@ejemplo.com",
            customerPhone: "+54 9 11 3499-1122",
            spotsCount: 2,
            selectedAddOns: [],
            subtotal: 70000,
            discountAmount: 0,
            totalAmount: 70000,
            paymentMethod: "stripe",
            paymentStatus: "paid",
            checkinStatus: "checked_in",
            createdAt: "Hoy, 10:30",
          },
          {
            id: "res-3",
            token: "tok-martin-rossi-6204",
            code: "#EO-6204C",
            tastingId: "tasting-blancos-altura",
            tastingTitle: "Blancos de Altura",
            tastingDate: "02 NOV",
            tastingTime: "11:00",
            customerName: "Martín Rossi",
            customerEmail: "martin@ejemplo.com",
            customerPhone: "+54 9 261 887-1234",
            spotsCount: 1,
            selectedAddOns: [],
            subtotal: 40000,
            discountAmount: 0,
            totalAmount: 40000,
            paymentMethod: "bank_transfer",
            paymentStatus: "pending_transfer",
            checkinStatus: "pending",
            createdAt: "Ayer",
          },
          {
            id: "res-4",
            token: "tok-ana-gimenez-5109",
            code: "#EO-5109D",
            tastingId: "tasting-malbec-reserva",
            tastingTitle: "Cata Malbec Reserva",
            tastingDate: "24 OCT",
            tastingTime: "18:00",
            customerName: "Ana P. Giménez",
            customerEmail: "ana.g@ejemplo.com",
            customerPhone: "+54 9 261 990-4411",
            spotsCount: 2,
            selectedAddOns: [],
            subtotal: 90000,
            discountAmount: 0,
            totalAmount: 90000,
            paymentMethod: "stripe",
            paymentStatus: "paid",
            checkinStatus: "pending",
            createdAt: "Ayer",
          },
        ]);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalSpotsSold = 124;
  const totalRevenue = "$4.500.000";

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-surface-variant pb-6">
        <div>
          <p className="text-xs uppercase font-bold tracking-[0.2em] text-secondary mb-1">
            Resumen Mensual
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
            Panorama General
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            Escanear QR Puerta
          </button>
          <Link
            href="/admin/catas"
            className="flex items-center gap-2 px-4 py-2.5 bg-surface text-primary border border-outline-variant rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-variant transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nueva Cata
          </Link>
        </div>
      </header>

      {/* 3 Metric Cards (Stitch panel_de_control_admin) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Card 1: Total Spots Sold */}
        <div className="lg:col-span-4 bg-surface rounded-2xl p-6 border border-surface-variant soft-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 text-secondary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-primary text-base">confirmation_number</span>
              <h3>Total Cupos Vendidos</h3>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-4xl sm:text-5xl font-bold text-primary">
                {totalSpotsSold}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">trending_up</span> +12%
              </span>
            </div>
            <p className="text-xs text-secondary mt-2">Mes actual (Noviembre 2026)</p>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="lg:col-span-4 bg-surface rounded-2xl p-6 border border-surface-variant soft-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 text-secondary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-tertiary-container text-base">payments</span>
              <h3>Ingresos del Mes</h3>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-4xl sm:text-5xl font-bold text-on-surface">
                {totalRevenue}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">trending_up</span> +8%
              </span>
            </div>
            <p className="text-xs text-secondary mt-2">Ingresos netos estimados de catas</p>
          </div>
        </div>

        {/* Card 3: Harvest / Cellar Status Card */}
        <div className="lg:col-span-4 rounded-2xl overflow-hidden relative soft-shadow min-h-[160px] flex flex-col justify-end p-6 text-white group">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=800&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/60 to-transparent" />
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-0.5">
              Estado de Bodega
            </span>
            <h3 className="font-serif text-xl font-bold">Cosecha & Cava 2026</h3>
            <p className="text-xs opacity-90 mt-0.5">Cavas subterráneas al 85% de capacidad.</p>
          </div>
        </div>
      </div>

      <TerroirDivider />

      {/* Next Row: Upcoming Tastings Progress & Recent Attendees Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Próximas Catas & Occupancy Progress */}
        <div className="lg:col-span-5 bg-surface rounded-2xl p-6 border border-surface-variant soft-shadow space-y-6">
          <div className="flex justify-between items-center border-b border-surface-variant pb-3">
            <h3 className="font-serif text-lg font-bold text-on-surface">Próximas Catas</h3>
            <Link href="/admin/catas" className="text-xs font-bold uppercase text-primary hover:underline">
              Ver todas
            </Link>
          </div>

          <div className="space-y-5">
            {tastings.slice(0, 3).map((t, idx) => {
              const occupied = t.totalSpots - t.availableSpots;
              const percent = Math.round((occupied / t.totalSpots) * 100);
              const isFull = t.availableSpots <= 0;

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface truncate max-w-[200px]">{t.title}</span>
                    <span className="text-secondary">{t.dateDisplay}, {t.timeStart} hs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? "bg-primary" : percent > 70 ? "bg-primary" : "bg-primary/50"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-primary min-w-[45px] text-right">
                      {isFull ? "Completo" : `${occupied}/${t.totalSpots}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Attendees Table */}
        <div className="lg:col-span-7 bg-surface rounded-2xl border border-surface-variant soft-shadow overflow-hidden flex flex-col">
          <div className="p-6 border-b border-surface-variant flex justify-between items-center bg-surface-container-lowest">
            <div>
              <h3 className="font-serif text-lg font-bold text-on-surface">
                Lista de Asistentes Recientes
              </h3>
              <p className="text-xs text-secondary">Últimas reservas registradas</p>
            </div>
            <Link
              href="/admin/reservas"
              className="text-xs font-bold uppercase text-primary hover:underline"
            >
              Ver todas las reservas
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant">
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-secondary">Nombre</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-secondary">Evento</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-secondary">Fecha Compra</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-secondary">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-5 py-3.5 font-bold text-on-surface">
                      {r.customerName}
                      <span className="block text-[10px] text-secondary font-normal">{r.spotsCount} personas ({r.code})</span>
                    </td>
                    <td className="px-5 py-3.5 text-secondary">{r.tastingTitle}</td>
                    <td className="px-5 py-3.5 text-secondary">{r.createdAt}</td>
                    <td className="px-5 py-3.5">
                      {r.checkinStatus === "checked_in" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ Check-in
                        </span>
                      ) : r.paymentStatus === "paid" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          Confirmado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Pendiente Transf.
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCheckInSuccess={(res) => {
          alert(`Check-in confirmado para ${res.customerName} (${res.tastingTitle})`);
        }}
      />
    </div>
  );
}
