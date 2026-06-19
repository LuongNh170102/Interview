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
  ParseIntPipe,
} from '@nestjs/common';
import { CourierService } from './courier.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateCourierStatusDto } from './dto/update-courier-status.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CourierQueryDto } from './dto/courier-query.dto';

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

  @UseGuards(JwtAuthGuard)
  @Post('register')
  create(@Request() req, @Body() createCourierDto: CreateCourierDto) {
    return this.courierService.create(req.user.userId, createCourierDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system:manage_users')
  findAll(@Query() query: CourierQueryDto) {
    return this.courierService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courierService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system:manage_users')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdateCourierStatusDto
  ) {
    return this.courierService.updateStatus(
      id,
      req.user.userId,
      dto.status,
      dto.rejectionReason
    );
  }
}
