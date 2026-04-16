/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: "#050510",
        panel: "#0F0F1A",
      },
      fontFamily: {
        fantasy: ['Cinzel', 'serif'],
      }
    },
  },
  plugins: [],
}
