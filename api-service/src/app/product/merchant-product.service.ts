import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { PublicProductQueryDto, ProductStatus } from './dto/product-status.dto';
import { StorageService } from '../common/services/storage.service';
import { toLocalizedJson } from '../common/utils/localization.util';
import { PRODUCT_CONSTANTS } from '../common/constants/product.constant';
import { PRIMITIVE_TYPES } from '../common/constants/common.constant';
import { Prisma } from '@prisma/client';
import { MERCHANT_STATUS } from '../common/constants/merchant.constant';
import { ROLE } from '../common/constants/role.constants';

export const MERCHANT_PRODUCT_MESSAGES = {
  MERCHANT_NOT_FOUND: 'Merchant not found for this user account',
  MERCHANT_NOT_APPROVED:
    'Your merchant account must be APPROVED before you can manage products',
  PRODUCT_NOT_FOUND: 'Product not found',
  PERMISSION_DENIED: 'You do not have permission to manage this product',
};

@Injectable()
export class MerchantProductService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  // ---------------------------------------------------------------------------
  // Resolve the APPROVED merchant that belongs to the logged-in user
  // ---------------------------------------------------------------------------

  /**
   * Resolves the Merchant record owned by the authenticated user.
   * Called at the start of every Merchant-facing write operation.
   * Throws if:
   *  - The user has no Merchant (not a MERCHANT_OWNER)
   *  - The Merchant exists but is not yet APPROVED
   */
  async resolveApprovedMerchant(userId: number) {
    // Find the merchant via the UserRole → Merchant link (not by trusting body params)
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: { name: ROLE.MERCHANT_OWNER },
      },
      include: {
        merchant: true,
      },
    });

    if (!userRole?.merchant) {
      throw new ForbiddenException(MERCHANT_PRODUCT_MESSAGES.MERCHANT_NOT_FOUND);
    }

    const merchant = userRole.merchant;

    if (merchant.approvalStatus !== MERCHANT_STATUS.APPROVED) {
      throw new ForbiddenException(
        MERCHANT_PRODUCT_MESSAGES.MERCHANT_NOT_APPROVED,
      );
    }

    return merchant;
  }

  // ---------------------------------------------------------------------------
  // CREATE — merchant ID is derived from JWT, never from request body
  // ---------------------------------------------------------------------------

  /**
   * Creates a product and attaches it to the merchant owned by `userId`.
   * The `merchantId` is resolved from the JWT → UserRole → Merchant chain,
   * making it impossible for a user to assign a product to another merchant
   * by tampering with the request body.
   */
  async create(
    userId: number,
    createProductDto: CreateProductDto,
    files?: Array<Express.Multer.File>,
  ) {
    // Resolve + validate merchant ownership and approval status
    const merchant = await this.resolveApprovedMerchant(userId);

    // Upload images if provided
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await this.storageService.uploadFile(
          file,
          PRODUCT_CONSTANTS.STORAGE_FOLDER,
        );
        imageUrls.push(url);
      }
    }

    const { name, description, metadata, ...rest } = createProductDto;

    const nameJson = toLocalizedJson(name);
    const descJson = description ? toLocalizedJson(description) : Prisma.JsonNull;

    const metaObj = metadata
      ? typeof metadata === PRIMITIVE_TYPES.STRING
        ? JSON.parse(metadata as unknown as string)
        : metadata
      : {};

    if (imageUrls.length > 0) {
      metaObj[PRODUCT_CONSTANTS.METADATA.IMAGES] = imageUrls;
      if (!metaObj[PRODUCT_CONSTANTS.METADATA.THUMBNAIL]) {
        metaObj[PRODUCT_CONSTANTS.METADATA.THUMBNAIL] = imageUrls[0];
      }
    }

    return this.prisma.product.create({
      data: {
        ...rest,
        merchantId: merchant.id,    // ← ALWAYS from JWT, never from body
        name: nameJson,
        description: descJson,
        metadata: metaObj as unknown as Prisma.InputJsonValue,
        images: imageUrls.length > 0 ? (imageUrls as unknown as Prisma.InputJsonValue) : undefined,
        status: 'DRAFT' as any,     // new products start as DRAFT
      },
    });
  }

  // ---------------------------------------------------------------------------
  // LIST — merchant's own products
  // ---------------------------------------------------------------------------

  async findMyProducts(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<any>> {
    const merchant = await this.resolveApprovedMerchant(userId);

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { merchantId: merchant.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          externalId: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          sku: true,
          stock: true,
          status: true,
          images: true,
          averageRating: true,
          totalReviews: true,
          createdAt: true,
        },
      }),
      this.prisma.product.count({ where: { merchantId: merchant.id } }),
    ]);

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  // ---------------------------------------------------------------------------
  // UPDATE — verify ownership before allowing edit
  // ---------------------------------------------------------------------------

  async update(
    userId: number,
    externalId: string,
    updateProductDto: UpdateProductDto,
  ) {
    const merchant = await this.resolveApprovedMerchant(userId);

    const product = await this.prisma.product.findUnique({
      where: { externalId },
    });

    if (!product) {
      throw new NotFoundException(MERCHANT_PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    // Ownership check: product must belong to the user's merchant
    if (product.merchantId !== merchant.id) {
      throw new ForbiddenException(MERCHANT_PRODUCT_MESSAGES.PERMISSION_DENIED);
    }

    const { name, description, metadata, ...rest } = updateProductDto;
    const data: Prisma.ProductUpdateInput = { ...rest };

    if (name) data.name = name as unknown as Prisma.InputJsonValue;
    if (description) data.description = description as unknown as Prisma.InputJsonValue;
    if (metadata) data.metadata = metadata as unknown as Prisma.InputJsonValue;

    return this.prisma.product.update({ where: { externalId }, data });
  }

  // ---------------------------------------------------------------------------
  // CHANGE STATUS (Publish / Archive / Draft)
  // ---------------------------------------------------------------------------

  async updateStatus(
    userId: number,
    externalId: string,
    status: ProductStatus,
  ) {
    const merchant = await this.resolveApprovedMerchant(userId);

    const product = await this.prisma.product.findUnique({
      where: { externalId },
    });

    if (!product) {
      throw new NotFoundException(MERCHANT_PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    if (product.merchantId !== merchant.id) {
      throw new ForbiddenException(MERCHANT_PRODUCT_MESSAGES.PERMISSION_DENIED);
    }

    return this.prisma.product.update({
      where: { externalId },
      data: { status: status as any },
    });
  }

  // ---------------------------------------------------------------------------
  // DELETE (soft via isActive flag — we avoid hard deletes for order history)
  // ---------------------------------------------------------------------------

  async remove(userId: number, externalId: string) {
    const merchant = await this.resolveApprovedMerchant(userId);

    const product = await this.prisma.product.findUnique({
      where: { externalId },
    });

    if (!product) {
      throw new NotFoundException(MERCHANT_PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    if (product.merchantId !== merchant.id) {
      throw new ForbiddenException(MERCHANT_PRODUCT_MESSAGES.PERMISSION_DENIED);
    }

    // Soft delete: archive instead of hard delete to preserve order history
    return this.prisma.product.update({
      where: { externalId },
      data: { status: 'ARCHIVED' as any, isActive: false },
    });
  }

  // ---------------------------------------------------------------------------
  // B2C PUBLIC — paginated PUBLISHED products
  // ---------------------------------------------------------------------------

  /**
   * Public B2C endpoint — only returns PUBLISHED products.
   * No authentication required. Mandatory pagination.
   */
  async findPublished(
    query: PublicProductQueryDto,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * Math.min(limit, 100); // cap at 100 per page
    const take = Math.min(limit, 100);

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      status: 'PUBLISHED' as any,
      isActive: true,
    };

    if (query.merchantId) {
      const merchant = await this.prisma.merchant.findUnique({
        where: { externalId: query.merchantId },
        select: { id: true },
      });
      if (merchant) {
        where.merchantId = merchant.id;
      }
    }

    if (query.search) {
      where.OR = [
        { name: { path: ['vi'], string_contains: query.search } },
        { name: { path: ['en'], string_contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          externalId: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          images: true,
          averageRating: true,
          totalReviews: true,
          createdAt: true,
          merchant: {
            select: {
              name: true,
              externalId: true,
              city: true,
              logoUrl: true,
              averageRating: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit: take,
        lastPage: Math.ceil(total / take),
      },
    };
  }
}
