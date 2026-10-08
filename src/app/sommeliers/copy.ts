import type { Language } from "@/lib/i18n";
import type { SommelierSpecialty } from "@/lib/leads";

/* Únete a nuestra red de sommeliers & directores de cata. Los textos en español son literales del cliente. */

const es = {
  eyebrow: "Red de sommeliers",
  titleMain: "Únete a nuestra red de",
  titleHighlight: "sommeliers & directores de cata",
  intro: [
    "En El Origen elevamos la cultura del buen beber y la alta gastronomía a través de experiencias íntimas, rigurosas y memorables. Nos encontramos en constante búsqueda de sommeliers, especialistas en catas y embajadores de marca con pasión por la docencia sensorial y la maestría en mesa.",
    "Si posees formación técnica certificada en enología, destilados de alta gama o spirits de autor, y cuentas con facilidad para conectar con audiencias de perfil VIP y corporativo, queremos conocerte.",
  ],
  cta: "Postularme como Sommelier",

  offerTitle: "¿Qué ofrecemos?",
  offer: [
    { icon: "restaurant", text: "Liderar experiencias exclusivas en los restaurantes y sedes aliadas más destacadas de Caracas." },
    { icon: "handshake", text: "Alianzas con marcas y casas importadoras de renombre internacional." },
    {
      icon: "workspace_premium",
      text: "Formar parte de un club de experiencias gastronómicas de alto nivel con honorarios competitivos por sesión/evento.",
    },
  ],

  formEyebrow: "Postulación",
  formTitle: "Cuéntanos sobre ti",
  sectionContact: "Datos de contacto",
  sectionProfile: "Perfil profesional & formación",
  sectionExperience: "Demostración de experiencia",
  fullName: "Nombre completo",
  phone: "Teléfono de contacto (WhatsApp)",
  phoneHint: "Con código de área, p. ej. 0414-000-0000.",
  email: "Correo electrónico",
  instagram: "Usuario de Instagram",
  instagramHint: "Para evaluar tu perfil público y desenvolvimiento.",
  instagramPlaceholder: "@usuario",
  certification: "Titulación / Certificación",
  certificationHint:
    "Academia o institución de egreso, ej. Academia de Sommeliers de Venezuela, WSET, Court of Master Sommeliers, etc.",
  specialties: "Áreas de especialización",
  specialtiesHint: "Puedes elegir varias.",
  specialtyOptions: {
    vinos_internacionales: "Vinos Internacionales",
    whisky_spirits: "Whisky & Spirits",
    cocuy_destilados: "Cocuy & Destilados de Autor",
    habano_maridaje: "Habano & Maridaje",
  } satisfies Record<SommelierSpecialty, string>,
  years: "Años de experiencia dirigiendo catas o servicio en sala",
  cvUrl: "Enlace a Currículum Vitae / Perfil de LinkedIn",
  cvUrlPlaceholder: "https://",
  memorable: "Cuéntanos en pocas líneas cuál ha sido tu experiencia o cata más memorable dirigiendo grupos.",
  submit: "Postularme como Sommelier",
  errors: {
    fullName: "Indica tu nombre completo.",
    phone: "Indica un número de WhatsApp válido.",
    email: "Escribe un correo válido.",
    instagram: "Escribe tu usuario de Instagram sin espacios (p. ej. @usuario).",
    certification: "Indica tu titulación o certificación.",
    specialties: "Selecciona al menos un área de especialización.",
    years: "Indica tus años de experiencia (número entero).",
    cvUrl: "Escribe un enlace válido (p. ej. https://linkedin.com/in/usuario).",
    memorable: "Cuéntanos brevemente tu experiencia más memorable.",
  },

  successTitle: "¡Gracias por postularte!",
  successText: (name: string) =>
    `Recibimos tu postulación, ${name}. Nuestro equipo la revisará y te contactará por WhatsApp o correo.`,
  backToAbout: "Conocer a nuestro equipo",
  seeTastings: "Ver próximas catas",
};

const en: typeof es = {
  eyebrow: "Sommelier network",
  titleMain: "Join our network of",
  titleHighlight: "sommeliers & tasting directors",
  intro: [
    "At El Origen we elevate the culture of fine drinking and haute cuisine through intimate, rigorous and memorable experiences. We are always looking for sommeliers, tasting specialists and brand ambassadors with a passion for sensory teaching and mastery at the table.",
    "If you hold certified technical training in oenology, premium spirits or craft spirits, and you connect easily with VIP and corporate audiences, we'd love to meet you.",
  ],
  cta: "Apply as a Sommelier",

  offerTitle: "What we offer",
  offer: [
    { icon: "restaurant", text: "Lead exclusive experiences at the most outstanding partner restaurants and venues in Caracas." },
    { icon: "handshake", text: "Partnerships with internationally renowned brands and import houses." },
    {
      icon: "workspace_premium",
      text: "Be part of a high-end gastronomic experiences club with competitive fees per session/event.",
    },
  ],

  formEyebrow: "Application",
  formTitle: "Tell us about yourself",
  sectionContact: "Contact details",
  sectionProfile: "Professional profile & training",
  sectionExperience: "Your experience",
  fullName: "Full name",
  phone: "Contact phone (WhatsApp)",
  phoneHint: "Include the area code, e.g. 0414-000-0000.",
  email: "Email",
  instagram: "Instagram username",
  instagramHint: "So we can get to know your public profile and presence.",
  instagramPlaceholder: "@username",
  certification: "Qualification / Certification",
  certificationHint:
    "Academy or institution you graduated from, e.g. Academia de Sommeliers de Venezuela, WSET, Court of Master Sommeliers, etc.",
  specialties: "Areas of expertise",
  specialtiesHint: "You can choose several.",
  specialtyOptions: {
    vinos_internacionales: "International Wines",
    whisky_spirits: "Whisky & Spirits",
    cocuy_destilados: "Cocuy & Craft Spirits",
    habano_maridaje: "Cigars & Pairing",
  },
  years: "Years of experience leading tastings or floor service",
  cvUrl: "Link to your CV / LinkedIn profile",
  cvUrlPlaceholder: "https://",
  memorable: "Tell us in a few lines about your most memorable experience or tasting leading a group.",
  submit: "Apply as a Sommelier",
  errors: {
    fullName: "Enter your full name.",
    phone: "Enter a valid WhatsApp number.",
    email: "Enter a valid email address.",
    instagram: "Enter your Instagram username without spaces (e.g. @username).",
    certification: "Enter your qualification or certification.",
    specialties: "Select at least one area of expertise.",
    years: "Enter your years of experience (whole number).",
    cvUrl: "Enter a valid link (e.g. https://linkedin.com/in/username).",
    memorable: "Briefly tell us about your most memorable experience.",
  },

  successTitle: "Thank you for applying!",
  successText: (name: string) =>
    `We've received your application, ${name}. Our team will review it and get in touch by WhatsApp or email.`,
  backToAbout: "Meet our team",
  seeTastings: "See upcoming tastings",
};

export const SOMMELIERS_COPY: Record<Language, typeof es> = { es, en };
