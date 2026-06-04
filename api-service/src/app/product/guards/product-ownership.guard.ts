import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  PRODUCT_MESSAGES,
  RESOURCE_MESSAGES,
} from '../../common/constants/messages.constant';
import { MERCHANT_STATUS } from '../../common/constants/merchant.constant';
import { RESOURCE_TARGETS } from '../../common/constants/resource.constant';
import { ROLE } from '../../common/constants/role.constants';

@Injectable()
export class ProductOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const externalId = request.params.id;

    if (!user || !externalId) {
      return false;
    }

    const product = await this.prisma.product.findUnique({
      where: { externalId },
      include: {
        merchant: true,
      },
    });

    if (!product) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    // Check Merchant Status
    if (product.merchant.approvalStatus !== MERCHANT_STATUS.APPROVED) {
      throw new ForbiddenException(
        RESOURCE_MESSAGES.OPERATION_DENIED(
          RESOURCE_TARGETS.MERCHANT,
          product.merchant.approvalStatus
        )
      );
    }

    const merchantOwnerRole = await this.prisma.userRole.findFirst({
      where: {
        userId: user.userId,
        merchantId: product.merchantId,
        role: { name: ROLE.MERCHANT_OWNER },
      },
    });

    if (!merchantOwnerRole) {
      throw new ForbiddenException(
        PRODUCT_MESSAGES.PERMISSION_DENIED_MODIFICATION
      );
    }

    return true;
  }
}
