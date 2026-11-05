/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#e60049',
          hover: '#cc0041',
          soft: '#fff5f7',
          footer: '#fff0f3',
        },
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', '"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
