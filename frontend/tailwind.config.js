/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#E60000',
        'brand-yellow': '#FFD100',
        'brand-green': '#25D366',
      }
    },
  },
  plugins: [],
}

