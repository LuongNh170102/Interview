import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();

    // auto-apply migrations only in development environment
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      try {
        console.log('🔄 Auto-applying Prisma migrations...');
        // stdio: 'inherit' để hiện log của prisma ra terminal
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('✅ Migrations applied successfully.');
      } catch (error) {
        console.error('❌ Migration failed:', error);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
