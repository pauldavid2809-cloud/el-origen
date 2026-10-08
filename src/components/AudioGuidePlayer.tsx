"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import type { Language } from "@/lib/i18n";
import { teamInitials } from "@/lib/team";

/* Guía narrada de cada copa: lee en voz alta la historia que el admin escribió para el producto
   (síntesis de voz del navegador) y siempre ofrece el texto para leerlo. */

const COPY = {
  es: {
    badge: "Guía de la copa",
    listen: "Escuchar",
    stop: "Detener",
    showText: "Leer el texto",
    hideText: "Ocultar el texto",
    noVoice: "Su navegador no puede leer el texto en voz alta; puede leerlo aquí.",
  },
  en: {
    badge: "Glass guide",
    listen: "Listen",
    stop: "Stop",
    showText: "Read the text",
    hideText: "Hide the text",
    noVoice: "Your browser cannot read the text aloud; you can read it here.",
  },
};

interface AudioGuidePlayerProps {
  lang: Language;
  title: string;
  storyText: string;
  /** Sommelier que guía la cata (se muestra con monograma mientras no haya foto). */
  guideName?: string;
  guideRole?: string;
  /** Idioma en que está escrito el texto (los textos del admin están en español). */
  textLang?: Language;
}

export function AudioGuidePlayer({ lang, title, storyText, guideName, guideRole, textLang = "es" }: AudioGuidePlayerProps) {
  const t = COPY[lang];
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textId = useId();

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
  }, []);

  // Al cambiar de copa o salir de la página se corta la lectura.
  useEffect(() => {
    setProgress(0);
    setSpeaking(false);
    return () => {
      if (utteranceRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
        utteranceRef.current = null;
        window.speechSynthesis.cancel();
      }
    };
  }, [storyText]);

  const stop = () => {
    utteranceRef.current = null;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setProgress(0);
  };

  const play = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(storyText);
    const prefix = textLang === "es" ? "es" : "en";
    const voices = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith(prefix));
    const voice = voices.find((v) => /VE|419|MX|US/i.test(v.lang)) ?? voices[0];
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? (prefix === "es" ? "es-VE" : "en-US");
    utterance.rate = 0.95;
    utterance.onboundary = (e) => {
      if (utteranceRef.current === utterance) setProgress(Math.min(1, e.charIndex / Math.max(1, storyText.length)));
    };
    const finish = () => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      setSpeaking(false);
      setProgress(0);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    utteranceRef.current = utterance;
    setSpeaking(true);
    setProgress(0);
    synth.speak(utterance);
  };

  const textVisible = showText || !supported;

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <span
            className="w-12 h-12 rounded-full bg-primary-container text-white font-serif text-[17px] flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            {guideName ? teamInitials(guideName) : <span className="material-symbols-outlined">record_voice_over</span>}
          </span>
          <div className="min-w-0">
            <p className="eyebrow">{t.badge}</p>
            <h3 className="font-serif text-lg leading-tight mt-0.5 break-words">{title}</h3>
            {guideName && (
              <p className="text-[13px] text-on-surface-variant">
                {guideName}
                {guideRole ? ` · ${guideRole}` : ""}
              </p>
            )}
          </div>
        </div>

        {supported && (
          <button
            type="button"
            onClick={speaking ? stop : play}
            className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              {speaking ? "stop" : "play_arrow"}
            </span>
            {speaking ? t.stop : t.listen}
          </button>
        )}
      </div>

      {supported && (
        <div className="mt-4 h-1 w-full rounded-full bg-surface-container overflow-hidden" aria-hidden="true">
          <div className="h-full bg-primary-container transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      {supported ? (
        <button
          type="button"
          onClick={() => setShowText(!showText)}
          aria-expanded={showText}
          aria-controls={textId}
          className="mt-2 inline-flex items-center gap-1 min-h-11 text-[13px] font-semibold text-on-surface-variant hover:text-primary-container"
        >
          {showText ? t.hideText : t.showText}
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {showText ? "expand_less" : "expand_more"}
          </span>
        </button>
      ) : (
        <p className="mt-3 text-[13px] text-on-surface-variant">{t.noVoice}</p>
      )}

      {textVisible && (
        <p id={textId} lang={textLang} className="mt-2 rounded-xl bg-surface-container-low p-4 text-[15px] leading-relaxed text-on-surface-variant">
          {storyText}
        </p>
      )}
    </section>
  );
}
