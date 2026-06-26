import { Injectable, NotFoundException } from '@nestjs/common';
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

  private async attachCategoryToProduct(product: any) {
    if (!product) return product;
    const meta = product.metadata as Record<string, any>;
    if (meta?.categoryExternalId) {
      const category = await this.prisma.category.findUnique({
        where: { externalId: meta.categoryExternalId },
      });
      if (category) {
        product.category = {
          id: category.id,
          externalId: category.externalId,
          name: category.name,
        };
      }
    }
    return product;
  }

  async create(
    createProductDto: CreateProductDto,
    files?: Array<Express.Multer.File>
  ) {
    const { name, description, metadata, merchantId, categoryExternalId, ...rest } =
      createProductDto;

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

    if (categoryExternalId) {
      metaObj.categoryExternalId = categoryExternalId;
    }

    if (imageUrls.length > 0) {
      metaObj[PRODUCT_CONSTANTS.METADATA.IMAGES] = imageUrls;
      if (!metaObj[PRODUCT_CONSTANTS.METADATA.THUMBNAIL]) {
        metaObj[PRODUCT_CONSTANTS.METADATA.THUMBNAIL] = imageUrls[0];
      }
    }

    const metaJson = metaObj as unknown as Prisma.InputJsonValue;

    const created = await this.prisma.product.create({
      data: {
        ...rest,
        merchantId: merchantId as unknown as number,
        name: nameJson,
        description: descJson,
        metadata: metaJson,
      },
    });

    return this.attachCategoryToProduct(created);
  }

  async findAll() {
    const products = await this.prisma.product.findMany({
      include: {
        merchant: true,
      },
    });
    return Promise.all(products.map((prod) => this.attachCategoryToProduct(prod)));
  }

  async findAllByMerchant(
    merchantExternalId: string,
    paginationDto: PaginationDto & { search?: string }
  ): Promise<PaginatedResult<any>> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId: merchantExternalId },
    });

    if (!merchant) {
      throw new NotFoundException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
    }

    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const where: any = { merchantId: merchant.id };
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { sku: { contains: q, mode: 'insensitive' } },
        {
          name: {
            path: ['vi'],
            string_contains: q,
          },
        },
        {
          name: {
            path: ['en'],
            string_contains: q,
          },
        },
      ];
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

    const enrichedData = await Promise.all(
      data.map((prod) => this.attachCategoryToProduct(prod))
    );

    return {
      data: enrichedData,
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
    return this.attachCategoryToProduct(product);
  }

  async update(externalId: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(externalId);

    const { name, description, metadata, categoryExternalId, ...rest } = updateProductDto;

    const data: Prisma.ProductUpdateInput = {
      ...rest,
    };

    if (name) {
      data.name = name as unknown as Prisma.InputJsonValue;
    }
    if (description) {
      data.description = description as unknown as Prisma.InputJsonValue;
    }

    const existingMeta = (product.metadata as Record<string, any>) || {};
    const newMeta = { ...existingMeta };

    if (metadata) {
      const parsedMeta = typeof metadata === PRIMITIVE_TYPES.STRING
        ? JSON.parse(metadata as unknown as string)
        : metadata;
      Object.assign(newMeta, parsedMeta);
    }

    if (categoryExternalId !== undefined) {
      if (categoryExternalId) {
        newMeta.categoryExternalId = categoryExternalId;
      } else {
        delete newMeta.categoryExternalId;
      }
    }

    data.metadata = newMeta as unknown as Prisma.InputJsonValue;

    const updated = await this.prisma.product.update({
      where: { externalId },
      data,
    });

    return this.attachCategoryToProduct(updated);
  }

  async remove(externalId: string) {
    await this.findOne(externalId);
    return this.prisma.product.delete({
      where: { externalId },
    });
  }
}
