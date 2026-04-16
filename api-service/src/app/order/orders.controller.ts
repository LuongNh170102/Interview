import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    Get,
    Query,
    Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';
import { OrderService } from './orders.service';
import { OrderQueryDto } from './dto/order-query.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('orders:read')
    findAll(@Query() query: OrderQueryDto) {
        return this.orderService.findAll(query);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') externalId: string) {
        return this.orderService.findByExternalId(externalId);
    }

    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Post()
    @Permissions('order:create')
    create(@Request() req: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
        return this.orderService.create(req.user.userId, dto);
    }
}
