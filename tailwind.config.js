/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
        ],
      },
      boxShadow: {
        lift:
          '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -6px rgba(15, 23, 42, 0.08)',
        glow:
          '0 0 0 1px rgba(16, 185, 129, 0.12), 0 12px 40px -12px rgba(5, 150, 105, 0.35)',
      },
      keyframes: {
        'mesh-shift': {
          '0%, 100%': { backgroundPosition: '0% 40%' },
          '50%': { backgroundPosition: '100% 60%' },
        },
        'logo-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-5px) rotate(-1.5deg)' },
        },
        'logo-glow': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.08)' },
        },
        'orbit-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.9)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'mesh-shift': 'mesh-shift 14s ease-in-out infinite',
        'logo-float': 'logo-float 4s ease-in-out infinite',
        'logo-glow': 'logo-glow 3.2s ease-in-out infinite',
        'orbit-slow': 'orbit-slow 18s linear infinite',
        sparkle: 'sparkle 2.4s ease-in-out infinite',
        'fade-up': 'fade-up 0.45s ease-out both',
        shimmer: 'shimmer 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
