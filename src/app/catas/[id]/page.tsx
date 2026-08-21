"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerroirDivider } from "@/components/TerroirDivider";
import { Tasting, AddOn } from "@/types";

export default function TastingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tastingId = params?.id as string;

  const [tasting, setTasting] = useState<Tasting | null>(null);
  const [addOnsList, setAddOnsList] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [spotsCount, setSpotsCount] = useState<number>(2);
  const [selectedAddOns, setSelectedAddOns] = useState<{ [id: string]: number }>({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "bank_transfer">("stripe");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/tastings");
        const data = await res.json();
        if (data.success) {
          const found = data.tastings.find(
            (t: Tasting) => t.id === tastingId || t.slug === tastingId
          );
          setTasting(found || data.tastings[0]);
        }

        const defaultAddOns: AddOn[] = [
          {
            id: "coleccion-bottle",
            title: "Botella de Colección para Llevar",
            description: "Botella seleccionada por el sommelier para disfrutar en casa.",
            price: 35,
            priceFormatted: "$35 USD",
            icon: "wine_bar",
            category: "bottle",
          },
          {
            id: "copas-cristal-set",
            title: "Set de 2 Copas de Cristal El Origen",
            description: "Copas de cata profesional en estuche conmemorativo.",
            price: 25,
            priceFormatted: "$25 USD",
            icon: "award_star",
            category: "experience",
          },
          {
            id: "pairing-premium",
            title: "Maridaje Extra de Quesos Sowi",
            description: "Tabla de autor con quesos madurados Sowi, jamón serrano y panes artesanales.",
            price: 20,
            priceFormatted: "$20 USD",
            icon: "restaurant",
            category: "pairing",
          },
        ];
        setAddOnsList(defaultAddOns);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    if (tastingId) loadData();
  }, [tastingId]);

  if (loading || !tasting) {
    return (
      <div className="bg-background min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-24 text-on-surface-variant/60 text-xs">
          <span className="material-symbols-outlined animate-spin text-xl mr-2">progress_activity</span>
          Cargando experiencia...
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate pricing
  const tastingBaseTotal = tasting.price * spotsCount;
  let addOnsTotal = 0;
  Object.entries(selectedAddOns).forEach(([id, qty]) => {
    const found = addOnsList.find((a) => a.id === id);
    if (found && qty > 0) {
      addOnsTotal += found.price * qty;
    }
  });
  const subtotal = tastingBaseTotal + addOnsTotal;
  const discountAmount = Math.round((subtotal * appliedDiscount) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) => {
      const current = prev[id] || 0;
      return {
        ...prev,
        [id]: current > 0 ? 0 : 1,
      };
    });
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(couponCode.trim())}`);
      const data = await res.json();
      if (data.success && data.coupon) {
        setAppliedDiscount(data.coupon.discountPercent || 10);
        setCouponMessage({
          text: `¡Cupón "${data.coupon.code}" aplicado! -${data.coupon.discountPercent}%`,
          type: "success",
        });
      } else {
        setAppliedDiscount(0);
        setCouponMessage({
          text: "Cupón inválido o expirado.",
          type: "error",
        });
      }
    } catch {
      setCouponMessage({ text: "Error al validar el cupón.", type: "error" });
    }
  };

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) {
      alert("Por favor complete su nombre, correo y WhatsApp para generar su ticket.");
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const resolvedAddOns = Object.entries(selectedAddOns)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ id, quantity: qty }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tastingId: tasting.id,
          customerName,
          customerEmail,
          customerPhone,
          spotsCount,
          dietaryRestrictions,
          selectedAddOns: resolvedAddOns,
          couponCode: appliedDiscount > 0 ? couponCode : undefined,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(data.redirectUrl);
      } else {
        alert(data.message || "No se pudo procesar la reserva.");
      }
    } catch {
      alert("Error de conexión al procesar la reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary/10 selection:text-primary">
      <Navbar />

      <main className="flex-grow py-12 sm:py-20 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-[12px] font-medium text-on-surface-variant/60">
          <Link href="/" className="hover:text-primary transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/catas" className="hover:text-primary transition-colors">
            Catas
          </Link>
          <span>/</span>
          <span className="text-primary font-semibold">{tasting.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
          {/* LEFT COLUMN: Details */}
          <div className="lg:col-span-7 space-y-10">
            {/* Main Header in Double-Bezel Frame */}
            <div className="p-2 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
              <div className="relative rounded-[calc(2.5rem-0.5rem)] overflow-hidden aspect-[16/10] w-full bg-surface-container">
                <Image
                  src={tasting.imageUrl}
                  alt={tasting.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute top-5 left-5 bg-primary-container/90 text-white text-[11px] font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm shadow-sm">
                  {tasting.dateDisplay}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06]">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Experiencia Guiada en Bodega
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-on-surface tracking-tight">
                {tasting.title}
              </h1>

              <p className="text-[14px] sm:text-base text-on-surface-variant/80 leading-relaxed font-normal">
                {tasting.description}
              </p>
            </div>

            {/* Quick Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-black/[0.05] soft-shadow text-[13px]">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-wider block">Fecha</span>
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[17px]">calendar_today</span>
                  {tasting.dateFull || tasting.dateDisplay}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-wider block">Horario</span>
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[17px]">schedule</span>
                  {tasting.timeStart} - {tasting.timeEnd}
                </span>
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-wider block">Ubicación</span>
                <span className="font-semibold text-on-surface flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-primary text-[17px]">location_on</span>
                  Caracas, Venezuela
                </span>
              </div>
            </div>

            {/* Featured Wines */}
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">wine_bar</span>
                Vinos en la Degustación
              </h3>
              <div className="space-y-3">
                {tasting.wines.map((wine, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-black/[0.05] soft-shadow flex flex-col sm:flex-row justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-serif font-semibold text-base text-primary">{wine.name}</span>
                        <span className="text-[11px] bg-black/[0.04] text-primary px-2.5 py-0.5 rounded-full font-medium">
                          Añada {wine.vintage}
                        </span>
                      </div>
                      <p className="text-[13px] text-on-surface-variant/80">{wine.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {wine.aromaProfile.map((a) => (
                          <span key={a} className="text-[11px] bg-surface-container px-2.5 py-1 rounded-full text-on-surface-variant/80">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pairings */}
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">restaurant</span>
                Maridaje Artesanal Incluido
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-on-surface-variant/80">
                {tasting.pairings.map((p, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 bg-white p-4 rounded-xl border border-black/[0.05] soft-shadow">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sommelier Info in Double-Bezel */}
            <div className="p-1.5 rounded-2xl bg-black/[0.02] border border-black/[0.05]">
              <div className="bg-white p-5 rounded-xl flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border border-outline-variant/50 flex-shrink-0">
                  <Image
                    src={tasting.sommelier.avatarUrl}
                    alt={tasting.sommelier.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                    Tu Anfitrión Sommelier
                  </span>
                  <h4 className="font-serif text-base font-semibold text-on-surface">{tasting.sommelier.name}</h4>
                  <p className="text-[12px] text-on-surface-variant/70">{tasting.sommelier.bio}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 3-Step Checkout in Double-Bezel Card */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="p-2 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
              <div className="bg-white rounded-[calc(2.5rem-0.5rem)] p-6 sm:p-8 shadow-[0_8px_32px_rgba(122,32,72,0.04)]">
                <div className="flex justify-between items-center border-b border-black/[0.05] pb-5 mb-6">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60">
                      Reserva Inmediata
                    </span>
                    <h3 className="font-serif text-2xl font-semibold text-on-surface">Comprar Cupos</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-on-surface-variant/60 font-medium block">Por persona</span>
                    <span className="font-serif text-2xl font-semibold text-primary">{tasting.priceFormatted}</span>
                  </div>
                </div>

                {/* Step Navigator */}
                <div className="flex items-center justify-between gap-1 mb-6 bg-surface-container/60 p-1 rounded-full text-[12px] font-medium">
                  {[
                    { num: 1, label: "1. Cupos" },
                    { num: 2, label: "2. Datos" },
                    { num: 3, label: "3. Pago" },
                  ].map((s) => (
                    <button
                      key={s.num}
                      onClick={() => setStep(s.num as 1 | 2 | 3)}
                      className={`flex-1 py-1.5 rounded-full text-center transition-all duration-300 ${
                        step === s.num
                          ? "bg-primary-container text-white shadow-sm font-semibold"
                          : "text-on-surface-variant/70 hover:text-on-surface"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* STEP 1: SPOTS & ADD-ONS */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-2">
                        Cantidad de cupos
                      </label>
                      <div className="flex items-center justify-between bg-surface-container-low border border-black/[0.05] rounded-2xl p-3.5">
                        <span className="text-[13px] font-semibold text-on-surface">
                          {spotsCount} {spotsCount === 1 ? "Persona" : "Personas"}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSpotsCount(Math.max(1, spotsCount - 1))}
                            className="w-8 h-8 rounded-full bg-white text-primary font-bold text-base hover:bg-black/[0.04] flex items-center justify-center transition-colors shadow-sm active:scale-95"
                          >
                            -
                          </button>
                          <span className="font-serif font-semibold text-lg text-primary min-w-[20px] text-center">
                            {spotsCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSpotsCount(Math.min(tasting.availableSpots, spotsCount + 1))}
                            className="w-8 h-8 rounded-full bg-white text-primary font-bold text-base hover:bg-black/[0.04] flex items-center justify-center transition-colors shadow-sm active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-on-surface-variant/60 mt-2">
                        Disponibles: <strong className="text-primary">{tasting.availableSpots} cupos</strong> para esta fecha.
                      </p>
                    </div>

                    {/* Add-ons (Up-selling) */}
                    <div className="space-y-3 pt-2 border-t border-black/[0.05]">
                      <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70">
                        Mejora tu experiencia (Opcional)
                      </label>
                      {addOnsList.map((addon) => {
                        const isChecked = (selectedAddOns[addon.id] || 0) > 0;
                        return (
                          <div
                            key={addon.id}
                            onClick={() => toggleAddOn(addon.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 flex items-start gap-3 ${
                              isChecked
                                ? "bg-primary-fixed/20 border-primary/40"
                                : "bg-white border-black/[0.05] hover:border-black/[0.12]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                            />
                            <div className="flex-grow text-[12px]">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-on-surface">{addon.title}</span>
                                <span className="font-serif font-semibold text-primary">{addon.priceFormatted}</span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant/70 mt-0.5">{addon.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="group w-full flex items-center justify-between pl-6 pr-2 py-2 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold rounded-full transition-all duration-300 shadow-sm active:scale-[0.98]"
                    >
                      <span>Continuar con tus datos</span>
                      <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </span>
                    </button>
                  </div>
                )}

                {/* STEP 2: GUEST DETAILS */}
                {step === 2 && (
                  <div className="space-y-4 animate-fade-in text-[13px]">
                    <div>
                      <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ej: Laura Rossi"
                        className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-[13px] text-on-surface focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1">
                        Correo electrónico * (para ticket QR)
                      </label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="nombre@ejemplo.com"
                        className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-[13px] text-on-surface focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1">
                        WhatsApp / Teléfono *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+58 414 123-4567"
                        className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-[13px] text-on-surface focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1">
                        Restricciones dietéticas o alergias
                      </label>
                      <input
                        type="text"
                        value={dietaryRestrictions}
                        onChange={(e) => setDietaryRestrictions(e.target.value)}
                        placeholder="Ej: Menú Vegetariano, Celíaco / Sin TACC, sin frutos secos..."
                        className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-[13px] text-on-surface focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[12px] font-semibold text-on-surface-variant/70 hover:text-on-surface py-3 px-5 rounded-full hover:bg-black/[0.03] transition-colors"
                      >
                        Volver
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!customerName || !customerEmail || !customerPhone) {
                            alert("Por favor complete los campos obligatorios (*)");
                            return;
                          }
                          setStep(3);
                        }}
                        className="group flex-1 flex items-center justify-between pl-6 pr-2 py-2 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold rounded-full transition-all duration-300 shadow-sm active:scale-[0.98]"
                      >
                        <span>Ir a Método de Pago</span>
                        <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: COUPON & PAYMENT */}
                {step === 3 && (
                  <form onSubmit={handleSubmitReservation} className="space-y-6 animate-fade-in text-[13px]">
                    {/* Coupon */}
                    <div>
                      <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                        Cupón de descuento
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Ej: ORIGEN10 o VIP2026"
                          className="flex-grow bg-surface-container-low border border-black/[0.06] rounded-xl px-3 py-2 text-[12px] uppercase font-mono text-on-surface focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="bg-white border border-primary text-primary text-[11px] font-semibold uppercase px-4 py-2 rounded-xl hover:bg-primary-fixed/20 transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                      {couponMessage && (
                        <p
                          className={`text-[11px] mt-1.5 font-medium ${
                            couponMessage.type === "success" ? "text-emerald-700" : "text-error"
                          }`}
                        >
                          {couponMessage.text}
                        </p>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70">
                        Forma de pago
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("stripe")}
                          className={`p-3.5 rounded-2xl border text-left text-[12px] font-medium flex flex-col gap-1 transition-all ${
                            paymentMethod === "stripe"
                              ? "border-primary bg-primary-fixed/20"
                              : "border-black/[0.06] bg-white hover:border-black/[0.15]"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-semibold text-primary">
                            <span className="material-symbols-outlined text-[16px]">credit_card</span>
                            Tarjeta (Stripe / Apple Pay)
                          </span>
                          <span className="text-[10px] text-on-surface-variant/60">Moneda internacional (USD)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod("bank_transfer")}
                          className={`p-3.5 rounded-2xl border text-left text-[12px] font-medium flex flex-col gap-1 transition-all ${
                            paymentMethod === "bank_transfer"
                              ? "border-primary bg-primary-fixed/20"
                              : "border-black/[0.06] bg-white hover:border-black/[0.15]"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-semibold text-on-surface">
                            <span className="material-symbols-outlined text-[16px]">account_balance</span>
                            Zelle / Pago Móvil
                          </span>
                          <span className="text-[10px] text-on-surface-variant/60">Tasa oficial BCV</span>
                        </button>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-surface-container-low p-4 rounded-2xl border border-black/[0.05] space-y-2 text-[12px]">
                      <div className="flex justify-between text-on-surface-variant/70">
                        <span>Catas ({spotsCount} x {tasting.priceFormatted}):</span>
                        <span>${tastingBaseTotal} USD</span>
                      </div>
                      {addOnsTotal > 0 && (
                        <div className="flex justify-between text-on-surface-variant/70">
                          <span>Experiencias adicionales:</span>
                          <span>+${addOnsTotal} USD</span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Descuento aplicado:</span>
                          <span>-${discountAmount} USD</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-black/[0.08] flex justify-between font-bold text-on-surface text-[14px]">
                        <span>Total Final:</span>
                        <span className="text-primary font-serif text-lg">${grandTotal} USD</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-[12px] font-semibold text-on-surface-variant/70 hover:text-on-surface py-3 px-5 rounded-full hover:bg-black/[0.03] transition-colors"
                      >
                        Volver
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold py-3.5 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                            Confirmando...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">lock</span>
                            Confirmar y Pagar
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        <TerroirDivider className="my-20" />
      </main>

      <Footer />
    </div>
  );
}
