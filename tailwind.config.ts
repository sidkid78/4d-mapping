import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

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
        // Primary Colors
        background: '#FFFFFF', // Clean background
        foreground: '#003366', // Navy blue for text
        
        // Card styling
        card: {
          DEFAULT: '#FFFFFF', // White background for cards
          foreground: '#003366' // Navy text for cards
        },
        
        // Popover styling
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#003366'
        },
        
        // Primary elements (headers, nav, main buttons)
        primary: {
          DEFAULT: '#003366', // Navy blue
          foreground: '#FFFFFF'
        },
        
        // Secondary elements (CTAs, interactive elements)
        secondary: {
          DEFAULT: '#1E90FF', // Light blue
          foreground: '#FFFFFF'
        },
        
        // Muted elements (subtle backgrounds, secondary text)
        muted: {
          DEFAULT: '#A9A9A9', // Gray
          foreground: '#FFFFFF'
        },
        
        // Accent elements (highlights, interactive states)
        accent: {
          DEFAULT: '#1E90FF', // Light blue
          foreground: '#FFFFFF'
        },
        
        // Destructive actions (errors, critical alerts)
        destructive: {
          DEFAULT: '#FF4500', // Red
          foreground: '#FFFFFF'
        },
        
        // Success indicators
        success: {
          DEFAULT: '#32CD32', // Green
          foreground: '#FFFFFF'
        },
        
        // UI Elements
        border: '#A9A9A9', // Gray for borders and dividers
        input: '#A9A9A9', // Gray for form elements
        ring: '#1E90FF', // Light blue for focus states
        
        // Chart colors
        chart: {
          '1': '#003366', // Navy blue
          '2': '#1E90FF', // Light blue
          '3': '#32CD32', // Green
          '4': '#FF4500', // Red
          '5': '#A9A9A9'  // Gray
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)', 
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [animate],
} satisfies Config;
