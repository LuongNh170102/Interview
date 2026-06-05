import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ProductOwnershipGuard } from './guards/product-ownership.guard';
import { ResourceStatusGuard } from '../common/guards/resource-status.guard';
import { CheckStatus } from '../common/decorators/check-status.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MerchantOwnershipPipe } from '../common/pipes/merchant-ownership.pipe';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ProductMerchantQueryDto } from './dto/product-merchant-query.dto';
import { MerchantAccessGuard } from './guards/merchant-access.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard, ResourceStatusGuard)
  @CheckStatus(RESOURCE_TARGETS.MERCHANT)
  @Permissions('product:create')
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Query('merchantId') merchantId: string,
    @Body(MerchantOwnershipPipe) createProductDto: CreateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    return this.productService.create(createProductDto, files);
  }

  @Get('public/filters')
  findPublicFilters() {
    return this.productService.findPublicFilters();
  }

  @Get('public')
  findPublic(@Query() query: ProductQueryDto) {
    return this.productService.findPublic(query);
  }

  @Get('public/:id')
  findPublicOne(@Param('id') externalId: string) {
    return this.productService.findPublicOne(externalId);
  }

  @Get('merchant/:merchantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard, MerchantAccessGuard)
  @Permissions('product:read')
  findAllByMerchant(
    @Param('merchantId') merchantId: string,
    @Query() query: ProductMerchantQueryDto
  ) {
    return this.productService.findAllByMerchant(merchantId, query);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:read')
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:read')
  findOne(@Param('id') externalId: string) {
    return this.productService.findOne(externalId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProductOwnershipGuard)
  @Permissions('product:update')
  @UseInterceptors(FilesInterceptor('images', 10))
  update(
    @Param('id') externalId: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: Array<Express.Multer.File>
  ) {
    return this.productService.update(externalId, updateProductDto, files);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProductOwnershipGuard)
  @Permissions('product:delete')
  remove(@Param('id') externalId: string) {
    return this.productService.remove(externalId);
  }
}
