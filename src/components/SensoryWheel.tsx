"use client";

import React, { useState } from "react";
import type { Language } from "@/lib/i18n";

/* Ficha sensorial interactiva (vista, nariz, boca y puntaje) para la cata en vivo.
   Sirve para vinos y destilados. Los valores se guardan como ids estables y se muestran en el idioma activo. */

export interface SensoryData {
  visual: { color: string; clarity: string; density: string };
  /** Ids de AROMAS. */
  aromas: string[];
  /** Escala 1–5. */
  gustative: { acidity: number; tannins: number; body: number; persistence: number };
  /** 70–100. */
  score: number;
  notes: string;
  pairingIdea: string;
}

/** Ficha guardada en /api/tasting-notes (una por copa; la última versión es la vigente). */
export interface LiveTastingNote extends SensoryData {
  tastingId: string;
  productIndex: number;
  productName: string;
}

type Label = Record<Language, string>;

interface AromaFamily {
  id: string;
  label: Label;
  tone: string;
  active: string;
  items: { id: string; label: Label }[];
}

const AROMA_FAMILIES: AromaFamily[] = [
  {
    id: "fruit",
    label: { es: "Frutales", en: "Fruit" },
    tone: "bg-primary-fixed/40 text-on-primary-fixed border-primary-fixed-dim/60",
    active: "bg-primary-container text-white border-primary-container",
    items: [
      { id: "plum", label: { es: "Ciruela", en: "Plum" } },
      { id: "blackberry", label: { es: "Mora", en: "Blackberry" } },
      { id: "cherry", label: { es: "Cereza", en: "Cherry" } },
      { id: "raspberry", label: { es: "Frambuesa", en: "Raspberry" } },
      { id: "dried_fig", label: { es: "Higo seco", en: "Dried fig" } },
      { id: "citrus", label: { es: "Cítricos", en: "Citrus" } },
      { id: "green_apple", label: { es: "Manzana verde", en: "Green apple" } },
      { id: "tropical", label: { es: "Frutas tropicales", en: "Tropical fruit" } },
    ],
  },
  {
    id: "floral",
    label: { es: "Florales y herbales", en: "Floral & herbal" },
    tone: "bg-secondary-fixed/60 text-on-secondary-fixed border-secondary-fixed-dim/70",
    active: "bg-on-secondary-fixed-variant text-white border-on-secondary-fixed-variant",
    items: [
      { id: "violet", label: { es: "Violeta", en: "Violet" } },
      { id: "rose", label: { es: "Rosa", en: "Rose" } },
      { id: "orange_blossom", label: { es: "Azahar", en: "Orange blossom" } },
      { id: "fresh_herbs", label: { es: "Hierbas frescas", en: "Fresh herbs" } },
      { id: "eucalyptus", label: { es: "Eucalipto", en: "Eucalyptus" } },
      { id: "thyme", label: { es: "Tomillo", en: "Thyme" } },
    ],
  },
  {
    id: "spice",
    label: { es: "Especias", en: "Spice" },
    tone: "bg-tertiary-fixed/50 text-on-tertiary-fixed border-tertiary-fixed-dim/70",
    active: "bg-tertiary text-white border-tertiary",
    items: [
      { id: "black_pepper", label: { es: "Pimienta negra", en: "Black pepper" } },
      { id: "clove", label: { es: "Clavo", en: "Clove" } },
      { id: "vanilla", label: { es: "Vainilla", en: "Vanilla" } },
      { id: "cinnamon", label: { es: "Canela", en: "Cinnamon" } },
      { id: "licorice", label: { es: "Regaliz", en: "Licorice" } },
      { id: "nutmeg", label: { es: "Nuez moscada", en: "Nutmeg" } },
    ],
  },
  {
    id: "oak",
    label: { es: "Crianza y madera", en: "Oak & ageing" },
    tone: "bg-surface-container-high text-on-surface border-outline-variant",
    active: "bg-primary text-white border-primary",
    items: [
      { id: "toasted_oak", label: { es: "Roble tostado", en: "Toasted oak" } },
      { id: "cocoa", label: { es: "Cacao", en: "Cocoa" } },
      { id: "tobacco", label: { es: "Tabaco", en: "Tobacco" } },
      { id: "coffee", label: { es: "Café", en: "Coffee" } },
      { id: "leather", label: { es: "Cuero", en: "Leather" } },
      { id: "cedar", label: { es: "Cedro", en: "Cedar" } },
    ],
  },
  {
    id: "sweet",
    label: { es: "Dulces y destilados", en: "Sweet & spirits" },
    tone: "bg-tertiary-fixed/30 text-on-tertiary-fixed-variant border-tertiary-container/50",
    active: "bg-on-tertiary-fixed-variant text-white border-on-tertiary-fixed-variant",
    items: [
      { id: "caramel", label: { es: "Caramelo", en: "Caramel" } },
      { id: "honey", label: { es: "Miel", en: "Honey" } },
      { id: "nuts", label: { es: "Frutos secos", en: "Nuts" } },
      { id: "smoky", label: { es: "Ahumado", en: "Smoky" } },
      { id: "malt", label: { es: "Malta", en: "Malt" } },
      { id: "sugar_cane", label: { es: "Caña de azúcar", en: "Sugar cane" } },
      { id: "agave", label: { es: "Agave", en: "Agave" } },
    ],
  },
  {
    id: "mineral",
    label: { es: "Minerales y tierra", en: "Mineral & earth" },
    tone: "bg-surface-container text-on-surface-variant border-outline-variant",
    active: "bg-ink text-white border-ink",
    items: [
      { id: "graphite", label: { es: "Grafito", en: "Graphite" } },
      { id: "wet_stone", label: { es: "Piedra mojada", en: "Wet stone" } },
      { id: "damp_earth", label: { es: "Tierra húmeda", en: "Damp earth" } },
      { id: "saline", label: { es: "Salino", en: "Saline" } },
      { id: "ash", label: { es: "Ceniza", en: "Ash" } },
    ],
  },
];

