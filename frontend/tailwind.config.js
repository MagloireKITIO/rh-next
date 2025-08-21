const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    screens: {
      xs: "475px",
      ...defaultTheme.screens,
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      black: "#000000",
      // Corporate color palette
      primary: {
        50: "#eff6ff",
        100: "#dbeafe", 
        200: "#bfdbfe",
        300: "#93c5fd",
        400: "#60a5fa",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
        800: "#1e40af",
        900: "#1e3a8a",
      },
      secondary: {
        50: "#f0f9ff",
        100: "#e0f2fe",
        200: "#bae6fd", 
        300: "#7dd3fc",
        400: "#38bdf8",
        500: "#0ea5e9",
        600: "#0284c7",
        700: "#0369a1",
        800: "#075985",
        900: "#0c4a6e",
      },
      // Devfolio inspired colors adapted for corporate
      indigo: {
        light: "#6366f1",
        dark: "#4338ca",
      },
      purple: "#8b31ff",
      gray: {
        light: {
          1: "#f8fafc",
          2: "#e2e8f0",
          3: "#cbd5e1",
          4: "#94a3b8",
        },
        dark: {
          1: "#334155",
          2: "#1e293b", 
          3: "#0f172a",
          4: "#020617",
          5: "#000000",
        },
      },
      // Fix for text visibility
      "gray-light-1": "#f8fafc",
      "gray-light-2": "#e2e8f0", 
      "gray-light-3": "#cbd5e1",
      "gray-light-4": "#94a3b8",
      "gray-dark-1": "#334155",
      "gray-dark-2": "#1e293b",
      "gray-dark-3": "#0f172a", 
      "gray-dark-4": "#020617",
      "gray-dark-5": "#000000",
      success: "#10b981",
      warning: "#f59e0b", 
      danger: "#ef4444",
    },
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      mono: ["JetBrains Mono", "monospace"],
    },
    extend: {
      animation: {
        meteor: "meteor 5s linear infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-up": "fadeUp 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },
      keyframes: {
        meteor: {
          "0%": {
            transform: "rotate(215deg) translateX(0)",
            opacity: "1",
          },
          "70%": {
            opacity: "1",
          },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: "0",
          },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { 
            opacity: "0",
            transform: "translateY(30px)"
          },
          "100%": { 
            opacity: "1",
            transform: "translateY(0)"
          },
        },
        scaleIn: {
          "0%": {
            opacity: "0",
            transform: "scale(0.9)"
          },
          "100%": {
            opacity: "1", 
            transform: "scale(1)"
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};