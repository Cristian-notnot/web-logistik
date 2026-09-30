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
    dark: '#0F172A',
    dark2: '#1E293B',
    app: '#F8FAFC',
  },

  brand: {
    DEFAULT: '#2563EB',
    light: '#DBEAFE',
    dark: '#1D4ED8',
  },

  secondary: {
    DEFAULT: '#059669',
    light: '#D1FAE5',
    dark: '#047857',
  },

  accent: {
    DEFAULT: '#F97316',
    light: '#FFEDD5',
    dark: '#C2410C',
  },

  status: {
    baik: '#059669',
    rusak: '#DC2626',
    hilang: '#64748B',
    maintenance: '#D97706',
  },
},
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.06), 0 2px 10px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
