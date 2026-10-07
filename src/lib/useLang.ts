"use client";

import { useCallback, useEffect, useState } from "react";
import type { Language } from "./i18n";

const STORAGE_KEY = "el_origen_lang";
const CHANGE_EVENT = "eo:lang-change";

function readStoredLang(): Language | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "es" || saved === "en" ? saved : null;
  } catch {
    return null;
  }
}

/**
 * Idioma de la interfaz (ES/EN), persistido en localStorage.
 * Arranca en "es" para que el HTML del servidor y el primer render coincidan, y luego aplica el guardado.
 * Todas las instancias del hook se mantienen sincronizadas (misma pestaña y otras pestañas).
 */
export function useLang(): [Language, (l: Language) => void] {
  const [lang, setLangState] = useState<Language>("es");

  useEffect(() => {
    const saved = readStoredLang();
    if (saved) setLangState(saved);

    const onChange = (e: Event) => {
      const next = (e as CustomEvent<Language>).detail;
      if (next === "es" || next === "en") setLangState(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "es" || e.newValue === "en")) setLangState(e.newValue);
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Navegación privada o almacenamiento bloqueado: el cambio vale solo para esta vista.
    }
    window.dispatchEvent(new CustomEvent<Language>(CHANGE_EVENT, { detail: next }));
  }, []);

  return [lang, setLang];
}
