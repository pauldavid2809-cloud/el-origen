"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  showDownloadButton?: boolean;
  codeLabel?: string;
}

export function QRCodeDisplay({
  value,
  size = 200,
  showDownloadButton = true,
  codeLabel,
}: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (value) {
      QRCode.toDataURL(
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: "#5c0531", // Primary burgundy
            light: "#ffffff",
          },
        },
        (err, url) => {
          if (!err && url) {
            setDataUrl(url);
          }
        }
      );
    }
  }, [value, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `ticket-${codeLabel || "qr"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-surface-container-low rounded-xl border border-surface-variant">
      {/* QR Code Container */}
      <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white p-3 rounded-lg shadow-sm flex items-center justify-center mb-3">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR Code for ${codeLabel || "Ticket"}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary text-xs">
            <span className="material-symbols-outlined animate-spin mr-1">progress_activity</span>
            Generando QR...
          </div>
        )}
      </div>

      {codeLabel && (
        <span className="text-xs uppercase tracking-widest font-bold text-primary mb-1">
          {codeLabel}
        </span>
      )}

      <p className="text-xs text-center text-on-surface-variant max-w-xs leading-relaxed">
        Este código QR será tu entrada digital el día del evento. Preséntalo al llegar a la bodega.
      </p>

      {showDownloadButton && dataUrl && (
        <button
          onClick={handleDownload}
          className="mt-3 text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary-container flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-[14px]">download</span>
          Guardar imagen QR
        </button>
      )}
    </div>
  );
}
