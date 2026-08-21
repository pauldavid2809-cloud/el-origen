"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerroirDivider } from "@/components/TerroirDivider";
import { SensoryWheel, SensoryData } from "@/components/SensoryWheel";
import { AudioGuidePlayer } from "@/components/AudioGuidePlayer";
import { CertificateGenerator } from "@/components/CertificateGenerator";
import { Reservation, Tasting } from "@/types";

export default function LiveTastingExperiencePage() {
  const params = useParams();
  const token = params?.token as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [tasting, setTasting] = useState<Tasting | null>(null);
  const [currentWineIndex, setCurrentWineIndex] = useState(0);
  const [savedNotes, setSavedNotes] = useState<{ [wineIdx: number]: SensoryData }>({});
  const [showCertificate, setShowCertificate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action: "verify" }),
        });
        const data = await res.json();
        if (data.reservation) {
          setReservation(data.reservation);
        }

        // Fetch tastings
        const tRes = await fetch("/api/tastings");
        const tData = await tRes.json();
        if (tData.success && tData.tastings.length > 0) {
          setTasting(tData.tastings[0]);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleSaveNote = async (data: SensoryData) => {
    setSavedNotes((prev) => ({
      ...prev,
      [currentWineIndex]: data,
    }));

    try {
      await fetch("/api/tasting-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationToken: token,
          tastingId: tasting?.id || "tasting-1",
          attendeeName: reservation?.customerName || "Catador de Bodega",
          wineIndex: currentWineIndex,
          wineName: tasting?.wines[currentWineIndex]?.name || "Vino de Altura",
          visual: data.visual,
          aromas: data.aromas,
          gustative: data.gustative,
          score: data.score,
          notes: data.notes,
          pairingIdea: data.pairingIdea,
        }),
      });
    } catch {
      // ignore
    }

    if (tasting && currentWineIndex < tasting.wines.length - 1) {
      setCurrentWineIndex(currentWineIndex + 1);
    } else {
      setShowCertificate(true);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-4 text-secondary">
        <span className="material-symbols-outlined animate-spin text-2xl mr-2">progress_activity</span>
        Iniciando experiencia sensorial en vivo...
      </div>
    );
  }

  const currentWine = tasting?.wines[currentWineIndex] || {
    name: "El Origen Malbec Gran Reserva",
    vintage: "2021",
    type: "Tinto de Altura • Crianza 18 meses",
    description: "Intenso color violeta profundo. Notas de ciruela madura, violetas y un fondo mineral de piedra caliza.",
    aromaProfile: ["Ciruela", "Violetas", "Grafito", "Pimienta negra"],
    audioStory: "Nuestras vides de Malbec reciben el agua pura de deshielo andino. En esta copa experimentamos la máxima expresión del terroir.",
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-10 sm:py-16 px-4 sm:px-8 lg:px-16 max-w-4xl mx-auto w-full">
        {/* Top Header */}
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] bg-[#5C0531] text-white px-3.5 py-1.5 rounded-full shadow-sm">
            Ficha de Cata Sensorial Digital
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface mt-3 mb-1">
            {tasting?.title || "Cata de Vinos Premium & Terroir"}
          </h1>
          <p className="text-xs sm:text-sm text-secondary">
            Catador: <strong className="text-primary">{reservation?.customerName || "Invitado Especial"}</strong> • Ticket {reservation?.code || "#EO-8492A"}
          </p>
        </div>

        {/* Wine Selector Tabs */}
        {tasting && tasting.wines.length > 1 && !showCertificate && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {tasting.wines.map((w, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentWineIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  currentWineIndex === idx
                    ? "bg-primary-container text-white shadow-sm"
                    : "bg-surface-container text-secondary hover:bg-surface-variant"
                }`}
              >
                Copa #{idx + 1}: {w.name}
              </button>
            ))}
          </div>
        )}

        {!showCertificate ? (
          <div className="space-y-8 animate-fade-in-up">
            {/* Audio Guide Player */}
            <AudioGuidePlayer
              title={`Guía de Cata: ${currentWine.name}`}
              storyText={currentWine.audioStory || "Disfruta de este recorrido aromático guiado por la bodega."}
            />

            {/* Interactive Sensory Sheet & Aroma Wheel */}
            <SensoryWheel
              key={currentWineIndex}
              wineName={currentWine.name}
              wineVintage={currentWine.vintage}
              wineType={currentWine.type}
              onSave={handleSaveNote}
            />
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center mb-4">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                ✓ Experiencia Completada
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface mt-2">
                Tu Certificado de Degustador
              </h2>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                Has calificado con éxito todos los vinos de la experiencia. Guarda tu pasaporte oficial o compártelo en tus historias.
              </p>
            </div>

            <CertificateGenerator
              attendeeName={reservation?.customerName || "Catador Distinguido"}
              tastingTitle={tasting?.title || "Cata de Vinos Premium"}
              tastingDate={reservation?.tastingDate || "24 de Octubre de 2026"}
              averageScore={94}
              certificateCode={reservation?.code || "#EO-8492A"}
            />

            <div className="text-center pt-4">
              <button
                onClick={() => setShowCertificate(false)}
                className="text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary underline"
              >
                ← Volver a editar notas de cata
              </button>
            </div>
          </div>
        )}

        <TerroirDivider className="my-14" />

        <div className="flex justify-between items-center text-xs text-secondary">
          <Link href={`/confirmacion/${reservation?.id || "res-1"}?token=${token}`} className="hover:text-primary underline">
            ← Volver a mi Ticket QR
          </Link>
          <Link href={`/recuerdos/${tasting?.id || "tasting-1"}`} className="hover:text-primary underline">
            Ver fotos del evento →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
