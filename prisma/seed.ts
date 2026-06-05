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
    {
      resource: 'product',
      action: 'create',
      description: {
        en: 'Create new product',
        vi: 'Tạo sản phẩm mới',
        ko: '새 제품 만들기',
      },
    },
    {
      resource: 'product',
      action: 'update',
      description: {
        en: 'Update product details',
        vi: 'Cập nhật thông tin sản phẩm',
        ko: '제품 정보 업데이트',
      },
    },
    {
      resource: 'product',
      action: 'delete',
      description: {
        en: 'Delete product',
        vi: 'Xóa sản phẩm',
        ko: '제품 삭제',
      },
    },
    {
      resource: 'product',
      action: 'read',
      description: {
        en: 'View product details',
        vi: 'Xem chi tiết sản phẩm',
        ko: '제품 상세 보기',
      },
    },

    // Category (NEW)
    {
      resource: 'category',
      action: 'create',
      description: {
        en: 'Create category',
        vi: 'Tạo danh mục',
        ko: '카테고리 생성',
      },
    },
    {
      resource: 'category',
      action: 'update',
      description: {
        en: 'Update category',
        vi: 'Cập nhật danh mục',
        ko: '카테고리 업데이트',
      },
    },
    {
      resource: 'category',
      action: 'delete',
      description: {
        en: 'Delete category',
        vi: 'Xóa danh mục',
        ko: '카테고리 삭제',
      },
    },
    {
      resource: 'category',
      action: 'read',
      description: {
        en: 'View category',
        vi: 'Xem danh mục',
        ko: '카테고리 보기',
      },
    },

    // Order
    {
      resource: 'order',
      action: 'read',
      description: { en: 'View orders', vi: 'Xem đơn hàng', ko: '주문 보기' },
    },
    {
      resource: 'order',
      action: 'update_status',
      description: {
        en: 'Update order status',
        vi: 'Cập nhật trạng thái đơn hàng',
        ko: '주문 상태 업데이트',
      },
    },
    {
      resource: 'order',
      action: 'create',
      description: { en: 'Place an order', vi: 'Đặt hàng', ko: '주문하기' },
    },

    // Merchant

    {
      resource: 'merchant',
      action: 'create',
      description: {
        en: 'Create merchant',
        vi: 'Tạo cửa hàng',
        ko: '상점 만들기',
      },
    },
    {
      resource: 'merchant',
      action: 'update',
      description: {
        en: 'Update merchant info',
        vi: 'Cập nhật thông tin cửa hàng',
        ko: '상점 정보 업데이트',
      },
    },
    {
      resource: 'merchant',
      action: 'delete',
      description: {
        en: 'Delete merchant',
        vi: 'Xóa cửa hàng',
        ko: '상점 삭제',
      },
    },
    {
      resource: 'merchant',
      action: 'update_status',
      description: {
        en: 'Update merchant status',
        vi: 'Cập nhật trạng thái cửa hàng',
        ko: '상점 상태 업데이트',
      },
    },
    {
      resource: 'merchant',
      action: 'read',
      description: {
        en: 'View merchant details',
        vi: 'Xem chi tiết cửa hàng',
        ko: '상점 상세 보기',
      },
    },

    // Agency
    {
      resource: 'agency',
      action: 'create',
      description: {
        en: 'Create agency',
        vi: 'Tạo đại lý',
        ko: '대리점 만들기',
      },
    },
    {
      resource: 'agency',
      action: 'update',
      description: {
        en: 'Update agency info',
        vi: 'Cập nhật thông tin đại lý',
        ko: '대리점 정보 업데이트',
      },
    },
    {
      resource: 'agency',
      action: 'delete',
      description: {
        en: 'Delete agency',
        vi: 'Xóa đại lý',
        ko: '대리점 삭제',
      },
    },
    {
      resource: 'agency',
      action: 'update_status',
      description: {
        en: 'Update agency status',
        vi: 'Cập nhật trạng thái đại lý',
        ko: '대리점 상태 업데이트',
      },
    },
    {
      resource: 'agency',
      action: 'read',
      description: {
        en: 'View agency details',
        vi: 'Xem chi tiết đại lý',
        ko: '대리점 상세 보기',
      },
    },

    // Courier
    {
      resource: 'courier',
      action: 'create',
      description: {
        en: 'Create courier',
        vi: 'Tạo tài xế giao hàng',
        ko: '배달 기사 만들기',
      },
    },
    {
      resource: 'courier',
      action: 'update',
      description: {
        en: 'Update courier info',
        vi: 'Cập nhật thông tin tài xế',
        ko: '배달 기사 정보 업데이트',
      },
    },
    {
      resource: 'courier',
      action: 'delete',
      description: {
        en: 'Delete courier',
        vi: 'Xóa tài xế',
        ko: '배달 기사 삭제',
      },
    },
    {
      resource: 'courier',
      action: 'update_status',
      description: {
        en: 'Approve or reject courier',
        vi: 'Duyệt hoặc từ chối tài xế',
        ko: '배달 기사 승인 또는 거절',
      },
    },
    {
      resource: 'courier',
      action: 'read',
      description: {
        en: 'View courier details',
        vi: 'Xem chi tiết tài xế',
        ko: '배달 기사 상세 보기',
      },
    },

    // System
    {
      resource: 'system',
      action: 'manage_users',
      description: {
        en: 'Manage system users',
        vi: 'Quản lý người dùng hệ thống',
        ko: '시스템 사용자 관리',
      },
    },
    {
      resource: 'system',
      action: 'view_reports',
      description: {
        en: 'View system reports',
        vi: 'Xem báo cáo hệ thống',
        ko: '시스템 보고서 보기',
      },
    },
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
      update: {
        description: p.description as any, // Explicit cast to ensure JSON update
      },
      create: {
        resource: p.resource,
        action: p.action,
        description: p.description as any, // Explicit cast
      },
    });
  }

  // 2. Create Roles
  const rolesData = [
    {
      name: 'PLATFORM_ADMIN',
      scope: 'PLATFORM',
      description: {
        en: 'System Administrator',
        vi: 'Quản trị viên hệ thống',
        ko: '시스템 관리자',
      },
    },
    {
      name: 'AGENCY_OWNER',
      scope: 'MERCHANT',
      description: {
        en: 'Owner of an Agency',
        vi: 'Chủ sở hữu đại lý',
        ko: '대리점 소유자',
      },
    },
    {
      name: 'MERCHANT_OWNER',
      scope: 'MERCHANT',
      description: {
        en: 'Owner of a Merchant',
        vi: 'Chủ sở hữu cửa hàng',
        ko: '상점 소유자',
      },
    },
    {
      name: 'CUSTOMER',
      scope: 'PLATFORM',
      description: { en: 'End User / Customer', vi: 'Khách hàng', ko: '고객' },
    },
    {
      name: 'COURIER',
      scope: 'PLATFORM',
      description: {
        en: 'Delivery Driver',
        vi: 'Tài xế giao hàng',
        ko: '배달 기사',
      },
    },
  ];

  console.log(`Creating ${rolesData.length} roles...`);

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {
        description: r.description,
      },
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
      perms: allPermissions.filter(
        (p) =>
          ['merchant', 'product', 'order'].includes(p.resource) ||
          (p.resource === 'agency' && ['update', 'read'].includes(p.action))
      ),
    },
    {
      role: 'MERCHANT_OWNER',
      perms: allPermissions.filter(
        (p) =>
          ['product', 'order'].includes(p.resource) ||
          (p.resource === 'merchant' && ['update', 'read'].includes(p.action))
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
    {
      role: 'COURIER',
      perms: [
        getPerm('courier', 'read'),
        getPerm('courier', 'update'),
        getPerm('order', 'read'),
        getPerm('order', 'update_status'),
      ].filter(Boolean),
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
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@vhandelivery.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

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

  // 5. Create sample merchant owner, approved merchant and products for Task 3 local testing
  const merchantOwnerEmail = 'merchant.owner@vhandelivery.com';
  const merchantOwnerPassword = 'merchant123';
  const merchantOwnerHash = await bcrypt.hash(merchantOwnerPassword, 10);
  const merchantOwnerRole = getRole('MERCHANT_OWNER');
  const customerRole = getRole('CUSTOMER');
  const courierRole = getRole('COURIER');

  const merchantOwner = await prisma.user.upsert({
    where: { email: merchantOwnerEmail },
    update: {
      passwordHash: merchantOwnerHash,
      username: 'MerchantOwner',
      phone: '0900000001',
      profile: { firstName: 'Merchant', lastName: 'Owner' },
    },
    create: {
      email: merchantOwnerEmail,
      passwordHash: merchantOwnerHash,
      username: 'MerchantOwner',
      phone: '0900000001',
      profile: { firstName: 'Merchant', lastName: 'Owner' },
    },
  });

  let sampleMerchant = await prisma.merchant.findFirst({
    where: { phone: '0900000002' },
  });

  const sampleMerchantData = {
    name: 'VHan Demo Store',
    ownerId: merchantOwner.id,
    address: '123 Nguyen Hue, District 1',
    city: 'Ho Chi Minh City',
    contactName: 'Merchant Owner',
    businessType: 'OFFLINE',
    businessCategory: 'Food & Beverage',
    phone: '0900000002',
    latitude: 10.7758,
    longitude: 106.701,
    approvalStatus: 'APPROVED' as any,
    approvedAt: new Date(),
    approvedBy: adminUser.id,
    operationalStatus: 'ACTIVE' as any,
    isAcceptingOrders: true,
    metadata: {
      source: 'seed',
      purpose: 'Task 3 local product management testing',
    },
  };

  if (sampleMerchant) {
    sampleMerchant = await prisma.merchant.update({
      where: { id: sampleMerchant.id },
      data: sampleMerchantData,
    });
  } else {
    sampleMerchant = await prisma.merchant.create({
      data: sampleMerchantData,
    });
  }

  if (merchantOwnerRole) {
    const existingMerchantOwnerRole = await prisma.userRole.findFirst({
      where: {
        userId: merchantOwner.id,
        roleId: merchantOwnerRole.id,
        merchantId: sampleMerchant.id,
        agencyId: null,
        brandId: null,
      },
    });

    if (!existingMerchantOwnerRole) {
      await prisma.userRole.create({
        data: {
          userId: merchantOwner.id,
          roleId: merchantOwnerRole.id,
          merchantId: sampleMerchant.id,
          agencyId: null,
          brandId: null,
        },
      });
    }
  }

  const customerEmail = 'customer@vhandelivery.com';
  const customerPassword = 'customer123';
  const customerHash = await bcrypt.hash(customerPassword, 10);
  const customerUser = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {
      passwordHash: customerHash,
      username: 'CustomerDemo',
      phone: '0900000003',
      profile: { firstName: 'Customer', lastName: 'Demo' },
    },
    create: {
      email: customerEmail,
      passwordHash: customerHash,
      username: 'CustomerDemo',
      phone: '0900000003',
      profile: { firstName: 'Customer', lastName: 'Demo' },
    },
  });

  if (customerRole) {
    const existingCustomerRole = await prisma.userRole.findFirst({
      where: {
        userId: customerUser.id,
        roleId: customerRole.id,
        merchantId: null,
        agencyId: null,
        brandId: null,
      },
    });

    if (!existingCustomerRole) {
      await prisma.userRole.create({
        data: {
          userId: customerUser.id,
          roleId: customerRole.id,
          merchantId: null,
          agencyId: null,
          brandId: null,
        },
      });
    }
  }

  const courierEmail = 'courier.demo@vhandelivery.com';
  const courierPassword = 'courier123';
  const courierHash = await bcrypt.hash(courierPassword, 10);
  const courierUser = await prisma.user.upsert({
    where: { email: courierEmail },
    update: {
      passwordHash: courierHash,
      username: 'CourierDemo',
      phone: '0900000004',
      profile: { firstName: 'Courier', lastName: 'Demo' },
    },
    create: {
      email: courierEmail,
      passwordHash: courierHash,
      username: 'CourierDemo',
      phone: '0900000004',
      profile: { firstName: 'Courier', lastName: 'Demo' },
    },
  });

  if (courierRole) {
    const existingCourierRole = await prisma.userRole.findFirst({
      where: {
        userId: courierUser.id,
        roleId: courierRole.id,
        merchantId: null,
        agencyId: null,
        brandId: null,
      },
    });

    if (!existingCourierRole) {
      await prisma.userRole.create({
        data: {
          userId: courierUser.id,
          roleId: courierRole.id,
          merchantId: null,
          agencyId: null,
          brandId: null,
        },
      });
    }
  }

  await prisma.courier.upsert({
    where: { userId: courierUser.id },
    update: {
      name: 'Courier Demo',
      phone: '0900000004',
      email: courierEmail,
      status: 'ONLINE',
      vehicleType: 'motorbike',
      currentLocation: { latitude: 10.776, longitude: 106.701 },
      approvalStatus: 'APPROVED' as any,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      operationalStatus: 'ACTIVE' as any,
      statusChangedAt: new Date(),
      statusChangedBy: adminUser.id,
    },
    create: {
      userId: courierUser.id,
      name: 'Courier Demo',
      phone: '0900000004',
      email: courierEmail,
      status: 'ONLINE',
      vehicleType: 'motorbike',
      currentLocation: { latitude: 10.776, longitude: 106.701 },
      approvalStatus: 'APPROVED' as any,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      operationalStatus: 'ACTIVE' as any,
      statusChangedAt: new Date(),
      statusChangedBy: adminUser.id,
    },
  });

  const sampleProducts = [
    {
      sku: 'VHAN-PHO-001',
      name: { vi: 'Pho bo dac biet', en: 'Special beef pho' },
      description: {
        vi: 'Pho bo nong voi topping day du',
        en: 'Hot beef pho with full toppings',
      },
      price: '65000',
      stock: 30,
      metadata: {
        category: 'Food',
        images: ['https://placehold.co/480x320?text=Pho'],
      },
    },
    {
      sku: 'VHAN-COFFEE-001',
      name: { vi: 'Ca phe sua da', en: 'Vietnamese iced coffee' },
      description: {
        vi: 'Ca phe sua da truyen thong',
        en: 'Classic Vietnamese iced coffee',
      },
      price: '30000',
      stock: 50,
      metadata: {
        category: 'Drinks',
        images: ['https://placehold.co/480x320?text=Coffee'],
      },
    },
    {
      sku: 'VHAN-BANHMI-001',
      name: { vi: 'Banh mi ga', en: 'Chicken banh mi' },
      description: {
        vi: 'Banh mi ga sot dac biet',
        en: 'Chicken banh mi with house sauce',
      },
      price: '42000',
      stock: 25,
      metadata: {
        category: 'Food',
        images: ['https://placehold.co/480x320?text=Banh+Mi'],
      },
    },
  ];

  for (const product of sampleProducts) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        merchantId: sampleMerchant.id,
        sku: product.sku,
      },
    });

    const productData = {
      merchantId: sampleMerchant.id,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: 'VND',
      sku: product.sku,
      stock: product.stock,
      isActive: true,
      metadata: product.metadata,
    };

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
    } else {
      await prisma.product.create({
        data: productData,
      });
    }
  }

  console.log(
    `Created sample merchant owner: ${merchantOwnerEmail} / ${merchantOwnerPassword}`
  );
  console.log(`Created sample customer: ${customerEmail} / ${customerPassword}`);
  console.log(`Created sample courier: ${courierEmail} / ${courierPassword}`);
  console.log(`Created sample merchant and ${sampleProducts.length} products.`);

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
