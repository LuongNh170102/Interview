import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CourierService } from './courier.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';
import { RejectCourierDto } from './dto/reject-courier.dto';
import { CourierQueryDto } from './dto/courier-query.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';

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
  register(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateCourierDto
  ) {
    return this.courierService.create(req.user.userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:read')
  findAll(@Query() query: CourierQueryDto) {
    return this.courierService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:read')
  findOne(@Param('id') externalId: string) {
    return this.courierService.findByExternalId(externalId);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:update_status')
  approve(
    @Param('id') externalId: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.courierService.approve(externalId, req.user.userId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:update_status')
  reject(
    @Param('id') externalId: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: RejectCourierDto
  ) {
    return this.courierService.reject(externalId, req.user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:update')
  update(
    @Param('id') externalId: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateCourierDto
  ) {
    return this.courierService.update(externalId, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:delete')
  remove(
    @Param('id') externalId: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.courierService.remove(externalId, req.user.userId);
  }
}
