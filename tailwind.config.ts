import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // The app's chrome tokens, ported one for one from
        // threadology-native/lib/theme.ts. Prefixed so the new web UI can
        // be built alongside the old pages until they are retired.
        th: {
          bg: "#FFFFFF",
          surface: "#F7F6F3",
          chip: "#F2F0EC",
          "chip-on-media": "rgba(242,240,236,0.92)",
          "chip-pressed": "#E5E2D9",
          "nav-pill": "#F4F2EE",
          border: "#E8E5DE",
          ink: "#1B1A17",
          muted: "#6B6358",
          accent: "#2D5A45",
          "accent-pressed": "#1E3D2F",
          danger: "#A33A2B",
          "on-ink": "#FDFCFA",
          "avatar-glyph": "#BCB5A6",
        },
      },
      borderRadius: {
        // The app's whole radius family.
        "th-inline-chip": "11px",
        "th-chip": "14px",
        "th-card": "20px",
        "th-pill": "33px",
        "th-fab": "27px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        "th-sans": ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        "th-mono": ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        "mono-display": ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
