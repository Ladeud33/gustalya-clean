// tailwind.config.js - Configuration Tailwind CSS
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Couleurs personnalisées
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        cooking: {
          meat: '#dc2626',
          fish: '#0ea5e9',
          vegetable: '#16a34a',
          pasta: '#d97706',
          rice: '#a855f7',
        }
      },
      
      // Animations personnalisées
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'timer-tick': 'timer-tick 1s ease-in-out infinite',
        'progress': 'progress 1s ease-out',
      },
      
      keyframes: {
        'timer-tick': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'progress': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        }
      },
      
      // Ombres personnalisées
      boxShadow: {
        'timer': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'timer-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'cooking': '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
        'success': '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
        'warning': '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
        'error': '0 4px 14px 0 rgba(239, 68, 68, 0.39)',
      },
      
      // Bordures personnalisées
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // Espacement personnalisé
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Polices personnalisées
      fontFamily: {
        'timer': ['Monaco', 'Consolas', 'monospace'],
        'cooking': ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // Tailles personnalisées
      fontSize: {
        'timer': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'timer-sm': ['2rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display': ['4rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      
      // Gradients personnalisés
      backgroundImage: {
        'gradient-cooking': 'linear-gradient(135deg, #4f46e5, #7c3aed, #2563eb)',
        'gradient-success': 'linear-gradient(135deg, #059669, #10b981)',
        'gradient-warning': 'linear-gradient(135deg, #d97706, #f59e0b)',
        'gradient-error': 'linear-gradient(135deg, #dc2626, #ef4444)',
        'gradient-background': 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #f3e8ff 100%)',
      },
      
      // Transitions personnalisées
      transitionProperty: {
        'timer': 'transform, box-shadow, background-color',
      },
      
      // Largeurs maximales personnalisées
      maxWidth: {
        'timer': '400px',
        'cooking-form': '800px',
      },
      
      // Hauteurs personnalisées
      height: {
        'timer-display': '120px',
        'progress-bar': '8px',
      },
    },
  },
  plugins: [
    // Plugin pour les formes
    function({ addUtilities }) {
      const newUtilities = {
        '.timer-card': {
          'backdrop-filter': 'blur(10px)',
          'background': 'rgba(255, 255, 255, 0.95)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-effect': {
          'backdrop-filter': 'blur(15px)',
          'background': 'rgba(255, 255, 255, 0.1)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.text-gradient': {
          'background': 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
      }
      addUtilities(newUtilities)
    }
  ],
  
  // Dark mode
  darkMode: 'class',
} 