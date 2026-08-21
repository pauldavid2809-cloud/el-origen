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
    color: "bg-red-50 text-red-900 border-red-200",
    activeColor: "bg-red-800 text-white border-red-800",
    items: ["Ciruela Negra", "Mora Silvestre", "Cereza Madura", "Frambuesa", "Grosella", "Higo Seco"],
  },
  {
    family: "Especias & Balsámicos",
    color: "bg-amber-50 text-amber-900 border-amber-200",
    activeColor: "bg-amber-800 text-white border-amber-800",
    items: ["Pimienta Negra", "Clavo de Olor", "Vainilla", "Canela", "Regaliz", "Eucalipto"],
  },
  {
    family: "Crianza & Madera",
    color: "bg-orange-50 text-orange-900 border-orange-200",
    activeColor: "bg-orange-950 text-white border-orange-950",
    items: ["Roble Tostado", "Cacao Amargo", "Tabaco de Pipa", "Café Tostado", "Cuero Noble", "Cedro"],
  },
  {
    family: "Minerales & Terroir",
    color: "bg-stone-50 text-stone-800 border-stone-200",
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
    acidity: 4, // 1 to 5
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
    if (selectedAromas.includes(aroma)) {
      setSelectedAromas(selectedAromas.filter((a) => a !== aroma));
    } else {
      setSelectedAromas([...selectedAromas, aroma]);
    }
  };

  const handleFinish = () => {
    const data: SensoryData = {
      visual,
      aromas: selectedAromas,
      gustative,
      score,
      notes,
      pairingIdea,
    };
    if (onSave) onSave(data);
  };

  const getScoreBadge = (sc: number) => {
    if (sc >= 95) return { label: "Gran Reserva Excepcional (95-100 pts)", color: "text-amber-700 bg-amber-50" };
    if (sc >= 90) return { label: "Sobresaliente / Alta Gama (90-94 pts)", color: "text-primary bg-primary-fixed-dim/30" };
    if (sc >= 85) return { label: "Muy Bueno / Notable (85-89 pts)", color: "text-emerald-700 bg-emerald-50" };
    return { label: "Correcto / Tradicional (<85 pts)", color: "text-secondary bg-surface-container" };
  };

  return (
    <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl p-6 sm:p-8 soft-shadow max-w-3xl mx-auto">
      {/* Header with Wine Name */}
      <div className="border-b border-surface-variant pb-6 mb-6">
        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary bg-primary-fixed-dim/30 px-2.5 py-1 rounded">
              {wineType} • Añada {wineVintage}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface mt-2">
              {wineName}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-secondary tracking-widest block">Puntuación</span>
            <span className="font-serif text-3xl font-bold text-primary">{score} <span className="text-sm font-sans font-normal text-secondary">/ 100</span></span>
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { num: 1, label: "1. Visual", icon: "visibility" },
            { num: 2, label: "2. Olfativa", icon: "scent" },
            { num: 3, label: "3. Gustativa", icon: "wine_bar" },
            { num: 4, label: "4. Puntuación", icon: "hotel_class" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as 1 | 2 | 3 | 4)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-1 sm:px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                step === s.num
                  ? "bg-primary-container text-white shadow-sm"
                  : "bg-surface-container text-secondary hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[16px] hidden sm:inline">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: VISUAL PHASE */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h3 className="font-serif text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">visibility</span>
              Fase Visual: Color y Matiz
            </h3>
            <p className="text-xs text-on-surface-variant">
              Incline su copa a 45 grados sobre un fondo blanco para examinar el ribete y la intensidad del color.
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-3">
              Seleccione el tono predominante
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setVisual({ ...visual, color: c.name })}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    visual.color === c.name
                      ? "border-primary bg-primary-fixed-dim/20 shadow-sm"
                      : "border-surface-variant hover:border-primary/40 bg-surface"
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
              <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-2">
                Limpidez y Brillo
              </label>
              <select
                value={visual.clarity}
                onChange={(e) => setVisual({ ...visual, clarity: e.target.value })}
                className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs font-medium focus:border-primary focus:outline-none"
              >
                <option value="Brillante y límpido">Brillante y límpido (Cristalino)</option>
                <option value="Límpido mate">Límpido mate (Sin velo)</option>
                <option value="Opaco / No filtrado">Opaco / No filtrado (Natural)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-2">
                Densidad de Lágrima / Pierna
              </label>
              <select
                value={visual.density}
                onChange={(e) => setVisual({ ...visual, density: e.target.value })}
                className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-xs font-medium focus:border-primary focus:outline-none"
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
              className="bg-primary-container text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-primary transition-all flex items-center gap-2"
            >
              Siguiente: Fase Olfativa
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: OLFACTORY PHASE (AROMA WHEEL) */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h3 className="font-serif text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">scent</span>
              Fase Olfativa: Rueda de Aromas
            </h3>
            <p className="text-xs text-on-surface-variant">
              Gire la copa suavemente para oxigenar el vino. Seleccione todos los descriptores aromáticos que identifique.
            </p>
          </div>

          <div className="space-y-4">
            {AROMA_FAMILIES.map((fam) => (
              <div key={fam.family} className="bg-surface p-4 rounded-xl border border-surface-variant">
                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary mb-3 flex items-center justify-between">
                  <span>{fam.family}</span>
                  <span className="text-[10px] text-on-surface-variant font-normal">
                    {fam.items.filter((i) => selectedAromas.includes(i)).length} seleccionados
                  </span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {fam.items.map((aroma) => {
                    const isSelected = selectedAromas.includes(aroma);
                    return (
                      <button
                        key={aroma}
                        onClick={() => toggleAroma(aroma)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected ? fam.activeColor : `${fam.color} hover:opacity-80`
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
              className="bg-transparent border border-surface-variant text-secondary text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-surface-variant"
            >
              Anterior
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-primary-container text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-primary transition-all flex items-center gap-2"
            >
              Siguiente: Fase Gustativa
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: GUSTATIVE PALATE PHASE */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h3 className="font-serif text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">wine_bar</span>
              Fase Gustativa: Sensaciones en Boca
            </h3>
            <p className="text-xs text-on-surface-variant">
              Tome un sorbo, manténgalo unos segundos en boca y evalúe la armonía de la estructura.
            </p>
          </div>

          <div className="space-y-5 bg-surface p-5 rounded-xl border border-surface-variant">
            {/* Acidity */}
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-on-surface">Acidez / Frescura</span>
                <span className="text-primary">{gustative.acidity} / 5 ({gustative.acidity >= 4 ? "Vibrante" : "Media"})</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={gustative.acidity}
                onChange={(e) => setGustative({ ...gustative, acidity: Number(e.target.value) })}
                className="w-full accent-primary h-2 bg-surface-variant rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-secondary mt-1">
                <span>Baja / Plana</span>
                <span>Equilibrada</span>
                <span>Vibrante / Eléctrica</span>
              </div>
            </div>

            {/* Tannins */}
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-on-surface">Taninos / Estructura</span>
                <span className="text-primary">{gustative.tannins} / 5 ({gustative.tannins >= 4 ? "Sedosos y firmes" : "Suaves"})</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={gustative.tannins}
                onChange={(e) => setGustative({ ...gustative, tannins: Number(e.target.value) })}
                className="w-full accent-primary h-2 bg-surface-variant rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-secondary mt-1">
                <span>Sedosos</span>
                <span>Redondos</span>
                <span>Firmes / Potentes</span>
              </div>
            </div>

            {/* Body */}
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-on-surface">Cuerpo & Volumen</span>
                <span className="text-primary">{gustative.body} / 5 ({gustative.body >= 4 ? "Robusto" : "Medio"})</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={gustative.body}
                onChange={(e) => setGustative({ ...gustative, body: Number(e.target.value) })}
                className="w-full accent-primary h-2 bg-surface-variant rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-secondary mt-1">
                <span>Ligero</span>
                <span>Medio</span>
                <span>Cuerpo Completo</span>
              </div>
            </div>

            {/* Persistence */}
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-on-surface">Persistencia / Final en Boca</span>
                <span className="text-primary">{gustative.persistence} / 5 ({gustative.persistence >= 4 ? "> 15 segundos" : "Media"})</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={gustative.persistence}
                onChange={(e) => setGustative({ ...gustative, persistence: Number(e.target.value) })}
                className="w-full accent-primary h-2 bg-surface-variant rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-secondary mt-1">
                <span>Corto (&lt;5s)</span>
                <span>Medio (5-10s)</span>
                <span>Largo y memorable (&gt;15s)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="bg-transparent border border-surface-variant text-secondary text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-surface-variant"
            >
              Anterior
            </button>
            <button
              onClick={() => setStep(4)}
              className="bg-primary-container text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-primary transition-all flex items-center gap-2"
            >
              Siguiente: Puntuación & Notas
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SCORE & PERSONAL NOTES */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in-up">
          <div>
            <h3 className="font-serif text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">hotel_class</span>
              Calificación Final & Notas Personales
            </h3>
            <p className="text-xs text-on-surface-variant">
              Asigne su puntuación en escala de 100 puntos y registre sus impresiones de maridaje.
            </p>
          </div>

          <div className="bg-surface p-6 rounded-xl border border-surface-variant text-center space-y-4">
            <div className="inline-block">
              <span className="font-serif text-5xl font-bold text-primary">{score}</span>
              <span className="text-sm font-semibold text-secondary ml-1">/ 100 pts</span>
            </div>

            <div>
              <input
                type="range"
                min="70"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full max-w-md mx-auto accent-primary h-2.5 bg-surface-variant rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${getScoreBadge(score).color}`}>
                {getScoreBadge(score).label}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-2">
                Tus Notas Personales de Cata
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3.5 text-xs text-on-surface focus:border-primary focus:outline-none"
                placeholder="Escribe tus sensaciones y recuerdos de este vino..."
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-secondary mb-2">
                Maridaje Ideal Recomendado
              </label>
              <input
                type="text"
                value={pairingIdea}
                onChange={(e) => setPairingIdea(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3.5 text-xs text-on-surface focus:border-primary focus:outline-none"
                placeholder="Ej: Cordero braseado, quesos curados..."
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-surface-variant">
            <button
              onClick={() => setStep(3)}
              className="bg-transparent border border-surface-variant text-secondary text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-surface-variant"
            >
              Anterior
            </button>
            <button
              onClick={handleFinish}
              className="bg-primary-container text-white text-xs font-bold uppercase tracking-wider px-8 py-3 rounded-xl hover:bg-primary transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark_added</span>
              Guardar Nota de Cata
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
