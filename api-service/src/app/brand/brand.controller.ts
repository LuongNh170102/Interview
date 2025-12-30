import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';

import { BrandOwnershipGuard } from './guards/brand-ownership.guard';
import { ResourceStatusGuard } from '../common/guards/resource-status.guard';
import { CheckStatus } from '../common/decorators/check-status.decorator';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';

@Controller('brands')
@UseGuards(JwtAuthGuard, PermissionsGuard, ResourceStatusGuard)
@CheckStatus(RESOURCE_TARGETS.AGENCY)
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @Permissions('agency:create')
  createBrand(@Request() req, @Body() dto: CreateBrandDto) {
    return this.brandService.createBrand(req.user.userId, dto);
  }

  @Post(':id/branches')
  @UseGuards(BrandOwnershipGuard)
  @Permissions('agency:update')
  createBranch(
    @Request() req,
    @Param('id') brandId: string,
    @Body() dto: CreateBranchDto
  ) {
    return this.brandService.createBranch(brandId, dto);
  }

  @Get(':id/branches')
  getBranches(@Param('id') brandId: string) {
    return this.brandService.getBranches(brandId);
  }
}
