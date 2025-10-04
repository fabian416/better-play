/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // Tailwind v3: usar 'class' (lo más estable). Si usás daisyUI con data-theme, igual funciona.
  darkMode: "class",

  theme: {
    extend: {
      // Tokens "shadcn-like" usando OKLCH + CSS vars (definidas en globals.css)
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",

        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
      },

      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },

  plugins: [require("daisyui")],

  // Config de daisyUI: tu tema custom (lo renombré a 'betterplay' y un solo objeto, sin duplicados)
  daisyui: {
    themes: [
      {
        betterplay: {
          primary: "#2A3242",
          "primary-content": "#E2E8F0",
          secondary: "#2D3748",
          "secondary-content": "#81E6D9",
          accent: "#5B7DB1",
          "accent-content": "#E2E8F0",
          neutral: "#2D3748",
          "neutral-content": "#81E6D9",
          "base-100": "#0F172A",
          "base-200": "#1E293B",
          "base-300": "#2D3748",
          "base-content": "#E2E8F0",
          info: "#5B7DB1",
          success: "#34EEB6",
          warning: "#FFE08A",
          error: "#FF6B6B",
          "--rounded-btn": "9999rem",
          "--border-btn": "1px",
          "--btn-focus-scale": "0.95",
          // extras opcionales:
          "--gradient-primary": "linear-gradient(45deg, #5B7DB1 0%, #81E6D9 100%)",
          "--glow-effect": "0 0 8px rgba(129, 230, 217, 0.4)",
        },
      },
    ],
  },
};
