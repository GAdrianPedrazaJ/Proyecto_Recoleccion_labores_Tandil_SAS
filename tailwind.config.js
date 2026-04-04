/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#16a34a',
        ink: '#1f2937',
        surface: '#f9fafb',
      },
    },
  },
  plugins: [],
}
