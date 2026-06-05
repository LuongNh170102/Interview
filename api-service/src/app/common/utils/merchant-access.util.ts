import { PrismaService } from '../../prisma.service';
import { ROLE } from '../constants/role.constants';
import { isPlatformAdmin } from './role.util';

export async function canAccessMerchant(
  prisma: PrismaService,
  userId: number,
  merchantId: number
): Promise<boolean> {
  if (await isPlatformAdmin(prisma, userId)) {
    return true;
  }

  const merchantOwnerRole = await prisma.userRole.findFirst({
    where: {
      userId,
      merchantId,
      role: { name: ROLE.MERCHANT_OWNER },
    },
  });
  if (merchantOwnerRole) {
    return true;
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { agency: true },
  });

  return merchant?.agency?.ownerId === userId;
}

export async function resolveMerchantId(
  prisma: PrismaService,
  merchantExternalId: string
): Promise<number | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { externalId: merchantExternalId },
    select: { id: true },
  });
  return merchant?.id ?? null;
}

export async function getAccessibleMerchantIds(
  prisma: PrismaService,
  userId: number
): Promise<number[] | 'all'> {
  if (await isPlatformAdmin(prisma, userId)) {
    return 'all';
  }

  const ids = new Set<number>();
  const ownedRoles = await prisma.userRole.findMany({
    where: {
      userId,
      merchantId: { not: null },
      role: { name: ROLE.MERCHANT_OWNER },
    },
    select: { merchantId: true },
  });
  for (const role of ownedRoles) {
    if (role.merchantId) {
      ids.add(role.merchantId);
    }
  }

  const agencyMerchants = await prisma.merchant.findMany({
    where: { agency: { ownerId: userId } },
    select: { id: true },
  });
  for (const merchant of agencyMerchants) {
    ids.add(merchant.id);
  }

  return [...ids];
}
