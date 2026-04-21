/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./atlas-ui/**/*.{html,js,jsx,ts,tsx}",
    "./atlas-ui/template/**/*.html",
    "./atlas-ui/react/static/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'atlas-dark': '#0a0a1a',
        'atlas-blue': '#16213e',
        'atlas-accent': '#0f3460',
        'atlas-green': '#00ff88',
        'atlas-cyan': '#0099ff',
      },
      fontFamily: {
        'atlas': ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'stargate': 'stargate 0.3s ease-in-out',
      },
      keyframes: {
        stargate: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' }
        }
      }
    },
  },
  plugins: [],
}