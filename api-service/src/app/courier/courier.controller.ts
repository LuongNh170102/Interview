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
    Delete,
} from '@nestjs/common';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';
import { CourierService } from './courer.service';
import { CourierQueryDto } from './dto/courier-query.dto';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierStatusDto } from './dto/update-courier-status.dto';

@Controller('couriers')
export class CourierController {
    constructor(private readonly courierService: CourierService) { }

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

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('courier:read')
    findOne(@Param('id') externalId: string) {
        return this.courierService.findByExternalId(externalId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('register')
    create(@Request() req: AuthenticatedRequest, @Body() createCourierDto: CreateCourierDto) {
        return this.courierService.create(req.user.userId, createCourierDto);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('courier:update_status')
    updateStatus(@Param('id') externalId: string, @Body() dto: UpdateCourierStatusDto, @Request() req: AuthenticatedRequest) {
        return this.courierService.updateStatus(externalId, dto, req);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('courier:delete')
    delete(@Param('id') externalId: string) {
        return this.courierService.delete(externalId);
    }
}
