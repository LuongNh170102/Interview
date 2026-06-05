import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApprovalStatus, Prisma, ProductStatus } from '@prisma/client';
import {
  CATEGORY_MESSAGES,
  PRODUCT_MESSAGES,
  COMMON_MESSAGES,
} from '../common/constants/messages.constant';
import { StorageService } from '../common/services/storage.service';
import { toLocalizedJson } from '../common/utils/localization.util';
import { PRODUCT_CONSTANTS } from '../common/constants/product.constant';
import { PRIMITIVE_TYPES } from '../common/constants/common.constant';
import {
  ProductListResponse,
  ProductQueryDto,
  ProductStatistics,
} from './dto/product-query.dto';
import { ProductEntity } from './entities/product.entity';
import { ProductQueryBuilder } from './builders/product-query.builder';

const productInclude = Prisma.validator<Prisma.ProductInclude>()({
  merchant: {
    select: {
      externalId: true,
      name: true,
      approvalStatus: true,
    },
  },
  category: {
    select: {
      externalId: true,
      name: true,
      slug: true,
    },
  },
  section: {
    select: {
      id: true,
      name: true,
      displayOrder: true,
    },
  },
});

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

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
      sectionId,
      ...rest
    } = createProductDto;

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

    const metaObj = this.parseMetadata(metadata);

    if (imageUrls.length > 0) {
      metaObj[PRODUCT_CONSTANTS.METADATA.IMAGES] = imageUrls;
      if (!metaObj[PRODUCT_CONSTANTS.METADATA.THUMBNAIL]) {
        metaObj[PRODUCT_CONSTANTS.METADATA.THUMBNAIL] = imageUrls[0];
      }
    }

    const metaJson = metaObj as unknown as Prisma.InputJsonValue;

    const createdProduct = await this.prisma.product.create({
      data: {
        ...rest,
        merchantId: Number(merchantId),
        categoryId: await this.resolveCategoryId(categoryId),
        sectionId: sectionId ? Number(sectionId) : null,
        name: nameJson,
        description: descJson,
        metadata: metaJson,
      },
      include: productInclude,
    });

    return this.mapProductEntity(createdProduct);
  }

  async findPublicCatalog(
    query: ProductQueryDto
  ): Promise<ProductListResponse<ProductEntity>> {
    return this.findMany(query, (builder) =>
      builder
        .withMerchantExternalId(query.merchantId)
        .withCategoryExternalId(query.categoryId)
        .withSearch(query.search)
        .forPublicCatalog()
    );
  }

  async findAdminList(
    query: ProductQueryDto
  ): Promise<ProductListResponse<ProductEntity>> {
    return this.findMany(query, (builder) =>
      builder
        .withMerchantExternalId(query.merchantId)
        .withCategoryExternalId(query.categoryId)
        .withStatus(query.status)
        .withIsActive(query.isActive)
        .withSearch(query.search)
    );
  }

  async findAllByMerchant(
    merchantExternalId: string,
    query: ProductQueryDto
  ): Promise<ProductListResponse<ProductEntity>> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId: merchantExternalId },
    });

    if (!merchant) {
      throw new NotFoundException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
    }

    return this.findMany(query, (builder) =>
      builder
        .withMerchantExternalId(merchantExternalId)
        .withCategoryExternalId(query.categoryId)
        .withStatus(query.status)
        .withIsActive(query.isActive)
        .withSearch(query.search)
    );
  }

  async findPublishedOne(externalId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        externalId,
        status: ProductStatus.PUBLISHED,
        isActive: true,
        merchant: {
          approvalStatus: ApprovalStatus.APPROVED,
        },
      },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return this.mapProductEntity(product);
  }

  async findAdminOne(externalId: string) {
    const product = await this.prisma.product.findUnique({
      where: { externalId },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return this.mapProductEntity(product);
  }

  async update(
    externalId: string,
    updateProductDto: UpdateProductDto,
    files?: Array<Express.Multer.File>
  ) {
    const existingProduct = await this.prisma.product.findUnique({
      where: { externalId },
      include: productInclude,
    });

    if (!existingProduct) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    const {
      name,
      description,
      metadata,
      categoryId,
      sectionId,
      merchantId: _merchantId,
      ...rest
    } = updateProductDto;

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

    const data: Prisma.ProductUpdateInput = {
      ...rest,
    };

    if (name) {
      data.name = toLocalizedJson(name) as Prisma.InputJsonValue;
    }
    if (description) {
      data.description = toLocalizedJson(description) as Prisma.InputJsonValue;
    }
    if (metadata || imageUrls.length > 0) {
      const mergedMetadata = {
        ...this.parseMetadata(existingProduct.metadata),
        ...this.parseMetadata(metadata),
      };

      if (imageUrls.length > 0) {
        const existingImages = Array.isArray(
          mergedMetadata[PRODUCT_CONSTANTS.METADATA.IMAGES]
        )
          ? (
              mergedMetadata[PRODUCT_CONSTANTS.METADATA.IMAGES] as unknown[]
            ).filter((value): value is string => typeof value === 'string')
          : [];
        const mergedImages = [...new Set([...existingImages, ...imageUrls])];

        mergedMetadata[PRODUCT_CONSTANTS.METADATA.IMAGES] = mergedImages;

        if (!mergedMetadata[PRODUCT_CONSTANTS.METADATA.THUMBNAIL]) {
          mergedMetadata[PRODUCT_CONSTANTS.METADATA.THUMBNAIL] =
            mergedImages[0] ?? null;
        }
      }

      data.metadata = mergedMetadata as Prisma.InputJsonValue;
    }
    if (typeof categoryId !== 'undefined') {
      const resolvedCategoryId = await this.resolveCategoryId(categoryId);
      data.category = resolvedCategoryId
        ? { connect: { id: resolvedCategoryId } }
        : { disconnect: true };
    }
    if (typeof sectionId !== 'undefined') {
      data.section = sectionId
        ? { connect: { id: Number(sectionId) } }
        : { disconnect: true };
    }

    const updatedProduct = await this.prisma.product.update({
      where: { externalId },
      data,
      include: productInclude,
    });

    return this.mapProductEntity(updatedProduct);
  }

  async remove(externalId: string) {
    await this.findAdminOne(externalId);
    return this.prisma.product.delete({
      where: { externalId },
    });
  }

  private async findMany(
    query: ProductQueryDto,
    buildWhere: (builder: ProductQueryBuilder) => ProductQueryBuilder
  ): Promise<ProductListResponse<ProductEntity>> {
    const take = query.limit ?? 10;
    const skip = query.skip;
    const where = buildWhere(new ProductQueryBuilder()).build();

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: productInclude,
      }),
      this.prisma.product.count({ where }),
    ]);

    const response: ProductListResponse<ProductEntity> = {
      data: items.map((item) => this.mapProductEntity(item)),
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
    const [totalPublished, totalDraft, totalOutOfStock] =
      await this.prisma.$transaction([
        this.prisma.product.count({
          where: { status: ProductStatus.PUBLISHED },
        }),
        this.prisma.product.count({
          where: { status: ProductStatus.DRAFT },
        }),
        this.prisma.product.count({
          where: {
            OR: [{ stock: { lte: 0 } }, { stock: null }],
          },
        }),
      ]);

    return { totalPublished, totalDraft, totalOutOfStock };
  }

  private mapProductEntity(product: ProductWithRelations): ProductEntity {
    return new ProductEntity(product, {
      merchant: product.merchant,
      category: product.category,
      section: product.section,
    });
  }

  private parseMetadata(metadata?: unknown): Record<string, unknown> {
    if (!metadata) {
      return {};
    }

    if (typeof metadata === PRIMITIVE_TYPES.STRING) {
      return JSON.parse(metadata as string) as Record<string, unknown>;
    }

    return metadata as Record<string, unknown>;
  }

  private async resolveCategoryId(
    categoryId?: string | null
  ): Promise<number | null> {
    if (!categoryId) {
      return null;
    }

    const numericCategoryId = Number(categoryId);
    if (!Number.isNaN(numericCategoryId)) {
      return numericCategoryId;
    }

    const category = await this.prisma.category.findUnique({
      where: { externalId: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(CATEGORY_MESSAGES.NOT_FOUND);
    }

    return category.id;
  }
}
