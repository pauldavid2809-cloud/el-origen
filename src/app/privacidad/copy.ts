import type { Language } from "@/lib/i18n";
import type { LegalDocument } from "./_components/LegalPage";

/* Política de Privacidad. El texto en español es literal del cliente (PDF de respuestas, pregunta 28). */

const es: LegalDocument = {
  eyebrow: "Legal",
  title: "Política de Privacidad de El Origen",
  updatedLabel: "Última actualización:",
  updated: "Octubre 2026",
  intro:
    "En **El Origen** nos comprometemos a resguardar la privacidad y la confidencialidad de la información personal de nuestros usuarios, miembros y clientes VIP.",
  sections: [
    {
      title: "1. Recopilación de Información",
      blocks: [
        {
          p: "Recopilamos datos personales únicamente cuando el usuario se registra en nuestra plataforma, solicita una propuesta corporativa, se suscribe a nuestro boletín o completa la compra de tickets/productos. Estos datos incluyen: nombre completo, dirección de correo electrónico, número de teléfono (WhatsApp), cédula/ID y datos de facturación.",
        },
      ],
    },
    {
      title: "2. Uso de la Información",
      blocks: [
        { p: "Los datos suministrados serán utilizados exclusivamente para:" },
        {
          list: [
            "Procesar la reserva de cupos y emisión de tickets digitales.",
            "Coordinar la entrega de productos o botellas adicionales (upsells) el día del evento.",
            "Enviar confirmaciones, ubicaciones e información logística de las catas.",
            "Difundir ofertas exclusivas, códigos promocionales y acceso preferencial a nuevas ediciones (únicamente para usuarios suscritos).",
          ],
        },
      ],
    },
    {
      title: "3. Protección y Almacenamiento de Datos",
      blocks: [
        {
          p: "No vendemos, alquilamos ni compartimos tus datos personales con terceros para fines publicitarios ajenos a nuestra marca. Toda la información de pago enviada a través de la web se procesa mediante pasarelas y protocolos de encriptación seguros.",
        },
      ],
    },
    {
      title: "4. Consentimiento y Derechos",
      blocks: [
        {
          p: "Al interactuar con nuestro sitio web, el usuario acepta la presente política de privacidad. En cualquier momento, el usuario puede solicitar la actualización, modificación o eliminación definitiva de sus datos de nuestras bases de datos enviando una solicitud a nuestro canal de soporte.",
        },
      ],
    },
  ],
  related: { href: "/terminos", label: "Términos y Condiciones" },
};

const en: LegalDocument = {
  eyebrow: "Legal",
  title: "El Origen Privacy Policy",
  updatedLabel: "Last updated:",
  updated: "October 2026",
  intro:
    "At **El Origen** we are committed to safeguarding the privacy and confidentiality of the personal information of our users, members and VIP clients.",
  sections: [
    {
      title: "1. Information We Collect",
      blocks: [
        {
          p: "We collect personal data only when users register on our platform, request a corporate proposal, subscribe to our newsletter or complete a purchase of tickets/products. This data includes: full name, email address, phone number (WhatsApp), ID number and billing details.",
        },
      ],
    },
    {
      title: "2. How We Use Information",
      blocks: [
        { p: "The data provided will be used exclusively to:" },
        {
          list: [
            "Process spot reservations and issue digital tickets.",
            "Coordinate the delivery of additional products or bottles (upsells) on the day of the event.",
            "Send confirmations, locations and logistical information about the tastings.",
            "Share exclusive offers, promotional codes and early access to new editions (subscribed users only).",
          ],
        },
      ],
    },
    {
      title: "3. Data Protection and Storage",
      blocks: [
        {
          p: "We do not sell, rent or share your personal data with third parties for advertising purposes unrelated to our brand. All payment information sent through the website is processed through secure gateways and encryption protocols.",
        },
      ],
    },
    {
      title: "4. Consent and Rights",
      blocks: [
        {
          p: "By interacting with our website, users accept this privacy policy. At any time, users may request the update, modification or permanent deletion of their data from our databases by sending a request to our support channel.",
        },
      ],
    },
  ],
  related: { href: "/terminos", label: "Terms and Conditions" },
};

export const PRIVACY_POLICY: Record<Language, LegalDocument> = { es, en };
