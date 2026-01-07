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
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        surface: {
          base: 'var(--color-surface-base)',
          muted: 'var(--color-surface-muted)',
          elevated: 'var(--color-surface-elevated)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        border: {
          base: 'var(--color-border)',
        },
        status: {
          error: 'var(--color-status-error)',
          success: 'var(--color-status-success)',
        },
        content: {
          'on-primary': 'var(--color-on-primary)',
          'on-secondary': 'var(--color-on-secondary)',
        },
      },
    },
  },
  plugins: [],
};
