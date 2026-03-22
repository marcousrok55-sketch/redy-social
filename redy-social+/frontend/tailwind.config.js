/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
          light: '#818CF8'
        },
        secondary: {
          DEFAULT: '#10B981',
          dark: '#059669'
        },
        accent: {
          DEFAULT: '#F59E0B',
          dark: '#D97706'
        },
        background: '#0F172A',
        surface: {
          DEFAULT: '#1E293B',
          light: '#334155'
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
