import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * POST /api/orders
   * Places a new order. Must be authenticated (any logged-in user).
   * Internally selects the nearest APPROVED + ONLINE courier.
   */
  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
    return this.orderService.create(req.user.userId, dto);
  }

  /**
   * GET /api/orders
   * Returns the authenticated user's order history (paginated).
   */
  @Get()
  findMyOrders(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.orderService.findMyOrders(req.user.userId, paginationDto);
  }

  /**
   * GET /api/orders/:id
   * Returns detail of a single order. Enforces ownership — users can only
   * view their own orders.
   */
  @Get(':id')
  findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id') externalId: string,
  ) {
    return this.orderService.findOne(req.user.userId, externalId);
  }
}
