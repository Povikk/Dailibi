import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        desk: {
          950: "#0e100f",
          900: "#151815",
          800: "#1e211d",
          700: "#2b2f29",
        },
        kraft: {
          100: "#efe6d2",
          200: "#e2d4b6",
          300: "#d3bf95",
          400: "#c2a672",
          500: "#a98a52",
        },
        paper: {
          50: "#fbf9f3",
          100: "#f4efe2",
          200: "#e9e1cd",
          300: "#d9cdb0",
        },
        ink: {
          950: "#101113",
          900: "#191a1d",
          800: "#24262a",
          700: "#34373c",
          600: "#4a4e55",
          500: "#6b7078",
        },
        stamp: {
          DEFAULT: "#a1322b",
          deep: "#7d231e",
          bright: "#c0392b",
        },
        marker: "#f2d861",
        good: "#3f7d52",
        bad: "#a5432f",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Oswald", "sans-serif"],
        type: ["var(--font-type)", "'Special Elite'", "Courier New", "monospace"],
        mono: ["var(--font-mono)", "'Courier Prime'", "Courier New", "monospace"],
        sans: ["var(--font-body)", "system-ui", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        file: "0 1px 0 rgba(255,255,255,0.04), 0 18px 40px -22px rgba(0,0,0,0.85)",
        folder: "3px 4px 0 rgba(0,0,0,0.35), 0 22px 45px -25px rgba(0,0,0,0.9)",
        paper: "0 1px 2px rgba(0,0,0,0.25)",
        stamp: "inset 0 0 0 2px rgba(161,50,43,0.85)",
      },
      backgroundImage: {
        "felt": "radial-gradient(circle at 50% 0%, #22261f 0%, #0e100f 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
