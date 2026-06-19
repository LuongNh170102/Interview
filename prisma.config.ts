import { defineConfig, env } from 'prisma/config';

// Load environment variables natively in Node.js >= 20.6.0
if (typeof process.loadEnvFile === 'function') {
  process.loadEnvFile();
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
