/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        /* ✅ Global Background & Text */
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',

        /* ✅ Navbar & Sidebar */
        navbar: {
          DEFAULT: 'var(--bg-primary)',
          text: 'var(--text-primary)',
          hover: 'var(--link-hover)',
          active: 'var(--accent-color)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar-background)',
          foreground: 'var(--sidebar-foreground)',
          accent: 'var(--sidebar-accent)',
        },

        /* ✅ Buttons & Links */
        button: {
          DEFAULT: 'var(--button-bg)',
          text: 'var(--button-text)',
        },
        link: {
          DEFAULT: 'var(--link-color)',
          hover: 'var(--link-hover)',
        },

        /* ✅ Card Components */
        card: {
          DEFAULT: 'var(--card-bg)',
          foreground: 'var(--card-text)',
        },

        /* ✅ Borders */
        border: {
          DEFAULT: 'var(--border-color)',
          accent: 'var(--accent-dark)', // ✅ Now directly applied
        },

        /* ✅ Accent Colors */
        accent: {
          base: 'var(--accent-base)',
          light: 'var(--accent-light)',
          lighter: 'var(--accent-lighter)',
          dark: 'var(--accent-dark)', // ✅ Fixes accent-dark border issue
          darker: 'var(--accent-darker)',
          contrast: 'var(--accent-contrast)',
        },
      },

      /* ✅ Background Utilities */
      backgroundColor: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        accent: 'var(--accent-color)',
        button: 'var(--button-bg)',
      },

      /* ✅ Text Utilities */
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        grey: 'var(--text-grey)',
        accent: 'var(--accent-color)',
        link: 'var(--link-color)',
        'link-hover': 'var(--link-hover)',
      },

      /* ✅ Border Utilities */
      borderColor: {
        DEFAULT: 'var(--border-color)',
        accent: 'var(--accent-dark)', // ✅ Ensures proper border color
      },

      /* ✅ Border Radius */
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      /* ✅ Animations */
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },

      /* ✅ Box Shadows */
      boxShadow: {
        header: 'var(--header-box-shadow)',
        shadow: 'var(--shadow)',
        'shadow-hover': 'var(--shadow-hover)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/forms')],
};
