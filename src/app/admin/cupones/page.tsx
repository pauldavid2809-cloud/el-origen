"use client";

import React, { useState, useEffect } from "react";
import { Coupon } from "@/types";

export default function AdminCuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(15);
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadCoupons() {
      try {
        const res = await fetch("/api/coupons");
        const data = await res.json();
        if (data.success) {
          setCoupons(data.coupons);
        }
      } catch {
        // ignore
      }
    }
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountPercent: Number(discountPercent),
          description,
          active: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCoupons([...coupons, data.coupon]);
        setCode("");
        setDescription("");
      }
    } catch {
      alert("Error al crear cupón.");
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      <header className="border-b border-surface-variant pb-6">
        <p className="text-xs uppercase font-bold tracking-[0.2em] text-secondary mb-1">
          Marketing & Fidelización
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
          Cupones de Descuento
        </h2>
      </header>

      {/* Create Coupon Card */}
      <div className="bg-surface rounded-2xl border border-surface-variant p-6 soft-shadow">
        <h3 className="font-serif text-lg font-bold text-on-surface mb-4">Crear Nuevo Cupón</h3>
        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block uppercase font-bold text-secondary mb-1">Código Promocional</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: MENDOZA25"
              className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 uppercase font-mono font-bold text-primary focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block uppercase font-bold text-secondary mb-1">Descuento (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 font-bold text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block uppercase font-bold text-secondary mb-1">Descripción / Destinatario</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Invitación especial socios Sommelier Club"
                className="flex-grow bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary-container text-white font-bold uppercase px-5 py-3 rounded-xl hover:bg-primary transition-all shadow-sm"
              >
                Crear
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Active Coupons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.code} className="bg-surface rounded-xl border border-surface-variant p-5 soft-shadow space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-base text-primary bg-primary-fixed-dim/30 px-2.5 py-1 rounded">
                {c.code}
              </span>
              <span className="font-serif font-bold text-lg text-emerald-800">
                -{c.discountPercent}%
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">{c.description}</p>
            <div className="pt-2 flex justify-between items-center text-[10px] text-secondary border-t border-surface-variant">
              <span>Estado: <strong className="text-emerald-700">Activo</strong></span>
              <span>Canjeable en checkout</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
