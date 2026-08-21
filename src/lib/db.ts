import { 
  Tasting, 
  Reservation, 
  AddOn, 
  Coupon, 
  TastingSensoryNote, 
  PrivateEventInquiry, 
  EventMemoryPhoto,
  NotificationLog
} from "@/types";
import { supabase, isSupabaseConfigured } from "./supabase";
import { generateReservationCode, generateUUID } from "./utils";

// Initial seed tastings
const INITIAL_TASTINGS: Tasting[] = [
  {
    id: "tasting-malbec-reserva",
    slug: "cata-malbec-reserva",
    title: "Cata Malbec Reserva",
    subtitle: "El alma de la cordillera en cuatro copas excepcionales",
    description: "Un recorrido profundo por nuestras mejores añadas de Malbec cultivadas a 1.400 metros de altitud, maridado con quesos artesanales y charcutería de la región.",
    date: "2026-10-24",
    dateDisplay: "24 OCT",
    dateFull: "Sábado, 24 de Octubre de 2026",
    timeStart: "18:00",
    timeEnd: "20:30",
    location: "Cava Principal, Bodega El Origen, Mendoza",
    price: 45000,
    priceFormatted: "$45.000",
    totalSpots: 20,
    availableSpots: 8,
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Copa de vino tinto servida en una mesa rústica de madera en cava boutique.",
    category: "reserva",
    wines: [
      {
        name: "El Origen Malbec Single Vineyard",
        vintage: "2021",
        type: "Tinto de Altura",
        description: "Intenso color violeta profundo. Notas de ciruela madura, violetas y un fondo mineral de piedra caliza.",
        aromaProfile: ["Ciruela", "Violetas", "Grafito", "Pimienta negra"],
        audioStory: "Nuestras vides de Malbec de 1970 reciben el deshielo directo de los Andes, otorgando una concentración inigualable."
      },
      {
        name: "El Origen Gran Reserva Malbec",
        vintage: "2019",
        type: "Crianza 18 meses en Roble Francés",
        description: "Taninos aterciopelados y gran estructura. Aromas a frutos negros, cacao amargo y tostado elegante.",
        aromaProfile: ["Cacao", "Vainilla", "Mora", "Tabaco"],
        audioStory: "Crianza lenta en barricas de primer uso en nuestra cava subterránea de piedra volcánica."
      },
      {
        name: "El Origen Terroir Selección de Cava",
        vintage: "2017",
        type: "Edición Limitada de Colección",
        description: "Madurez impecable, notas de trufa, cuero noble y final prolongado de más de 20 segundos.",
        aromaProfile: ["Cuero", "Trufa", "Higo seco", "Cedro"],
        audioStory: "Una cosecha histórica en Mendoza con noches frescas que preservaron una acidez vibrante."
      }
    ],
    pairings: [
      "Queso de cabra curado en ceniza",
      "Jamón crudo de autor madurado 24 meses",
      "Trufas de chocolate negro 70% al Malbec"
    ],
    sommelier: {
      name: "Jaifred Pastran",
      role: "Head Sommelier & Admin",
      bio: "Miembro de la Asociación Internacional de Sommeliers, dedicado a transmitir la mística de los vinos de montaña.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop"
    },
    status: "active",
    createdAt: "2026-08-01T12:00:00Z"
  },
  {
    id: "tasting-atardecer-vinedo",
    slug: "atardecer-en-el-vinedo",
    title: "Atardecer en el Viñedo",
    subtitle: "Golden Hour entre hileras de vid y cordillera",
    description: "Degustación al aire libre de nuestra línea joven y rosados de prensa directa mientras el sol se esconde tras los picos nevados de la cordillera.",
    date: "2026-10-28",
    dateDisplay: "28 OCT",
    dateFull: "Miércoles, 28 de Octubre de 2026",
    timeStart: "17:30",
    timeEnd: "19:30",
    location: "Deck Panorámico del Viñedo, El Origen",
    price: 35000,
    priceFormatted: "$35.000",
    totalSpots: 25,
    availableSpots: 4,
    imageUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Atardecer dorado sobre hileras de viñedos con montañas de fondo.",
    category: "atardecer",
    wines: [
      {
        name: "El Origen Rosé de Malbec",
        vintage: "2023",
        type: "Rosado Prensado Directo",
        description: "Fresco, floral y aromático con matices de frambuesa fresca y pomelo rosado.",
        aromaProfile: ["Frambuesa", "Pomelo", "Rosas silvestres"],
        audioStory: "Cosechado a mano en las primeras horas de la madrugada para conservar los aromas más sutiles."
      },
      {
        name: "El Origen Blend Joven de Montaña",
        vintage: "2022",
        type: "Malbec - Cabernet Franc",
        description: "Jugoso, ágil y sedoso. Una explosión de frutas rojas frescas.",
        aromaProfile: ["Cereza", "Grosella", "Hierbas de montaña"],
        audioStory: "Elaborado con fermentación en piletas de hormigón sin paso por madera."
      }
    ],
    pairings: [
      "Bruschettas de tomate confitado y albahaca",
      "Empanadas mendocinas al horno de barro",
      "Frutas de estación marinadas"
    ],
    sommelier: {
      name: "Gonzalo Valenzuela",
      role: "Sommelier de Terraza",
      bio: "Especialista en maridajes contemporáneos y experiencias sensoriales al aire libre.",
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop"
    },
    status: "active",
    createdAt: "2026-08-05T12:00:00Z"
  },
  {
    id: "tasting-blancos-altura",
    slug: "blancos-de-altura",
    title: "Blancos de Altura & Mineralidad",
    subtitle: "Acidez vibrante y frescura extrema de los 1.500 metros",
    description: "Exploración sensorial de cepas blancas (Chardonnay, Torrontés de Altura, Semillón) cultivadas en las laderas más frías de la finca.",
    date: "2026-11-02",
    dateDisplay: "02 NOV",
    dateFull: "Lunes, 02 de Noviembre de 2026",
    timeStart: "11:00",
    timeEnd: "13:00",
    location: "Galería de Cristal & Sala de Barricas Blancas",
    price: 40000,
    priceFormatted: "$40.000",
    totalSpots: 18,
    availableSpots: 12,
    imageUrl: "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Sommelier vertiendo vino blanco en copas de cristal en cava con barricas de roble.",
    category: "blancos",
    wines: [
      {
        name: "El Origen Chardonnay Reserva de Altura",
        vintage: "2022",
        type: "Chardonnay con fermentación en barrica",
        description: "Notas de pera blanca, avellanas tostadas, manteca y una acidez punzante y mineral.",
        aromaProfile: ["Pera", "Avellana", "Manzana verde", "Brioche"],
        audioStory: "El suelo calcáreo aporta una mineralidad salina única que recuerda a los grandes vinos de Borgoña."
      },
      {
        name: "El Origen Semillón Viñas Viejas",
        vintage: "2021",
        type: "Semillón Tradicional",
        description: "Cera de abejas, miel suave, cítricos maduros y gran volumen en boca.",
        aromaProfile: ["Miel", "Lima", "Hierba fresca", "Cera de abeja"],
        audioStory: "Cepas patrimoniales plantadas en 1955 rescatadas con viticultura biodinámica."
      }
    ],
    pairings: [
      "Tartar de trucha de río andina",
      "Queso brie con frutos secos caramelizados",
      "Pan brioche artesanal con manteca de hierbas"
    ],
    sommelier: {
      name: "Jaifred Pastran",
      role: "Head Sommelier & Admin",
      bio: "Enamorado de la pureza de las cepas blancas de montaña.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop"
    },
    status: "active",
    createdAt: "2026-08-10T12:00:00Z"
  }
];

