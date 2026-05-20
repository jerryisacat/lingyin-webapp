import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sakura: {
          DEFAULT: "#f0a8b0",
          light: "#f5c3c8",
          dark: "#d98a93",
        },
        warm: {
          white: "#faf3e8",
          beige: "#f3ebe1",
        },
        dusty: {
          blue: "#9caec1",
        },
        ink: {
          DEFAULT: "#2c2c2c",
          light: "#6b6b6b",
        },
        surface: {
          DEFAULT: "#f3ebe1",
          border: "#e2dedb",
        },
      },
      fontFamily: {
        sans: ["Noto Sans SC", "Inter", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
        glow: "0 0 0 3px rgba(240, 168, 176, 0.25)",
      },
      lineHeight: {
        relaxed: "1.75",
      },
    },
  },
  plugins: [],
};

export default config;
