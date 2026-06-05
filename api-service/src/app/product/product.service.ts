import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ProductQueryDto,
  PublicProductSort,
} from './dto/product-query.dto';
import {
  ApprovalStatus,
  OperationalStatus,
  Prisma,
  ProductStatus,
} from '@prisma/client';
import {
  PRODUCT_MESSAGES,
  COMMON_MESSAGES,
} from '../common/constants/messages.constant';
import { StorageService } from '../common/services/storage.service';
import { CacheService } from '../common/services/cache.service';
import { findProductIdsByFullText } from '../common/utils/product-search.util';
import { toLocalizedJson } from '../common/utils/localization.util';
import {
  PRODUCT_CONSTANTS,
  PRODUCT_STATUS,
} from '../common/constants/product.constant';
import { PRIMITIVE_TYPES } from '../common/constants/common.constant';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { serializeProduct } from '../common/utils/decimal.util';
import { ProductMerchantQueryDto } from './dto/product-merchant-query.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private cache: CacheService
  ) {}

  private async invalidatePublicCache(): Promise<void> {
    await this.cache.invalidatePrefix('public-products:');
  }

  private async applySearchFilter(
    and: Prisma.ProductWhereInput[],
    search?: string
  ): Promise<void> {
    if (!search?.trim()) {
      return;
    }
    const term = search.trim();
    try {
      const ids = await findProductIdsByFullText(this.prisma, term);
      if (ids.length) {
        and.push({ id: { in: ids } });
        return;
      }
    } catch {
      // Fall back to contains search when FTS is unavailable.
    }
    and.push({ OR: this.buildTextSearchWhere(term) });
  }

  private resolvePublishState(
    publishStatus?: string,
    isActive?: boolean
  ): { publishStatus: ProductStatus; isActive: boolean } {
    if (
      publishStatus &&
      Object.values(PRODUCT_STATUS).includes(
        publishStatus as (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS]
      )
    ) {
      const status = publishStatus as ProductStatus;
      return {
        publishStatus: status,
        isActive: status === ProductStatus.PUBLISHED,
      };
    }
    if (isActive !== undefined) {
      return {
        publishStatus: isActive ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
        isActive,
      };
    }
    return { publishStatus: ProductStatus.DRAFT, isActive: false };
  }

  private buildTextSearchWhere(term: string): Prisma.ProductWhereInput['OR'] {
    return [
      { sku: { contains: term, mode: 'insensitive' } },
      {
        name: {
          path: ['vi'],
          string_contains: term,
          mode: 'insensitive',
        },
      },
      {
        name: {
          path: ['en'],
          string_contains: term,
          mode: 'insensitive',
        },
      },
    ];
  }

  async create(
    createProductDto: CreateProductDto,
    files?: Array<Express.Multer.File>
  ) {
    const {
      name,
      description,
      metadata,
      merchantId,
      categoryId,
      publishStatus,
      isActive,
      ...rest
    } = createProductDto;
    const publishState = this.resolvePublishState(publishStatus, isActive);

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
    if (categoryId) {
      metaObj['categoryId'] = categoryId;
    }

    const metaJson = metaObj as unknown as Prisma.InputJsonValue;

    const product = await this.prisma.product.create({
      data: {
        ...rest,
        ...publishState,
        merchantId: merchantId as unknown as number,
        name: nameJson,
        description: descJson,
        metadata: metaJson,
      },
    });
    await this.invalidatePublicCache();
    return serializeProduct(product);
  }

  private readonly publicProductWhere: Prisma.ProductWhereInput = {
    publishStatus: ProductStatus.PUBLISHED,
    merchant: {
      approvalStatus: ApprovalStatus.APPROVED,
      operationalStatus: OperationalStatus.ACTIVE,
    },
  };

  async findPublicFilters() {
    const where = await this.buildPublicWhere(new ProductQueryDto());

    const [merchants, products, categories] = await Promise.all([
      this.prisma.merchant.findMany({
        where: {
          approvalStatus: ApprovalStatus.APPROVED,
          operationalStatus: OperationalStatus.ACTIVE,
          products: { some: { publishStatus: ProductStatus.PUBLISHED } },
        },
        select: {
          externalId: true,
          name: true,
          _count: {
            select: {
              products: { where: { publishStatus: ProductStatus.PUBLISHED } },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.findMany({
        where,
        select: { metadata: true, price: true },
      }),
      this.prisma.category.findMany({
        orderBy: { slug: 'asc' },
      }),
    ]);

    const categoryCounts = new Map<string, number>();
    let minPrice = Infinity;
    let maxPrice = 0;

    for (const product of products) {
      const meta = product.metadata as Record<string, unknown> | null;
      const categoryId = meta?.['categoryId'];
      if (typeof categoryId === 'string') {
        categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
      }
      const price = Number(product.price ?? 0);
      if (price > 0) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    }

    if (!Number.isFinite(minPrice)) minPrice = 0;
    if (maxPrice === 0) maxPrice = 100000;

    return {
      merchants: merchants.map((m) => ({
        id: m.externalId,
        name: m.name,
        count: m._count.products,
      })),
      categories: categories
        .filter((c) => categoryCounts.has(c.externalId))
        .map((c) => ({
          id: c.externalId,
          name: c.name,
          count: categoryCounts.get(c.externalId) ?? 0,
        })),
      priceRange: {
        min: minPrice,
        max: Math.ceil(maxPrice / 10000) * 10000,
      },
    };
  }

  async findPublic(
    query: ProductQueryDto
  ): Promise<PaginatedResult<unknown>> {
    const cacheKey = `public-products:${JSON.stringify(query)}`;
    const cached = await this.cache.get<PaginatedResult<unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    const { page = 1, limit = 10, sortBy } = query;
    const skip = (page - 1) * limit;
    const where = await this.buildPublicWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: this.getPublicOrderBy(sortBy),
        include: {
          merchant: {
            select: {
              externalId: true,
              name: true,
              address: true,
              city: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      data: data.map(serializeProduct),
      meta: { total, page, lastPage: Math.ceil(total / limit), limit },
    };
    await this.cache.set(
      cacheKey,
      result,
      PRODUCT_CONSTANTS.PUBLIC_LIST_CACHE_TTL_MS
    );
    return result;
  }

  private parseList(value?: string): string[] {
    return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
  }

  private async buildPublicWhere(
    query: ProductQueryDto
  ): Promise<Prisma.ProductWhereInput> {
    const and: Prisma.ProductWhereInput[] = [{ ...this.publicProductWhere }];

    const merchantIdList = [
      ...this.parseList(query.merchantIds),
      ...(query.merchantId ? [query.merchantId] : []),
    ];
    if (merchantIdList.length) {
      and.push({
        merchant: {
          externalId: { in: merchantIdList },
          approvalStatus: ApprovalStatus.APPROVED,
          operationalStatus: OperationalStatus.ACTIVE,
        },
      });
    }

    const categoryIdList = this.parseList(query.categoryIds);
    if (categoryIdList.length) {
      and.push({
        OR: categoryIdList.map((id) => ({
          metadata: { path: ['categoryId'], equals: id },
        })),
      });
    }

    await this.applySearchFilter(and, query.search);

    if (query.minPrice != null || query.maxPrice != null) {
      and.push({
        price: {
          ...(query.minPrice != null ? { gte: query.minPrice } : {}),
          ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
        },
      });
    }

    return { AND: and };
  }

  private getPublicOrderBy(
    sortBy?: PublicProductSort
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sortBy) {
      case 'price-asc':
        return { price: 'asc' };
      case 'price-desc':
        return { price: 'desc' };
      case 'rating':
        return { averageRating: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  async findPublicOne(externalId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        externalId,
        ...this.publicProductWhere,
      },
      include: {
        merchant: {
          select: {
            externalId: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });
    if (!product) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }
    return serializeProduct(product);
  }

  async findAll(
    query: ProductQueryDto
  ): Promise<PaginatedResult<unknown>> {
    const { page = 1, limit = 10, search, merchantId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (merchantId) {
      const merchant = await this.prisma.merchant.findUnique({
        where: { externalId: merchantId },
      });
      if (!merchant) {
        throw new NotFoundException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
      }
      where.merchantId = merchant.id;
    }

    if (search?.trim()) {
      const and: Prisma.ProductWhereInput[] = [];
      await this.applySearchFilter(and, search);
      if (and.length) {
        Object.assign(where, and[0]);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { merchant: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map(serializeProduct),
      meta: { total, page, lastPage: Math.ceil(total / limit), limit },
    };
  }

  async findAllByMerchant(
    merchantExternalId: string,
    query: ProductMerchantQueryDto
  ): Promise<PaginatedResult<unknown>> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId: merchantExternalId },
    });

    if (!merchant) {
      throw new NotFoundException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
    }

    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = { merchantId: merchant.id };

    if (search?.trim()) {
      const and: Prisma.ProductWhereInput[] = [];
      await this.applySearchFilter(and, search);
      if (and.length) {
        Object.assign(where, and[0]);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {},
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map(serializeProduct),
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
    return serializeProduct(product);
  }

  async update(
    externalId: string,
    updateProductDto: UpdateProductDto,
    files?: Array<Express.Multer.File>
  ) {
    const existing = await this.prisma.product.findUnique({
      where: { externalId },
    });
    if (!existing) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    const {
      name,
      description,
      metadata,
      categoryId,
      publishStatus,
      isActive,
      ...rest
    } = updateProductDto;

    const data: Prisma.ProductUpdateInput = { ...rest };

    if (publishStatus !== undefined || isActive !== undefined) {
      Object.assign(data, this.resolvePublishState(publishStatus, isActive));
    }

    if (name) {
      data.name = name as unknown as Prisma.InputJsonValue;
    }
    if (description) {
      data.description = description as unknown as Prisma.InputJsonValue;
    }

    const imageUrls: string[] = [];
    if (files?.length) {
      for (const file of files) {
        const url = await this.storageService.uploadFile(
          file,
          PRODUCT_CONSTANTS.STORAGE_FOLDER
        );
        imageUrls.push(url);
      }
    }

    if (metadata || categoryId || imageUrls.length) {
      const metaObj =
        typeof existing.metadata === 'object' && existing.metadata !== null
          ? { ...(existing.metadata as Record<string, unknown>) }
          : {};
      if (metadata) {
        Object.assign(metaObj, metadata);
      }
      if (categoryId) {
        metaObj['categoryId'] = categoryId;
      }
      if (imageUrls.length) {
        const existingImages = Array.isArray(
          metaObj[PRODUCT_CONSTANTS.METADATA.IMAGES]
        )
          ? (metaObj[PRODUCT_CONSTANTS.METADATA.IMAGES] as string[])
          : [];
        metaObj[PRODUCT_CONSTANTS.METADATA.IMAGES] = [
          ...existingImages,
          ...imageUrls,
        ];
        if (!metaObj[PRODUCT_CONSTANTS.METADATA.THUMBNAIL]) {
          metaObj[PRODUCT_CONSTANTS.METADATA.THUMBNAIL] = imageUrls[0];
        }
      }
      data.metadata = metaObj as unknown as Prisma.InputJsonValue;
    }

    const product = await this.prisma.product.update({
      where: { externalId },
      data,
    });
    await this.invalidatePublicCache();
    return serializeProduct(product);
  }

  async remove(externalId: string) {
    await this.findOne(externalId);
    const product = await this.prisma.product.delete({
      where: { externalId },
    });
    await this.invalidatePublicCache();
    return serializeProduct(product);
  }
}
