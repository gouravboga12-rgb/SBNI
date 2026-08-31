/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#003893',
          dark: '#002669',
          green: '#007a33',
          emerald: '#059669',
        }
      }
    },
  },
  plugins: [],
}
