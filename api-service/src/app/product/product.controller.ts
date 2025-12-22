import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ProductOwnershipGuard } from './guards/product-ownership.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MerchantOwnershipPipe } from '../common/pipes/merchant-ownership.pipe';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:create')
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body(MerchantOwnershipPipe) createProductDto: CreateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    return this.productService.create(createProductDto, files);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get('merchant/:merchantId')
  findAllByMerchant(
    @Param('merchantId') merchantId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.productService.findAllByMerchant(merchantId, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') externalId: string) {
    return this.productService.findOne(externalId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProductOwnershipGuard)
  @Permissions('product:update')
  update(
    @Param('id') externalId: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productService.update(externalId, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProductOwnershipGuard)
  @Permissions('product:delete')
  remove(@Param('id') externalId: string) {
    return this.productService.remove(externalId);
  }
}
