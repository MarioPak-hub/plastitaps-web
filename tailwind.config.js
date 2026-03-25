/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plastic: {
          50: '#f2f8fc',
          100: '#e1eff7',
          200: '#cbe2f0',
          300: '#a7cee4',
          400: '#7cb5d4',
          500: '#5c9ac0',
          600: '#487da3',
          700: '#3c6484',
          800: '#34556e',
          900: '#2e475c',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