const AROMA_LABELS = new Map(AROMA_FAMILIES.flatMap((f) => f.items.map((i) => [i.id, i.label] as const)));

/** Nombre de un aroma (id) en el idioma pedido. */
export function aromaLabel(id: string, lang: Language): string {
  return AROMA_LABELS.get(id)?.[lang] ?? id;
}

const COLORS: { id: string; hex: string; label: Label }[] = [
  { id: "clear", hex: "#F4F1EA", label: { es: "Cristalino", en: "Clear" } },
  { id: "straw", hex: "#E8D58E", label: { es: "Pajizo", en: "Straw" } },
  { id: "gold", hex: "#D9A35A", label: { es: "Dorado", en: "Gold" } },
  { id: "amber", hex: "#A8641E", label: { es: "Ámbar", en: "Amber" } },
  { id: "tawny", hex: "#6E2619", label: { es: "Teja", en: "Tawny" } },
  { id: "garnet", hex: "#63172C", label: { es: "Granate", en: "Garnet" } },
  { id: "ruby", hex: "#7D2A46", label: { es: "Rubí", en: "Ruby" } },
  { id: "purple", hex: "#3E1322", label: { es: "Púrpura", en: "Purple" } },
];

const CLARITY: { id: string; label: Label }[] = [
  { id: "brilliant", label: { es: "Brillante y límpido", en: "Brilliant and clear" } },
  { id: "clean", label: { es: "Límpido, sin brillo", en: "Clean, not bright" } },
  { id: "hazy", label: { es: "Velado / sin filtrar", en: "Hazy / unfiltered" } },
];

const DENSITY: { id: string; label: Label }[] = [
  { id: "dense", label: { es: "Lágrima densa y lenta", en: "Thick, slow legs" } },
  { id: "medium", label: { es: "Lágrima media", en: "Medium legs" } },
  { id: "fluid", label: { es: "Lágrima fluida", en: "Thin, quick legs" } },
];

type GustativeKey = keyof SensoryData["gustative"];

