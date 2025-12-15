import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding ...');

  // 1. Create Permissions
  // Define resources and actions
  const permissionsData = [
    // Product
    { resource: 'product', action: 'create', description: 'Create new product' },
    { resource: 'product', action: 'update', description: 'Update product details' },
    { resource: 'product', action: 'delete', description: 'Delete product' },
    { resource: 'product', action: 'read', description: 'View product details' },
    
    // Order
    { resource: 'order', action: 'read', description: 'View orders' },
    { resource: 'order', action: 'update_status', description: 'Update order status' },
    { resource: 'order', action: 'create', description: 'Place an order' },
    
    // Merchant
    { resource: 'merchant', action: 'create', description: 'Create merchant' },
    { resource: 'merchant', action: 'update', description: 'Update merchant info' },
    { resource: 'merchant', action: 'delete', description: 'Delete merchant' },
    
    // Agency
    { resource: 'agency', action: 'create', description: 'Create agency' },
    { resource: 'agency', action: 'update', description: 'Update agency info' },
    
    // System
    { resource: 'system', action: 'manage_users', description: 'Manage system users' },
    { resource: 'system', action: 'view_reports', description: 'View system reports' },
  ];

  console.log(`Creating ${permissionsData.length} permissions...`);
  
  // Upsert permissions to avoid duplicates
  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: p.resource,
          action: p.action,
        },
      },
      update: {},
      create: p,
    });
  }

  // 2. Create Roles
  const rolesData = [
    { name: 'PLATFORM_ADMIN', scope: 'PLATFORM', description: 'System Administrator' },
    { name: 'AGENCY_OWNER', scope: 'MERCHANT', description: 'Owner of an Agency' },
    { name: 'MERCHANT_OWNER', scope: 'MERCHANT', description: 'Owner of a Merchant' },
    { name: 'CUSTOMER', scope: 'PLATFORM', description: 'End User / Customer' },
    { name: 'COURIER', scope: 'PLATFORM', description: 'Delivery Driver' },
  ];

  console.log(`Creating ${rolesData.length} roles...`);

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        scope: r.scope as any, // Cast to enum
        description: r.description,
      },
    });
  }

  // 3. Assign Permissions to Roles
  // Helper to get IDs
  const allPermissions = await prisma.permission.findMany();
  const allRoles = await prisma.role.findMany();

  const getRole = (name: string) => allRoles.find((r) => r.name === name);
  const getPerm = (res: string, act: string) => 
    allPermissions.find((p) => p.resource === res && p.action === act);

  // Define mappings
  const rolePermissionsMap = [
    {
      role: 'PLATFORM_ADMIN',
      perms: allPermissions, // Admin gets everything
    },
    {
      role: 'AGENCY_OWNER',
      perms: allPermissions.filter(p => 
        ['merchant', 'product', 'order', 'agency'].includes(p.resource)
      ),
    },
    {
      role: 'MERCHANT_OWNER',
      perms: allPermissions.filter(p => 
        ['product', 'order'].includes(p.resource) || 
        (p.resource === 'merchant' && p.action === 'update')
      ),
    },
    {
      role: 'CUSTOMER',
      perms: [
        getPerm('order', 'create'),
        getPerm('order', 'read'),
        getPerm('product', 'read'),
      ].filter(Boolean), // Filter out undefined
    },
  ];

  for (const map of rolePermissionsMap) {
    const role = getRole(map.role);
    if (!role) continue;

    for (const perm of map.perms) {
      if (!perm) continue;
      
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
  }
  console.log('Assigned permissions to roles.');

  // 4. Create Default Admin User
  const adminEmail = 'admin@vhandelivery.com';
  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      username: 'SuperAdmin',
      profile: { firstName: 'Admin', lastName: 'User' },
    },
  });

  // Assign PLATFORM_ADMIN role to admin user
  const adminRole = getRole('PLATFORM_ADMIN');
  if (adminRole) {
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: adminUser.id,
        roleId: adminRole.id,
        merchantId: null,
        agencyId: null,
        brandId: null,
      },
    });

    if (!existingRole) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
          merchantId: null,
          agencyId: null,
          brandId: null,
        },
      });
      console.log(`Assigned PLATFORM_ADMIN role to ${adminEmail}`);
    } else {
      console.log(`User ${adminEmail} already has PLATFORM_ADMIN role.`);
    }
    
    console.log(`Created admin user: ${adminEmail}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
