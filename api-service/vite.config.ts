import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig as defineVitestConfig } from 'vitest/config';
export default defineVitestConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/api-service',

  plugins: [nxViteTsPaths()],

  esbuild: {
    target: 'es2021',
  },

  // Cấu hình Vitest
  test: {
    globals: true,
    environment: 'node', // Bắt buộc cho Backend
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/api-service',
      provider: 'v8',
    },
  },
});
