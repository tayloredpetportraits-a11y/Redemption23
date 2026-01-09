/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['var(--font-playfair)', 'serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
        sans: ['var(--font-outfit)', 'var(--font-inter)', 'sans-serif'], // Default to Outfit for modern feel
      },
      colors: {
        brand: {
          bg: '#F4F5F7',        // Cool Silver (Main Background)
          text: '#101123',      // Dark Navy (Primary Text)
          navy: '#101123',      // Dark Navy (Primary Action)
          periwinkle: '#E7ECFF',// Light Periwinkle (Secondary/Text-on-dark)
          blue: '#D9E1FC',      // Vibrant Blue (Highlights)
          white: '#FFFFFF',     // Surface/Cards
        },
        // Keeping zinc as a fallback if needed, but brand should take precedence
        zinc: {
          950: '#fafaf9',
          900: '#ffffff',
          800: '#e7e5e4',
          700: '#d6d3d1',
          600: '#a8a29e',
          500: '#78716c',
          400: '#57534e',
          300: '#44403c',
          200: '#292524',
          100: '#1c1917',
          50: '#0c0a09',
        },
      },
    },
  },
  plugins: [],
};
