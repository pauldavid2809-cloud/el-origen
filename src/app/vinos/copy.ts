import type { Language } from "@/lib/i18n";
import type { WineType } from "@/types";

/* Textos del catálogo de vinos (/vinos, /vinos/[slug] y la franja de la portada), ES/EN. */

export const WINE_TYPE_LABEL: Record<Language, Record<WineType, string>> = {
  es: { tinto: "Tinto", blanco: "Blanco", rosado: "Rosado", espumoso: "Espumoso", dulce: "Dulce", destilado: "Destilado", otro: "Otro" },
  en: { tinto: "Red", blanco: "White", rosado: "Rosé", espumoso: "Sparkling", dulce: "Sweet", destilado: "Spirit", otro: "Other" },
};

const es = {
  eyebrow: "Nuestros vinos",
  titleMain: "Lo que hemos",
  titleHighlight: "descorchado",
  subtitle: "Vinos, destilados y etiquetas que hemos degustado en nuestras catas, con su ficha técnica.",
  showcaseTitle: "Nuestros vinos",
  showcaseSubtitle: "Las etiquetas que han pasado por nuestras copas, con su ficha técnica.",
  viewAll: "Ver todos",
  emptyTitle: "Muy pronto",
  emptyText: "Estamos preparando las fichas de los vinos que hemos degustado en nuestras catas.",
  seeTastings: "Ver próximas catas",
  open: (name: string) => `Ver la ficha de ${name}`,
  back: "Todos los vinos",
  techSheet: "Ficha técnica",
  type: "Tipo",
  grapes: "Uva",
  vintage: "Añada",
  region: "Origen",
  winery: "Bodega",
  tastedIn: "Lo degustamos en",
  related: "Otros vinos",
  ask: "Pregúntanos por este vino",
  askMessage: (name: string) => `Hola El Origen, quisiera saber más sobre el vino ${name}.`,
  imageAlt: (name: string) => `Botella de ${name}`,

  // Venta (solo los vinos activos para la venta muestran precio y botones)
  buy: "Comprar",
  openForSale: (name: string, price: string) => `Ver la ficha de ${name} y comprar, ${price}`,
  bsApprox: (bs: string) => `≈ Bs ${bs}`,
  bsTitle: "Calculado con la tasa BCV del día",
  buyEyebrow: "Comprar este vino",
  perBottle: "por botella",
  quantity: "Cantidad",
  fewer: "Una botella menos",
  more: "Una botella más",
  maxPerOrder: (n: number) => `Máximo ${n} por pedido.`,
  inCart: (n: number) => `Ya tienes ${n} ${n === 1 ? "botella" : "botellas"} en tu carrito.`,
  addToCart: "Agregar al carrito",
  buyNow: "Comprar ahora",
  added: "Agregado a tu carrito.",
  viewCart: "Ver carrito",
  limitMax: (n: number) => `Llegaste al máximo de ${n} por pedido para este vino.`,
  limitBottles: (n: number) => `Un pedido admite hasta ${n} botellas en total.`,
  limitLines: (n: number) => `Un pedido admite hasta ${n} vinos distintos.`,
  cartLabel: "Carrito",
  cartAria: (n: number) => (n > 0 ? `Ver el carrito: ${n} ${n === 1 ? "botella" : "botellas"}` : "Ver el carrito"),

  // Tienda cerrada (el administrador la cierra en Admin → Tienda de vinos; los precios siguen visibles)
  closedTitle: "Tienda cerrada por ahora",
  closedDefault: "Por ahora no estamos tomando pedidos. Puedes ver los vinos y sus precios; vuelve pronto.",
  openPriced: (name: string, price: string) => `Ver la ficha de ${name}, ${price}`,

  // Existencias
  soldOut: "Agotado",
  openSoldOut: (name: string) => `Ver la ficha de ${name}, agotado`,
  soldOutText: "Este vino está agotado por ahora. Escríbenos por WhatsApp para saber cuándo vuelve a estar disponible.",
  onlyLeft: (n: number) => (n === 1 ? "Solo queda 1 botella." : `Solo quedan ${n} botellas.`),
  limitStock: (n: number) =>
    n === 1 ? "Solo queda 1 botella de este vino y ya está en tu carrito." : `Solo quedan ${n} botellas de este vino y ya las tienes en tu carrito.`,
};

type WinesCopy = typeof es;

const en: WinesCopy = {
  eyebrow: "Our wines",
  titleMain: "What we have",
  titleHighlight: "uncorked",
  subtitle: "Wines, spirits and labels we have tasted at our tastings, with their technical sheet.",
  showcaseTitle: "Our wines",
  showcaseSubtitle: "The labels that have been in our glasses, with their technical sheet.",
  viewAll: "View all",
  emptyTitle: "Coming soon",
  emptyText: "We are preparing the sheets of the wines we have tasted at our tastings.",
  seeTastings: "See upcoming tastings",
  open: (name) => `View the sheet of ${name}`,
  back: "All wines",
  techSheet: "Technical sheet",
  type: "Type",
  grapes: "Grape",
  vintage: "Vintage",
  region: "Origin",
  winery: "Winery",
  tastedIn: "We tasted it at",
  related: "More wines",
  ask: "Ask us about this wine",
  askMessage: (name) => `Hi El Origen, I'd like to know more about the wine ${name}.`,
  imageAlt: (name) => `Bottle of ${name}`,

  buy: "Buy",
  openForSale: (name, price) => `View the sheet of ${name} and buy, ${price}`,
  bsApprox: (bs) => `≈ Bs ${bs}`,
  bsTitle: "Calculated with the BCV rate of the day",
  buyEyebrow: "Buy this wine",
  perBottle: "per bottle",
  quantity: "Quantity",
  fewer: "One bottle less",
  more: "One bottle more",
  maxPerOrder: (n) => `Maximum ${n} per order.`,
  inCart: (n) => `You already have ${n} ${n === 1 ? "bottle" : "bottles"} in your cart.`,
  addToCart: "Add to cart",
  buyNow: "Buy now",
  added: "Added to your cart.",
  viewCart: "View cart",
  limitMax: (n) => `You reached the maximum of ${n} per order for this wine.`,
  limitBottles: (n) => `An order allows up to ${n} bottles in total.`,
  limitLines: (n) => `An order allows up to ${n} different wines.`,
  cartLabel: "Cart",
  cartAria: (n) => (n > 0 ? `View cart: ${n} ${n === 1 ? "bottle" : "bottles"}` : "View cart"),

  closedTitle: "Shop closed for now",
  closedDefault: "We are not taking orders right now. You can browse the wines and their prices; please come back soon.",
  openPriced: (name, price) => `View the sheet of ${name}, ${price}`,

  soldOut: "Sold out",
  openSoldOut: (name) => `View the sheet of ${name}, sold out`,
  soldOutText: "This wine is sold out for now. Message us on WhatsApp to find out when it will be available again.",
  onlyLeft: (n) => (n === 1 ? "Only 1 bottle left." : `Only ${n} bottles left.`),
  limitStock: (n) =>
    n === 1 ? "Only 1 bottle of this wine is left and it is already in your cart." : `Only ${n} bottles of this wine are left and you already have them in your cart.`,
};

export const WINES_COPY: Record<Language, WinesCopy> = { es, en };
