/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary:   '#0D1B2A',
        secondary: '#1B4F72',
        accent:    '#1ABC9C',
        warning:   '#F39C12',
        danger:    '#E74C3C',
        success:   '#27AE60',
        muted:     '#5D6D7E',
      },
    },
  },
  plugins: [],
};
