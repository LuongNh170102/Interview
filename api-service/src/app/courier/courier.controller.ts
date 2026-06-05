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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { CourierService } from './courier.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { CourierQueryDto } from './dto/courier-query.dto';
import { UpdateCourierApprovalDto } from './dto/update-courier-approval.dto';
import { UpdateCourierAvailabilityDto } from './dto/update-courier-availability.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';

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

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:read')
  @Get('me')
  findMe(@Request() req: AuthenticatedRequest) {
    return this.courierService.findMe(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:update')
  @Patch('me/availability')
  updateMyAvailability(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateCourierAvailabilityDto
  ) {
    return this.courierService.updateMyAvailability(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system:manage_users')
  @Get()
  findAll(@Query() query: CourierQueryDto) {
    return this.courierService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system:manage_users')
  @Get(':id')
  findOne(@Param('id') externalId: string) {
    return this.courierService.findByExternalId(externalId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system:manage_users')
  @Patch(':id')
  update(@Param('id') externalId: string, @Body() dto: UpdateCourierDto) {
    return this.courierService.update(externalId, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system:manage_users')
  @Patch(':id/approval')
  updateApproval(
    @Param('id') externalId: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateCourierApprovalDto
  ) {
    return this.courierService.updateApproval(externalId, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system:manage_users')
  @Delete(':id')
  remove(@Param('id') externalId: string) {
    return this.courierService.remove(externalId);
  }
}
