import { PrismaService } from '../../prisma.service';
import { ROLE } from '../constants/role.constants';

export async function isPlatformAdmin(
  prisma: PrismaService,
  userId: number
): Promise<boolean> {
  const adminRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: { name: ROLE.PLATFORM_ADMIN },
    },
  });
  return !!adminRole;
}
