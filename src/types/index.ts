export interface Tasting {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  date: string; // YYYY-MM-DD
  dateDisplay: string; // e.g. "24 OCT"
  dateFull: string; // e.g. "Sábado, 24 de Octubre de 2024"
  timeStart: string; // e.g. "18:00"
  timeEnd: string; // e.g. "20:30"
  location: string;
  price: number; // in CLP / ARS / USD representation, e.g., 45000
  priceFormatted: string; // e.g. "$45.000"
  totalSpots: number;
  availableSpots: number;
  imageUrl: string;
  imageAlt: string;
  category: "reserva" | "atardecer" | "blancos" | "privada" | "icono";
  wines: {
    name: string;
    vintage: string;
    type: string;
    description: string;
    aromaProfile: string[];
    audioStory?: string;
  }[];
  pairings: string[];
  sommelier: {
    name: string;
    role: string;
    bio: string;
    avatarUrl: string;
  };
  status: "active" | "sold_out" | "draft" | "archived";
  createdAt: string;
}

export interface AddOn {
  id: string;
  title: string;
  description: string;
  price: number;
  priceFormatted: string;
  icon: string;
  category: "bottle" | "transport" | "pairing" | "experience";
}

export interface Coupon {
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  description: string;
  active: boolean;
}

export interface Reservation {
  id: string;
  token: string;
  code: string; // e.g. "#EO-8492A"
  tastingId: string;
  tastingTitle: string;
  tastingDate: string;
  tastingTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  spotsCount: number;
  dietaryRestrictions?: string;
  selectedAddOns: {
    id: string;
    title: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentMethod: "stripe" | "bank_transfer" | "test";
  paymentStatus: "paid" | "pending_transfer" | "cancelled";
  transferReceiptUrl?: string;
  checkinStatus: "pending" | "checked_in";
  checkedInAt?: string;
  checkedInBy?: string;
  createdAt: string;
  notes?: string;
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
