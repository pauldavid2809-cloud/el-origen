import React from "react";

interface TerroirDividerProps {
  className?: string;
}

/* Separador: línea fina con la Silla de Caracas en miniatura al centro */
export function TerroirDivider({ className = "" }: TerroirDividerProps) {
  return (
    <div className={`flex items-center justify-center gap-5 py-2 text-primary-container ${className}`} aria-hidden="true">
      <div className="flex-1 h-px bg-outline-variant" />
      <svg viewBox="0 0 64 20" className="w-14 h-5 flex-shrink-0">
        <path
          d="M2,18 C10,16 16,12 22,8 C25,6 27,3 29,3 C31,3 31,6 33,6 C35,6 36,2 39,2 C43,2 46,9 52,13 C56,15 59,17 62,18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex-1 h-px bg-outline-variant" />
    </div>
  );
}
