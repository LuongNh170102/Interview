import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';
import {
  PRODUCT_MESSAGES,
  COMMON_MESSAGES,
} from '../common/constants/messages.constant';
import { StorageService } from '../common/services/storage.service';
import { toLocalizedJson } from '../common/utils/localization.util';
import { PRODUCT_CONSTANTS, PRODUCT_STATUS } from '../common/constants/product.constant';
import { PRIMITIVE_TYPES } from '../common/constants/common.constant';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { ProductListResponse, ProductQueryDto, ProductStatistics } from './dto/product-query.dto';
import { ProductEntity } from './entities';
import { ProductQueryBuilder } from './builders/product-query.builder';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async create(
    req: AuthenticatedRequest,
    createProductDto: CreateProductDto,
    files?: Array<Express.Multer.File>
  ) {
    const { name, description, metadata, merchantId, ...rest } =
      createProductDto;

    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        // imageUrls.push(`${req.protocol}://${req.get('host')}/uploads/${file.originalname}`);
        imageUrls.push(`${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
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
      },
    });
  }

  async findAll(query: ProductQueryDto): Promise<ProductListResponse<ProductEntity>> {
    const take = query.limit ?? 10;
    const skip = query.skip;

    const where = new ProductQueryBuilder()
      .withStatus(query.status)
      .withDateRange(query.startDate, query.endDate)
      .withPriceRange(query.startPrice, query.endPrice)
      .withSearch(query.search)
      .build();

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        include: { merchant: true },
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const response: ProductListResponse<ProductEntity> = {
      data: items.map((item) => new ProductEntity(item, {
        merchant: item.merchant
      })),
      total,
      page: query.page ?? 1,
      limit: take,
    };

    if (query.shouldIncludeStatistics) {
      response.statistics = await this.getStatistics();
    }

    return response;
  }

  private async getStatistics(): Promise<ProductStatistics> {
    const [totalDraft, totalPublished, totalArchived] =
      await this.prisma.$transaction([
        this.prisma.product.count({
          where: { status: PRODUCT_STATUS.DRAFT },
        }),
        this.prisma.product.count({
          where: { status: PRODUCT_STATUS.PUBLISHED },
        }),
        this.prisma.product.count({
          where: { status: PRODUCT_STATUS.ARCHIVED },
        })
      ]);

    return { totalDraft, totalPublished, totalArchived };
  }

  async findAllByMerchant(
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
        where: { merchantId: merchant.id },
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
    await this.findOne(externalId);
    return this.prisma.product.delete({
      where: { externalId },
    });
  }
}
