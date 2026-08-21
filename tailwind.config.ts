import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#5c0531",
        "primary-container": "#7a2048",
        "on-primary": "#ffffff",
        "on-primary-container": "#ff8cb6",
        "primary-fixed": "#ffd9e3",
        "primary-fixed-dim": "#ffb0ca",
        "on-primary-fixed": "#3e001f",
        "on-primary-fixed-variant": "#7f244c",
        "inverse-primary": "#ffb0ca",

        "surface": "#faf8f7",
        "surface-dim": "#dcd9d9",
        "surface-bright": "#faf8f7",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f2f1",
        "surface-container": "#efeceb",
        "surface-container-high": "#e9e6e5",
        "surface-container-highest": "#e3e0df",
        "surface-variant": "#e8e4e3",

        "background": "#faf8f7",
        "on-background": "#1a1a1a",
        "on-surface": "#1a1a1a",
        "on-surface-variant": "#64585c",

        "secondary": "#6b6966",
        "secondary-container": "#e2dfdb",
        "secondary-fixed": "#e5e2de",
        "secondary-fixed-dim": "#c8c6c2",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#636260",
        "on-secondary-fixed": "#1c1c1a",
        "on-secondary-fixed-variant": "#474744",

        "tertiary": "#735c00",
        "tertiary-container": "#cca730",
        "tertiary-fixed": "#ffe088",
        "tertiary-fixed-dim": "#e9c349",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#4f3e00",
        "on-tertiary-fixed": "#241a00",
        "on-tertiary-fixed-variant": "#574500",

        "outline": "#877277",
        "outline-variant": "#ddd2d5",
        "surface-tint": "#9d3c63",
        "inverse-surface": "#1a1a1a",
        "inverse-on-surface": "#f5f2f1",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        "gold": "#c9a84c",
        "vinotinto": "#7a2048",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Manrope'", "system-ui", "-apple-system", "sans-serif"],
      },
      spacing: {
        "container-max": "1280px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(122,32,72,0.04), 0 12px 40px rgba(122,32,72,0.03)",
        card: "0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(122,32,72,0.035)",
        elevated: "0 8px 30px rgba(0,0,0,0.06), 0 2px 8px rgba(122,32,72,0.04)",
        mockup: "0 24px 48px -12px rgba(0,0,0,0.12), 0 8px 16px -4px rgba(122,32,72,0.06)",
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        full: "9999px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "700": "700ms",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "scale-in": "scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "float": "float 4s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
