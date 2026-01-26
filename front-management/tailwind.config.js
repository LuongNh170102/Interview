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
        // Primary colors
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
        },
        // Secondary & Accent
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        // Surface colors
        surface: {
          DEFAULT: 'var(--color-surface-base)',
          base: 'var(--color-surface-base)',
          muted: 'var(--color-surface-muted)',
          elevated: 'var(--color-surface-elevated)',
        },
        // Background
        background: {
          DEFAULT: 'var(--color-surface-base)',
          muted: 'var(--color-background-muted)',
          footer: 'var(--color-footer-background)',
        },
        // Text colors
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          'on-primary': 'var(--color-on-primary)',
          'on-secondary': 'var(--color-on-secondary)',
        },
        // Border colors
        border: {
          DEFAULT: 'var(--color-border)',
          base: 'var(--color-border)',
          light: 'var(--color-border-light)',
        },
        // Status colors
        status: {
          error: 'var(--color-status-error)',
          'error-bg': 'var(--color-status-error-bg)',
          success: 'var(--color-status-success)',
          'success-bg': 'var(--color-status-success-bg)',
          warning: 'var(--color-status-warning)',
          'warning-bg': 'var(--color-status-warning-bg)',
          info: 'var(--color-status-info)',
          'info-bg': 'var(--color-status-info-bg)',
          default: 'var(--color-status-default)',
          'default-bg': 'var(--color-status-default-bg)',
        },
      },
      // Text color aliases for easier usage
      textColor: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
      },
      // Border color aliases
      borderColor: {
        DEFAULT: 'var(--color-border)',
        light: 'var(--color-border-light)',
      },
    },
  },
  plugins: [],
};
