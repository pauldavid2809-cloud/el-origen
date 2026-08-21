import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-surface-container-highest border-t border-outline-variant full-width mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 sm:px-8 lg:px-16 py-12 max-w-container-max mx-auto gap-8">
        {/* Brand & Address */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/images/logo-color.png"
                alt="El Origen"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-serif text-xl font-bold text-primary tracking-tight">
              El Origen
            </span>
          </div>
          <p className="text-sm text-on-surface-variant text-center md:text-left max-w-xs leading-relaxed">
            Crafting the source of excellence.<br />
            Ruta del Vino s/n, Valle de Uco, Mendoza, Argentina.
          </p>
        </div>

        {/* Links Navigation */}
        <nav className="flex flex-wrap justify-center gap-6 text-xs uppercase tracking-widest font-semibold text-on-surface-variant">
          <Link href="/nosotros" className="hover:text-primary transition-colors">
            La Bodega
          </Link>
          <Link href="/catas" className="hover:text-primary transition-colors">
            Catas
          </Link>
          <Link href="/privadas" className="hover:text-primary transition-colors">
            Eventos Privados
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Privacidad
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Términos
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Sostenibilidad
          </Link>
        </nav>

        {/* Contact & Socials */}
        <div className="flex flex-col items-center md:items-end gap-3 text-on-surface-variant">
          <div className="flex gap-4 text-primary">
            <a
              href="mailto:experiencias@elorigen.com"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary-container hover:text-white transition-colors"
              title="Correo"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
            </a>
            <a
              href="https://wa.me/5492614558822"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary-container hover:text-white transition-colors"
              title="WhatsApp"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </a>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary-container hover:text-white transition-colors"
              title="Ubicación"
            >
              <span className="material-symbols-outlined text-[18px]">location_on</span>
            </a>
          </div>
          <p className="text-xs text-on-surface-variant/80 text-center md:text-right">
            © 2026 El Origen Wine Experience. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
