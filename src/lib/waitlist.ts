/** Cupos que se pueden pedir en la lista de espera (lo usan el formulario y el servidor). */
export const WAITLIST_MAX_SPOTS = 10;

/* Preguntas de preferencias de la lista de espera (las del formulario «Lista de Espera & Registro
   Prioritario» del cliente). Los textos están en lista-de-espera/copy.ts. */

/** ¿Qué tipo de experiencias o catas te gustaría vivir con nosotros? (varias) */
export const WAITLIST_EXPERIENCES = ["catas_pais", "maridajes", "estilo_vida", "comparativas", "privados"] as const;
/** ¿Qué días y horarios prefieres para asistir? (una) */
export const WAITLIST_SCHEDULES = ["jueves_noche", "viernes_noche", "sabados", "domingos"] as const;
/** ¿Cuál es tu nivel de conocimiento o interés en el mundo del vino? (una) */
export const WINE_LEVELS = ["principiante", "intermedio", "avanzado"] as const;

export type WaitlistExperience = (typeof WAITLIST_EXPERIENCES)[number];
export type WaitlistSchedule = (typeof WAITLIST_SCHEDULES)[number];
export type WineLevel = (typeof WINE_LEVELS)[number];
