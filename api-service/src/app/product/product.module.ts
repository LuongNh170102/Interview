import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MerchantProductController, PublicProductController } from './merchant-product.controller';
import { MerchantProductService } from './merchant-product.service';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../common/services/storage.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [
    ProductController,            // existing legacy controller
    MerchantProductController,    // new: /merchant/products — requires JWT + MERCHANT_OWNER
    PublicProductController,      // new: /public/products — unauthenticated B2C
  ],
  providers: [
    ProductService,
    MerchantProductService,
    PrismaService,
    StorageService,
  ],
})
export class ProductModule {}

