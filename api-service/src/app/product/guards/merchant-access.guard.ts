import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { PRODUCT_MESSAGES } from '../../common/constants/messages.constant';
import { COMMON_MESSAGES } from '../../common/constants/messages.constant';
import {
  canAccessMerchant,
  resolveMerchantId,
} from '../../common/utils/merchant-access.util';

@Injectable()
export class MerchantAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const merchantExternalId = request.params.merchantId;

    if (!user?.userId || !merchantExternalId) {
      return false;
    }

    const merchantId = await resolveMerchantId(this.prisma, merchantExternalId);
    if (!merchantId) {
      throw new NotFoundException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
    }

    const allowed = await canAccessMerchant(
      this.prisma,
      user.userId,
      merchantId
    );
    if (!allowed) {
      throw new ForbiddenException(PRODUCT_MESSAGES.PERMISSION_DENIED_CREATION);
    }

    request.merchantInternalId = merchantId;
    return true;
  }
}