const COPY = {
  es: {
    glass: (n: number) => `Copa ${n}`,
    selectedCount: (n: number) => `${n} ${n === 1 ? "aroma" : "aromas"}`,
    steps: ["Vista", "Nariz", "Boca", "Puntaje"],
    stepsLabel: "Fases de la cata",
    visualTitle: "Vista: color y brillo",
    visualText: "Inclina la copa sobre un fondo blanco y observa el color, la limpidez y las lágrimas.",
    colorLabel: "Tono predominante",
    clarityLabel: "Limpidez",
    densityLabel: "Lágrimas",
    noseTitle: "Nariz: aromas",
    noseText: "Gira suavemente la copa y marca todos los aromas que reconozcas.",
    selected: (n: number) => `${n} marcados`,
    palateTitle: "Boca: sensaciones",
    palateText: "Toma un sorbo, mantenlo unos segundos y evalúa cada sensación.",
    gustative: {
      acidity: { label: "Acidez / frescura", ends: ["Baja", "Media", "Vibrante"] },
      tannins: { label: "Taninos / astringencia", ends: ["Sedosos", "Redondos", "Firmes"] },
      body: { label: "Cuerpo", ends: ["Ligero", "Medio", "Robusto"] },
      persistence: { label: "Persistencia", ends: ["Corta", "Media", "Larga"] },
    } satisfies Record<GustativeKey, { label: string; ends: string[] }>,
    scoreTitle: "Puntaje y notas",
    scoreText: "Califica la copa de 70 a 100 puntos y anota tus impresiones.",
    scoreLabel: "Puntaje",
    points: "pts",
    badges: ["Bueno", "Muy bueno", "Excelente", "Excepcional"],
    notesLabel: "Mis notas",
    notesPlaceholder: "Lo que más te llamó la atención de esta copa…",
    pairingLabel: "Maridaje que imagino",
    pairingPlaceholder: "Ej.: quesos curados, chocolate oscuro…",
    previous: "Anterior",
    next: "Siguiente",
    save: "Guardar ficha",
    saving: "Guardando…",
  },
  en: {
    glass: (n: number) => `Glass ${n}`,
    selectedCount: (n: number) => `${n} ${n === 1 ? "aroma" : "aromas"}`,
    steps: ["Sight", "Nose", "Palate", "Score"],
    stepsLabel: "Tasting steps",
    visualTitle: "Sight: colour and clarity",
    visualText: "Tilt the glass over a white background and look at the colour, clarity and legs.",
    colorLabel: "Main hue",
    clarityLabel: "Clarity",
    densityLabel: "Legs",
    noseTitle: "Nose: aromas",
    noseText: "Gently swirl the glass and mark every aroma you recognise.",
    selected: (n: number) => `${n} selected`,
    palateTitle: "Palate: sensations",
    palateText: "Take a sip, hold it for a few seconds and rate each sensation.",
    gustative: {
      acidity: { label: "Acidity / freshness", ends: ["Low", "Medium", "Vibrant"] },
      tannins: { label: "Tannins / astringency", ends: ["Silky", "Round", "Firm"] },
      body: { label: "Body", ends: ["Light", "Medium", "Full"] },
      persistence: { label: "Finish", ends: ["Short", "Medium", "Long"] },
    } satisfies Record<GustativeKey, { label: string; ends: string[] }>,
    scoreTitle: "Score and notes",
    scoreText: "Rate the glass from 70 to 100 points and write down your impressions.",
    scoreLabel: "Score",
    points: "pts",
    badges: ["Good", "Very good", "Excellent", "Outstanding"],
    notesLabel: "My notes",
    notesPlaceholder: "What stood out most in this glass…",
    pairingLabel: "Pairing I imagine",
    pairingPlaceholder: "E.g. aged cheese, dark chocolate…",
    previous: "Back",
    next: "Next",
    save: "Save tasting sheet",
    saving: "Saving…",
  },
};

const STEP_ICONS = ["visibility", "air", "wine_bar", "hotel_class"];

const DEFAULT_DATA: SensoryData = {
  visual: { color: "", clarity: "brilliant", density: "medium" },
  aromas: [],
  gustative: { acidity: 3, tannins: 3, body: 3, persistence: 3 },
  score: 88,
  notes: "",
  pairingIdea: "",
};

interface SensoryWheelProps {
  lang: Language;
  productName: string;
  productVintage?: string;
  productType?: string;
  /** Número de copa (1..n). */
  glassNumber: number;
  initialData?: Partial<SensoryData>;
  saving?: boolean;
  onSave: (data: SensoryData) => void;
}

const fieldCls =
  "w-full h-12 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[15px] focus:border-primary-container focus:outline-none";
