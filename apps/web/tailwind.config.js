/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1890ff',
          hover: '#1677d9',
          light: '#e6f7ff',
        },
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 0, 0, 0.06)',
        header: '0 1px 0 rgba(0, 0, 0, 0.06)',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};
