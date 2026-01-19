import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Happier Grocery inspired palette
        primary: {
          DEFAULT: "#22c55e",
          light: "#4ade80",
          dark: "#16a34a",
        },
        cream: {
          DEFAULT: "#f5f5f4",
          light: "#fafaf9",
          dark: "#e7e5e4",
        },
        charcoal: {
          DEFAULT: "#1c1917",
          light: "#44403c",
          muted: "#78716c",
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      letterSpacing: {
        'wider-custom': '0.1em',
      },
      borderRadius: {
        'pill': '9999px',
      },
    },
  },
  plugins: [],
};
export default config;
