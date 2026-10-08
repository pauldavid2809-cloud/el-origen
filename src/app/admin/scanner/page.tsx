"use client";

import React from "react";
import Link from "next/link";
import { DoorScanner } from "@/components/QRScannerModal";

/* Escáner del panel: el mismo de la puerta, dentro del menú de administración. */
export default function AdminScannerPage() {
  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <p className="eyebrow">Control de acceso</p>
          <h1 className="font-serif text-2xl sm:text-3xl mt-1">Escáner de entradas</h1>
          <p className="text-[14px] text-on-surface-variant mt-1 max-w-xl">
            Cada QR corresponde a una persona. Verifique la entrada y pulse «Registrar ingreso».
          </p>
        </div>
        <Link
          href="/puerta"
          className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded border border-outline-variant bg-surface-container-lowest text-[14px] font-semibold hover:border-primary-container flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">fullscreen</span>
          Modo puerta (pantalla completa)
        </Link>
      </header>

      <DoorScanner
        lang="es"
        onUnauthorized={() => {
          // La sesión del panel expiró: el guard muestra de nuevo la clave.
          window.location.reload();
        }}
      />

      <p className="text-[13px] text-on-surface-variant">
        Para la tablet o el teléfono de la entrada use <strong>/puerta</strong> con la clave de puerta (DOOR_PASSWORD): solo da
        acceso al escáner, no al resto del panel.
      </p>
    </div>
  );
}
