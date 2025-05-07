import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"
const { fontFamily } = defaultTheme;

const config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: '#7357FF',
        brandAlt: '#0C6BFF',
        surfaceLight: '#FFFFFF',
        surfaceDark: '#121827',
        cardLight: '#F8F9FF',
        cardDark: '#1A2138',
        borderLight: '#E5E7EB',
        borderDark: '#26324C',
        accentGreen: '#22C55E',
        accentAmber: '#F59E0B',
        success: {
          DEFAULT: "hsl(var(--success))",
          light: "hsl(var(--success-light))",
          dark: "hsl(var(--success-dark))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          light: "hsl(var(--warning-light))",
          dark: "hsl(var(--warning-dark))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          light: "hsl(var(--info-light))",
          dark: "hsl(var(--info-dark))",
        },
        ai: {
          DEFAULT: "hsl(var(--ai))",
          light: "hsl(var(--ai-light))",
          dark: "hsl(var(--ai-dark))",
        },
        user: {
          DEFAULT: "hsl(var(--user))",
          light: "hsl(var(--user-light))",
          dark: "hsl(var(--user-dark))",
        },
        timer: {
          normal: "hsl(var(--timer-normal))",
          warning: "hsl(var(--timer-warning))",
          danger: "hsl(var(--timer-danger))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", ...fontFamily.sans],
        mono: ["var(--font-jetbrains-mono)", ...fontFamily.mono],
        display: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      transitionProperty: {
        width: "width",
        spacing: 'margin, padding',
      },
      boxShadow: {
        card: '0 4px 30px rgba(0,0,0,.06)',
        cardDark: '0 4px 30px rgba(0,0,0,.45)',
      },
      backgroundImage: {
        'promo-light': 'linear-gradient(90deg,#d8dbff 0%,#f4e5ff 100%)',
        'promo-dark':  'linear-gradient(90deg,#3e2c81 0%,#30215d 100%)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-in",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
} satisfies Config

export default config
