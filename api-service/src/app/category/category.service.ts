import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { toLocalizedJson } from '../common/utils/localization.util';
import { CATEGORY_MESSAGES } from '../common/constants/messages.constant';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, parentId, slug } = createCategoryDto;

    return this.prisma.category.create({
      data: {
        name: toLocalizedJson(name),
        parentId,
        slug,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        children: true,
      },
    });
  }

  async findOne(externalId: string) {
    const category = await this.prisma.category.findUnique({
      where: { externalId },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException(CATEGORY_MESSAGES.NOT_FOUND);
    }

    return category;
  }

  async update(externalId: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(externalId); // Check existence

    const { name, parentId, slug } = updateCategoryDto;

    const data: any = {};
    if (name) data.name = toLocalizedJson(name);
    if (parentId !== undefined) data.parentId = parentId;
    if (slug) data.slug = slug;

    return this.prisma.category.update({
      where: { externalId },
      data,
    });
  }

  async remove(externalId: string) {
    await this.findOne(externalId); // Check existence
    return this.prisma.category.delete({
      where: { externalId },
    });
  }
}
