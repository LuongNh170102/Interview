import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Post('register')
  create(@Request() req, @Body() createMerchantDto: CreateMerchantDto) {
    return this.merchantService.create(req.user.userId, createMerchantDto);
  }
}
