import {
  PipeTransform,
  Injectable,
  Inject,
  Scope,
  ForbiddenException,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { ROLE } from '../constants/role.constants';
import {
  PRODUCT_MESSAGES,
  COMMON_MESSAGES,
} from '../constants/messages.constant';
import { PRIMITIVE_TYPES } from '../constants/common.constant';

@Injectable({ scope: Scope.REQUEST })
export class MerchantOwnershipPipe implements PipeTransform {
  constructor(
    @Inject(REQUEST) private request: any,
    private prisma: PrismaService
  ) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    value = value || {};

    const user = this.request.user;

    if (!user) {
      throw new ForbiddenException(COMMON_MESSAGES.USER_NOT_FOUND_IN_CONTEXT);
    }

    let internalMerchantId: number;

    let inputId = value.merchantId;

    // Fallback to Query Param if not in Body
    if (!inputId && this.request.query?.merchantId) {
      inputId = this.request.query.merchantId;
    }

    if (!inputId) {
      throw new BadRequestException(COMMON_MESSAGES.MERCHANT_ID_REQUIRED);
    }

    // 2. Handle provided merchantId
    const isUuid =
      typeof inputId === PRIMITIVE_TYPES.STRING && inputId.length > 20;

    if (isUuid) {
      const merchant = await this.prisma.merchant.findUnique({
        where: { externalId: inputId },
      });
      if (!merchant) {
        throw new BadRequestException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
      }
      internalMerchantId = merchant.id;
    } else {
      internalMerchantId = Number(inputId);
      if (isNaN(internalMerchantId)) {
        throw new BadRequestException(
          COMMON_MESSAGES.INVALID_MERCHANT_ID_FORMAT
        );
      }
    }

    const hasPermission = await this.validatePermission(
      user.userId,
      internalMerchantId
    );

    if (!hasPermission) {
      throw new ForbiddenException(PRODUCT_MESSAGES.PERMISSION_DENIED_CREATION);
    }

    // Inject internal ID back to value so Service can use it
    value.merchantId = internalMerchantId;

    return value;
  }

  private async validatePermission(
    userId: number,
    merchantId: number
  ): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        merchantId,
        role: { name: ROLE.MERCHANT_OWNER },
      },
    });

    if (userRole) return true;

    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { agency: true },
    });

    if (merchant?.agency?.ownerId === userId) {
      return true;
    }

    return false;
  }
}
