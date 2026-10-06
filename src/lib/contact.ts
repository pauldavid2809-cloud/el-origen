/* Datos oficiales de contacto y pago de El Origen (fuente única). */

export const CONTACT = {
  whatsappNumber: "584141074007",
  phoneDisplay: "0414-107-4007",
  phoneIntl: "+58-414-1074007",
  email: "experiencethewine22@gmail.com",
  instagramHandle: "@elorigen.vzla",
  instagramUrl: "https://www.instagram.com/elorigen.vzla",
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${CONTACT.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const PAYMENT_ID = "24.698.668";

export interface PaymentAccount {
  label: string;
  bank: string;
  fields: { name: string; value: string; copy?: string }[];
}

export const PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    label: "Pago Móvil",
    bank: "Banco de Venezuela / Mercantil",
    fields: [
      { name: "Teléfono", value: "0412-399-3848", copy: "04123993848" },
      { name: "Cédula", value: PAYMENT_ID, copy: "24698668" },
    ],
  },
  {
    label: "Transferencia",
    bank: "Banco de Venezuela · Cuenta corriente",
    fields: [
      { name: "Cuenta", value: "0102 0245 1200 0024 1704", copy: "01020245120000241704" },
      { name: "Cédula", value: PAYMENT_ID, copy: "24698668" },
    ],
  },
  {
    label: "Transferencia",
    bank: "Banco Mercantil · Cuenta corriente",
    fields: [
      { name: "Cuenta", value: "0105 0019 2810 1931 2823", copy: "01050019281019312823" },
      { name: "Cédula", value: PAYMENT_ID, copy: "24698668" },
    ],
  },
];
