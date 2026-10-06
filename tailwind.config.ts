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
        /* El Origen — paleta derivada del logo (vino #7D2A46) y del sol/ocre del atardecer caraqueño */
        "primary": "#5A1C31",
        "primary-container": "#7D2A46",
        "on-primary": "#FFFFFF",
        "on-primary-container": "#F4C9D4",
        "primary-fixed": "#F3DDE2",
        "primary-fixed-dim": "#E2B3BF",
        "on-primary-fixed": "#33101C",
        "on-primary-fixed-variant": "#6E2540",
        "inverse-primary": "#E2B3BF",

        "surface": "#F6F0E7",
        "surface-dim": "#E2D8C9",
        "surface-bright": "#FBF7F1",
        "surface-container-lowest": "#FFFCF7",
        "surface-container-low": "#F2EADF",
        "surface-container": "#ECE3D6",
        "surface-container-high": "#E5DACB",
        "surface-container-highest": "#DED2C1",
        "surface-variant": "#E8DFD2",

        "background": "#F6F0E7",
        "on-background": "#2A1519",
        "on-surface": "#2A1519",
        "on-surface-variant": "#6A5650",

        "secondary": "#6E625A",
        "secondary-container": "#E6DCCE",
        "secondary-fixed": "#EAE1D4",
        "secondary-fixed-dim": "#CFC3B3",
        "on-secondary": "#FFFFFF",
        "on-secondary-container": "#5F544D",
        "on-secondary-fixed": "#221A16",
        "on-secondary-fixed-variant": "#4A403A",

        "tertiary": "#8A5A1C",
        "tertiary-container": "#D9A35A",
        "tertiary-fixed": "#F6DDB6",
        "tertiary-fixed-dim": "#E8BE7E",
        "on-tertiary": "#FFFFFF",
        "on-tertiary-container": "#4A2F08",
        "on-tertiary-fixed": "#2B1A03",
        "on-tertiary-fixed-variant": "#6B4512",

        "outline": "#8E7D74",
        "outline-variant": "#DACDBC",
        "surface-tint": "#7D2A46",
        "inverse-surface": "#2A1519",
        "inverse-on-surface": "#F6F0E7",

        "error": "#B3261E",
        "error-container": "#F9DEDC",
        "on-error": "#FFFFFF",
        "on-error-container": "#8C1D18",

        "gold": "#C08A3E",
        "vinotinto": "#7D2A46",
        "ink": "#2A1519",
        "paper": "#F6F0E7",
        "sun": "#D9A35A",
      },
      fontFamily: {
        serif: ["'Gelasio'", "Georgia", "serif"],
        sans: ["'Figtree'", "system-ui", "-apple-system", "sans-serif"],
      },
      spacing: {
        "container-max": "1280px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(125,42,70,0.04), 0 12px 40px rgba(125,42,70,0.03)",
        card: "0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(125,42,70,0.035)",
        elevated: "0 8px 30px rgba(0,0,0,0.06), 0 2px 8px rgba(125,42,70,0.04)",
        mockup: "0 24px 48px -12px rgba(0,0,0,0.12), 0 8px 16px -4px rgba(125,42,70,0.06)",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
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
