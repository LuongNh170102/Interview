const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          red: 'var(--primary-red)',
          dark: 'var(--primary-dark)',
          yellow: 'var(--primary-yellow)',
        },
        text: {
          dark: 'var(--text-dark)',
          gray: 'var(--text-gray)',
          light: 'var(--text-light)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
        },
        bg: {
          gray: 'var(--bg-gray)',
          white: 'var(--white)',
        },
        status: {
          error: 'var(--error-red)',
          success: 'var(--success-green)',
        },
      },
    },
  },
  plugins: [],
};
