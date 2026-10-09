import React from "react";
import Image from "next/image";

/* ─── Logo ───
   Recortes del logo oficial (montañas, copa y sol) sin márgenes. */

type LogoTone = "color" | "dark" | "white";

const LOGO_SIZES: Record<LogoTone, { full: [number, number]; mark: [number, number] }> = {
  color: { full: [1035, 637], mark: [1035, 472] },
  dark: { full: [892, 549], mark: [892, 406] },
  white: { full: [892, 549], mark: [892, 406] },
};

interface LogoProps {
  tone?: LogoTone;
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
}

export function Logo({ tone = "color", variant = "mark", className = "", priority }: LogoProps) {
  const [w, h] = LOGO_SIZES[tone][variant];
  return (
    <Image
      src={`/images/logo-${tone}-${variant}.png`}
      alt="El Origen"
      width={w}
      height={h}
      priority={priority}
      className={`h-auto ${className}`}
    />
  );
}

/* ─── Línea del Ávila ───
   Silueta continua del macizo con los dos picos de la Silla de Caracas,
   dibujada con el mismo trazo del logo. */

const RIDGE_PATH =
  "M0,132 C110,124 200,114 300,100 C380,88 432,66 500,56 C540,50 562,34 590,28 C612,24 626,40 642,42 C662,44 678,24 702,19 C732,14 762,40 802,52 C880,74 962,70 1042,82 C1122,94 1202,104 1302,112 C1362,117 1402,120 1440,122";

const VALLEY_PATH = "M250,152 C430,120 620,128 800,146 C900,156 1000,151 1110,138";

interface AvilaRidgeProps {
  className?: string;
  /** Rellena el área bajo la línea (útil como transición entre secciones). */
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  showValley?: boolean;
  showBirds?: boolean;
  animate?: boolean;
  /** Dibuja el Hotel Humboldt sobre la cumbre (requiere `fill`, que también colorea el edificio). */
  showHumboldt?: boolean;
}

/* Cumbre del Ávila en el trazo: x 702 de 1440, y 19 de 170 (el hotel se apoya ahí). */
const SUMMIT_LEFT = `${(702 / 1440) * 100}%`;
const SUMMIT_BOTTOM = `${((170 - 21) / 170) * 100}%`;

/** Silueta del Hotel Humboldt: solo la torre cilíndrica con su corona, apoyada en la cumbre. */
function HumboldtSilhouette({ fill, className = "", style }: { fill: string; className?: string; style?: React.CSSProperties }) {
  const floors = [14, 19, 24, 29, 34, 39, 44];
  return (
    <svg viewBox="0 0 48 54" className={className} style={style} aria-hidden="true">
      {/* antena */}
      <rect x="23.4" y="0" width="1.2" height="7" fill={fill} />
      {/* corona */}
      <rect x="15" y="6" width="18" height="4" rx="1" fill={fill} />
      {/* torre */}
      <path d="M17 10 H31 L30.4 54 H17.6 Z" fill={fill} />
      {/* franjas de los pisos */}
      {floors.map((y) => (
        <rect key={y} x="18.4" y={y} width="11.2" height="1.3" fill="#ffffff" opacity="0.16" />
      ))}
    </svg>
  );
}

export function AvilaRidge({
  className = "",
  fill,
  stroke = "currentColor",
  strokeWidth = 2,
  showValley = true,
  showBirds = false,
  animate = false,
  showHumboldt = false,
}: AvilaRidgeProps) {
  const drawProps = animate ? { pathLength: 1, className: "animate-draw" } : {};
  if (showHumboldt && fill) {
    // El trazo se estira con preserveAspectRatio="none"; el hotel va en su propio SVG para no deformarse.
    return (
      <div className={`relative ${className}`} aria-hidden="true">
        <AvilaRidge
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          showValley={showValley}
          showBirds={showBirds}
          animate={animate}
          className="h-full"
        />
        <HumboldtSilhouette
          fill={fill}
          className="absolute h-[27px] sm:h-10 w-auto -translate-x-1/2"
          style={{ left: SUMMIT_LEFT, bottom: SUMMIT_BOTTOM }}
        />
      </div>
    );
  }
  return (
    <svg
      viewBox="0 0 1440 170"
      preserveAspectRatio="none"
      className={`block w-full ${className}`}
      aria-hidden="true"
    >
      {fill && <path d={`${RIDGE_PATH} L1440,170 L0,170 Z`} fill={fill} />}
      {showBirds && (
        <g stroke={stroke} strokeWidth={1.6} strokeLinecap="round" fill="none">
          <path d="M360,40 q8,-7 15,0 q7,-7 15,0" />
          <path d="M400,22 q6,-5 11,0 q5,-5 11,0" />
          <path d="M318,62 q7,-6 13,0 q6,-6 13,0" />
        </g>
      )}
      <path
        d={RIDGE_PATH}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        {...drawProps}
      />
      {showValley && (
        <path
          d={VALLEY_PATH}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.55}
          {...drawProps}
        />
      )}
    </svg>
  );
}

/* ─── Encabezado de sección editorial ─── */

interface SectionHeadingProps {
  index?: string;
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  subtitle,
  align = "left",
  tone = "light",
  className = "",
}: SectionHeadingProps) {
  const dark = tone === "dark";
  return (
    <div className={`${align === "center" ? "text-center mx-auto" : ""} max-w-2xl ${className}`}>
      <p
        className={`eyebrow flex items-center gap-3 mb-5 ${align === "center" ? "justify-center" : ""} ${
          dark ? "!text-sun" : ""
        }`}
      >
        {index && <span className="tabular-nums">{index}</span>}
        {index && <span className={`h-px w-8 ${dark ? "bg-sun/60" : "bg-primary-container/40"}`} />}
        <span>{eyebrow}</span>
      </p>
      <h2
        className={`font-serif text-[2rem] leading-[1.1] sm:text-5xl text-balance ${
          dark ? "text-paper" : "text-on-surface"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-5 text-[15px] sm:text-base leading-relaxed text-pretty ${
            dark ? "text-paper/75" : "text-on-surface-variant"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─── Sol del logo ─── */

export function SunBurst({ className = "" }: { className?: string }) {
  const rays = [-90, -60, -30, 0, 180, 210, 240];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" fill="none">
        <circle cx="50" cy="50" r="15" />
        {rays.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={50 + Math.cos(rad) * 25}
              y1={50 + Math.sin(rad) * 25}
              x2={50 + Math.cos(rad) * (deg === -90 ? 44 : 38)}
              y2={50 + Math.sin(rad) * (deg === -90 ? 44 : 38)}
            />
          );
        })}
      </g>
    </svg>
  );
}

/* ─── Cabecera de páginas interiores ─── */

interface PageHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="relative paper-grain -mt-16 sm:-mt-20 pt-28 sm:pt-40">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pb-6">
        <p className="eyebrow flex items-center gap-3 mb-6">
          <span className="h-px w-8 bg-primary-container/40" />
          {eyebrow}
        </p>
        <h1 className="font-serif text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl text-on-surface max-w-4xl text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 text-[16px] sm:text-lg text-on-surface-variant leading-relaxed max-w-2xl text-pretty">{subtitle}</p>
        )}
        {children}
      </div>
      <div className="text-primary-container/35">
        <AvilaRidge strokeWidth={1.5} showBirds className="h-14 sm:h-24" />
      </div>
    </header>
  );
}
