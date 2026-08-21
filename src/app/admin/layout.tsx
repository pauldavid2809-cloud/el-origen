"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/catas", label: "Catas & Cupos", icon: "calendar_month" },
    { href: "/admin/reservas", label: "Asistentes & Reservas", icon: "group" },
    { href: "/admin/cupones", label: "Cupones de Descuento", icon: "sell" },
    { href: "/admin/privadas", label: "Eventos Privados B2B", icon: "business_center" },
    { href: "/admin/recuerdos", label: "Galería de Recuerdos", icon: "photo_library" },
    { href: "/admin/automatizaciones", label: "Automatizaciones", icon: "send_and_archive" },
    { href: "/admin/scanner", label: "Escáner QR Puerta", icon: "qr_code_scanner" },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar (Stitch panel_de_control_admin) */}
      <aside className="w-full lg:w-64 bg-surface-container-low border-r border-outline-variant flex flex-col justify-between flex-shrink-0 z-20">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-surface-variant flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src="/images/logo-color.png"
                  alt="El Origen"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold text-primary leading-tight">Admin Panel</h1>
                <p className="text-[11px] text-secondary">Gestión El Origen</p>
              </div>
            </Link>
          </div>

          {/* Nav menu */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-primary-container text-white shadow-sm translate-x-1"
                      : "text-secondary hover:bg-surface-container hover:text-primary"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Public site link */}
        <div className="p-4 border-t border-outline-variant space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary transition-colors px-2"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            Ver Sitio Público
          </Link>

          <div className="flex items-center gap-3 px-2 pt-2 border-t border-surface-variant">
            <div className="w-9 h-9 rounded-full bg-surface-variant overflow-hidden relative flex-shrink-0 border border-outline-variant">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
                alt="Jaifred Pastran"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-xs">
              <p className="font-bold text-on-surface">Jaifred Pastran</p>
              <p className="text-[10px] text-secondary">Head Sommelier & Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-auto lg:h-screen overflow-y-auto bg-background relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: "radial-gradient(#7a2048 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative z-10 flex-1">{children}</div>
      </main>
    </div>
  );
}
