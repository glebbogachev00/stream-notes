/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': '1rem',      // 16px
        'sm': '1.125rem',  // 18px
        'base': '1.25rem',   // 20px
        'lg': '1.5rem',    // 24px
        'xl': '1.875rem',  // 30px
        '2xl': '2.25rem',   // 36px
        '3xl': '3rem',      // 48px
        '4xl': '4rem',      // 64px
        '5xl': '5rem',      // 80px
        '6xl': '6rem',      // 96px
      },
      fontFamily: {
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        'tighter': '-0.02em',
        'tight': '-0.01em',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}