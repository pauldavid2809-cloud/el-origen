"use client";

import { useCallback, useEffect, useState } from "react";
import { WINE_MAX_PER_ORDER_LIMIT, WINE_ORDER_MAX_BOTTLES, WINE_ORDER_MAX_LINES } from "./wineSale";

/* Carrito de vinos: vive en el navegador (localStorage), no en el servidor. El servidor nunca confía en él:
   al comprar relee cada vino y recalcula precios y cantidades. */

const STORAGE_KEY = "eo_wine_cart_v1";
/** Aviso a las demás instancias del hook en la misma pestaña (el evento `storage` solo llega a las otras pestañas). */
const CHANGE_EVENT = "eo:wine-cart-change";

export interface WineCartItem {
  wineId: string;
  quantity: number;
}

/** Por qué `add` dejó la cantidad por debajo de lo pedido: tope del vino, de vinos distintos o de botellas del pedido. */
export type WineCartLimit = "max" | "lines" | "bottles";

export interface WineCartAddResult {
  /** Cantidad de ese vino que quedó en el carrito. */
  quantity: number;
  /** Se agregó todo lo pedido (o ya estaba al tope sin poder agregar más: ver `limit`). */
  limit: WineCartLimit | null;
}

/** Respaldo cuando localStorage está bloqueado (navegación privada, cookies desactivadas): el carrito dura mientras la pestaña. */
let memoryItems: WineCartItem[] = [];

/** Valida lo guardado: otra versión, otra pestaña o el usuario pudieron dejar cualquier cosa. */
function sanitize(raw: unknown): WineCartItem[] {
  const list = (raw as { items?: unknown } | null)?.items;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const items: WineCartItem[] = [];
  for (const entry of list) {
    const wineId = typeof entry?.wineId === "string" ? entry.wineId : "";
    const quantity = Math.floor(Number(entry?.quantity));
    if (!wineId || seen.has(wineId) || !Number.isFinite(quantity) || quantity < 1) continue;
    seen.add(wineId);
    items.push({ wineId, quantity: Math.min(quantity, WINE_MAX_PER_ORDER_LIMIT) });
    if (items.length >= WINE_ORDER_MAX_LINES) break;
  }
  return items;
}

function readCart(): WineCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    memoryItems = raw ? sanitize(JSON.parse(raw)) : [];
    return memoryItems;
  } catch {
    return memoryItems;
  }
}

function writeCart(items: WineCartItem[]): void {
  memoryItems = items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  } catch {
    // Almacenamiento bloqueado o lleno: el carrito sigue en memoria mientras la pestaña esté abierta.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

const bottlesOf = (items: WineCartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);

/**
 * Lógica de `add` sin navegador: devuelve el carrito resultante (null si no cambia) y qué quedó.
 * Topes: `max` del vino (y 24), 20 vinos distintos y 36 botellas por pedido.
 */
export function addToItems(
  current: WineCartItem[],
  wineId: string,
  qty: number,
  max: number
): { items: WineCartItem[] | null; result: WineCartAddResult } {
  const existing = current.find((i) => i.wineId === wineId);
  const have = existing?.quantity ?? 0;
  const want = Math.floor(qty);
  if (!(want >= 1)) return { items: null, result: { quantity: have, limit: null } };
  if (!existing && current.length >= WINE_ORDER_MAX_LINES) return { items: null, result: { quantity: 0, limit: "lines" } };

  const perWine = Math.max(1, Math.min(Math.floor(max) || 1, WINE_MAX_PER_ORDER_LIMIT));
  const room = WINE_ORDER_MAX_BOTTLES - (bottlesOf(current) - have);
  const allowed = Math.min(perWine, room);
  const next = Math.min(have + want, allowed);
  const limit: WineCartLimit | null = next >= have + want ? null : allowed === perWine ? "max" : "bottles";
  // Ya estaba al tope (o por encima): no se agrega nada.
  if (next <= have) return { items: null, result: { quantity: have, limit: limit ?? "max" } };
  const items = existing ? current.map((i) => (i.wineId === wineId ? { ...i, quantity: next } : i)) : [...current, { wineId, quantity: next }];
  return { items, result: { quantity: next, limit } };
}

export interface WineCart {
  items: WineCartItem[];
  /** Botellas en total (suma de cantidades). */
  count: number;
  /** Suma `qty` botellas del vino (hasta `max`, el tope del vino, y los topes del pedido). */
  add: (wineId: string, qty: number, max: number) => WineCartAddResult;
  /** Fija la cantidad de un vino (0 o menos lo quita). */
  setQty: (wineId: string, qty: number) => void;
  remove: (wineId: string) => void;
  clear: () => void;
  /** false hasta leer el carrito guardado (en el servidor y en el primer render el carrito siempre está vacío). */
  ready: boolean;
}

/**
 * Carrito de vinos. `localStorage["eo_wine_cart_v1"] = { items: [{ wineId, quantity }] }`.
 * Tolera localStorage bloqueado y se mantiene sincronizado entre instancias y pestañas.
 */
export function useWineCart(): WineCart {
  const [items, setItems] = useState<WineCartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
    const refresh = () => setItems(readCart());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) refresh();
    };
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const add = useCallback((wineId: string, qty: number, max: number): WineCartAddResult => {
    // Siempre se parte de lo guardado (no del estado): otra pestaña pudo cambiar el carrito.
    const { items: next, result } = addToItems(readCart(), wineId, qty, max);
    if (next) writeCart(next);
    return result;
  }, []);

  const setQty = useCallback((wineId: string, qty: number) => {
    const current = readCart();
    if (!current.some((i) => i.wineId === wineId)) return;
    const q = Math.floor(qty);
    if (!(q >= 1)) {
      writeCart(current.filter((i) => i.wineId !== wineId));
      return;
    }
    writeCart(current.map((i) => (i.wineId === wineId ? { ...i, quantity: Math.min(q, WINE_MAX_PER_ORDER_LIMIT) } : i)));
  }, []);

  const remove = useCallback((wineId: string) => {
    writeCart(readCart().filter((i) => i.wineId !== wineId));
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  return { items, count: bottlesOf(items), add, setQty, remove, clear, ready };
}
