import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Get,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CourierService } from './courier.service';

import { Roles } from '../common/decorators/roles.decorator';
import { ROLE } from '../common/constants/role.constants';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  RegisterCourierDto,
  RejectCourierDto,
} from './dto/register-courier.dto';
import { Permissions } from '../common/decorators/permissions.decorator';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { OtpService } from '../otp/otp.service';

@Controller('couriers')
export class CourierController {
  constructor(
    private courierService: CourierService,
    private readonly otpService: OtpService
  ) {}

  @Post('request-otp')
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.otpService.requestOtp(dto);
  }

  @Post('verify-registration')
  async verifyAndRegister(@Body() dto: VerifyOtpDto) {
    const isValid = await this.otpService.verifyOtp(dto, 'REGISTER_COURIER');
    if (!isValid)
      throw new BadRequestException('OTP code is not correct or expired');

    return this.courierService.createCourierProfile(dto);
  }

  @Post('register')
  async register(@Body() dto: RegisterCourierDto, @Req() req: any) {
    return this.courierService.register(dto, req.user.id);
  }

  @Patch(':id/approve')
  @Roles(ROLE.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async approve(@Param('id') id: string, @Req() req: any) {
    return this.courierService.approve(+id, req.user.id);
  }

  @Patch(':id/reject')
  @Roles(ROLE.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectCourierDto,
    @Req() req: any
  ) {
    return this.courierService.reject(+id, req.user.id, dto.rejectionReason);
  }

  @Get()
  @Roles(ROLE.PLATFORM_ADMIN)
  @Permissions('courier:read')
  async getAll(@Query() query: any) {
    return this.courierService.findAll(query);
  }

  @Get(':id')
  @Roles(ROLE.PLATFORM_ADMIN, ROLE.COURIER)
  async getOne(@Param('id') id: string) {
    return this.courierService.findOne(+id);
  }

  @Delete(':id')
  @Roles(ROLE.PLATFORM_ADMIN)
  @Permissions('courier:delete')
  async remove(@Param('id') id: string) {
    return this.courierService.softDelete(+id);
  }
}
