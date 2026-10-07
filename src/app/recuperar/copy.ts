import type { Language } from "@/lib/i18n";

/* Textos de "Recuperar contraseña" (ES/EN). */

const es = {
  eyebrow: "Cuenta Origen",
  title: "Recuperar contraseña",
  subtitle: "Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.",
  aside: "El enlace es personal, vence en 1 hora y deja de funcionar en cuanto cambies la contraseña.",
  email: "Correo electrónico",
  submit: "Enviar enlace",
  submitting: "Enviando…",
  back: "Volver a ingresar",
  sentTitle: "Revisa tu correo",
  sentText: (email: string) =>
    `Si existe una Cuenta Origen con ${email}, te enviamos un enlace para restablecer la contraseña. Vence en 1 hora. Revisa también la carpeta de spam o promociones.`,
  resend: "Usar otro correo",
  noMailTitle: "Te ayudamos por WhatsApp",
  noMailText:
    "En este momento no podemos enviar correos. Escríbenos por WhatsApp desde el número de tu cuenta y te ayudamos a recuperar el acceso.",
  whatsapp: "Escribir por WhatsApp",
  whatsappMessage: (email: string) => `Hola, necesito recuperar el acceso a mi Cuenta Origen (${email}).`,
  errors: {
    email: "Escribe un correo válido.",
    network: "Error de conexión. Inténtalo de nuevo.",
  },
};

const en: typeof es = {
  eyebrow: "Origen Account",
  title: "Reset your password",
  subtitle: "Enter your account email and we'll send you a link to create a new password.",
  aside: "The link is personal, expires in 1 hour and stops working as soon as you change your password.",
  email: "Email",
  submit: "Send link",
  submitting: "Sending…",
  back: "Back to sign in",
  sentTitle: "Check your email",
  sentText: (email: string) =>
    `If an Origen Account exists for ${email}, we've sent you a link to reset your password. It expires in 1 hour. Please also check your spam or promotions folder.`,
  resend: "Use another email",
  noMailTitle: "We'll help you on WhatsApp",
  noMailText:
    "We can't send emails right now. Message us on WhatsApp from your account's number and we'll help you regain access.",
  whatsapp: "Message us on WhatsApp",
  whatsappMessage: (email: string) => `Hello, I need to recover access to my Origen Account (${email}).`,
  errors: {
    email: "Enter a valid email address.",
    network: "Connection error. Please try again.",
  },
};

export const FORGOT_COPY: Record<Language, typeof es> = { es, en };
