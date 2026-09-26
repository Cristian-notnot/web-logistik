/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        base: {
          dark: '#12232C',
          dark2: '#1B2C36',
          app: '#F5F1EA',
        },
        brand: {
          DEFAULT: '#1F6F5F',
          light: '#E8F4EF',
          dark: '#194F43',
        },
        status: {
          baik: '#1E8E67',
          rusak: '#D9534F',
          hilang: '#5A6678',
          maintenance: '#C57B1C',
        },
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.06), 0 2px 10px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
