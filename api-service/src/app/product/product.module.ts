import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from '../prisma.service';
import { CommonModule } from '../common/common.module';
import { MerchantAccessGuard } from './guards/merchant-access.guard';

@Module({
  imports: [CommonModule],
  controllers: [ProductController],
  providers: [ProductService, PrismaService, MerchantAccessGuard],
})
export class ProductModule {}
