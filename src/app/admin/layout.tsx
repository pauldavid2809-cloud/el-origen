"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Otras rutas que marcan este elemento como activo. */
  also?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/catas", label: "Catas", icon: "calendar_month" },
  { href: "/admin/reservas", label: "Reservas & Pagos", icon: "receipt_long" },
  { href: "/admin/cupones", label: "Cupones", icon: "sell" },
  { href: "/admin/miembros", label: "Miembros", icon: "group" },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: "inbox", also: ["/admin/privadas"] },
  { href: "/admin/recuerdos", label: "Recuerdos", icon: "photo_library" },
  { href: "/admin/configuracion", label: "Configuración de pagos", icon: "account_balance" },
  { href: "/admin/automatizaciones", label: "Correo y WhatsApp", icon: "forum" },
  { href: "/admin/scanner", label: "Escáner", icon: "qr_code_scanner" },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/admin") return pathname === "/admin";
  return [item.href, ...(item.also ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const [menuOpen, setMenuOpen] = useState(false);
  const current = NAV_ITEMS.find((item) => isActive(pathname, item));

  // Al navegar se cierra el menú móvil.
  useEffect(() => setMenuOpen(false), [pathname]);

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.reload();
  };

  return (
    <AdminAuthGuard>
      <div className="bg-background text-on-background min-h-screen flex flex-col lg:flex-row lg:overflow-hidden">
        {/* Barra superior (móvil) */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 h-14">
          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <span className="relative w-9 h-6 flex-shrink-0">
              <Image src="/images/logo-color-mark.png" alt="El Origen" fill className="object-contain" sizes="36px" />
            </span>
            <span className="font-serif text-[15px] font-bold text-primary truncate">{current?.label ?? "Panel"}</span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="admin-nav"
            className="h-11 w-11 -mr-2 inline-flex items-center justify-center rounded text-primary"
          >
            <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
            <span className="sr-only">{menuOpen ? "Cerrar menú" : "Abrir menú"}</span>
          </button>
        </div>

        {/* Menú lateral */}
        <aside
          id="admin-nav"
          className={`${menuOpen ? "flex" : "hidden"} lg:flex w-full lg:w-64 bg-surface-container-low border-b lg:border-b-0 lg:border-r border-outline-variant flex-col justify-between flex-shrink-0 z-20`}
        >
          <div>
            <div className="hidden lg:flex p-6 border-b border-surface-variant items-center">
              <Link href="/admin" className="flex items-center gap-3">
                <span className="relative w-12 h-8 flex-shrink-0">
                  <Image src="/images/logo-color-mark.png" alt="El Origen" fill className="object-contain" sizes="48px" />
                </span>
                <span>
                  <span className="block font-serif text-lg font-bold text-primary leading-tight">Panel</span>
                  <span className="block text-[11px] text-secondary">Gestión El Origen</span>
                </span>
              </Link>
            </div>

            <nav className="p-3 space-y-1" aria-label="Panel de administración">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-3.5 min-h-11 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                      active ? "bg-primary-container text-white shadow-sm" : "text-secondary hover:bg-surface-container hover:text-primary"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      aria-hidden="true"
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-3 border-t border-outline-variant space-y-1">
            <Link
              href="/"
              className="flex items-center gap-2 min-h-11 px-3.5 text-xs font-semibold text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">open_in_new</span>
              Ver sitio público
            </Link>
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2 min-h-11 px-3.5 text-xs font-semibold text-secondary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">logout</span>
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Contenido */}
        <main className="flex-1 min-w-0 flex flex-col h-auto lg:h-screen lg:overflow-y-auto bg-background relative">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: "radial-gradient(#7D2A46 1px, transparent 1px)", backgroundSize: "20px 20px" }}
          />
          <div className="relative z-10 flex-1">{children}</div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
