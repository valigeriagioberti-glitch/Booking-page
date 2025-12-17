/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 18px 40px rgba(2, 6, 23, 0.12)',
      },
    },
  },
  plugins: [],
};
