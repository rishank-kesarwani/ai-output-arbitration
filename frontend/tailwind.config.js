/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151f32',
          950: '#070d17',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        emerald: {
          450: '#10b981',
        },
        amber: {
          450: '#f59e0b',
        },
        rose: {
          450: '#f43f5e',
        },
      },
      screens: {
        'xs': '400px',
        '3xl': '1920px',
        '4k': '2560px',
      },
    },
  },
  plugins: [],
};
