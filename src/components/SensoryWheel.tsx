"use client";

import React, { useState } from "react";

export interface SensoryData {
  visual: {
    color: string;
    clarity: string;
    density: string;
  };
  aromas: string[];
  gustative: {
    attack: string;
    acidity: number;
    tannins: number;
    body: number;
    persistence: number;
  };
  score: number;
  notes: string;
  pairingIdea: string;
}

interface SensoryWheelProps {
  wineName: string;
  wineVintage?: string;
  wineType?: string;
  initialData?: Partial<SensoryData>;
  onSave?: (data: SensoryData) => void;
}

const AROMA_FAMILIES = [
  {
    family: "Frutos Rojos & Negros",
    color: "bg-red-50/60 text-red-950 border-red-200/60",
    activeColor: "bg-[#7A2048] text-white border-[#7A2048]",
    items: ["Ciruela Negra", "Mora Silvestre", "Cereza Madura", "Frambuesa", "Grosella", "Higo Seco"],
  },
  {
    family: "Especias & Balsámicos",
    color: "bg-amber-50/60 text-amber-950 border-amber-200/60",
    activeColor: "bg-[#735C00] text-white border-[#735C00]",
    items: ["Pimienta Negra", "Clavo de Olor", "Vainilla", "Canela", "Regaliz", "Eucalipto"],
  },
  {
    family: "Crianza & Madera",
    color: "bg-orange-50/60 text-orange-950 border-orange-200/60",
    activeColor: "bg-[#5C0531] text-white border-[#5C0531]",
    items: ["Roble Tostado", "Cacao Amargo", "Tabaco de Pipa", "Café Tostado", "Cuero Noble", "Cedro"],
  },
  {
    family: "Minerales & Terroir",
    color: "bg-stone-100/60 text-stone-900 border-stone-200/60",
    activeColor: "bg-stone-800 text-white border-stone-800",
    items: ["Grafito", "Piedra Caliza", "Tierra Húmeda", "Violetas", "Tomillo Silvestre", "Ceniza"],
  },
];

const COLOR_PALETTE = [
  { name: "Púrpura Joven", hex: "#4A0E2E" },
  { name: "Rojo Rubí Intenso", hex: "#7A2048" },
  { name: "Rojo Granate", hex: "#63172C" },
  { name: "Teja / Caoba", hex: "#6E2619" },
  { name: "Amarillo Dorado", hex: "#D4AF37" },
  { name: "Pajizo Brillante", hex: "#E8DC9E" },
];

