/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gig: {
          lime: '#D7FD3C',
          'lime-hover': '#C5F82A',
          'lime-light': '#F3FCE2',
          'lime-dark': '#A3E635',
          dark: '#111827',
          'dark-surface': '#1F2937',
          'dark-card': '#161F2C',
          bg: '#F8FAF5',
          border: '#E6EFE2',
          muted: '#64748B',
        },
      },
      boxShadow: {
        card: '0 10px 30px -4px rgba(18, 24, 20, 0.05), 0 4px 10px -2px rgba(18, 24, 20, 0.02)',
        glow: '0 0 35px -5px rgba(215, 253, 60, 0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
