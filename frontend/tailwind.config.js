/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          bg: '#282a2e',
          panel: '#34373a',
          panelhover: '#42454a',
          primary: '#ff8c42', // orange
          secondary: '#20c997', // teal
          dark: '#1e2023',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