export function SensoryWheel({
  wineName,
  wineVintage = "2021",
  wineType = "Vino de Altura",
  onSave,
}: SensoryWheelProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [visual, setVisual] = useState({
    color: "Rojo Rubí Intenso",
    clarity: "Brillante y límpido",
    density: "Lágrima densa y pausada",
  });

  const [selectedAromas, setSelectedAromas] = useState<string[]>([
    "Ciruela Negra",
    "Violetas",
    "Roble Tostado",
  ]);

  const [gustative, setGustative] = useState({
    attack: "Franco y envolvente",
    acidity: 4,
    tannins: 4,
    body: 4,
    persistence: 5,
  });

  const [score, setScore] = useState<number>(94);
  const [notes, setNotes] = useState<string>(
    "Estructura soberbia. Gran expresión de terroir andino con notas de violetas y grafito muy marcadas."
  );
  const [pairingIdea, setPairingIdea] = useState<string>("Ojo de bife a las brasas con reducción de Malbec.");

  const toggleAroma = (aroma: string) => {
    setSelectedAromas((prev) =>
      prev.includes(aroma) ? prev.filter((a) => a !== aroma) : [...prev, aroma]
    );
  };

  const handleFinish = () => {
    if (onSave) {
      onSave({
        visual,
        aromas: selectedAromas,
        gustative,
        score,
        notes,
        pairingIdea,
      });
    }
  };

  const getScoreBadge = (sc: number) => {
    if (sc >= 95) return { label: "Excepcional • Gran Reserva Ícono", color: "bg-emerald-50 text-emerald-900 border-emerald-300" };
    if (sc >= 90) return { label: "Excelente • Calidad Sobresaliente", color: "bg-blue-50 text-blue-900 border-blue-300" };
    if (sc >= 85) return { label: "Muy Bueno • Armónico y Equilibrado", color: "bg-amber-50 text-amber-900 border-amber-300" };
    return { label: "Bueno • Correcto", color: "bg-stone-50 text-stone-900 border-stone-300" };
  };

  return (
    <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
      <div className="bg-white rounded-[calc(2.5rem-0.625rem)] p-6 sm:p-10 shadow-[0_8px_32px_rgba(122,32,72,0.04)] space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-black/[0.05] pb-5">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary block">
              Evaluación Técnica • Copa #{step}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface">
              {wineName}
            </h2>
            <p className="text-[12px] text-on-surface-variant/70 mt-0.5">
              Añada {wineVintage} • {wineType}
            </p>
          </div>

          <div className="bg-primary-fixed/20 text-primary px-3.5 py-1 rounded-full text-[11px] font-semibold">
            {selectedAromas.length} descriptores seleccionados
          </div>
        </div>

        {/* Phase Stepper Pills (Emil Kowalski Tab Indicator Pattern) */}
        <div className="bg-surface-container/60 p-1 rounded-full flex items-center justify-between gap-1 text-[12px]">
          {[
            { num: 1, label: "1. Visual", icon: "visibility" },
            { num: 2, label: "2. Olfativa", icon: "scent" },
            { num: 3, label: "3. Gustativa", icon: "wine_bar" },
            { num: 4, label: "4. Puntuación", icon: "hotel_class" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as 1 | 2 | 3 | 4)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-full font-medium transition-all duration-300 ${
                step === s.num
                  ? "bg-primary-container text-white shadow-sm font-semibold"
                  : "text-on-surface-variant/70 hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[15px] hidden sm:inline">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* STEP 1: VISUAL PHASE */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in text-[13px]">
            <div>
              <h3 className="font-serif text-xl font-semibold text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">visibility</span>
                Fase Visual: Color y Matiz
              </h3>
              <p className="text-[13px] text-on-surface-variant/70">
                Incline su copa a 45 grados sobre un fondo blanco para examinar el ribete y la intensidad del color.
              </p>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-3">
                Seleccione el tono predominante
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setVisual({ ...visual, color: c.name })}
                    aria-pressed={visual.color === c.name}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${
                      visual.color === c.name
                        ? "bg-white border-primary shadow-sm font-semibold text-primary"
                        : "bg-surface-container-low border-black/[0.05] hover:bg-white text-on-surface-variant/80"
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/20 shadow-inner flex-shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                  Limpidez y Brillo
                </label>
                <select
                  value={visual.clarity}
                  onChange={(e) => setVisual({ ...visual, clarity: e.target.value })}
                  className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-[12px] font-medium focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="Brillante y límpido">Brillante y límpido (Cristalino)</option>
                  <option value="Límpido mate">Límpido mate (Sin velo)</option>
                  <option value="Opaco / No filtrado">Opaco / No filtrado (Natural)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                  Densidad de Lágrima / Pierna
                </label>
                <select
                  value={visual.density}
                  onChange={(e) => setVisual({ ...visual, density: e.target.value })}
                  className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3 text-[12px] font-medium focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="Lágrima densa y pausada">Lágrima densa y pausada (Alto alcohol / cuerpo)</option>
                  <option value="Lágrima fluida">Lágrima fluida (Ligero y fresco)</option>
                  <option value="Lágrima media uniforme">Lágrima media uniforme</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="group inline-flex items-center gap-3 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold pl-5 pr-2 py-2 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98]"
              >
                <span>Siguiente: Fase Olfativa</span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OLFACTORY PHASE (AROMA WHEEL) */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in text-[13px]">
            <div>
              <h3 className="font-serif text-xl font-semibold text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">scent</span>
                Fase Olfativa: Rueda de Aromas
              </h3>
              <p className="text-[13px] text-on-surface-variant/70">
                Gire la copa suavemente para oxigenar el vino. Seleccione todos los descriptores aromáticos que identifique.
              </p>
            </div>

            <div className="space-y-4">
              {AROMA_FAMILIES.map((fam) => (
                <div key={fam.family} className="bg-surface-container-low p-4 sm:p-5 rounded-2xl border border-black/[0.05]">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70 mb-3 flex items-center justify-between">
                    <span>{fam.family}</span>
                    <span className="text-[10px] text-on-surface-variant/60 font-normal">
                      {fam.items.filter((i) => selectedAromas.includes(i)).length} seleccionados
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {fam.items.map((aroma) => {
                      const isSelected = selectedAromas.includes(aroma);
                      return (
                        <button
                          key={aroma}
                          type="button"
                          onClick={() => toggleAroma(aroma)}
                          aria-pressed={isSelected}
                          className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all duration-200 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none ${
                            isSelected ? `${fam.activeColor} shadow-sm` : `${fam.color} hover:bg-white`
                          }`}
                        >
                          {isSelected && <span className="mr-1">✓</span>}
                          {aroma}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="text-[12px] font-semibold text-on-surface-variant/70 hover:text-on-surface py-2 px-4 rounded-full transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setStep(3)}
                className="group inline-flex items-center gap-3 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold pl-5 pr-2 py-2 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98]"
              >
                <span>Siguiente: Fase Gustativa</span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GUSTATIVE PALATE PHASE */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in text-[13px]">
            <div>
              <h3 className="font-serif text-xl font-semibold text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">wine_bar</span>
                Fase Gustativa: Sensaciones en Boca
              </h3>
              <p className="text-[13px] text-on-surface-variant/70">
                Tome un sorbo, manténgalo unos segundos en boca y evalúe la armonía de la estructura.
              </p>
            </div>

            <div className="space-y-6 bg-surface-container-low p-6 rounded-2xl border border-black/[0.05]">
              {/* Acidity */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider mb-2">
                  <span className="text-on-surface">Acidez / Frescura</span>
                  <span className="text-primary">{gustative.acidity} / 5 ({gustative.acidity >= 4 ? "Vibrante" : "Media"})</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={gustative.acidity}
                  onChange={(e) => setGustative({ ...gustative, acidity: Number(e.target.value) })}
                  className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant/60 mt-1">
                  <span>Baja / Plana</span>
                  <span>Equilibrada</span>
                  <span>Vibrante / Eléctrica</span>
                </div>
              </div>

              {/* Tannins */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider mb-2">
                  <span className="text-on-surface">Taninos / Estructura</span>
                  <span className="text-primary">{gustative.tannins} / 5 ({gustative.tannins >= 4 ? "Sedosos y firmes" : "Suaves"})</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={gustative.tannins}
                  onChange={(e) => setGustative({ ...gustative, tannins: Number(e.target.value) })}
                  className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant/60 mt-1">
                  <span>Sedosos</span>
                  <span>Redondos</span>
                  <span>Firmes / Potentes</span>
                </div>
              </div>

              {/* Body */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider mb-2">
                  <span className="text-on-surface">Cuerpo & Volumen</span>
                  <span className="text-primary">{gustative.body} / 5 ({gustative.body >= 4 ? "Robusto" : "Medio"})</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={gustative.body}
                  onChange={(e) => setGustative({ ...gustative, body: Number(e.target.value) })}
                  className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant/60 mt-1">
                  <span>Ligero</span>
                  <span>Medio</span>
                  <span>Cuerpo Completo</span>
                </div>
              </div>

              {/* Persistence */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider mb-2">
                  <span className="text-on-surface">Persistencia / Final en Boca</span>
                  <span className="text-primary">{gustative.persistence} / 5 ({gustative.persistence >= 4 ? "> 15 segundos" : "Media"})</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={gustative.persistence}
                  onChange={(e) => setGustative({ ...gustative, persistence: Number(e.target.value) })}
                  className="w-full accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant/60 mt-1">
                  <span>Corto (&lt;5s)</span>
                  <span>Medio (5-10s)</span>
                  <span>Largo y memorable (&gt;15s)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="text-[12px] font-semibold text-on-surface-variant/70 hover:text-on-surface py-2 px-4 rounded-full transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setStep(4)}
                className="group inline-flex items-center gap-3 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold pl-5 pr-2 py-2 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98]"
              >
                <span>Siguiente: Puntuación</span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SCORE & NOTES */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in text-[13px]">
            <div>
              <h3 className="font-serif text-xl font-semibold text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">hotel_class</span>
                Calificación Final & Notas Personales
              </h3>
              <p className="text-[13px] text-on-surface-variant/70">
                Asigne su puntuación en escala de 100 puntos y registre sus impresiones de maridaje.
              </p>
            </div>

            <div className="bg-surface-container-low p-8 rounded-2xl border border-black/[0.05] text-center space-y-4">
              <div>
                <span className="font-serif text-6xl font-semibold text-primary">{score}</span>
                <span className="text-[13px] font-semibold text-on-surface-variant/70 ml-1">/ 100 pts</span>
              </div>

              <div>
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full max-w-md mx-auto accent-primary h-2 bg-surface-container rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <span className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-semibold border ${getScoreBadge(score).color}`}>
                  {getScoreBadge(score).label}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                  Tus Notas Personales de Cata
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3.5 text-on-surface focus:border-primary focus:outline-none transition-colors"
                  placeholder="Escribe tus sensaciones y recuerdos de este vino..."
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant/70 mb-1.5">
                  Maridaje Ideal Recomendado
                </label>
                <input
                  type="text"
                  value={pairingIdea}
                  onChange={(e) => setPairingIdea(e.target.value)}
                  className="w-full bg-surface-container-low border border-black/[0.06] rounded-xl p-3.5 text-on-surface focus:border-primary focus:outline-none transition-colors"
                  placeholder="Ej: Cordero braseado, quesos curados..."
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-black/[0.05]">
              <button
                onClick={() => setStep(3)}
                className="text-[12px] font-semibold text-on-surface-variant/70 hover:text-on-surface py-2 px-4 rounded-full transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={handleFinish}
                className="group inline-flex items-center gap-3 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold pl-6 pr-2 py-2 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98]"
              >
                <span>Guardar Nota de Cata</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <span className="material-symbols-outlined text-[16px]">bookmark_added</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
