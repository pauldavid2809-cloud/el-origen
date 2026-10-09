import type { Language } from "@/lib/i18n";
import type { BrandObjective } from "@/lib/leads";

/* Alianzas Comerciales & Marcas Aliadas. Los textos en español son literales del cliente.
   En los párrafos, **texto** se muestra en negrita y _texto_ en cursiva. */

const es = {
  eyebrow: "Marcas & patrocinio",
  titleMain: "Alianzas Comerciales &",
  titleHighlight: "Marcas Aliadas",
  subtitle: "Conectamos marcas de prestigio con un público selecto a través de experiencias gastronómicas de alto nivel.",
  cta: "Solicitar Dossier para Marcas",

  narrativeEyebrow: "Narrativa de valor",
  narrativeTitle: "Posiciona tu etiqueta en la mesa correcta.",
  photosCaption: "Acqua Panna, marca aliada, en la mesa de nuestra cata en Maratea: así se integra una marca a la experiencia.",
  narrative: [
    "En **El Origen** transformamos la degustación tradicional en un canal de experiencia inmersiva para marcas de vinos, destilados y productos gourmet de alta gama. No ofrecemos simple presencia de logo; creamos el entorno perfecto para que tu portafolio sea apreciado por consumidores VIP, líderes de opinión, restauradores y compradores clave en Caracas.",
    "A través de catas guiadas de aforo reducido (20 a 40 invitados), la narrativa de nuestros sommeliers y maridajes diseñados a la medida, garantizamos que tu marca sea la verdadera protagonista de la velada.",
  ],

  reasonsEyebrow: "Beneficios B2B",
  reasonsTitle: "Razones para aliarse con El Origen",
  reasons: [
    {
      icon: "diamond",
      title: "Audiencia VIP Calificada",
      text: "Acceso directo a consumidores de alto poder adquisitivo, coleccionistas, ejecutivos y apasionados de la enología y licores _ultra-premium_.",
    },
    {
      icon: "wine_bar",
      title: "Experiencia de Marca Inmersiva (Brand Experience)",
      text: "Tu producto servido en condiciones técnicas perfectas (cristalería especializada, temperaturas controladas y maridaje de autor).",
    },
    {
      icon: "photo_camera",
      title: "Generación de Contenido de Valor (Marketing & PR)",
      text: "Cobertura audiovisual profesional en cada edición, menciones en redes sociales, envío de notas de prensa y difusión en nuestros canales privados de miembros.",
    },
    {
      icon: "insights",
      title: "Validación Comercial & Feedback",
      text: "Escenario ideal para el lanzamiento de nuevas etiquetas, pruebas de aceptación en mercado o activaciones exclusivas de portafolios _Private Reserve_.",
    },
  ],

  modesEyebrow: "Modalidades",
  modesTitle: "Modalidades de Participación",
  modes: [
    {
      letter: "A",
      title: "Marca Protagonista de Edición (Sponsor Principal)",
      points: [
        "La velada y el menú de maridaje se diseñan conceptualmente en torno a tu marca o portafolio exclusivo.",
        "Presencia prioritaria en todo el material promocional (web, invitaciones digitales, minuta impresa y redes).",
      ],
    },
    {
      letter: "B",
      title: "Aliado de Experiencia / Co-Sponsor",
      points: [
        "Participación dentro del recorrido de catas en tiempos o como maridaje de un plato específico.",
        "Presencia de marca en los espacios del evento y mención técnica por parte del sommelier.",
      ],
    },
    {
      letter: "C",
      title: "Activaciones & Eventos Privados B2B",
      points: [
        "Diseñamos eventos corporativos o catas exclusivas a la medida para los clientes VIP, distribuidores o fuerza de ventas de tu marca.",
      ],
    },
  ],

  formEyebrow: "Dossier para marcas",
  company: "Nombre de la Empresa / Distribuidora",
  brand: "Marca o Portafolio a Presentar",
  contactName: "Nombre del Contacto",
  contactRole: "Cargo",
  phone: "Teléfono (WhatsApp Directo)",
  phoneHint: "Con código de área, p. ej. 0414-000-0000.",
  email: "Correo Corporativo",
  objective: "Objetivo de la Alianza",
  objectivePlaceholder: "Selecciona una opción",
  objectives: {
    patrocinar_edicion: "Patrocinar una Edición",
    lanzamiento_producto: "Lanzamiento de Producto",
    cata_privada_b2b: "Cata Privada B2B",
    presencia_marca: "Presencia de Marca",
  } satisfies Record<BrandObjective, string>,
  message: "Mensaje / Requerimiento adicional",
  samples: "Me gustaría enviarles una muestra de nuestros productos",
  submit: "Solicitar Dossier para Marcas",
  errors: {
    company: "Indica la empresa o distribuidora.",
    brand: "Indica la marca o portafolio.",
    contactName: "Indica el nombre de contacto.",
    phone: "Indica un número de WhatsApp válido.",
    email: "Escribe un correo corporativo válido.",
    objective: "Selecciona el objetivo de la alianza.",
  },

  closingTitle: "¿Quieres que tu marca forme parte de nuestra próxima edición?",
  closingText:
    "Solicita nuestro dossier comercial y conversemos sobre cómo diseñar una experiencia a la medida de tu portafolio.",

  successTitle: "¡Gracias por tu interés!",
  successText: (brand: string) =>
    `Recibimos tu solicitud para ${brand}. Nuestro equipo te enviará el dossier comercial y te contactará para conversar sobre cómo diseñar una experiencia a la medida de tu portafolio.`,
  successSamples: "Te indicaremos cómo hacernos llegar las muestras de tus productos.",
  whatsappMessage: (brand: string) => `Hola El Origen, acabo de solicitar el dossier para marcas${brand ? ` (${brand})` : ""}.`,
};

