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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ProductOwnershipGuard } from './guards/product-ownership.guard';
import { ResourceStatusGuard } from '../common/guards/resource-status.guard';
import { CheckStatus } from '../common/decorators/check-status.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MerchantOwnershipPipe } from '../common/pipes/merchant-ownership.pipe';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ProductQueryDto } from './dto/product-query.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard, ResourceStatusGuard)
  @CheckStatus(RESOURCE_TARGETS.MERCHANT)
  @Permissions('product:create')
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body(MerchantOwnershipPipe) createProductDto: CreateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    return this.productService.create(createProductDto, files);
  }

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findPublicCatalog(query);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:read')
  findAdminList(@Query() query: ProductQueryDto) {
    return this.productService.findAdminList(query);
  }

  @Get('merchant/:merchantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:read')
  findAllByMerchant(
    @Param('merchantId') merchantId: string,
    @Query() query: ProductQueryDto
  ) {
    return this.productService.findAllByMerchant(merchantId, query);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('product:read')
  findAdminOne(@Param('id') externalId: string) {
    return this.productService.findAdminOne(externalId);
  }

  @Get(':id')
  findOne(@Param('id') externalId: string) {
    return this.productService.findPublishedOne(externalId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, ProductOwnershipGuard)
  @Permissions('product:update')
  @UseInterceptors(FilesInterceptor('images', 10))
  update(
    @Param('id') externalId: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>
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
