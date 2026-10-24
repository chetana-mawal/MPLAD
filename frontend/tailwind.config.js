/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B132B',
          800: '#1C2541',
          700: '#3A506B',
        },
        sentinel: {
          critical: '#DC2626', // Red 600
          high: '#EA580C',     // Orange 600
          medium: '#D97706',   // Amber 600
          low: '#16A34A',      // Green 600
        }
      }
    },
  },
  plugins: [],
}
