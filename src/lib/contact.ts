/* Datos oficiales de contacto y pago de El Origen (fuente única). */

export const CONTACT = {
  ownerName: "Jaifred Pastran",
  /** WhatsApp Business: también es el número desde el que salen las entradas. */
  whatsappNumber: "584141074007",
  phoneDisplay: "0414-107-4007",
  phoneIntl: "+58-414-1074007",
  email: "experiencethewine22@gmail.com",
  instagramHandle: "@elorigen.vzla",
  instagramUrl: "https://www.instagram.com/elorigen.vzla",
  /** Sin oficina física: solo se muestra la ciudad. */
  city: "Caracas",
};

/** Horario de atención (cada elemento es una línea). */
export const BUSINESS_HOURS: { es: string[]; en: string[] } = {
  es: [
    "Lunes a viernes: 8:00 a.m. – 1:30 p.m. y 7:00 p.m. – 11:00 p.m.",
    "Sábados: 8:00 – 10:00 a.m., 3:00 – 4:00 p.m. y 7:00 – 11:00 p.m.",
  ],
  en: [
    "Monday to Friday: 8:00 a.m. – 1:30 p.m. and 7:00 p.m. – 11:00 p.m.",
    "Saturday: 8:00 – 10:00 a.m., 3:00 – 4:00 p.m. and 7:00 – 11:00 p.m.",
  ],
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${CONTACT.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const PAYMENT_ID = "24.698.668";

/* PENDIENTE CLIENTE: el PDF de respuestas indica Pago Móvil 0412.399.38.38, pero el número usado hasta ahora
   es 0412.399.38.48. Se conserva 0412-399-3848 por defecto; se corrige desde Admin → Configuración de pagos. */
export const PAGO_MOVIL_PHONE = "0412-399-3848";

export const BANK_ACCOUNTS = {
  bdv: { bank: "Banco de Venezuela", accountType: "Cuenta corriente", number: "0102 0245 1200 0024 1704" },
  mercantil: { bank: "Banco Mercantil", accountType: "Cuenta corriente", number: "0105 0019 2810 1931 2823" },
} as const;

export interface PaymentAccount {
  label: string;
  bank: string;
  fields: { name: string; value: string; copy?: string }[];
}

const digits = (v: string) => v.replace(/\D/g, "");

/** Datos de pago por defecto (la configuración editable vive en `@/lib/settings`). */
export const PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    label: "Pago Móvil",
    bank: "Banco de Venezuela / Mercantil",
    fields: [
      { name: "Teléfono", value: PAGO_MOVIL_PHONE, copy: digits(PAGO_MOVIL_PHONE) },
      { name: "Cédula", value: PAYMENT_ID, copy: digits(PAYMENT_ID) },
    ],
  },
  {
    label: "Transferencia",
    bank: `${BANK_ACCOUNTS.bdv.bank} · ${BANK_ACCOUNTS.bdv.accountType}`,
    fields: [
      { name: "Cuenta", value: BANK_ACCOUNTS.bdv.number, copy: digits(BANK_ACCOUNTS.bdv.number) },
      { name: "Cédula", value: PAYMENT_ID, copy: digits(PAYMENT_ID) },
    ],
  },
  {
    label: "Transferencia",
    bank: `${BANK_ACCOUNTS.mercantil.bank} · ${BANK_ACCOUNTS.mercantil.accountType}`,
    fields: [
      { name: "Cuenta", value: BANK_ACCOUNTS.mercantil.number, copy: digits(BANK_ACCOUNTS.mercantil.number) },
      { name: "Cédula", value: PAYMENT_ID, copy: digits(PAYMENT_ID) },
    ],
  },
];
