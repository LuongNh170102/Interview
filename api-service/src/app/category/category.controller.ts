import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('category:create')
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':externalId')
  findOne(@Param('externalId') externalId: string) {
    return this.categoryService.findOne(externalId);
  }

  @Patch(':externalId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('category:update')
  update(
    @Param('externalId') externalId: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoryService.update(externalId, updateCategoryDto);
  }

  @Delete(':externalId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('category:delete')
  remove(@Param('externalId') externalId: string) {
    return this.categoryService.remove(externalId);
  }
}