const INITIAL_ADDONS: AddOn[] = [
  {
    id: "gran-reserva-bottle",
    title: "Botella Malbec Gran Reserva 2020",
    description: "Botella numerada de colección firmada por el enólogo jefe para llevar a casa.",
    price: 28000,
    priceFormatted: "$28.000",
    icon: "wine_bar",
    category: "bottle"
  },
  {
    id: "private-transfer",
    title: "Traslado Privado Ida y Vuelta",
    description: "Chofer privado desde tu hotel o centro de la ciudad hasta la bodega en van ejecutiva.",
    price: 18000,
    priceFormatted: "$18.000",
    icon: "directions_car",
    category: "transport"
  },
  {
    id: "pairing-premium",
    title: "Maridaje de Quesos Madurados & Embutidos",
    description: "Tabla de autor con quesos de cabra curados, jamón serrano y panes de masa madre.",
    price: 12000,
    priceFormatted: "$12.000",
    icon: "restaurant",
    category: "pairing"
  }
];

const INITIAL_COUPONS: Coupon[] = [
  { code: "ORIGEN10", discountPercent: 10, description: "10% de bienvenida enoturística", active: true },
  { code: "SOMMELIER20", discountPercent: 20, description: "20% para miembros y sommeliers", active: true },
  { code: "VIP2024", discountPercent: 15, description: "15% cortesía especial", active: true }
];

