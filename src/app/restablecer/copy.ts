import type { Language } from "@/lib/i18n";

/* Textos de "Nueva contraseña" (ES/EN). */

const es = {
  eyebrow: "Cuenta Origen",
  title: "Crea una nueva contraseña",
  subtitle: "Elige una contraseña que no uses en otros sitios.",
  aside: "Al guardar la nueva contraseña iniciarás sesión automáticamente.",
  checking: "Verificando el enlace…",
  password: "Nueva contraseña",
  passwordHint: "Mínimo 8 caracteres.",
  submit: "Guardar contraseña",
  submitting: "Guardando…",
  invalidTitle: "Este enlace ya no es válido",
  invalidText: "Puede que haya vencido (dura 1 hora) o que la contraseña ya se haya cambiado. Solicita un enlace nuevo.",
  requestNew: "Solicitar un enlace nuevo",
  doneTitle: "Contraseña actualizada",
  doneText: "Ya iniciaste sesión con tu nueva contraseña.",
  goAccount: "Ir a mi cuenta",
  errors: {
    password: "La contraseña debe tener al menos 8 caracteres.",
    rateLimited: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    generic: "No pudimos cambiar la contraseña. Inténtalo de nuevo.",
    network: "Error de conexión. Inténtalo de nuevo.",
  },
};

const en: typeof es = {
  eyebrow: "Origen Account",
  title: "Create a new password",
  subtitle: "Choose a password you don't use on other sites.",
  aside: "Once you save your new password you'll be signed in automatically.",
  checking: "Checking the link…",
  password: "New password",
  passwordHint: "At least 8 characters.",
  submit: "Save password",
  submitting: "Saving…",
  invalidTitle: "This link is no longer valid",
  invalidText: "It may have expired (it lasts 1 hour) or the password was already changed. Request a new link.",
  requestNew: "Request a new link",
  doneTitle: "Password updated",
  doneText: "You're now signed in with your new password.",
  goAccount: "Go to my account",
  errors: {
    password: "Your password must be at least 8 characters long.",
    rateLimited: "Too many attempts. Please wait a few minutes and try again.",
    generic: "We couldn't change your password. Please try again.",
    network: "Connection error. Please try again.",
  },
};

export const RESET_COPY: Record<Language, typeof es> = { es, en };
