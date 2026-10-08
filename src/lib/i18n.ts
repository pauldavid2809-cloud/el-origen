import { PURCHASE_POLICIES } from "./policies";

export type Language = "es" | "en";

/* Textos compartidos de la estructura del sitio (barra, pie, portada y catálogo).
   La copia propia de cada página interior vive en un `copy.ts` junto a esa página. */

/** Políticas de compra (texto literal del cliente), reutilizadas en las preguntas frecuentes. */
const POLICY = {
  es: {
    guarantee: PURCHASE_POLICIES.es[0].body,
    cancellation: PURCHASE_POLICIES.es[2].body,
    punctuality: PURCHASE_POLICIES.es[3].body,
  },
  en: {
    guarantee: PURCHASE_POLICIES.en[0].body,
    cancellation: PURCHASE_POLICIES.en[2].body,
    punctuality: PURCHASE_POLICIES.en[3].body,
  },
};

/** Lema del cliente. */
export const MOTTO: Record<Language, string> = {
  es: "El Origen, allí el inicio de todo",
  en: "El Origen, where it all begins",
};

export const translations = {
  es: {
    nav: {
      catas: "Catas",
      privadas: "Privadas",
      alianzas: "Alianzas",
      nosotros: "Nosotros",
      sommeliers: "Sommeliers",
      contacto: "Contacto",
      admin: "Admin",
      reservar: "Reservar",
      mainLabel: "Principal",
      mobileLabel: "Menú",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      switchLang: "Switch to English",
      home: "El Origen — inicio",
    },
    hero: {
      eyebrow: "Caracas, Venezuela · Catas guiadas",
      titleMain: "El Origen, allí el inicio",
      titleHighlight: "de todo",
      subtitle:
        "Experiencias exclusivas de cata guiada para quienes buscan conectar a través del paladar, el aprendizaje y el networking de alto nivel.",
      ctaPrimary: "Ver próximas catas",
      ctaSecondary: "Crear mi Cuenta Origen",
      imageAlt: "Copa de vino tinto servida en una cata",
      nextTasting: "Próxima cata",
      stats: [
        { value: "1 a 2 horas", label: "Duración de cada cata" },
        { value: "Grupos reducidos", label: "Cupos limitados" },
        { value: "QR por persona", label: "Entrada individual" },
      ],
    },
    tastings: {
      badge: "Agenda",
      title: "Próximas catas",
      subtitle:
        "Cada fecha indica los productos a degustar, el menú, el lugar, el horario y el sommelier que la guía. Precio en divisas y en bolívares a tasa BCV del día.",
      viewAll: "Ver todas las catas",
      loading: "Cargando catas…",
      soldOut: "Agotado",
      spots: "cupos",
      spot: "cupo",
      perPerson: "por persona",
      bsApprox: (bs: string) => `≈ Bs ${bs}`,
      bsTitle: (currency: string) => `Tasa BCV ${currency === "EUR" ? "del euro" : "del dólar"} del día`,
      noImage: "Cata de El Origen",
      emptyBadge: "Muy pronto",
      emptyTitle: "Estamos preparando las próximas fechas",
      emptyText:
        "Crea tu Cuenta Origen y entérate primero cuando publiquemos una nueva cata. Es gratis y toma menos de un minuto.",
      emptyCta: "Crear mi Cuenta Origen",
      emptySecondary: "Escríbenos por WhatsApp",
      emptyWhatsapp: "Hola El Origen, quisiera saber cuándo será la próxima cata.",
      errorTitle: "No pudimos cargar las catas",
      errorText: "Revisa tu conexión e inténtalo de nuevo.",
      retry: "Reintentar",
    },
    categories: {
      degustacion: "Degustación guiada",
      reserva: "Reserva de cava",
      atardecer: "Atardecer",
      blancos: "Blancos",
      privada: "Privada",
      icono: "Ícono",
    },
    catalog: {
      badge: "Agenda de catas",
      title: "Catas & experiencias guiadas",
      subtitle:
        "Reserva en línea tu cupo (hasta 10 por reserva) y recibe una entrada con código QR por cada persona.",
      filterAll: "Todas",
      filterLabel: "Filtrar por tipo de cata",
      searchPlaceholder: "Buscar por nombre, producto o fecha…",
      loading: "Cargando catas…",
      count: (n: number) => (n === 1 ? "1 cata disponible" : `${n} catas disponibles`),
      noResultsTitle: "Ninguna cata coincide",
      noResultsSubtitle: "Prueba con otra búsqueda o quita los filtros.",
      resetFilters: "Quitar filtros",
      privateBadge: "Privadas & corporativas",
      privateTitle: "Experiencias Privadas & Eventos Corporativos",
      privateSubtitle: "Diseñamos veladas de cata a medida para marcas, empresas y celebraciones exclusivas.",
      privateCta: "Solicitar Propuesta Privada",
    },
    story: {
      badge: "Nosotros",
      title: "Una firma de experiencias exclusivas",
      p1: "El Origen nació en Caracas a inicios de 2026, impulsado por una visión clara: transformar la manera en que se vive la gastronomía y los licores de alta gama en Venezuela. Lo que comenzó como un concepto íntimo de catas guiadas evolucionó rápidamente en una firma de experiencias exclusivas, diseñadas para quienes buscan conectar a través del paladar, el aprendizaje y el networking de alto nivel.",
      p2: "Desde nuestras primeras ediciones dedicadas al fascinante universo del vino y las grandes etiquetas El Origen se ha consolidado como un punto de encuentro para apasionados, coleccionistas y marcas de prestigio.",
      imageMainAlt: "Copa de vino tinto frente a un viñedo",
      imageSideAlt: "Tanques de acero en una bodega",
      ritual: [
        { n: "01", title: "Curaduría", text: "Vinos, destilados y grandes etiquetas elegidos con un hilo conductor en cada edición." },
        { n: "02", title: "Maridaje", text: "Armonías y menú de autor junto a restaurantes aliados de Caracas." },
        { n: "03", title: "Conversación", text: "Grupos reducidos guiados por sommeliers, para aprender y conectar sin prisa." },
      ],
      cta: "Conocer nuestra historia",
    },
    team: {
      badge: "Sommeliers",
      title: "Quienes dirigen cada cata",
      subtitle: "Sommeliers, catadores y embajadores de marca que guían cada experiencia de El Origen.",
      cta: "Conocer al equipo",
      join: "¿Eres sommelier? Únete a nuestra red",
      instagram: (handle: string) => `Instagram de ${handle}`,
    },
    liveDemo: {
      badge: "Incluida en cada cata",
      title: "Ficha de cata interactiva",
      description:
        "Durante la cata, cada asistente abre desde su teléfono la rueda de aromas, toma sus notas y califica cada copa. Al final se lleva su certificado de degustador.",
      note: "El certificado es un recuerdo simbólico de la experiencia; no tiene validez oficial.",
      cta: "Probar la ficha",
    },
    partners: {
      badge: "Aliados",
      title: "Aliados de El Origen",
      subtitle: "Marcas, casas y restaurantes que hacen posible cada edición.",
      viewProfile: (name: string) => `Ver Instagram de ${name}`,
    },
    commercialShowcase: {
      eyebrow: "Alianzas Comerciales & Marcas Aliadas",
      main: {
        badge: "Para marcas",
        title: "Posiciona tu etiqueta en la mesa correcta.",
        subtitle: "Conectamos marcas de prestigio con un público selecto a través de experiencias gastronómicas de alto nivel.",
        modalitiesLabel: "Modalidades de participación",
        modalities: [
          { key: "A", label: "Marca Protagonista de Edición" },
          { key: "B", label: "Aliado de Experiencia / Co-Sponsor" },
          { key: "C", label: "Activaciones & Eventos Privados B2B" },
        ],
        ctaPrimary: "Solicitar Dossier para Marcas",
        ctaSecondary: "Conversar por WhatsApp",
        whatsapp: "Hola, me gustaría conversar sobre una alianza comercial o patrocinio de marca con El Origen.",
      },
      sommeliers: {
        badge: "Red de sommeliers",
        title: "Únete a nuestra red de sommeliers & directores de cata",
        subtitle:
          "Nos encontramos en constante búsqueda de sommeliers, especialistas en catas y embajadores de marca con pasión por la docencia sensorial y la maestría en mesa.",
        highlight: "Vinos · Whisky · Cocuy · Habanos",
        cta: "Postularme",
      },
      private: {
        badge: "Privadas & corporativas",
        title: "Experiencias Privadas & Eventos Corporativos",
        subtitle: "Diseñamos veladas de cata a medida para marcas, empresas y celebraciones exclusivas.",
        highlight: "De 10 a 60 invitados",
        cta: "Solicitar propuesta",
      },
    },
    faq: {
      badge: "Preguntas frecuentes",
      title: "Antes de tu cata",
      items: [
        {
          q: "¿Cuánto dura una cata?",
          a: "Entre 1 y 2 horas, aproximadamente. Cada cata indica su horario, los productos a degustar, el menú o armonías, el lugar y el sommelier que la guía.",
        },
        {
          q: "¿Qué métodos de pago aceptan?",
          a: "Pago Móvil y transferencia en bolívares (Banco de Venezuela y Mercantil) a la tasa BCV del día, Binance USDT y efectivo con entrega previa acordada. Por ahora no aceptamos tarjetas internacionales.",
        },
        {
          q: "¿Cuándo queda confirmado mi cupo?",
          a: `${POLICY.es.guarantee} Al reservar, tus cupos quedan apartados por 60 minutos mientras envías el comprobante.`,
        },
        {
          q: "¿Qué pasa si no puedo asistir?",
          a: POLICY.es.cancellation,
        },
        {
          q: "¿A qué hora debo llegar?",
          a: POLICY.es.punctuality,
        },
        {
          q: "¿Cómo son las entradas?",
          a: "Cada persona tiene su propia entrada con código QR. Si reservas varios cupos recibes un QR por cupo, para que cada invitado tenga el suyo aunque lleguen por separado; si quieres, puedes poner el nombre de cada asistente.",
        },
        {
          // Mismo límite que MAX_SPOTS_PER_ORDER (src/lib/orders.ts).
          q: "¿Cuántos cupos puedo reservar?",
          a: "Hasta 10 cupos por reserva. Para grupos más grandes diseñamos una experiencia privada a la medida.",
        },
        {
          q: "¿Pueden tener en cuenta alergias o restricciones alimentarias?",
          a: "Sí, al reservar puedes indicarnos tus alergias o restricciones alimentarias para tenerlas en cuenta.",
        },
      ],
    },
    contactSection: {
      badge: "Contacto",
      title: "Conversemos",
      subtitle: (owner: string) =>
        `${owner} te atiende por WhatsApp para reservas, catas privadas y alianzas.`,
      whatsapp: "Escribir por WhatsApp",
      account: "Crear mi Cuenta Origen",
      hours: "Horario de atención",
    },
    concierge: {
      label: "Atención al cliente",
      aria: "Atención al cliente por WhatsApp",
      message: "Hola El Origen, quisiera consultar por las catas.",
    },
    footer: {
      description: "Catas guiadas y experiencias de gastronomía y licores de alta gama en Caracas, Venezuela.",
      explore: "Explorar",
      contact: "Contacto",
      hours: "Horario de atención",
      customerService: "Atención al cliente",
      email: "Correo",
      legal: "Legal",
      privacy: "Política de Privacidad",
      terms: "Términos y Condiciones",
      copyright: (year: number) => `© ${year} El Origen.`,
    },
  },
  en: {
    nav: {
      catas: "Tastings",
      privadas: "Private",
      alianzas: "Partnerships",
      nosotros: "About",
      sommeliers: "Sommeliers",
      contacto: "Contact",
      admin: "Admin",
      reservar: "Book",
      mainLabel: "Main",
      mobileLabel: "Menu",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      switchLang: "Cambiar a español",
      home: "El Origen — home",
    },
    hero: {
      eyebrow: "Caracas, Venezuela · Guided tastings",
      titleMain: "El Origen, where it all",
      titleHighlight: "begins",
      subtitle:
        "Exclusive guided tasting experiences for those who seek to connect through the palate, learning and high-level networking.",
      ctaPrimary: "See upcoming tastings",
      ctaSecondary: "Create my Origen Account",
      imageAlt: "Glass of red wine served at a tasting",
      nextTasting: "Next tasting",
      stats: [
        { value: "1 to 2 hours", label: "Length of each tasting" },
        { value: "Small groups", label: "Limited spots" },
        { value: "One QR per guest", label: "Individual ticket" },
      ],
    },
    tastings: {
      badge: "Calendar",
      title: "Upcoming tastings",
      subtitle:
        "Each date lists the products to taste, the menu, the venue, the schedule and the sommelier leading it. Prices in US dollars and in bolívars at the BCV rate of the day.",
      viewAll: "View all tastings",
      loading: "Loading tastings…",
      soldOut: "Sold out",
      spots: "spots",
      spot: "spot",
      perPerson: "per person",
      bsApprox: (bs: string) => `≈ Bs ${bs}`,
      bsTitle: (currency: string) => `BCV ${currency === "EUR" ? "euro" : "dollar"} rate of the day`,
      noImage: "El Origen tasting",
      emptyBadge: "Coming soon",
      emptyTitle: "We are preparing the next dates",
      emptyText:
        "Create your Origen Account and be the first to know when we announce a new tasting. It is free and takes less than a minute.",
      emptyCta: "Create my Origen Account",
      emptySecondary: "Message us on WhatsApp",
      emptyWhatsapp: "Hello El Origen, I would like to know when the next tasting will be.",
      errorTitle: "We could not load the tastings",
      errorText: "Check your connection and try again.",
      retry: "Try again",
    },
    categories: {
      degustacion: "Guided tasting",
      reserva: "Cellar reserve",
      atardecer: "Sunset",
      blancos: "White wines",
      privada: "Private",
      icono: "Icon",
    },
    catalog: {
      badge: "Tasting calendar",
      title: "Guided tastings & experiences",
      subtitle: "Book your spots online (up to 10 per booking) and get a QR ticket for each guest.",
      filterAll: "All",
      filterLabel: "Filter by tasting type",
      searchPlaceholder: "Search by name, product or date…",
      loading: "Loading tastings…",
      count: (n: number) => (n === 1 ? "1 tasting available" : `${n} tastings available`),
      noResultsTitle: "No tastings match",
      noResultsSubtitle: "Try another search or clear the filters.",
      resetFilters: "Clear filters",
      privateBadge: "Private & corporate",
      privateTitle: "Private Experiences & Corporate Events",
      privateSubtitle: "We design bespoke tasting evenings for brands, companies and exclusive celebrations.",
      privateCta: "Request a Private Proposal",
    },
    story: {
      badge: "About us",
      title: "A firm of exclusive experiences",
      p1: "El Origen was born in Caracas in early 2026, driven by a clear vision: to transform the way high-end gastronomy and spirits are experienced in Venezuela. What began as an intimate guided-tasting concept quickly grew into a firm of exclusive experiences, designed for those who seek to connect through the palate, learning and high-level networking.",
      p2: "Since our first editions devoted to the fascinating world of wine and great labels, El Origen has become a meeting point for enthusiasts, collectors and prestigious brands.",
      imageMainAlt: "Glass of red wine overlooking a vineyard",
      imageSideAlt: "Steel tanks in a winery cellar",
      ritual: [
        { n: "01", title: "Curation", text: "Wines, spirits and great labels chosen with a common thread for every edition." },
        { n: "02", title: "Pairing", text: "Signature menus and pairings with partner restaurants in Caracas." },
        { n: "03", title: "Conversation", text: "Small groups guided by sommeliers, to learn and connect at an unhurried pace." },
      ],
      cta: "Read our story",
    },
    team: {
      badge: "Sommeliers",
      title: "The people behind every tasting",
      subtitle: "Sommeliers, judges and brand ambassadors who lead every El Origen experience.",
      cta: "Meet the team",
      join: "Are you a sommelier? Join our network",
      instagram: (handle: string) => `${handle} on Instagram`,
    },
    liveDemo: {
      badge: "Included in every tasting",
      title: "Interactive tasting sheet",
      description:
        "During the tasting, each guest opens the aroma wheel on their phone, takes notes and scores every glass. At the end they take home their taster certificate.",
      note: "The certificate is a symbolic keepsake of the experience; it has no official validity.",
      cta: "Try the tasting sheet",
    },
    partners: {
      badge: "Partners",
      title: "El Origen partners",
      subtitle: "Brands, houses and restaurants that make every edition possible.",
      viewProfile: (name: string) => `See ${name} on Instagram`,
    },
    commercialShowcase: {
      eyebrow: "Business Partnerships & Partner Brands",
      main: {
        badge: "For brands",
        title: "Place your label at the right table.",
        subtitle: "We connect prestigious brands with a select audience through high-level gastronomic experiences.",
        modalitiesLabel: "Participation options",
        modalities: [
          { key: "A", label: "Edition Lead Brand" },
          { key: "B", label: "Experience Partner / Co-Sponsor" },
          { key: "C", label: "B2B Activations & Private Events" },
        ],
        ctaPrimary: "Request the Brand Dossier",
        ctaSecondary: "Talk on WhatsApp",
        whatsapp: "Hello, I would like to discuss a business partnership or brand sponsorship with El Origen.",
      },
      sommeliers: {
        badge: "Sommelier network",
        title: "Join our network of sommeliers & tasting directors",
        subtitle:
          "We are always looking for sommeliers, tasting specialists and brand ambassadors with a passion for sensory teaching and tableside mastery.",
        highlight: "Wine · Whisky · Cocuy · Cigars",
        cta: "Apply",
      },
      private: {
        badge: "Private & corporate",
        title: "Private Experiences & Corporate Events",
        subtitle: "We design bespoke tasting evenings for brands, companies and exclusive celebrations.",
        highlight: "From 10 to 60 guests",
        cta: "Request a proposal",
      },
    },
    faq: {
      badge: "Frequently asked questions",
      title: "Before your tasting",
      items: [
        {
          q: "How long does a tasting last?",
          a: "Between 1 and 2 hours, approximately. Each tasting lists its schedule, the products to taste, the menu or pairings, the venue and the sommelier leading it.",
        },
        {
          q: "Which payment methods do you accept?",
          a: "Pago Móvil and bank transfer in bolívars (Banco de Venezuela and Mercantil) at the BCV rate of the day, Binance USDT, and cash with delivery arranged in advance. We do not accept international cards for now.",
        },
        {
          q: "When is my spot confirmed?",
          a: `${POLICY.en.guarantee} When you book, your spots are held for 60 minutes while you send the proof of payment.`,
        },
        {
          q: "What if I cannot attend?",
          a: POLICY.en.cancellation,
        },
        {
          q: "What time should I arrive?",
          a: POLICY.en.punctuality,
        },
        {
          q: "What are the tickets like?",
          a: "Every guest has their own QR ticket. If you book several spots you get one QR per spot, so each guest has theirs even if you arrive separately; you can also add each guest's name.",
        },
        {
          q: "How many spots can I book?",
          a: "Up to 10 spots per booking. For larger groups we design a bespoke private experience.",
        },
        {
          q: "Can you accommodate allergies or dietary restrictions?",
          a: "Yes. When booking you can tell us about any allergies or dietary restrictions so we can take them into account.",
        },
      ],
    },
    contactSection: {
      badge: "Contact",
      title: "Let's talk",
      subtitle: (owner: string) => `${owner} will help you on WhatsApp with bookings, private tastings and partnerships.`,
      whatsapp: "Message on WhatsApp",
      account: "Create my Origen Account",
      hours: "Opening hours",
    },
    concierge: {
      label: "Customer service",
      aria: "Customer service on WhatsApp",
      message: "Hello El Origen, I would like to ask about the tastings.",
    },
    footer: {
      description: "Guided tastings and high-end gastronomy and spirits experiences in Caracas, Venezuela.",
      explore: "Explore",
      contact: "Contact",
      hours: "Opening hours",
      customerService: "Customer service",
      email: "Email",
      legal: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms and Conditions",
      copyright: (year: number) => `© ${year} El Origen.`,
    },
  },
};

export type Translations = (typeof translations)["es"];
