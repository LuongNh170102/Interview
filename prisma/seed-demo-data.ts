import {
  ApprovalStatus,
  CourierAvailabilityStatus,
  OperationalStatus,
  Prisma,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

type RoleLookup = (name: string) => Role | undefined;

const loc = (vi: string, en?: string) => ({ vi, en: en ?? vi });

const DEMO_ACCOUNTS = {
  agency: { email: 'agency@demo.vn', password: 'agency123', username: 'AgencyOwner' },
  merchant: { email: 'merchant@demo.vn', password: 'merchant123', username: 'MerchantOwner' },
  customer: { email: 'customer@demo.vn', password: 'customer123', username: 'CustomerDemo' },
  courierOnline: {
    email: 'courier.online@demo.vn',
    password: 'courier123',
    username: 'CourierOnline',
    phone: '0901111001',
  },
  courierPending: {
    email: 'courier.pending@demo.vn',
    password: 'courier123',
    username: 'CourierPending',
    phone: '0901111002',
  },
  courierRejected: {
    email: 'courier.rejected@demo.vn',
    password: 'courier123',
    username: 'CourierRejected',
    phone: '0901111003',
  },
} as const;

async function upsertUser(
  prisma: PrismaClient,
  email: string,
  password: string,
  username: string,
  phone?: string
) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { username, phone },
    create: { email, passwordHash, username, phone, profile: { demo: true } },
  });
}

async function assignRole(
  prisma: PrismaClient,
  userId: number,
  role: Role,
  scope: { merchantId?: number; agencyId?: number; brandId?: number } = {}
) {
  const existing = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId: role.id,
      merchantId: scope.merchantId ?? null,
      agencyId: scope.agencyId ?? null,
      brandId: scope.brandId ?? null,
    },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
        merchantId: scope.merchantId ?? null,
        agencyId: scope.agencyId ?? null,
        brandId: scope.brandId ?? null,
      },
    });
  }
}

