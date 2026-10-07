import "server-only";
import type {
  AddOn,
  Coupon as LegacyCoupon,
  NotificationLog,
  PrivateEventInquiry,
  Tasting,
  TastingSensoryNote,
} from "@/types";
import { createCata, getCata, listCatas, type CataInput } from "./catas";
import { getCoupon, listCoupons, upsertCoupon, type Coupon } from "./coupons";
import { generateUUID } from "./utils";

/* ─────────────────────────────────────────────────────────────
   @deprecated Adaptador de compatibilidad para rutas antiguas.
   Las catas, cupones y adicionales reales viven en:
     - catas      → `@/lib/catas` (+ disponibilidad en `@/lib/availability`)
     - cupones    → `@/lib/coupons`
     - adicionales → `tasting.addOns` (definidos por cata)
     - solicitudes → `@/lib/leads`, fichas → `@/lib/tastingNotes`
   Aquí no queda ningún dato de ejemplo: todo delega en esos módulos,
   salvo los registros antiguos en memoria que aún no se han migrado.
   ───────────────────────────────────────────────────────────── */

const toLegacyCoupon = (c: Coupon): LegacyCoupon => ({
  code: c.code,
  discountPercent: c.discountPercent,
  description: c.description,
  active: c.active,
});

class LegacyDatabase {
  private sensoryNotes: TastingSensoryNote[] = [];
  private inquiries: PrivateEventInquiry[] = [];
  private notifications: NotificationLog[] = [];

  /** @deprecated Use `listCatas()` de `@/lib/catas`. Solo catas públicas (activas/agotadas). */
  async getTastings(): Promise<Tasting[]> {
    return listCatas();
  }

  /** @deprecated Use `getCata()` de `@/lib/catas`. */
  async getTastingById(idOrSlug: string): Promise<Tasting | null> {
    return getCata(idOrSlug);
  }

  /** @deprecated Use `createCata()` de `@/lib/catas`. */
  async createTasting(data: Partial<Tasting> & Partial<CataInput>): Promise<Tasting> {
    return createCata({
      ...(data as CataInput),
      priceUsd: data.priceUsd ?? data.price ?? NaN,
    });
  }

  /** @deprecated Los adicionales ahora se definen por cata (`tasting.addOns`). */
  async getAddOns(): Promise<AddOn[]> {
    return [];
  }

  /**
   * @deprecated Use `validateCouponForEmail()` de `@/lib/coupons` (aplica límites y "solo miembros").
   * Aquí solo se aceptan cupones activos sin restricciones.
   */
  async validateCoupon(code: string): Promise<LegacyCoupon | null> {
    const c = await getCoupon(code);
    return c && c.active && !c.membersOnly && c.maxUses === null ? toLegacyCoupon(c) : null;
  }

  /** @deprecated Use `listCoupons()` de `@/lib/coupons`. */
  async getCoupons(): Promise<LegacyCoupon[]> {
    return (await listCoupons()).map(toLegacyCoupon);
  }

  /** @deprecated Use `upsertCoupon()` de `@/lib/coupons`. */
  async createCoupon(coupon: LegacyCoupon): Promise<LegacyCoupon> {
    const saved = await upsertCoupon({
      code: coupon.code,
      discountPercent: coupon.discountPercent ?? 0,
      description: coupon.description,
      referrer: null,
      membersOnly: false,
      maxUses: null,
      active: coupon.active,
    });
    return toLegacyCoupon(saved);
  }

  /** @deprecated Use `saveTastingNote()` de `@/lib/tastingNotes`. */
  async saveSensoryNote(note: Omit<TastingSensoryNote, "id" | "savedAt">): Promise<TastingSensoryNote> {
    const saved: TastingSensoryNote = { ...note, id: generateUUID(), savedAt: new Date().toISOString() };
    this.sensoryNotes.push(saved);
    return saved;
  }

  /** @deprecated Use `listTastingNotes()` de `@/lib/tastingNotes`. */
  async getSensoryNotesByToken(token: string): Promise<TastingSensoryNote[]> {
    return this.sensoryNotes.filter((n) => n.reservationToken === token);
  }

  /** @deprecated Use `createPrivateInquiry()` de `@/lib/leads`. */
  async createPrivateInquiry(
    inquiry: Omit<PrivateEventInquiry, "id" | "createdAt" | "status">
  ): Promise<PrivateEventInquiry> {
    const saved: PrivateEventInquiry = { ...inquiry, id: generateUUID(), status: "new", createdAt: new Date().toISOString() };
    this.inquiries.unshift(saved);
    return saved;
  }

  /** @deprecated Use `listLeads("private")` de `@/lib/leads`. */
  async getPrivateInquiries(): Promise<PrivateEventInquiry[]> {
    return [...this.inquiries];
  }

  async logNotification(log: Omit<NotificationLog, "id" | "sentAt">): Promise<NotificationLog> {
    const saved: NotificationLog = { ...log, id: generateUUID(), sentAt: new Date().toISOString() };
    this.notifications.unshift(saved);
    return saved;
  }

  async getNotifications(): Promise<NotificationLog[]> {
    return [...this.notifications];
  }
}

const globalForDb = globalThis as unknown as { __eoLegacyDb?: LegacyDatabase };
export const db = (globalForDb.__eoLegacyDb ??= new LegacyDatabase());