const en: typeof es = {
  eyebrow: "Brands & sponsorship",
  titleMain: "Business Partnerships &",
  titleHighlight: "Partner Brands",
  subtitle: "We connect prestigious brands with a select audience through high-end gastronomic experiences.",
  cta: "Request the Brand Dossier",

  narrativeEyebrow: "Our value",
  narrativeTitle: "Put your label on the right table.",
  photosCaption: "Acqua Panna, a partner brand, on the table at our tasting at Maratea: this is how a brand becomes part of the experience.",
  narrative: [
    "At **El Origen** we turn the traditional tasting into an immersive experience channel for premium wine, spirits and gourmet brands. We don't offer mere logo placement; we create the perfect setting for your portfolio to be appreciated by VIP consumers, opinion leaders, restaurateurs and key buyers in Caracas.",
    "Through small guided tastings (20 to 40 guests), our sommeliers' storytelling and tailor-made pairings, we make sure your brand is the true star of the evening.",
  ],

  reasonsEyebrow: "B2B benefits",
  reasonsTitle: "Why partner with El Origen",
  reasons: [
    {
      icon: "diamond",
      title: "Qualified VIP Audience",
      text: "Direct access to high-spending consumers, collectors, executives and lovers of wine and _ultra-premium_ spirits.",
    },
    {
      icon: "wine_bar",
      title: "Immersive Brand Experience",
      text: "Your product served in perfect technical conditions (specialised glassware, controlled temperatures and chef-driven pairings).",
    },
    {
      icon: "photo_camera",
      title: "Valuable Content Creation (Marketing & PR)",
      text: "Professional audiovisual coverage at every edition, social media mentions, press releases and promotion through our private member channels.",
    },
    {
      icon: "insights",
      title: "Commercial Validation & Feedback",
      text: "The ideal stage for launching new labels, testing market acceptance or running exclusive activations of _Private Reserve_ portfolios.",
    },
  ],

  modesEyebrow: "Formats",
  modesTitle: "Ways to Take Part",
  modes: [
    {
      letter: "A",
      title: "Featured Brand of the Edition (Main Sponsor)",
      points: [
        "The evening and the pairing menu are conceived around your brand or exclusive portfolio.",
        "Priority presence across all promotional material (website, digital invitations, printed menu and social media).",
      ],
    },
    {
      letter: "B",
      title: "Experience Partner / Co-Sponsor",
      points: [
        "A place within the tasting flight, or as the pairing for a specific dish.",
        "Brand presence at the venue and a technical mention by the sommelier.",
      ],
    },
    {
      letter: "C",
      title: "B2B Activations & Private Events",
      points: [
        "We design bespoke corporate events or exclusive tastings for your brand's VIP clients, distributors or sales force.",
      ],
    },
  ],

  formEyebrow: "Brand dossier",
  company: "Company / Distributor name",
  brand: "Brand or portfolio to present",
  contactName: "Contact name",
  contactRole: "Position",
  phone: "Phone (direct WhatsApp)",
  phoneHint: "Include the area code, e.g. 0414-000-0000.",
  email: "Corporate email",
  objective: "Partnership goal",
  objectivePlaceholder: "Select an option",
  objectives: {
    patrocinar_edicion: "Sponsor an edition",
    lanzamiento_producto: "Product launch",
    cata_privada_b2b: "Private B2B tasting",
    presencia_marca: "Brand presence",
  },
  message: "Message / Additional requirements",
  samples: "I'd like to send you a sample of our products",
  submit: "Request the Brand Dossier",
  errors: {
    company: "Enter the company or distributor.",
    brand: "Enter the brand or portfolio.",
    contactName: "Enter the contact name.",
    phone: "Enter a valid WhatsApp number.",
    email: "Enter a valid corporate email.",
    objective: "Select the partnership goal.",
  },

  closingTitle: "Would you like your brand to be part of our next edition?",
  closingText: "Request our commercial dossier and let's talk about designing an experience tailored to your portfolio.",

  successTitle: "Thank you for your interest!",
  successText: (brand: string) =>
    `We've received your request for ${brand}. Our team will send you the commercial dossier and get in touch to discuss designing an experience tailored to your portfolio.`,
  successSamples: "We'll let you know how to send us your product samples.",
  whatsappMessage: (brand: string) => `Hello El Origen, I just requested the brand dossier${brand ? ` (${brand})` : ""}.`,
};

export const ALIANZAS_COPY: Record<Language, typeof es> = { es, en };