const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: "res-1",
    token: "tok-carlos-mendoza-8492",
    code: "#EO-8492A",
    tastingId: "tasting-malbec-reserva",
    tastingTitle: "Cata Malbec Reserva",
    tastingDate: "Sábado, 24 de Octubre",
    tastingTime: "18:00 - 20:30",
    customerName: "Carlos Mendoza",
    customerEmail: "carlos.mendoza@ejemplo.com",
    customerPhone: "+54 9 261 455-8822",
    spotsCount: 2,
    dietaryRestrictions: "Ninguna",
    selectedAddOns: [
      { id: "gran-reserva-bottle", title: "Botella Malbec Gran Reserva 2020", price: 28000, quantity: 1 }
    ],
    subtotal: 118000,
    discountAmount: 11800,
    couponCode: "ORIGEN10",
    totalAmount: 106200,
    paymentMethod: "stripe",
    paymentStatus: "paid",
    checkinStatus: "checked_in",
    checkedInAt: "2026-08-20T18:15:00Z",
    checkedInBy: "M. Silva",
    createdAt: "2026-08-20T16:00:00Z"
  },
  {
    id: "res-2",
    token: "tok-lucia-ferreyra-7193",
    code: "#EO-7193B",
    tastingId: "tasting-atardecer-vinedo",
    tastingTitle: "Atardecer en el Viñedo",
    tastingDate: "Miércoles, 28 de Octubre",
    tastingTime: "17:30 - 19:30",
    customerName: "Lucía Ferreyra",
    customerEmail: "lucia.f@ejemplo.com",
    customerPhone: "+54 9 11 3499-1122",
    spotsCount: 2,
    dietaryRestrictions: "Vegetariana",
    selectedAddOns: [
      { id: "private-transfer", title: "Traslado Privado Ida y Vuelta", price: 18000, quantity: 1 }
    ],
    subtotal: 88000,
    discountAmount: 0,
    totalAmount: 88000,
    paymentMethod: "stripe",
    paymentStatus: "paid",
    checkinStatus: "pending",
    createdAt: "2026-08-21T02:30:00Z"
  },
  {
    id: "res-3",
    token: "tok-martin-rossi-6204",
    code: "#EO-6204C",
    tastingId: "tasting-blancos-altura",
    tastingTitle: "Blancos de Altura",
    tastingDate: "Lunes, 02 de Noviembre",
    tastingTime: "11:00 - 13:00",
    customerName: "Martín Rossi",
    customerEmail: "martin.rossi@ejemplo.com",
    customerPhone: "+54 9 261 887-1234",
    spotsCount: 1,
    selectedAddOns: [],
    subtotal: 40000,
    discountAmount: 0,
    totalAmount: 40000,
    paymentMethod: "bank_transfer",
    paymentStatus: "pending_transfer",
    checkinStatus: "pending",
    createdAt: "2026-08-20T10:00:00Z"
  }
];

const INITIAL_MEMORIES: EventMemoryPhoto[] = [
  {
    id: "mem-1",
    tastingId: "tasting-malbec-reserva",
    tastingDate: "2026-08-15",
    title: "Atardecer en la Cava Principal",
    url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
    photographer: "M. Silva",
    uploadedAt: "2026-08-15T21:00:00Z"
  },
  {
    id: "mem-2",
    tastingId: "tasting-malbec-reserva",
    tastingDate: "2026-08-15",
    title: "Degustación de Barricas de Roble",
    url: "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=1200&auto=format&fit=crop",
    photographer: "G. Valenzuela",
    uploadedAt: "2026-08-15T21:30:00Z"
  }
];

