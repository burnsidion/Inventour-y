/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1d1e22',
        secondary: '#393f4d',
        fallback: '#3f3f3f',
        ivory: '#FFF1E7',
      },
      spacing: {
        'sales-input': '60px',
        'sizes-display': '80px',
      },
      keyframes: {
        bounceOnce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      animation: {
        bounceOnce: 'bounceOnce 0.4s ease-out',
      },
    },
  },
  plugins: [daisyui],
};
