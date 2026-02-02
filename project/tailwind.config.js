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
        poppins: ['var(--font-poppins)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        portal: {
          // Background colors
          'cool-blue': '#E4F3FF',
          'soft-lilac': '#E0D6FF',
          // Accent colors
          'sky': '#7DC6FF',
          'pink': '#FF9AC4',
          // Text colors
          'navy': '#1F2A3C',
          'gray': '#444444',
        },
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'button': '0 4px 12px rgba(125, 198, 255, 0.3)',
        'button-pink': '0 4px 12px rgba(255, 154, 196, 0.3)',
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
      ringWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};