// Reactive In-Memory Store
class MemoryDatabase {
  private tastings: Tasting[] = [...INITIAL_TASTINGS];
  private reservations: Reservation[] = [...INITIAL_RESERVATIONS];
  private addOns: AddOn[] = [...INITIAL_ADDONS];
  private coupons: Coupon[] = [...INITIAL_COUPONS];
  private sensoryNotes: TastingSensoryNote[] = [];
  private inquiries: PrivateEventInquiry[] = [];
  private memories: EventMemoryPhoto[] = [...INITIAL_MEMORIES];
  private notifications: NotificationLog[] = [];

  // Tastings CRUD
  async getTastings(): Promise<Tasting[]> {
    return [...this.tastings];
  }

  async getTastingById(id: string): Promise<Tasting | null> {
    return this.tastings.find(t => t.id === id || t.slug === id) || null;
  }

  async createTasting(data: Omit<Tasting, "id" | "createdAt">): Promise<Tasting> {
    const newTasting: Tasting = {
      ...data,
      id: `tasting-${generateUUID().substring(0, 8)}`,
      createdAt: new Date().toISOString()
    };
    this.tastings.unshift(newTasting);
    return newTasting;
  }

  async updateTasting(id: string, data: Partial<Tasting>): Promise<Tasting | null> {
    const index = this.tastings.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.tastings[index] = { ...this.tastings[index], ...data };
    return this.tastings[index];
  }

  async deleteTasting(id: string): Promise<boolean> {
    const initialLen = this.tastings.length;
    this.tastings = this.tastings.filter(t => t.id !== id);
    return this.tastings.length < initialLen;
  }

  // Add-ons & Coupons
  async getAddOns(): Promise<AddOn[]> {
    return [...this.addOns];
  }

