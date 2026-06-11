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
import { CourierService } from './courier.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CourierQueryDto } from './dto/courier-query.dto';
import { ApproveCourierDto, RejectCourierDto } from './dto/update-courier-status.dto';

@Controller('couriers')
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.courierService.requestOtp(dto);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.courierService.verifyOtp(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:read')
  findAll(@Query() query: CourierQueryDto) {
    return this.courierService.findAll(query);
  }

  @Get(':externalId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:read')
  findOne(@Param('externalId') externalId: string) {
    return this.courierService.findByExternalId(externalId);
  }

  @Post('register')
  create(@Body() createCourierDto: CreateCourierDto) {
    return this.courierService.register(createCourierDto);
  }

  @Patch(':externalId/approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:approve')
  approve(
    @Request() req,
    @Param('externalId') externalId: string,
    @Body() dto: ApproveCourierDto,
  ) {
    return this.courierService.approve(req.user.userId, externalId);
  }

  @Patch(':externalId/reject')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:reject')
  reject(
    @Request() req,
    @Param('externalId') externalId: string,
    @Body() dto: RejectCourierDto,
  ) {
    return this.courierService.reject(req.user.userId, externalId, dto.rejectionReason);
  }
}
