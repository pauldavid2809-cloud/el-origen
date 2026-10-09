export type TastingCategory = "degustacion" | "reserva" | "atardecer" | "blancos" | "privada" | "icono";
export type TastingStatus = "active" | "sold_out" | "draft" | "archived";
/**
 * Tasa con la que se calcula el monto en bolívares de una cata:
 * USD / EUR = tasa oficial BCV del dólar / del euro; BINANCE = dólar paralelo (referencia del mercado P2P de Binance).
 */
export type RateCurrency = "USD" | "EUR" | "BINANCE";
export const RATE_CURRENCIES: readonly RateCurrency[] = ["USD", "EUR", "BINANCE"];

/** Métodos de pago (sin tarjeta internacional). */
export type PaymentMethodId = "pago_movil" | "transferencia" | "binance_usdt" | "zelle" | "efectivo";
export const PAYMENT_METHOD_IDS: readonly PaymentMethodId[] = ["pago_movil", "transferencia", "binance_usdt", "zelle", "efectivo"];

/** Producto a degustar (vino, destilado, cocuy…). */
export interface TastingProduct {
  name: string;
  vintage: string;
  type: string;
  description: string;
  aromaProfile: string[];
  audioStory?: string;
}

/** Adicional que el admin define para una cata concreta (botella, producto…). */
export interface TastingAddOn {
  id: string;
  title: string;
  description?: string;
  priceUsd: number;
}

/** Usuario de Instagram que se muestra en la cata (sommelier, aliado…). */
export interface TastingInstagram {
  handle: string; // "@usuario"
  label?: string;
}

export interface Tasting {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  date: string; // YYYY-MM-DD
  dateDisplay: string; // e.g. "24 OCT"
  dateFull: string; // e.g. "Sábado, 24 de octubre de 2026"
  timeStart: string; // e.g. "18:00"
  timeEnd: string; // e.g. "20:30"
  location: string;
  locationAddress?: string;
  /** Enlace de Google Maps (GPS del sitio). */
  mapsUrl?: string;
  /** Precio por cupo en divisa. Igual a `priceUsd` (se conserva por compatibilidad). */
  price: number;
  priceUsd: number;
  priceFormatted: string; // e.g. "$55 USD"
  rateCurrency: RateCurrency;
  /** Métodos de pago que acepta esta cata (se ofrecen solo los que además estén activos en Configuración). */
  paymentMethods: PaymentMethodId[];
  /** Cuenta Zelle de esta cata (id de Configuración → Zelle); null = la primera configurada. */
  zelleAccountId: string | null;
  totalSpots: number;
  availableSpots: number;
  imageUrl: string;
  imageAlt: string;
  category: TastingCategory;
  /** Productos a degustar. */
  wines: TastingProduct[];
  /** Armonías / menú. */
  pairings: string[];
  sommelierIds: string[];
  /** Primer sommelier seleccionado (compatibilidad). Campos vacíos si la cata no tiene sommelier. */
  sommelier: {
    name: string;
    role: string;
    bio: string;
    avatarUrl: string;
  };
  instagram: TastingInstagram[];
  addOns: TastingAddOn[];
  status: TastingStatus;
  createdAt: string;
  updatedAt?: string;
}

/** @deprecated Los adicionales ahora son por cata: use `TastingAddOn`. */
export interface AddOn {
  id: string;
  title: string;
  description: string;
  price: number;
  priceFormatted: string;
  icon: string;
  category: "bottle" | "transport" | "pairing" | "experience";
}

/** @deprecated Use `Coupon` de `@/lib/coupons`. */
export interface Coupon {
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  description: string;
  active: boolean;
}

export interface TastingSensoryNote {
  id: string;
  reservationToken: string;
  tastingId: string;
  attendeeName: string;
  wineIndex: number;
  wineName: string;
  visual: {
    color: string;
    clarity: string;
    density: string;
  };
  aromas: string[]; // e.g. ["Frutas Rojas", "Vainilla", "Pimienta", "Roble Tostado"]
  gustative: {
    attack: string;
    acidity: number; // 1 - 5
    tannins: number; // 1 - 5
    body: number; // 1 - 5
    persistence: number; // 1 - 5
  };
  score: number; // 50 - 100
  notes: string;
  pairingIdea: string;
  savedAt: string;
}

export interface PrivateEventInquiry {
  id: string;
  companyOrName: string;
  contactEmail: string;
  contactPhone: string;
  estimatedGuests: number;
  preferredDate: string;
  eventType: "corporate" | "anniversary" | "vip" | "team_building";
  pairingPreference: "standard" | "premium" | "asado_cordillerano";
  transportRequired: boolean;
  budgetNotes: string;
  status: "new" | "quoted" | "confirmed" | "declined";
  createdAt: string;
}

export interface EventMemoryPhoto {
  id: string;
  tastingId: string;
  tastingDate: string;
  title: string;
  url: string;
  uploadedAt: string;
  photographer: string;
}

export interface NotificationLog {
  id: string;
  type: "whatsapp_confirmation" | "whatsapp_reminder" | "email_ticket" | "internal_sale_alert";
  recipient: string;
  reservationCode: string;
  status: "sent" | "failed" | "queued";
  sentAt: string;
  previewText: string;
}
