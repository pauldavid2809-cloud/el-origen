import type { Language } from "@/lib/i18n";

/* Textos de /puerta (ES/EN). Los mensajes de validación de entradas los redacta el servidor. */

const es = {
  loading: "Cargando…",
  loginTitle: "Acceso de puerta",
  loginText: "Ingrese la clave de puerta para escanear las entradas. Este acceso no abre el panel de administración.",
  password: "Clave de puerta",
  showPassword: "Mostrar clave",
  hidePassword: "Ocultar clave",
  enter: "Entrar al escáner",
  entering: "Verificando…",
  wrongPassword: "Clave incorrecta.",
  tooMany: "Demasiados intentos. Espere unos minutos e intente de nuevo.",
  notConfigured: "La clave de puerta no está configurada en el servidor.",
  connectionError: "Error de conexión. Intente de nuevo.",
  sessionExpired: "La sesión de puerta expiró. Ingrese la clave de nuevo.",
  backToSite: "Volver al sitio",
  title: "Puerta",
  subtitle: "Escáner de entradas",
  fullscreen: "Pantalla completa",
  exitFullscreen: "Salir de pantalla completa",
  logout: "Salir",
  panel: "Panel",
  switchLang: "Switch to English",
};

type DoorCopy = typeof es;

const en: DoorCopy = {
  loading: "Loading…",
  loginTitle: "Door access",
  loginText: "Enter the door password to scan tickets. This access does not open the admin panel.",
  password: "Door password",
  showPassword: "Show password",
  hidePassword: "Hide password",
  enter: "Open the scanner",
  entering: "Checking…",
  wrongPassword: "Wrong password.",
  tooMany: "Too many attempts. Wait a few minutes and try again.",
  notConfigured: "The door password is not configured on the server.",
  connectionError: "Connection error. Please try again.",
  sessionExpired: "The door session expired. Enter the password again.",
  backToSite: "Back to the site",
  title: "Door",
  subtitle: "Ticket scanner",
  fullscreen: "Full screen",
  exitFullscreen: "Exit full screen",
  logout: "Sign out",
  panel: "Panel",
  switchLang: "Cambiar a español",
};

export const DOOR_COPY: Record<Language, DoorCopy> = { es, en };
