import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MERCHANT_STATUS } from '../common/constants/merchant.constant';
import {
  COMMON_MESSAGES,
  PRODUCT_MESSAGES,
} from '../common/constants/messages.constant';
import { PRODUCT_CONSTANTS } from '../common/constants/product.constant';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { StorageService } from '../common/services/storage.service';
import { toLocalizedJson } from '../common/utils/localization.util';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Array<Express.Multer.File> = [],
    merchantId: string
  ) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: createProductDto.merchantId as unknown as number },
      include: { owner: true },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    if (merchant.ownerId !== merchantId) {
      throw new ForbiddenException(PRODUCT_MESSAGES.PERMISSION_DENIED_CREATION);
    }

    if (merchant.approvalStatus !== MERCHANT_STATUS.APPROVED) {
      throw new ForbiddenException(
        `Merchant status is ${merchant.approvalStatus}. Only APPROVED merchants can create products.`
      );
    }

    const imageUrls: string[] = [];
    for (const file of files) {
      const url = await this.storageService.uploadFile(
        file,
        PRODUCT_CONSTANTS.STORAGE_FOLDER
      );
      imageUrls.push(url);
    }

    const nameJson = toLocalizedJson(createProductDto.name);
    const descJson = createProductDto.description
      ? toLocalizedJson(createProductDto.description)
      : null;

    const metadata = {
      images: imageUrls,
      thumbnail: imageUrls[0] || null,
    };

    return this.prisma.product.create({
      data: {
        name: nameJson,
        description: descJson,
        price: createProductDto.price,
        sku: createProductDto.sku,
        stock: createProductDto.stock,
        merchantId: merchant.id,
        isActive: createProductDto.isActive ?? true,
        metadata: metadata as any,
      },
      include: {
        merchant: {
          select: { name: true, externalId: true },
        },
      },
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { merchant: true },
      }),
      this.prisma.product.count(),
    ]);

    return {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit), limit },
    };
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
