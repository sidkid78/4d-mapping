import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        foreground: '#003366',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#003366'
        },
        popover: {
          DEFAULT: '#FFFFFF', 
          foreground: '#003366'
        },
        primary: {
          DEFAULT: '#003366',
          foreground: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#1E90FF',
          foreground: '#FFFFFF'
        },
        muted: {
          DEFAULT: '#A9A9A9',
          foreground: '#FFFFFF'
        },
        accent: {
          DEFAULT: '#1E90FF',
          foreground: '#FFFFFF'
        },
        destructive: {
          DEFAULT: '#FF4500',
          foreground: '#FFFFFF'
        },
        success: {
          DEFAULT: '#32CD32',
          foreground: '#FFFFFF'
        },
        border: '#A9A9A9',
        input: '#A9A9A9',
        ring: '#1E90FF',
        chart: {
          '1': '#003366',
          '2': '#1E90FF', 
          '3': '#32CD32',
          '4': '#FF4500',
          '5': '#A9A9A9'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)', 
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
