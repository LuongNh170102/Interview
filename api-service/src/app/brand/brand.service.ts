import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { slugify } from '../common/utils/string.util';
import { MERCHANT_STATUS } from '../common/constants/merchant.constant';
import { PrismaService } from '../prisma.service';
import { BRAND_MESSAGES } from '../common/constants/messages.constant';

@Injectable()
export class BrandService {
  constructor(private prisma: PrismaService) {}

  async createBrand(userId: number, dto: CreateBrandDto) {
    const agency = await this.prisma.agency.findFirst({
      where: { ownerId: userId },
    });

    if (!agency) {
      throw new ForbiddenException(BRAND_MESSAGES.AGENCY_REQUIRED);
    }

    return this.prisma.brand.create({
      data: {
        name: dto.name,
        description: dto.description ? { text: dto.description } : {},
        slug: dto.slug || slugify(dto.name),
        businessCategory: dto.businessCategory,
        agencyId: agency.id,
      },
    });
  }
  async createBranch(brandExternalId: string, dto: CreateBranchDto) {
    const brand = await this.prisma.brand.findUnique({
      where: { externalId: brandExternalId },
      include: { agency: true },
    });

    if (!brand) throw new NotFoundException(BRAND_MESSAGES.NOT_FOUND);

    const categoryExternalIds = dto.categoryIds || [];

    let internalCategoryIds: number[] = [];
    if (categoryExternalIds.length > 0) {
      const categories = await this.prisma.category.findMany({
        where: { externalId: { in: categoryExternalIds } },
        select: { id: true },
      });
      internalCategoryIds = categories.map((c) => c.id);
    }

    return this.prisma.merchant.create({
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        phone: dto.phone,
        contactName: dto.contactName || brand.agency.name,
        businessCategory: dto.businessCategory,

        brandId: brand.id,
        agencyId: brand.agencyId,
        ownerId: brand.agency.ownerId,
        status: MERCHANT_STATUS.APPROVED,

        categories: {
          create: internalCategoryIds.map((catId) => ({
            categoryId: catId,
          })),
        },
      },
    });
  }

  async getBranches(brandExternalId: string) {
    return this.prisma.merchant.findMany({
      where: { brand: { externalId: brandExternalId } },
      include: { categories: { include: { category: true } } },
    });
  }
}
