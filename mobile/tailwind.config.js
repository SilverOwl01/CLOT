/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'particle': 'particle 0.6s ease-out forwards',
      },
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'particle': {
          '0%': { transform: 'translate(0,0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--tw-translate-x), var(--tw-translate-y)) scale(0)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}