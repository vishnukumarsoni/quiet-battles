/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0b0c',        // near-black page background
        coal: '#151517',       // raised surfaces
        graphite: '#232326',   // borders, dividers
        ash: '#8a8a85',        // muted text
        bone: '#e9e5dc',       // off-white text
        clay: '#b9a98f',       // single warm accent, used sparingly
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        wider2: '0.22em',
      },
      keyframes: {
        toast: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
        rise: { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        toast: 'toast .3s ease-out both',
        fade: 'fade .8s ease-out both',
        rise: 'rise 1.1s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
};
