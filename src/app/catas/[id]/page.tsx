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

  // Checkout form state
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

        // Add-ons list
        const defaultAddOns: AddOn[] = [
          {
            id: "gran-reserva-bottle",
            title: "Botella Malbec Gran Reserva 2020",
            description: "Botella numerada de colección firmada por el enólogo jefe para llevar a casa.",
            price: 28000,
            priceFormatted: "$28.000",
            icon: "wine_bar",
            category: "bottle",
          },
          {
            id: "private-transfer",
            title: "Traslado Privado Ida y Vuelta",
            description: "Chofer privado desde tu hotel o centro de la ciudad hasta la bodega en van ejecutiva.",
            price: 18000,
            priceFormatted: "$18.000",
            icon: "directions_car",
            category: "transport",
          },
          {
            id: "pairing-premium",
            title: "Maridaje de Quesos Madurados & Embutidos",
            description: "Tabla de autor con quesos de cabra curados, jamón serrano y panes de masa madre.",
            price: 12000,
            priceFormatted: "$12.000",
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
        <div className="flex-grow flex items-center justify-center py-24 text-secondary">
          <span className="material-symbols-outlined animate-spin text-2xl mr-2">progress_activity</span>
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
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-10 sm:py-16 px-4 sm:px-8 lg:px-16 max-w-container-max mx-auto w-full">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-secondary font-semibold">
          <Link href="/" className="hover:text-primary transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/catas" className="hover:text-primary transition-colors">
            Catas
          </Link>
          <span>/</span>
          <span className="text-primary font-bold">{tasting.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-start">
          {/* LEFT COLUMN: Tasting Full Details */}
          <div className="lg:col-span-7 space-y-8">
            {/* Main Header & Image */}
            <div className="relative rounded-2xl overflow-hidden soft-shadow bg-surface-container aspect-[16/9]">
              <Image
                src={tasting.imageUrl}
                alt={tasting.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-4 left-4 bg-primary-container text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md">
                {tasting.dateDisplay}
              </div>
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-primary">
                Experiencia Guiada en Bodega
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface mt-2 mb-3">
                {tasting.title}
              </h1>
              <p className="text-sm text-secondary italic mb-4">{tasting.subtitle}</p>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed font-normal">
                {tasting.description}
              </p>
            </div>

            {/* Quick Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-surface p-5 rounded-2xl border border-surface-variant text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block">Fecha</span>
                <span className="font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[16px]">calendar_today</span>
                  {tasting.dateFull || tasting.dateDisplay}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block">Horario</span>
                <span className="font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                  {tasting.timeStart} - {tasting.timeEnd}
                </span>
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block">Ubicación</span>
                <span className="font-bold text-on-surface flex items-center gap-1 truncate">
                  <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
                  Valle de Uco, Mendoza
                </span>
              </div>
            </div>

            {/* Featured Wines */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">wine_bar</span>
                Vinos en la Degustación
              </h3>
              <div className="space-y-3">
                {tasting.wines.map((wine, idx) => (
                  <div
                    key={idx}
                    className="bg-surface p-4 rounded-xl border border-surface-variant flex flex-col sm:flex-row justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-primary">{wine.name}</span>
                        <span className="text-[11px] bg-primary-fixed-dim/30 text-primary px-2 py-0.5 rounded font-semibold">
                          Añada {wine.vintage}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">{wine.description}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {wine.aromaProfile.map((a) => (
                          <span key={a} className="text-[10px] bg-surface-container px-2 py-0.5 rounded text-secondary">
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
            <div className="space-y-3">
              <h3 className="font-serif text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">restaurant</span>
                Maridaje Artesanal Incluido
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface-variant">
                {tasting.pairings.map((p, idx) => (
                  <li key={idx} className="flex items-center gap-2 bg-surface p-3 rounded-lg border border-surface-variant">
                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sommelier Info */}
            <div className="bg-surface p-5 rounded-2xl border border-surface-variant flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-primary shadow-sm flex-shrink-0">
                <Image
                  src={tasting.sommelier.avatarUrl}
                  alt={tasting.sommelier.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Tu Sommelier Anfitrión
                </span>
                <h4 className="font-serif text-base font-bold text-on-surface">{tasting.sommelier.name}</h4>
                <p className="text-xs text-secondary">{tasting.sommelier.bio}</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive 3-Step Checkout Form */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-6 sm:p-8 soft-shadow">
              <div className="flex justify-between items-center border-b border-surface-variant pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                    Reserva Online Inmediata
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-on-surface">Comprar Cupos</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-secondary uppercase font-bold block">Por persona</span>
                  <span className="font-serif text-2xl font-bold text-primary">{tasting.priceFormatted}</span>
                </div>
              </div>

              {/* Step Navigator */}
              <div className="flex items-center justify-between gap-1 mb-6 bg-surface-container-low p-1.5 rounded-xl text-xs font-bold">
                {[
                  { num: 1, label: "1. Cupos" },
                  { num: 2, label: "2. Datos" },
                  { num: 3, label: "3. Pago" },
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => setStep(s.num as 1 | 2 | 3)}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                      step === s.num
                        ? "bg-primary-container text-white shadow-sm"
                        : "text-secondary hover:text-on-surface"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* STEP 1: SPOTS & ADD-ONS */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Spots Selector */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-2">
                      Selecciona la cantidad de cupos
                    </label>
                    <div className="flex items-center justify-between bg-surface border border-surface-variant rounded-xl p-3">
                      <span className="text-sm font-semibold text-on-surface">
                        {spotsCount} {spotsCount === 1 ? "Persona" : "Personas"}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSpotsCount(Math.max(1, spotsCount - 1))}
                          className="w-8 h-8 rounded-lg bg-surface-container text-primary font-bold text-lg hover:bg-surface-variant flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span className="font-serif font-bold text-lg text-primary min-w-[20px] text-center">
                          {spotsCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSpotsCount(Math.min(tasting.availableSpots, spotsCount + 1))}
                          className="w-8 h-8 rounded-lg bg-surface-container text-primary font-bold text-lg hover:bg-surface-variant flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-secondary mt-1.5">
                      Disponibles: <strong className="text-primary">{tasting.availableSpots} cupos</strong> para esta fecha.
                    </p>
                  </div>

                  {/* Add-ons (Up-selling) */}
                  <div className="space-y-3 pt-2 border-t border-surface-variant">
                    <label className="block text-xs uppercase font-bold tracking-wider text-secondary">
                      Mejora tu experiencia (Add-ons opcionales)
                    </label>
                    {addOnsList.map((addon) => {
                      const isChecked = (selectedAddOns[addon.id] || 0) > 0;
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddOn(addon.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isChecked
                              ? "bg-primary-fixed-dim/20 border-primary"
                              : "bg-surface border-surface-variant hover:border-primary/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
                          />
                          <div className="flex-grow text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-on-surface">{addon.title}</span>
                              <span className="font-serif font-bold text-primary">{addon.priceFormatted}</span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">{addon.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl hover:bg-primary transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    Continuar con tus datos
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              )}

              {/* STEP 2: GUEST DETAILS & DIETARY PREFERENCES */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej: Laura Rossi"
                      className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1">
                      Correo electrónico * (para envío de ticket QR)
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="nombre@ejemplo.com"
                      className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1">
                      WhatsApp / Teléfono * (para confirmación automática)
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+54 9 261 123-4567"
                      className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1">
                      Restricciones dietéticas o alergias
                    </label>
                    <input
                      type="text"
                      value={dietaryRestrictions}
                      onChange={(e) => setDietaryRestrictions(e.target.value)}
                      placeholder="Ej: Menú Vegetariano, Celíaco / Sin TACC..."
                      className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="bg-transparent border border-surface-variant text-secondary text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-surface-variant"
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
                      className="flex-grow bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-primary transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      Ir a Método de Pago
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: COUPON & PAYMENT */}
              {step === 3 && (
                <form onSubmit={handleSubmitReservation} className="space-y-6 animate-fade-in-up">
                  {/* Coupon form */}
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-1.5">
                      ¿Tienes un cupón de descuento?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Ej: ORIGEN10 o SOMMELIER20"
                        className="flex-grow bg-surface-container-low border border-surface-variant rounded-xl px-3 py-2 text-xs uppercase text-on-surface focus:border-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="bg-surface border border-primary text-primary text-xs font-bold uppercase px-4 py-2 rounded-xl hover:bg-surface-variant transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponMessage && (
                      <p
                        className={`text-[11px] mt-1 font-semibold ${
                          couponMessage.type === "success" ? "text-emerald-700" : "text-error"
                        }`}
                      >
                        {couponMessage.text}
                      </p>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase font-bold tracking-wider text-secondary">
                      Selecciona forma de pago
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("stripe")}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold flex flex-col gap-1 transition-all ${
                          paymentMethod === "stripe"
                            ? "border-primary bg-primary-fixed-dim/20"
                            : "border-surface-variant bg-surface hover:border-primary/40"
                        }`}
                      >
                        <span className="flex items-center gap-1 font-bold text-primary">
                          <span className="material-symbols-outlined text-sm">credit_card</span>
                          Tarjeta / Stripe
                        </span>
                        <span className="text-[10px] text-secondary">Apple Pay / Google Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("bank_transfer")}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold flex flex-col gap-1 transition-all ${
                          paymentMethod === "bank_transfer"
                            ? "border-primary bg-primary-fixed-dim/20"
                            : "border-surface-variant bg-surface hover:border-primary/40"
                        }`}
                      >
                        <span className="flex items-center gap-1 font-bold text-on-surface">
                          <span className="material-symbols-outlined text-sm">account_balance</span>
                          Transferencia
                        </span>
                        <span className="text-[10px] text-secondary">Carga de comprobante</span>
                      </button>
                    </div>
                  </div>

                  {/* Price Summary Breakdown */}
                  <div className="bg-surface p-4 rounded-xl border border-surface-variant space-y-2 text-xs">
                    <div className="flex justify-between text-secondary">
                      <span>Catas ({spotsCount} x {tasting.priceFormatted}):</span>
                      <span>${tastingBaseTotal.toLocaleString("es-CL")}</span>
                    </div>
                    {addOnsTotal > 0 && (
                      <div className="flex justify-between text-secondary">
                        <span>Experiencias adicionales:</span>
                        <span>+${addOnsTotal.toLocaleString("es-CL")}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Descuento aplicado:</span>
                        <span>-${discountAmount.toLocaleString("es-CL")}</span>
                      </div>
                    )}
                    <div className="border-t border-surface-variant pt-2 flex justify-between items-center text-sm font-bold">
                      <span className="text-on-surface">Total a Pagar:</span>
                      <span className="font-serif text-xl text-primary font-bold">
                        ${grandTotal.toLocaleString("es-CL")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="bg-transparent border border-surface-variant text-secondary text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-surface-variant"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-grow bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl hover:bg-primary transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                          Confirmando reserva...
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

        <TerroirDivider className="my-16" />
      </main>

      <Footer />
    </div>
  );
}
