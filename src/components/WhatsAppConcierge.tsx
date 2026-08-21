"use client";

import React, { useState } from "react";

export function WhatsAppConcierge() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-fade-in pointer-events-auto">
      <a
        href="https://wa.me/584141074007?text=Hola%20El%20Origen,%20quisiera%20consultar%20por%20las%20experiencias%20de%20cata%20en%20Caracas"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group flex items-center gap-2.5 bg-white/90 hover:bg-white text-on-surface pl-3.5 pr-4 py-2.5 rounded-full border border-black/[0.08] shadow-[0_8px_24px_rgba(122,32,72,0.08)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover-lift active:scale-95"
        aria-label="Hablar con el Sommelier por WhatsApp"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>

        <span className="material-symbols-outlined text-[#25D366] text-[18px]">
          chat
        </span>

        <span className="text-[12px] font-semibold text-on-surface tracking-tight">
          Concierge Sommelier
        </span>
      </a>
    </div>
  );
}
