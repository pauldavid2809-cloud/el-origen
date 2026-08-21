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
    id: "tasting-vinos-coleccion",
    slug: "cata-vinos-coleccion",
    title: "Cata Vinos de Colección & Maridaje de Autor",
    subtitle: "Recorrido sensorial por cuatro etiquetas internacionales de alta gama",
    description: "Una velada íntima guiada por sommelier certificado, degustando añadas de colección de España, Francia e Italia, maridadas con tablas de quesos artesanales Sowi y charcutería selecta.",
    date: "2026-10-24",
    dateDisplay: "24 OCT",
    dateFull: "Sábado, 24 de Octubre de 2026",
    timeStart: "19:00",
    timeEnd: "21:30",
    location: "Salón Exclusivo, Caracas, Venezuela",
    price: 55,
    priceFormatted: "$55 USD",
    totalSpots: 18,
    availableSpots: 8,
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Copa de vino tinto servida en mesa de degustación con cristalería fina.",
    category: "reserva",
    wines: [
      {
        name: "Gran Reserva Rioja Alta Crianza",
        vintage: "2018",
        type: "Tempranillo - España",
        description: "Intenso color rubí brillante. Notas de cereza negra, vainilla noble, cuero y fondo especiado.",
        aromaProfile: ["Cereza", "Vainilla", "Cedro", "Pimienta negra"],
        audioStory: "Crianza lenta de 24 meses en barricas de roble francés y americano con guarda en botella."
      },
      {
        name: "Chianti Classico Gran Selezione",
        vintage: "2019",
        type: "Sangiovese - Toscana, Italia",
        description: "Taninos aterciopelados y gran vivacidad. Aromas a violetas, frutos del bosque y cacao amargo.",
        aromaProfile: ["Violetas", "Mora", "Cacao", "Tabaco dulce"],
        audioStory: "Producido en viñedos históricos en colinas toscanas de suelos arcillo-calcáreos."
      },
      {
        name: "Cabernet Sauvignon Terroir de Autor",
        vintage: "2020",
        type: "Tinto de Guarda - Valle Central",
        description: "Estructura potente y elegante, notas de cassis, grafito y final prolongado.",
        aromaProfile: ["Cassis", "Grafito", "Chocolate negro", "Eucalipto"],
        audioStory: "Una añada memorable seleccionada por su equilibrio perfecto entre fruta y madera."
      }
    ],
    pairings: [
      "Tabla de quesos madurados artesanales Sowi",
      "Jamón serrano y embutidos curados de autor",
      "Trufas de chocolate oscuro 70% maridadas al vino"
    ],
    sommelier: {
      name: "Belkis Croquer",
      role: "Head Sommelier Invitada",
      bio: "Sommelier certificada y curadora enológica, creadora de 'De Cata en Cata'.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop"
    },
    status: "active",
    createdAt: "2026-08-01T12:00:00Z"
  },
  {
    id: "tasting-atardecer-terrazas",
    slug: "cata-atardecer-terrazas",
    title: "Cata Atardecer & Terrazas",
    subtitle: "Golden Hour con Espumosos, Blancos y Rosados de Alta Gama",
    description: "Degustación al atardecer en terraza selecta de Caracas con copas de espumosos método tradicional, blancos minerales y maridajes frescos de autor.",
    date: "2026-10-28",
    dateDisplay: "28 OCT",
    dateFull: "Miércoles, 28 de Octubre de 2026",
    timeStart: "18:00",
    timeEnd: "20:30",
    location: "Terraza Lounge, Caracas, Venezuela",
    price: 45,
    priceFormatted: "$45 USD",
    totalSpots: 20,
    availableSpots: 6,
    imageUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Atardecer dorado y copas de vino en terraza.",
    category: "atardecer",
    wines: [
      {
        name: "Cava Reserva Brut Nature",
        vintage: "2021",
        type: "Espumoso Método Tradicional",
        description: "Burbuja fina y persistente, aromas de manzana verde, cítricos y notas sutiles de panadería tostada.",
        aromaProfile: ["Manzana verde", "Brioche", "Cítricos", "Flor blanca"],
        audioStory: "Crianza mínima de 18 meses sobre lías que le confiere una textura cremosa."
      },
      {
        name: "Sauvignon Blanc Selección de Cava",
        vintage: "2023",
        type: "Blanco Fresco & Mineral",
        description: "Aromático, fresco y chispeante. Notas de maracuyá, hierba fresca y pomelo.",
        aromaProfile: ["Maracuyá", "Pomelo", "Hierba cortada"],
        audioStory: "Fermentado en frío en acero inoxidable para preservar la frescura frutal."
      }
    ],
    pairings: [
      "Bruschettas de tomate confitado, albahaca y queso feta Sowi",
      "Ceviche fresco con reducción de cítricos",
      "Selección de frutos secos caramelizados"
    ],
    sommelier: {
      name: "Jaifred Pastran",
      role: "Sommelier Anfitrión",
      bio: "Especialista en maridajes contemporáneos y experiencias sensoriales dinámicas.",
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop"
    },
    status: "active",
    createdAt: "2026-08-05T12:00:00Z"
  },
  {
    id: "tasting-maratea-trattoria",
    slug: "noche-vinos-trattoria",
    title: "Noche de Vinos & Maridaje Italiano",
    subtitle: "Grandes Vinos en alianza con Maratea Trattoria",
    description: "Una experiencia culinaria exclusiva junto a Maratea Trattoria: cuatro tiempos de pastas artesanales y antipastos maridados copa a copa con vinos italianos y españoles.",
    date: "2026-11-02",
    dateDisplay: "02 NOV",
    dateFull: "Lunes, 02 de Noviembre de 2026",
    timeStart: "19:30",
    timeEnd: "22:00",
    location: "Maratea Trattoria, Caracas, Venezuela",
    price: 65,
    priceFormatted: "$65 USD",
    totalSpots: 16,
    availableSpots: 5,
    imageUrl: "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Sommelier sirviendo vino en copas de cristal en cena gourmet.",
    category: "blancos",
    wines: [
      {
        name: "Primitivo di Manduria Riserva",
        vintage: "2020",
        type: "Tinto con Cuerpo - Puglia, Italia",
        description: "Envolvente, cálido y sedoso. Notas de mermelada de higos, ciruela pasa y especias dulces.",
        aromaProfile: ["Higo", "Ciruela pasa", "Canela", "Café"],
        audioStory: "Vendimia tardía de viñedos viejos en la costa sur de Italia."
      },
      {
        name: "Pinot Grigio delle Venezie DOC",
        vintage: "2022",
        type: "Blanco Elegante",
        description: "Fresco, floral y equilibrado con matices de pera madura y flores de acacia.",
        aromaProfile: ["Pera", "Acacia", "Almendra fresca"],
        audioStory: "Acompañamiento ideal para abrir el apetito con antipastos finos."
      }
    ],
    pairings: [
      "Antipasto italiano con focaccia artesanal y burrata",
      "Pasta fresca al ragú tradicional de la trattoria",
      "Cannoli siciliani con ricota dulce"
    ],
    sommelier: {
      name: "Belkis Croquer",
      role: "Head Sommelier",
      bio: "Curadora enológica y apasionada de la armonía entre cocina y vino.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop"
    },
    status: "active",
    createdAt: "2026-08-10T12:00:00Z"
  }
];

const INITIAL_ADDONS: AddOn[] = [
  {
    id: "coleccion-bottle",
    title: "Botella de Colección para Llevar",
    description: "Botella seleccionada por el sommelier para disfrutar en casa.",
    price: 35,
    priceFormatted: "$35 USD",
    icon: "wine_bar",
    category: "bottle"
  },
  {
    id: "copas-cristal-set",
    title: "Set de 2 Copas de Cristal El Origen",
    description: "Copas de cata profesional en estuche conmemorativo.",
    price: 25,
    priceFormatted: "$25 USD",
    icon: "award_star",
    category: "experience"
  },
  {
    id: "pairing-premium",
    title: "Maridaje Extra de Quesos Sowi",
    description: "Tabla de autor con quesos madurados Sowi, jamón serrano y panes artesanales.",
    price: 20,
    priceFormatted: "$20 USD",
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
