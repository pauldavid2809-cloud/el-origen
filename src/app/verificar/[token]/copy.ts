import type { Language } from "@/lib/i18n";

/* Textos de /verificar/[token] (ES/EN). Los mensajes de validación los redacta el servidor. */

const es = {
  // Visitante (sin sesión de puerta ni de admin)
  guestTitle: "Entrada de El Origen",
  guestPresent: "Presente este código en la puerta",
  guestText: "El personal de El Origen lo escaneará al llegar. Cada código es válido para una persona.",
  ticketOf: (n: number) => `Entrada ${n}`,
  qrAlt: (code: string) => `Código QR de la entrada ${code}`,
  live: "Ficha de cata en vivo",
  staff: "¿Personal de El Origen?",
  staffLogin: "Inicie sesión en la puerta",
  staffAfter: "y vuelva a escanear.",

  // Personal
  verifying: "Verificando…",
  connectionError: "Error de conexión. Intente de nuevo.",
  attendee: "Asistente",
  buyer: "Comprador",
  docId: "Cédula",
  tasting: "Cata",
  when: "Fecha",
  code: "Código",
  diet: "Dieta",
  group: "Grupo",
  groupProgress: (inside: number, total: number) => `${inside} de ${total} ya ingresaron`,
  checkin: "Registrar ingreso",
  checkinMany: (n: number) => `Registrar ingreso (${n} personas)`,
  checkingIn: "Registrando…",
  scanner: "Escanear otra entrada",
};

type VerifyCopy = typeof es;

const en: VerifyCopy = {
  guestTitle: "El Origen ticket",
  guestPresent: "Show this code at the door",
  guestText: "El Origen staff will scan it when you arrive. Each code admits one person.",
  ticketOf: (n) => `Ticket ${n}`,
  qrAlt: (code) => `QR code for ticket ${code}`,
  live: "Live tasting sheet",
  staff: "El Origen staff?",
  staffLogin: "Sign in at the door",
  staffAfter: "and scan again.",

  verifying: "Verifying…",
  connectionError: "Connection error. Please try again.",
  attendee: "Guest",
  buyer: "Buyer",
  docId: "ID number",
  tasting: "Tasting",
  when: "Date",
  code: "Code",
  diet: "Diet",
  group: "Group",
  groupProgress: (inside, total) => `${inside} of ${total} already checked in`,
  checkin: "Check in",
  checkinMany: (n) => `Check in (${n} people)`,
  checkingIn: "Checking in…",
  scanner: "Scan another ticket",
};

export const VERIFY_COPY: Record<Language, VerifyCopy> = { es, en };
