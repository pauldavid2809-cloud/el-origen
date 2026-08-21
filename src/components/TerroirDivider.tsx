import React from "react";

interface TerroirDividerProps {
  className?: string;
}

export function TerroirDivider({ className = "" }: TerroirDividerProps) {
  return (
    <div className={`w-full flex items-center justify-center my-8 ${className}`}>
      <div className="flex-1 max-w-xs h-px bg-outline-variant opacity-60"></div>
      <div className="mx-4 flex items-center justify-center text-primary opacity-80">
        <svg
          width="48"
          height="18"
          viewBox="0 0 48 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-primary"
        >
          <path
            d="M2 16L14 4L22 12L30 2L46 16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex-1 max-w-xs h-px bg-outline-variant opacity-60"></div>
    </div>
  );
}
