import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { MerchantProductService } from './merchant-product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  UpdateProductStatusDto,
  PublicProductQueryDto,
} from './dto/product-status.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';

// ---------------------------------------------------------------------------
// Merchant-facing Product Management Controller
// Base path: /api/merchant/products
// All routes require JWT + product:create/update/delete permission
// merchantId is NEVER accepted from request body — always resolved from JWT
// ---------------------------------------------------------------------------
@Controller('merchant/products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MerchantProductController {
  constructor(private readonly merchantProductService: MerchantProductService) {}

  /**
   * POST /api/merchant/products
   * Creates a product for the merchant owned by the authenticated user.
   * Security: merchantId is auto-resolved from JWT → UserRole → Merchant.
   * Any merchantId in the request body is IGNORED.
   */
  @Post()
  @Permissions('product:create')
  @UseInterceptors(FilesInterceptor('images', 10))
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.merchantProductService.create(req.user.userId, dto, files);
  }

  /**
   * GET /api/merchant/products
   * Returns paginated products belonging to the authenticated merchant.
   */
  @Get()
  @Permissions('product:read')
  findMyProducts(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.merchantProductService.findMyProducts(
      req.user.userId,
      paginationDto,
    );
  }

  /**
   * PATCH /api/merchant/products/:id
   * Updates a product. Verifies product belongs to the calling merchant.
   */
  @Patch(':id')
  @Permissions('product:update')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') externalId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.merchantProductService.update(req.user.userId, externalId, dto);
  }

  /**
   * PATCH /api/merchant/products/:id/status
   * Publish, Draft, or Archive a product.
   */
  @Patch(':id/status')
  @Permissions('product:update')
  updateStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id') externalId: string,
    @Body() dto: UpdateProductStatusDto,
  ) {
    return this.merchantProductService.updateStatus(
      req.user.userId,
      externalId,
      dto.status,
    );
  }

  /**
   * DELETE /api/merchant/products/:id
   * Soft-deletes (archives) a product. Preserves order history integrity.
   */
  @Delete(':id')
  @Permissions('product:delete')
  remove(
    @Request() req: AuthenticatedRequest,
    @Param('id') externalId: string,
  ) {
    return this.merchantProductService.remove(req.user.userId, externalId);
  }
}

// ---------------------------------------------------------------------------
// B2C Public Storefront Controller
// Base path: /api/public/products
// No authentication required — read-only, PUBLISHED products only
// ---------------------------------------------------------------------------
@Controller('public/products')
export class PublicProductController {
  constructor(private readonly merchantProductService: MerchantProductService) {}

  /**
   * GET /api/public/products
   * Returns paginated PUBLISHED products for the B2C storefront.
   * Mandatory pagination enforced by PaginationDto (default: page=1, limit=20).
   */
  @Get()
  findAll(
    @Query() query: PublicProductQueryDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.merchantProductService.findPublished(query, paginationDto);
  }
}
