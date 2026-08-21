import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-outline-variant/40 mt-auto">
      <div className="w-full px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-7 h-7">
                <Image src="/images/logo-color.png" alt="El Origen" fill className="object-contain" />
              </div>
              <span className="font-serif text-lg font-semibold text-primary tracking-tight">
                El Origen
              </span>
            </Link>
            <p className="text-[13px] text-on-surface-variant/70 leading-relaxed max-w-[280px]">
              Crafting the source of excellence desde el Valle de Uco, Mendoza, Argentina.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">Explorar</span>
              <nav className="flex flex-col gap-2">
                <Link href="/nosotros" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">La Bodega</Link>
                <Link href="/catas" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">Experiencias</Link>
                <Link href="/privadas" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">Eventos Privados</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">Legal</span>
              <nav className="flex flex-col gap-2">
                <Link href="#" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">Privacidad</Link>
                <Link href="#" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">Términos</Link>
                <Link href="#" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">Sostenibilidad</Link>
              </nav>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4 md:text-right">
            <div className="flex gap-2 md:justify-end">
              {[
                { href: "mailto:experiencias@elorigen.com", icon: "mail", label: "Correo" },
                { href: "https://wa.me/5492614558822", icon: "chat", label: "WhatsApp" },
                { href: "https://maps.google.com", icon: "location_on", label: "Ubicación" },
              ].map((s) => (
                <a
                  key={s.icon}
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="w-9 h-9 rounded-full bg-surface-container/60 hover:bg-primary-container hover:text-white text-on-surface-variant/60 flex items-center justify-center transition-all duration-300"
                  title={s.label}
                >
                  <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                </a>
              ))}
            </div>
            <p className="text-[11px] text-on-surface-variant/40">
              © 2026 El Origen Wine Experience
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
