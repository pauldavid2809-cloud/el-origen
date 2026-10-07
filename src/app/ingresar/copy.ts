import type { Language } from "@/lib/i18n";

/* Textos del ingreso (ES/EN). */

const es = {
  eyebrow: "Cuenta Origen",
  title: "Ingresar",
  subtitle: "Accede a tus reservas y entradas.",
  aside: "Con tu Cuenta Origen reservas más rápido y tienes tus entradas con QR siempre a mano.",
  email: "Correo electrónico",
  password: "Contraseña",
  forgot: "¿Olvidaste tu contraseña?",
  submit: "Ingresar",
  submitting: "Ingresando…",
  noAccount: "¿Aún no tienes cuenta?",
  register: "Crear mi Cuenta Origen",
  errors: {
    missing: "Escribe tu correo y tu contraseña.",
    invalid: "Correo o contraseña incorrectos.",
    rateLimited: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    network: "Error de conexión. Inténtalo de nuevo.",
  },
};

const en: typeof es = {
  eyebrow: "Origen Account",
  title: "Sign in",
  subtitle: "Access your bookings and tickets.",
  aside: "With your Origen Account you book faster and always have your QR tickets at hand.",
  email: "Email",
  password: "Password",
  forgot: "Forgot your password?",
  submit: "Sign in",
  submitting: "Signing in…",
  noAccount: "Don't have an account yet?",
  register: "Create my Origen Account",
  errors: {
    missing: "Enter your email and password.",
    invalid: "Incorrect email or password.",
    rateLimited: "Too many attempts. Please wait a few minutes and try again.",
    network: "Connection error. Please try again.",
  },
};

export const LOGIN_COPY: Record<Language, typeof es> = { es, en };
