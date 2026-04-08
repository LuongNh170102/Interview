import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import { CourierService } from './courier.service';
import { RegisterCourierDto } from './dto/register-courier.dto';
import { RejectCourierDto } from './dto/reject-courier.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CourierQueryDto } from './dto/courier-query.dto';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';

@Controller('couriers')
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  // ---------------------------------------------------------------------------
  // Public OTP endpoints (no auth required — mirrors Agency pattern)
  // ---------------------------------------------------------------------------

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.courierService.requestOtp(dto);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.courierService.verifyOtp(dto);
  }

  // ---------------------------------------------------------------------------
  // Registration (requires JWT — the applicant must be a logged-in user)
  // ---------------------------------------------------------------------------

  /**
   * POST /couriers/register
   * Any authenticated user can register as a courier.
   * The system sets status = PENDING awaiting admin review.
   */
  @Post('register')
  @UseGuards(JwtAuthGuard)
  register(@Body() dto: RegisterCourierDto) {
    return this.courierService.register(dto);
  }

  // ---------------------------------------------------------------------------
  // Admin — List all couriers (paginated, filterable by status)
  // ---------------------------------------------------------------------------

  /**
   * GET /couriers
   * Returns paginated list of couriers. Supports ?approvalStatus=PENDING filter.
   * Requires courier:read permission (PLATFORM_ADMIN only).
   */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:read')
  findAll(@Query() query: CourierQueryDto) {
    return this.courierService.findAll(query);
  }

  /**
   * GET /couriers/:id
   * Returns a single courier by externalId.
   * Requires courier:read permission.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:read')
  findOne(@Param('id') externalId: string) {
    return this.courierService.findByExternalId(externalId);
  }

  // ---------------------------------------------------------------------------
  // Admin — Approval / Rejection
  // ---------------------------------------------------------------------------

  /**
   * PATCH /couriers/:id/approve
   * Idempotent: calling multiple times on an already-APPROVED courier is safe.
   * Requires courier:approve permission (PLATFORM_ADMIN only).
   */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:approve')
  approve(
    @Param('id') externalId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.courierService.approve(externalId, req.user.userId);
  }

  /**
   * PATCH /couriers/:id/reject
   * Body must include `reason` (min 10 chars). Only PENDING couriers can be rejected.
   * Requires courier:reject permission (PLATFORM_ADMIN only).
   */
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courier:reject')
  reject(
    @Param('id') externalId: string,
    @Body() dto: RejectCourierDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.courierService.reject(externalId, dto, req.user.userId);
  }
}