export async function seedDemoBusinessData(
  prisma: PrismaClient,
  adminUserId: number,
  getRole: RoleLookup
) {
  console.log('Seeding demo business data...');

  const now = new Date();

  // --- Users ---
  const agencyUser = await upsertUser(
    prisma,
    DEMO_ACCOUNTS.agency.email,
    DEMO_ACCOUNTS.agency.password,
    DEMO_ACCOUNTS.agency.username,
    '0909000001'
  );
  const merchantUser = await upsertUser(
    prisma,
    DEMO_ACCOUNTS.merchant.email,
    DEMO_ACCOUNTS.merchant.password,
    DEMO_ACCOUNTS.merchant.username,
    '0909000002'
  );
  const customerUser = await upsertUser(
    prisma,
    DEMO_ACCOUNTS.customer.email,
    DEMO_ACCOUNTS.customer.password,
    DEMO_ACCOUNTS.customer.username,
    '0909000003'
  );
  const courierOnlineUser = await upsertUser(
    prisma,
    DEMO_ACCOUNTS.courierOnline.email,
    DEMO_ACCOUNTS.courierOnline.password,
    DEMO_ACCOUNTS.courierOnline.username,
    DEMO_ACCOUNTS.courierOnline.phone
  );
  const courierPendingUser = await upsertUser(
    prisma,
    DEMO_ACCOUNTS.courierPending.email,
    DEMO_ACCOUNTS.courierPending.password,
    DEMO_ACCOUNTS.courierPending.username,
    DEMO_ACCOUNTS.courierPending.phone
  );
  const courierRejectedUser = await upsertUser(
    prisma,
    DEMO_ACCOUNTS.courierRejected.email,
    DEMO_ACCOUNTS.courierRejected.password,
    DEMO_ACCOUNTS.courierRejected.username,
    DEMO_ACCOUNTS.courierRejected.phone
  );

  const agencyOwnerRole = getRole('AGENCY_OWNER')!;
  const merchantOwnerRole = getRole('MERCHANT_OWNER')!;
  const customerRole = getRole('CUSTOMER')!;
  const courierRole = getRole('COURIER')!;

  await assignRole(prisma, customerUser.id, customerRole);

  // --- Categories ---
  const categoryFood = await prisma.category.upsert({
    where: { externalId: '11111111-1111-1111-1111-111111111101' },
    update: { name: loc('Đồ ăn & Thức uống', 'Food & Beverage'), slug: 'food-beverage' },
    create: {
      externalId: '11111111-1111-1111-1111-111111111101',
      name: loc('Đồ ăn & Thức uống', 'Food & Beverage'),
      slug: 'food-beverage',
    },
  });
  const categoryGrocery = await prisma.category.upsert({
    where: { externalId: '11111111-1111-1111-1111-111111111102' },
    update: { name: loc('Tạp hóa', 'Grocery'), slug: 'grocery' },
    create: {
      externalId: '11111111-1111-1111-1111-111111111102',
      name: loc('Tạp hóa', 'Grocery'),
      slug: 'grocery',
    },
  });

  // --- Tags ---
  const tagPremium = await prisma.tag.upsert({
    where: { code: 'PREMIUM' },
    update: { name: loc('Đối tác cao cấp', 'Premium Partner'), color: '#F59E0B' },
    create: {
      code: 'PREMIUM',
      name: loc('Đối tác cao cấp', 'Premium Partner'),
      color: '#F59E0B',
      icon: 'star',
    },
  });
  const tagNew = await prisma.tag.upsert({
    where: { code: 'NEW_PARTNER' },
    update: { name: loc('Mới tham gia', 'New Partner'), color: '#3B82F6' },
    create: {
      code: 'NEW_PARTNER',
      name: loc('Mới tham gia', 'New Partner'),
      color: '#3B82F6',
    },
  });

  // --- Agency ---
  let agency = await prisma.agency.findFirst({
    where: { email: 'agency@sharkbee.demo' },
  });
  if (!agency) {
    agency = await prisma.agency.create({
      data: {
        name: 'SharkBee Agency HCMC',
        taxCode: '0312345678',
        email: 'agency@sharkbee.demo',
        phone: '02812345678',
        address: '123 Nguyen Hue, District 1, Ho Chi Minh City',
        ownerId: agencyUser.id,
        approvalStatus: ApprovalStatus.APPROVED,
        approvedAt: now,
        approvedBy: adminUserId,
        operationalStatus: OperationalStatus.ACTIVE,
      },
    });
  } else {
    agency = await prisma.agency.update({
      where: { id: agency.id },
      data: {
        ownerId: agencyUser.id,
        approvalStatus: ApprovalStatus.APPROVED,
        operationalStatus: OperationalStatus.ACTIVE,
      },
    });
  }
  await assignRole(prisma, agencyUser.id, agencyOwnerRole, { agencyId: agency.id });

  // --- Brand ---
  let brand = await prisma.brand.findFirst({ where: { slug: 'sharkbee-food' } });
  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        name: 'SharkBee Food',
        slug: 'sharkbee-food',
        description: loc('Thương hiệu F&B SharkBee', 'SharkBee F&B Brand'),
        businessCategory: 'F&B',
        agencyId: agency.id,
      },
    });
  }

  await prisma.brandCategory.upsert({
    where: { brandId_categoryId: { brandId: brand.id, categoryId: categoryFood.id } },
    update: {},
    create: { brandId: brand.id, categoryId: categoryFood.id, isFeatured: true, displayOrder: 1 },
  });

  // --- Merchants ---
  async function ensureMerchant(data: {
    name: string;
    phone: string;
    ownerId: number;
    approvalStatus: ApprovalStatus;
    latitude?: number;
    longitude?: number;
    city?: string;
  }) {
    let merchant = await prisma.merchant.findFirst({
      where: { name: data.name, ownerId: data.ownerId },
    });
    if (!merchant) {
      merchant = await prisma.merchant.create({
        data: {
          name: data.name,
          phone: data.phone,
          ownerId: data.ownerId,
          brandId: brand!.id,
          agencyId: agency!.id,
          address: '45 Le Loi, District 1, Ho Chi Minh City',
          city: data.city ?? 'Ho Chi Minh City',
          businessType: 'HYBRID',
          businessCategory: 'F&B',
          latitude: data.latitude,
          longitude: data.longitude,
          approvalStatus: data.approvalStatus,
          approvedAt: data.approvalStatus === ApprovalStatus.APPROVED ? now : null,
          approvedBy: data.approvalStatus === ApprovalStatus.APPROVED ? adminUserId : null,
          operationalStatus: OperationalStatus.ACTIVE,
          averageRating: 4.6,
          totalReviews: 128,
        },
      });
    } else {
      merchant = await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          approvalStatus: data.approvalStatus,
          operationalStatus: OperationalStatus.ACTIVE,
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });
    }
    return merchant;
  }

  const merchantCafe = await ensureMerchant({
    name: 'SharkBee Cafe Q1',
    phone: '02888880001',
    ownerId: merchantUser.id,
    approvalStatus: ApprovalStatus.APPROVED,
    latitude: 10.7769,
    longitude: 106.7009,
  });
  const merchantMart = await ensureMerchant({
    name: 'SharkBee Mart D3',
    phone: '02888880002',
    ownerId: merchantUser.id,
    approvalStatus: ApprovalStatus.APPROVED,
    latitude: 10.762622,
    longitude: 106.660172,
    city: 'District 3',
  });
  const merchantPending = await ensureMerchant({
    name: 'Pending Bistro Demo',
    phone: '02888880003',
    ownerId: merchantUser.id,
    approvalStatus: ApprovalStatus.PENDING,
  });

  await assignRole(prisma, merchantUser.id, merchantOwnerRole, {
    merchantId: merchantCafe.id,
  });

  await prisma.merchantCategory.upsert({
    where: {
      merchantId_categoryId: { merchantId: merchantCafe.id, categoryId: categoryFood.id },
    },
    update: {},
    create: { merchantId: merchantCafe.id, categoryId: categoryFood.id, isFeatured: true },
  });
  await prisma.merchantTag.upsert({
    where: { merchantId_tagId: { merchantId: merchantCafe.id, tagId: tagPremium.id } },
    update: {},
    create: { merchantId: merchantCafe.id, tagId: tagPremium.id },
  });
  await prisma.merchantTag.upsert({
    where: { merchantId_tagId: { merchantId: merchantMart.id, tagId: tagNew.id } },
    update: {},
    create: { merchantId: merchantMart.id, tagId: tagNew.id },
  });

  // Operating hours (Mon–Sun 08:00–22:00)
  for (let day = 0; day <= 6; day++) {
    const existingHour = await prisma.operatingHour.findFirst({
      where: { merchantId: merchantCafe.id, dayOfWeek: day },
    });
    if (!existingHour) {
      await prisma.operatingHour.create({
        data: {
          merchantId: merchantCafe.id,
          dayOfWeek: day,
          openTime: '08:00',
          closeTime: '22:00',
        },
      });
    }
  }

  // --- Menu ---
  let menu = await prisma.menu.findFirst({ where: { merchantId: merchantCafe.id } });
  if (!menu) {
    menu = await prisma.menu.create({
      data: {
        merchantId: merchantCafe.id,
        name: loc('Thực đơn chính', 'Main Menu'),
        description: loc('Menu chính của SharkBee Cafe', 'Main menu'),
        isActive: true,
      },
    });
  }

  let sectionDrinks = await prisma.menuSection.findFirst({
    where: { menuId: menu.id, displayOrder: 1 },
  });
  if (!sectionDrinks) {
    sectionDrinks = await prisma.menuSection.create({
      data: {
        menuId: menu.id,
        name: loc('Đồ uống', 'Drinks'),
        displayOrder: 1,
      },
    });
  }
  let sectionFood = await prisma.menuSection.findFirst({
    where: { menuId: menu.id, displayOrder: 2 },
  });
  if (!sectionFood) {
    sectionFood = await prisma.menuSection.create({
      data: {
        menuId: menu.id,
        name: loc('Đồ ăn', 'Food'),
        displayOrder: 2,
      },
    });
  }

  // --- Products ---
  const productDefs: Array<{
    sku: string;
    name: ReturnType<typeof loc>;
    description: ReturnType<typeof loc>;
    price: number;
    stock: number;
    sectionId: number;
    categoryId: string;
    merchantId?: number;
  }> = [
    {
      sku: 'SB-CF-001',
      name: loc('Cà phê sữa đá', 'Vietnamese Iced Coffee'),
      description: loc('Cà phê phin truyền thống', 'Traditional phin coffee'),
      price: 35000,
      stock: 200,
      sectionId: sectionDrinks.id,
      categoryId: categoryFood.externalId,
    },
    {
      sku: 'SB-TE-001',
      name: loc('Trà đào cam sả', 'Peach Tea'),
      description: loc('Trà trái cây tươi mát', 'Fresh fruit tea'),
      price: 45000,
      stock: 150,
      sectionId: sectionDrinks.id,
      categoryId: categoryFood.externalId,
    },
    {
      sku: 'SB-BN-001',
      name: loc('Bánh mì thịt nướng', 'Grilled Pork Banh Mi'),
      description: loc('Bánh mì giòn nhân đầy', 'Crispy banh mi'),
      price: 30000,
      stock: 80,
      sectionId: sectionFood.id,
      categoryId: categoryFood.externalId,
    },
    {
      sku: 'SB-CK-001',
      name: loc('Cơm gà Hội An', 'Hoi An Chicken Rice'),
      description: loc('Cơm gà xé thơm', 'Shredded chicken rice'),
      price: 55000,
      stock: 60,
      sectionId: sectionFood.id,
      categoryId: categoryFood.externalId,
    },
    {
      sku: 'SB-MK-001',
      name: loc('Sữa tươi TH true', 'Fresh Milk 1L'),
      description: loc('Sữa tươi tiệt trùng', 'UHT milk'),
      price: 28000,
      stock: 100,
      sectionId: sectionFood.id,
      categoryId: categoryGrocery.externalId,
      merchantId: merchantMart.id,
    },
  ];

  const products: Prisma.ProductGetPayload<object>[] = [];
  for (const def of productDefs) {
    const targetMerchantId = def.merchantId ?? merchantCafe.id;
    let product = await prisma.product.findFirst({
      where: { sku: def.sku, merchantId: targetMerchantId },
    });
    const metadata = {
      categoryId: def.categoryId,
      thumbnail: 'https://placehold.co/400x400/f2f4f7/475467?text=Product',
      images: ['https://placehold.co/400x400/f2f4f7/475467?text=Product'],
    };
    if (!product) {
      product = await prisma.product.create({
        data: {
          merchantId: targetMerchantId,
          sectionId: def.sectionId,
          sku: def.sku,
          name: def.name,
          description: def.description,
          price: def.price,
          stock: def.stock,
          isActive: true,
          metadata,
          averageRating: 4.5,
          totalReviews: 24,
        },
      });
    } else {
      product = await prisma.product.update({
        where: { id: product.id },
        data: { isActive: true, price: def.price, stock: def.stock, metadata },
      });
    }
    products.push(product);
  }

  // Product variant for coffee
  const coffee = products.find((p) => p.sku === 'SB-CF-001')!;
  const variantExists = await prisma.productVariant.findFirst({
    where: { productId: coffee.id },
  });
  if (!variantExists) {
    await prisma.productVariant.create({
      data: {
        productId: coffee.id,
        name: loc('Size L', 'Size L'),
        price: 40000,
        stock: 100,
      },
    });
  }

  // --- Couriers ---
  async function ensureCourier(
    userId: number,
    data: {
      name: string;
      phone: string;
      email: string;
      approvalStatus: ApprovalStatus;
      availabilityStatus: CourierAvailabilityStatus;
      latitude?: number;
      longitude?: number;
      rejectionReason?: string;
    }
  ) {
    const existing = await prisma.courier.findUnique({ where: { userId } });
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: 'Ho Chi Minh City',
      vehicleType: 'motorbike',
      approvalStatus: data.approvalStatus,
      approvedAt: data.approvalStatus === ApprovalStatus.APPROVED ? now : null,
      approvedBy: data.approvalStatus === ApprovalStatus.APPROVED ? adminUserId : null,
      rejectedAt: data.approvalStatus === ApprovalStatus.REJECTED ? now : null,
      rejectedBy: data.approvalStatus === ApprovalStatus.REJECTED ? adminUserId : null,
      rejectionReason: data.rejectionReason ?? null,
      operationalStatus: OperationalStatus.ACTIVE,
      availabilityStatus: data.availabilityStatus,
      latitude: data.latitude,
      longitude: data.longitude,
    };
    if (!existing) {
      await prisma.courier.create({ data: { userId, ...payload } });
    } else {
      await prisma.courier.update({ where: { userId }, data: payload });
    }
    await assignRole(prisma, userId, courierRole);
  }

  await ensureCourier(courierOnlineUser.id, {
    name: 'Nguyen Van Tai',
    phone: DEMO_ACCOUNTS.courierOnline.phone,
    email: DEMO_ACCOUNTS.courierOnline.email,
    approvalStatus: ApprovalStatus.APPROVED,
    availabilityStatus: CourierAvailabilityStatus.ONLINE,
    latitude: 10.772,
    longitude: 106.698,
  });
  await ensureCourier(courierPendingUser.id, {
    name: 'Tran Van Pending',
    phone: DEMO_ACCOUNTS.courierPending.phone,
    email: DEMO_ACCOUNTS.courierPending.email,
    approvalStatus: ApprovalStatus.PENDING,
    availabilityStatus: CourierAvailabilityStatus.OFFLINE,
    latitude: 10.78,
    longitude: 106.71,
  });
  await ensureCourier(courierRejectedUser.id, {
    name: 'Le Van Rejected',
    phone: DEMO_ACCOUNTS.courierRejected.phone,
    email: DEMO_ACCOUNTS.courierRejected.email,
    approvalStatus: ApprovalStatus.REJECTED,
    availabilityStatus: CourierAvailabilityStatus.OFFLINE,
    rejectionReason: 'Giấy tờ không hợp lệ',
  });

  const courierOnline = await prisma.courier.findUnique({
    where: { userId: courierOnlineUser.id },
  });

  // --- Promotion & Shipping ---
  let promotion = await prisma.promotion.findFirst({
    where: { code: 'WELCOME10', merchantId: merchantCafe.id },
  });
  if (!promotion) {
    promotion = await prisma.promotion.create({
      data: {
        merchantId: merchantCafe.id,
        code: 'WELCOME10',
        description: loc('Giảm 10% đơn đầu', '10% off first order'),
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 50000,
        startAt: now,
        endAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        maxUses: 1000,
      },
    });
  }

  const shippingExists = await prisma.shippingFee.findFirst({
    where: { merchantId: merchantCafe.id },
  });
  if (!shippingExists) {
    await prisma.shippingFee.create({
      data: {
        merchantId: merchantCafe.id,
        minDistance: 0,
        maxDistance: 10,
        baseFee: 15000,
        feePerKm: 3000,
      },
    });
  }

  // --- Cart (customer) ---
  let cart = await prisma.cart.findFirst({
    where: { userId: customerUser.id, merchantId: merchantCafe.id },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: customerUser.id, merchantId: merchantCafe.id, totalAmount: 0 },
    });
  }

  const cartProduct = products.find((p) => p.sku === 'SB-CF-001')!;
  const cartItemExists = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId: cartProduct.id },
  });
  if (!cartItemExists) {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: cartProduct.id,
        quantity: 2,
        price: cartProduct.price,
        total: new Prisma.Decimal(Number(cartProduct.price) * 2),
      },
    });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { totalAmount: new Prisma.Decimal(Number(cartProduct.price) * 2) },
    });
  }

  // --- Sample completed order ---
  const orderExists = await prisma.order.findFirst({
    where: { userId: customerUser.id, merchantId: merchantCafe.id },
  });
  if (!orderExists && courierOnline) {
    const orderTotal = new Prisma.Decimal(125000);
    const order = await prisma.order.create({
      data: {
        userId: customerUser.id,
        merchantId: merchantCafe.id,
        courierId: courierOnline.id,
        promotionId: promotion.id,
        totalAmount: orderTotal,
        shippingFee: new Prisma.Decimal(15000),
        status: 'completed',
        paymentStatus: 'paid',
        deliveryAddress: {
          address: '10 Nguyen Hue, District 1, HCM',
          latitude: 10.7769,
          longitude: 106.7009,
          phone: '0909000003',
        },
        orderItems: {
          create: [
            {
              productId: cartProduct.id,
              quantity: 2,
              price: cartProduct.price,
              total: new Prisma.Decimal(Number(cartProduct.price) * 2),
            },
            {
              productId: products.find((p) => p.sku === 'SB-BN-001')!.id,
              quantity: 1,
              price: 30000,
              total: new Prisma.Decimal(30000),
            },
          ],
        },
      },
    });
    console.log(`Created sample order: ${order.externalId}`);
  }

  // --- Reviews ---
  const reviewExists = await prisma.review.findFirst({
    where: { userId: customerUser.id, productId: cartProduct.id },
  });
  if (!reviewExists) {
    await prisma.review.create({
      data: {
        userId: customerUser.id,
        productId: cartProduct.id,
        merchantId: merchantCafe.id,
        rating: new Prisma.Decimal(5),
        comment: 'Cà phê rất ngon, giao hàng nhanh!',
      },
    });
  }

  // --- OTP sample (for testing) ---
  const otpExists = await prisma.otpVerification.findFirst({
    where: { phone: '0909000099', code: '123456' },
  });
  if (!otpExists) {
    await prisma.otpVerification.create({
      data: {
        phone: '0909000099',
        code: '123456',
        verified: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
  }

  console.log('Demo accounts (password in parentheses):');
  console.log(`  Admin:          admin@vhandelivery.com (admin123)`);
  console.log(`  Agency Owner:   ${DEMO_ACCOUNTS.agency.email} (${DEMO_ACCOUNTS.agency.password})`);
  console.log(`  Merchant Owner: ${DEMO_ACCOUNTS.merchant.email} (${DEMO_ACCOUNTS.merchant.password})`);
  console.log(`  Customer:       ${DEMO_ACCOUNTS.customer.email} (${DEMO_ACCOUNTS.customer.password})`);
  console.log(`  Courier ONLINE: ${DEMO_ACCOUNTS.courierOnline.email} (${DEMO_ACCOUNTS.courierOnline.password})`);
  console.log(`  Courier PENDING:${DEMO_ACCOUNTS.courierPending.email} (for /users/couriers)`);
  console.log(`  Merchant Cafe:  ${merchantCafe.name} (${merchantCafe.externalId})`);
  console.log(`  Products:       ${products.length} items seeded`);
  console.log('Demo business data seeded.');
}
