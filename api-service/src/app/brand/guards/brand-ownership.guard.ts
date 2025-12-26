import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BRAND_MESSAGES } from '../../common/constants/messages.constant';

@Injectable()
export class BrandOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const brandId = request.params.id; // External ID (UUID)

    if (!user || !brandId) {
      return false;
    }

    const brand = await this.prisma.brand.findUnique({
      where: { externalId: brandId },
      include: { agency: true },
    });

    if (!brand) {
      throw new NotFoundException(BRAND_MESSAGES.NOT_FOUND);
    }

    if (brand.agency.ownerId !== user.userId) {
      throw new ForbiddenException(BRAND_MESSAGES.NOT_OWNER);
    }

    return true;
  }
}
