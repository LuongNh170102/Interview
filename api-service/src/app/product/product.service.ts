import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';
import {
  PRODUCT_MESSAGES,
  COMMON_MESSAGES,
} from '../common/constants/messages.constant';
import { StorageService } from '../common/services/storage.service';
import { toLocalizedJson } from '../common/utils/localization.util';
import { PRODUCT_CONSTANTS } from '../common/constants/product.constant';
import { PRIMITIVE_TYPES } from '../common/constants/common.constant';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  //* TASK 3
  async create(
    user: any,
    createProductDto: CreateProductDto,
    files?: Array<Express.Multer.File>
  ) {
    const { name, description, metadata, merchantId, ...rest } =
      createProductDto;

    //* Merchant must have APPROVED status before creating products
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId as unknown as number },
    });

    if (!merchant) throw new NotFoundException('Can not find merchant');

    if (merchant.approvalStatus !== 'APPROVED') {
      throw new BadRequestException(
        'Merchant can only create new product with APPROVED STATUS'
      );
    }

    //* API must validate that the user role is MERCHANT_OWNER
    if (user.userRoles !== 'MERCHANT_OWNER') {
      throw new ForbiddenException(
        'Only Merchant owner have permission to create production'
      );
    }

    //* Merchant Owners can only create products for their own store
    if (merchant.ownerId !== user.userId) {
      throw new ForbiddenException(
        "You don't have permission to create the product of other's store"
      );
    }

    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await this.storageService.uploadFile(
          file,
          PRODUCT_CONSTANTS.STORAGE_FOLDER
        );
        imageUrls.push(url);
      }
    }

    const nameJson = toLocalizedJson(name);
    const descJson = description
      ? toLocalizedJson(description)
      : Prisma.JsonNull;

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

    const metaJson = metaObj as unknown as Prisma.InputJsonValue;

    return this.prisma.product.create({
      data: {
        ...rest,
        merchantId: merchantId as unknown as number,
        name: nameJson,
        description: descJson,
        metadata: metaJson,
        status: createProductDto.status || 'DRAFT',
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        merchant: true,
        status: 'PUBLISHED',
      },
    });
  }

  async findProductByMerchant(
    merchantExternalId: string,
    paginationDto: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId: merchantExternalId },
    });

    if (!merchant) {
      throw new NotFoundException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { merchantId: merchant.id, status: 'PUBLISHED' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {},
      }),
      this.prisma.product.count({
        where: { merchantId: merchant.id },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async findOne(externalId: string) {
    const product = await this.prisma.product.findUnique({
      where: { externalId },
      include: {
        merchant: true,
        status: 'PUBLISHED',
      },
    });
    if (!product) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }
    return product;
  }

  async update(externalId: string, updateProductDto: UpdateProductDto) {
    await this.findOne(externalId);

    const { name, description, metadata, ...rest } = updateProductDto;

    const data: Prisma.ProductUpdateInput = {
      ...rest,
    };

    if (name) {
      data.name = name as unknown as Prisma.InputJsonValue;
    }
    if (description) {
      data.description = description as unknown as Prisma.InputJsonValue;
    }
    if (metadata) {
      data.metadata = metadata as unknown as Prisma.InputJsonValue;
    }

    return this.prisma.product.update({
      where: { externalId },
      data,
    });
  }

  async remove(externalId: string) {
    return this.prisma.product.update({
      where: { externalId },
      data: { status: 'ARCHIVED' },
    });
  }

  //* TASK 3: Implement pagination for product listing APIs
  async findProductByPage(
    paginationDto: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { status: 'PUBLISHED' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { merchant: true },
      }),
      this.prisma.product.count({ where: { status: 'PUBLISHED' } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async getSuggestions(keyword: string) {
    if (!keyword) return [];

    return this.prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      select: { name: true },
      take: 5,
    });
  }

  async searchProducts(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const products = await this.prisma.$queryRaw`
      SELECT *, 
             similarity(name::text, ${query}) AS score
      FROM products
      WHERE 
        (status = 'PUBLISHED') 
        AND (deleted_at IS NULL)
        AND (name::text % ${query} OR similarity(name::text, ${query}) > 0.2)
      ORDER BY score DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    return products;
  }
}
