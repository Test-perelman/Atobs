/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — teal #44A194
        brand: {
          50:  '#f0faf8',
          100: '#d8f1ed',
          200: '#b2e3dc',
          300: '#7dcfc4',
          400: '#4cb5a9',
          500: '#44a194',
          600: '#367f75',
          700: '#2d6861',
          800: '#265550',
          900: '#214644',
          950: '#102827',
        },
        // Secondary — steel blue #537D96
        steel: {
          50:  '#f1f6f9',
          100: '#ddebf1',
          200: '#bfd8e5',
          300: '#93bdd2',
          400: '#629bb8',
          500: '#537d96',
          600: '#42647a',
          700: '#385365',
          800: '#314654',
          900: '#2c3d48',
          950: '#1c272f',
        },
        // Accent — salmon/blush #EC8F8D
        blush: {
          50:  '#fdf3f3',
          100: '#fbe8e8',
          200: '#f9d5d4',
          300: '#f4b4b3',
          400: '#ec8f8d',
          500: '#e06766',
          600: '#cc4747',
          700: '#aa3939',
          800: '#8c3131',
          900: '#752e2e',
          950: '#401515',
        },
        // Background — cream #F4F0E4
        cream: {
          50:  '#fdfcf9',
          100: '#f4f0e4',
          200: '#e8e2cb',
          300: '#d8d0b0',
          400: '#c4ba90',
          500: '#b0a373',
          600: '#978b5d',
          700: '#7c714d',
          800: '#665d41',
          900: '#534b36',
          950: '#2d2920',
        },
      },
    },
  },
  plugins: [],
}
