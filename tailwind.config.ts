import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Syne", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // ── FORTI Brand Palette (dari logo) ──
        navy: {
          950: "#111e2a",   // darkest bg
          900: "#1e3040",   // primary bg (logo background)
          800: "#243649",   // card / surface
          700: "#2d4a63",   // border / hover
          600: "#3a5f7d",   // subtle highlight
          500: "#4d7a9e",   // muted elements
        },
        cyan: {
          DEFAULT: "#29abe2", // accent (dari dot laptop di logo)
          bright: "#3dbef5",
          dim:    "#1a8cc4",
          glow:   "#29abe240",
          faint:  "#29abe215",
        },
        silver: {
          DEFAULT: "#b0c4d8", // teks sekunder
          bright:  "#d4e4f0", // teks terang
          dim:     "#7a9ab8", // teks muted
        },
        snow: "#f0f6fc",    // teks utama (hampir putih)

        // shadcn tokens
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "cyan-sm":  "0 0 12px #29abe230",
        "cyan-md":  "0 0 28px #29abe240",
        "cyan-lg":  "0 0 60px #29abe225",
        "card":     "0 4px 24px #0d1a2420",
        "card-hover": "0 8px 40px #0d1a2440",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%":      { opacity: "1",   transform: "scale(1.05)" },
        },
        "ticker": {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scan": {
          "0%":   { top: "0%" },
          "100%": { top: "100%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "float":          "float 4s ease-in-out infinite",
        "pulse-glow":     "pulse-glow 2.5s ease-in-out infinite",
        "ticker":         "ticker 20s linear infinite",
        "fade-up":        "fade-up 0.5s ease-out",
        "scan":           "scan 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