  async validateCoupon(code: string): Promise<Coupon | null> {
    const coupon = this.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);
    return coupon || null;
  }

  async getCoupons(): Promise<Coupon[]> {
    return [...this.coupons];
  }

  async createCoupon(coupon: Coupon): Promise<Coupon> {
    this.coupons.push(coupon);
    return coupon;
  }

  // Reservations
  async getReservations(): Promise<Reservation[]> {
    return [...this.reservations];
  }

  async getReservationByIdOrToken(identifier: string): Promise<Reservation | null> {
    return this.reservations.find(r => 
      r.id === identifier || 
      r.token === identifier || 
      r.code.toLowerCase() === identifier.toLowerCase()
    ) || null;
  }

  async createReservation(params: {
    tastingId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    spotsCount: number;
    dietaryRestrictions?: string;
    selectedAddOns?: { id: string; quantity: number }[];
    couponCode?: string;
    paymentMethod: "stripe" | "bank_transfer" | "test";
    notes?: string;
  }): Promise<{ reservation: Reservation; tasting: Tasting }> {
    const tasting = await this.getTastingById(params.tastingId);
    if (!tasting) throw new Error("Cata no encontrada");
    if (tasting.availableSpots < params.spotsCount) {
      throw new Error(`Solo quedan ${tasting.availableSpots} cupos disponibles`);
    }

    // Calculate pricing
    const tastingSubtotal = tasting.price * params.spotsCount;
    let addOnsSubtotal = 0;
    const resolvedAddOns: Reservation["selectedAddOns"] = [];

    if (params.selectedAddOns && params.selectedAddOns.length > 0) {
      for (const item of params.selectedAddOns) {
        const found = this.addOns.find(a => a.id === item.id);
        if (found && item.quantity > 0) {
          const itemTotal = found.price * item.quantity;
          addOnsSubtotal += itemTotal;
          resolvedAddOns.push({
            id: found.id,
            title: found.title,
            price: found.price,
            quantity: item.quantity
          });
        }
      }
    }

    const subtotal = tastingSubtotal + addOnsSubtotal;
    let discountAmount = 0;

    if (params.couponCode) {
      const validCoupon = await this.validateCoupon(params.couponCode);
      if (validCoupon && validCoupon.discountPercent) {
        discountAmount = Math.round((subtotal * validCoupon.discountPercent) / 100);
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const token = generateUUID();
    const code = generateReservationCode();

    const newReservation: Reservation = {
      id: generateUUID(),
      token,
      code,
      tastingId: tasting.id,
      tastingTitle: tasting.title,
      tastingDate: tasting.dateFull || tasting.dateDisplay,
      tastingTime: `${tasting.timeStart} - ${tasting.timeEnd}`,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      spotsCount: params.spotsCount,
      dietaryRestrictions: params.dietaryRestrictions,
      selectedAddOns: resolvedAddOns,
      subtotal,
      discountAmount,
      couponCode: params.couponCode,
      totalAmount,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentMethod === "bank_transfer" ? "pending_transfer" : "paid",
      checkinStatus: "pending",
      notes: params.notes,
      createdAt: new Date().toISOString()
    };

    // Deduct available spots
    tasting.availableSpots = Math.max(0, tasting.availableSpots - params.spotsCount);
    if (tasting.availableSpots === 0) {
      tasting.status = "sold_out";
    }

    this.reservations.unshift(newReservation);
    return { reservation: newReservation, tasting };
  }

  async checkInReservation(tokenOrCode: string, checkedInBy: string = "Admin Sommelier"): Promise<{ success: boolean; reservation?: Reservation; message: string }> {
    const reservation = await this.getReservationByIdOrToken(tokenOrCode);
    if (!reservation) {
      return { success: false, message: "Reserva no encontrada." };
    }

    if (reservation.checkinStatus === "checked_in") {
      return {
        success: false,
        reservation,
        message: `Entrada ya utilizada previamente el ${new Date(reservation.checkedInAt || "").toLocaleString("es-CL")}.`
      };
    }

    reservation.checkinStatus = "checked_in";
    reservation.checkedInAt = new Date().toISOString();
    reservation.checkedInBy = checkedInBy;

    return {
      success: true,
      reservation,
      message: `¡Check-in exitoso! Bienvenido ${reservation.customerName}.`
    };
  }

  async updatePaymentStatus(id: string, status: Reservation["paymentStatus"]): Promise<Reservation | null> {
    const res = this.reservations.find(r => r.id === id);
    if (!res) return null;
    res.paymentStatus = status;
    return res;
  }

  // Sensory Tasting Notes
  async saveSensoryNote(note: Omit<TastingSensoryNote, "id" | "savedAt">): Promise<TastingSensoryNote> {
    const newNote: TastingSensoryNote = {
      ...note,
      id: generateUUID(),
      savedAt: new Date().toISOString()
    };
    this.sensoryNotes.push(newNote);
    return newNote;
  }

  async getSensoryNotesByToken(token: string): Promise<TastingSensoryNote[]> {
    return this.sensoryNotes.filter(n => n.reservationToken === token);
  }

  // B2B Private Inquiries
  async createPrivateInquiry(inquiry: Omit<PrivateEventInquiry, "id" | "createdAt" | "status">): Promise<PrivateEventInquiry> {
    const newInquiry: PrivateEventInquiry = {
      ...inquiry,
      id: generateUUID(),
      status: "new",
      createdAt: new Date().toISOString()
    };
    this.inquiries.unshift(newInquiry);
    return newInquiry;
  }

  async getPrivateInquiries(): Promise<PrivateEventInquiry[]> {
    return [...this.inquiries];
  }

  async updateInquiryStatus(id: string, status: PrivateEventInquiry["status"]): Promise<PrivateEventInquiry | null> {
    const item = this.inquiries.find(i => i.id === id);
    if (!item) return null;
    item.status = status;
    return item;
  }

  // Memories
  async getMemories(tastingId?: string): Promise<EventMemoryPhoto[]> {
    if (tastingId) {
      return this.memories.filter(m => m.tastingId === tastingId);
    }
    return [...this.memories];
  }

  async addMemory(memory: Omit<EventMemoryPhoto, "id" | "uploadedAt">): Promise<EventMemoryPhoto> {
    const newMem: EventMemoryPhoto = {
      ...memory,
      id: generateUUID(),
      uploadedAt: new Date().toISOString()
    };
    this.memories.unshift(newMem);
    return newMem;
  }

  // Notifications
  async logNotification(log: Omit<NotificationLog, "id" | "sentAt">): Promise<NotificationLog> {
    const newLog: NotificationLog = {
      ...log,
      id: generateUUID(),
      sentAt: new Date().toISOString()
    };
    this.notifications.unshift(newLog);
    return newLog;
  }

  async getNotifications(): Promise<NotificationLog[]> {
    return [...this.notifications];
  }
}

// Global Singleton
const globalForDb = global as unknown as { dbInstance?: MemoryDatabase };
export const db = globalForDb.dbInstance ?? new MemoryDatabase();
if (process.env.NODE_ENV !== "production") globalForDb.dbInstance = db;
