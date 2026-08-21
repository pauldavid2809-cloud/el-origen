import React from "react";

interface TerroirDividerProps {
  className?: string;
}

export function TerroirDivider({ className = "" }: TerroirDividerProps) {
  return (
    <div className={`flex items-center justify-center gap-4 py-2 ${className}`}>
      <div className="flex-1 h-px bg-outline-variant/30" />
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-primary/30" />
        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
        <div className="w-1 h-1 rounded-full bg-primary/30" />
      </div>
      <div className="flex-1 h-px bg-outline-variant/30" />
    </div>
  );
}