const labelCls = "block text-[13px] font-semibold mb-2";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold disabled:opacity-60";
const ghostBtn = "inline-flex items-center gap-1 h-12 px-4 rounded text-[14px] font-semibold text-on-surface-variant hover:text-on-surface";

export function SensoryWheel({
  lang,
  productName,
  productVintage,
  productType,
  glassNumber,
  initialData,
  saving = false,
  onSave,
}: SensoryWheelProps) {
  const t = COPY[lang];
  const [step, setStep] = useState(0);
  const [visual, setVisual] = useState({ ...DEFAULT_DATA.visual, ...initialData?.visual });
  const [aromas, setAromas] = useState<string[]>(initialData?.aromas ?? []);
  const [gustative, setGustative] = useState({ ...DEFAULT_DATA.gustative, ...initialData?.gustative });
  const [score, setScore] = useState(initialData?.score ?? DEFAULT_DATA.score);
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [pairingIdea, setPairingIdea] = useState(initialData?.pairingIdea ?? "");

  const toggleAroma = (id: string) => setAromas((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  const badge = score >= 95 ? 3 : score >= 90 ? 2 : score >= 85 ? 1 : 0;
  const subtitle = [productVintage, productType].filter(Boolean).join(" · ");
  const idPrefix = `sw-${glassNumber}`;

  const nav = (
    <div className="flex justify-between gap-3 pt-5 border-t border-outline-variant">
      {step > 0 ? (
        <button type="button" onClick={() => setStep(step - 1)} className={ghostBtn}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
          {t.previous}
        </button>
      ) : (
        <span />
      )}
      {step < 3 ? (
        <button type="button" onClick={() => setStep(step + 1)} className={primaryBtn}>
          {t.next}: {t.steps[step + 1]}
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave({ visual, aromas, gustative, score, notes: notes.trim(), pairingIdea: pairingIdea.trim() })}
          className={primaryBtn}
        >
          <span className={`material-symbols-outlined text-[18px] ${saving ? "animate-spin" : ""}`} aria-hidden="true">
            {saving ? "progress_activity" : "bookmark_added"}
          </span>
          {saving ? t.saving : t.save}
        </button>
      )}
    </div>
  );

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{t.glass(glassNumber)}</p>
          <h2 className="font-serif text-2xl sm:text-3xl mt-1 break-words">{productName}</h2>
          {subtitle && <p className="text-[14px] text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        <span className="rounded-full bg-primary-fixed px-3 py-1 text-[12px] font-semibold text-on-primary-fixed-variant">
          {t.selectedCount(aromas.length)}
        </span>
      </header>

      <nav aria-label={t.stepsLabel} className="grid grid-cols-4 gap-1 rounded-full bg-surface-container p-1">
        {t.steps.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-current={step === i ? "step" : undefined}
            onClick={() => setStep(i)}
            className={`h-11 rounded-full inline-flex items-center justify-center gap-1 text-[13px] font-semibold transition-colors ${
              step === i ? "bg-primary-container text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {/* La visibilidad va en el contenedor: la hoja de Material Symbols fija display:inline-block en el icono y anula `hidden`. */}
            <span className="hidden sm:inline-flex" aria-hidden="true">
              <span className="material-symbols-outlined text-[16px]">{STEP_ICONS[i]}</span>
            </span>
            {label}
          </button>
        ))}
      </nav>

      {step === 0 && (
        <div className="space-y-5">
          <StepIntro title={t.visualTitle} text={t.visualText} />
          <fieldset>
            <legend className={labelCls}>{t.colorLabel}</legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={visual.color === c.id}
                  onClick={() => setVisual({ ...visual, color: c.id })}
                  className={`flex items-center gap-2.5 min-h-12 px-3 rounded border text-left text-[14px] transition-colors ${
                    visual.color === c.id
                      ? "border-primary-container bg-primary-fixed/40 font-semibold text-primary"
                      : "border-outline-variant bg-surface-container-lowest hover:border-primary-container/50"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full border border-black/20 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                  {c.label[lang]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${idPrefix}-clarity`} className={labelCls}>
                {t.clarityLabel}
              </label>
              <select
                id={`${idPrefix}-clarity`}
                value={visual.clarity}
                onChange={(e) => setVisual({ ...visual, clarity: e.target.value })}
                className={fieldCls}
              >
                {CLARITY.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label[lang]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${idPrefix}-density`} className={labelCls}>
                {t.densityLabel}
              </label>
              <select
                id={`${idPrefix}-density`}
                value={visual.density}
                onChange={(e) => setVisual({ ...visual, density: e.target.value })}
                className={fieldCls}
              >
                {DENSITY.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {nav}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <StepIntro title={t.noseTitle} text={t.noseText} />
          <div className="space-y-3">
            {AROMA_FAMILIES.map((fam) => (
              <fieldset key={fam.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <legend className="sr-only">{fam.label[lang]}</legend>
                <div className="flex items-center justify-between gap-3 mb-3 text-[13px]">
                  <span className="font-semibold" aria-hidden="true">{fam.label[lang]}</span>
                  <span className="text-on-surface-variant">{t.selected(fam.items.filter((i) => aromas.includes(i.id)).length)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fam.items.map((item) => {
                    const on = aromas.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleAroma(item.id)}
                        className={`min-h-11 px-4 rounded-full border text-[14px] font-medium transition-colors ${on ? fam.active : fam.tone}`}
                      >
                        {on && (
                          <span className="material-symbols-outlined text-[16px] align-[-3px] mr-1" aria-hidden="true">
                            check
                          </span>
                        )}
                        {item.label[lang]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          {nav}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <StepIntro title={t.palateTitle} text={t.palateText} />
          <div className="space-y-6 rounded-xl border border-outline-variant bg-surface-container-low p-5">
            {(Object.keys(t.gustative) as GustativeKey[]).map((key) => {
              const g = t.gustative[key];
              const id = `${idPrefix}-${key}`;
              return (
                <div key={key}>
                  <div className="flex justify-between gap-3 text-[14px] mb-2">
                    <label htmlFor={id} className="font-semibold">
                      {g.label}
                    </label>
                    <span className="text-primary-container font-semibold tabular-nums">{gustative[key]} / 5</span>
                  </div>
                  <input
                    id={id}
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={gustative[key]}
                    onChange={(e) => setGustative({ ...gustative, [key]: Number(e.target.value) })}
                    className="w-full h-11 accent-primary-container cursor-pointer"
                  />
                  <div className="flex justify-between text-[12px] text-on-surface-variant" aria-hidden="true">
                    {g.ends.map((end) => (
                      <span key={end}>{end}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {nav}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <StepIntro title={t.scoreTitle} text={t.scoreText} />
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 text-center space-y-3">
            <p>
              <span className="font-serif text-6xl text-primary-container tabular-nums">{score}</span>
              <span className="text-[14px] font-semibold text-on-surface-variant ml-1">/ 100 {t.points}</span>
            </p>
            <label htmlFor={`${idPrefix}-score`} className="sr-only">
              {t.scoreLabel}
            </label>
            <input
              id={`${idPrefix}-score`}
              type="range"
              min={70}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full max-w-md h-11 accent-primary-container cursor-pointer"
            />
            <p>
              <span className="inline-block rounded-full border border-tertiary-container bg-tertiary-fixed/60 px-4 py-1.5 text-[13px] font-semibold text-on-tertiary-fixed-variant">
                {t.badges[badge]}
              </span>
            </p>
          </div>
          <div>
            <label htmlFor={`${idPrefix}-notes`} className={labelCls}>
              {t.notesLabel}
            </label>
            <textarea
              id={`${idPrefix}-notes`}
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full rounded border border-outline-variant bg-surface-container-lowest p-3 text-[15px] focus:border-primary-container focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-pairing`} className={labelCls}>
              {t.pairingLabel}
            </label>
            <input
              id={`${idPrefix}-pairing`}
              type="text"
              maxLength={200}
              value={pairingIdea}
              onChange={(e) => setPairingIdea(e.target.value)}
              placeholder={t.pairingPlaceholder}
              className={fieldCls}
            />
          </div>
          {nav}
        </div>
      )}
    </section>
  );
}

function StepIntro({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="text-[14px] text-on-surface-variant mt-1 leading-relaxed">{text}</p>
    </div>
  );
}
