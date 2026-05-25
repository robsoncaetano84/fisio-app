import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        synap: {
          primary: '#2E7D5E',
          primaryLight: '#4CAF50',
          primaryDark: '#1B5E40',
          secondary: '#5C6BC0',
          secondaryLight: '#8E99C2',
          secondaryDark: '#3F51B5',
          accent: '#FF7043',
          accentLight: '#FFAB91',
          background: '#F5F7FA',
          surface: '#FFFFFF',
          border: '#E0E0E0',
          text: '#212121',
          muted: '#757575',
        },
      },
      borderRadius: {
        synap: '8px',
      },
      boxShadow: {
        synap: '0 8px 28px rgba(33, 33, 33, 0.08)',
        subtle: '0 1px 2px rgba(33, 33, 33, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
};

export default config;
