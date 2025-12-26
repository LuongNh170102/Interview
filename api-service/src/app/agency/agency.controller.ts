import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('agencies')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.agencyService.requestOtp(dto);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.agencyService.verifyOtp(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('register')
  create(@Request() req, @Body() createAgencyDto: CreateAgencyDto) {
    return this.agencyService.create(req.user.userId, createAgencyDto);
  }
}
