import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Connecting to:', process.env.DATABASE_URL);
  
  console.log('--- ROLES ---');
  const roles = await prisma.role.findMany();
  console.log(roles);

  console.log('\n--- PERMISSIONS ---');
  const permissions = await prisma.permission.findMany();
  console.log(permissions);

  console.log('\n--- ROLE PERMISSIONS ---');
  const rolePermissions = await prisma.rolePermission.findMany();
  console.log(`Total RolePermissions: ${rolePermissions.length}`);
  console.log(rolePermissions);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
