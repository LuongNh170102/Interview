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
        primary: 'var(--color-primary, #F35B2A)',
        'primary-hover': 'var(--color-primary-hover, #D94A1E)',
        secondary: 'var(--color-secondary, #1F2937)',
        accent: 'var(--color-accent, #10B981)',
        surface: {
          base: 'var(--color-surface-base, #FFFFFF)',
          muted: 'var(--color-surface-muted, #F9FAFB)',
          elevated: 'var(--color-surface-elevated, #FFFFFF)',
        },
        text: {
          primary: 'var(--color-text-primary, #111827)',
          secondary: 'var(--color-text-secondary, #4B5563)',
          tertiary: 'var(--color-text-tertiary, #9CA3AF)',
        },
        border: {
          base: 'var(--color-border, #E5E7EB)',
        },
        status: {
          error: 'var(--color-status-error, #EF4444)',
          success: 'var(--color-status-success, #10B981)',
        },
        content: {
          'on-primary': 'var(--color-on-primary, #FFFFFF)',
          'on-secondary': 'var(--color-on-secondary, #FFFFFF)',
        },
      },
    },
  },
  plugins: [],
};
