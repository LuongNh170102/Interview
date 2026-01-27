import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateMerchantStatusDto } from './dto/update-merchant-status.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { MerchantQueryDto } from './dto/merchant-query.dto';

@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.merchantService.requestOtp(dto);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.merchantService.verifyOtp(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system:manage_users')
  findAll(@Query() query: MerchantQueryDto) {
    return this.merchantService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('merchant:read')
  findOne(@Param('id') externalId: string) {
    return this.merchantService.findByExternalId(externalId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('merchant:update_status')
  updateStatus(
    @Param('id') externalId: string,
    @Body() dto: UpdateMerchantStatusDto
  ) {
    return this.merchantService.updateStatus(externalId, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Post('register')
  create(@Request() req, @Body() createMerchantDto: CreateMerchantDto) {
    return this.merchantService.create(req.user.userId, createMerchantDto);
  }
}
