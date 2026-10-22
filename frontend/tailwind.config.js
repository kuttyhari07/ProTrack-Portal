/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pro: {
          light: {
            bg: '#F5F7FB',
            card: '#FFFFFF',
            sidebar: '#101828',
            'text-primary': '#172033',
            'text-secondary': '#667085',
            'accent-primary': '#4F46E5',
            'accent-secondary': '#0D9488',
            border: '#E4E7EC',
            success: '#16A34A',
            warning: '#D97706',
            error: '#DC2626'
          },
          dark: {
            bg: '#0B1120',
            card: '#111827',
            surface: '#1F2937',
            sidebar: '#080D19',
            'text-primary': '#F3F4F6',
            'text-secondary': '#9CA3AF',
            'accent-primary': '#818CF8',
            'accent-secondary': '#2DD4BF',
            border: '#374151',
            success: '#4ADE80',
            warning: '#FBBF24',
            error: '#F87171'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      borderRadius: {
        card: '14px'
      }
    },
  },
  plugins: [],
}
