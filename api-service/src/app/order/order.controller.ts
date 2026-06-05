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
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';
import { AddCartItemDto, UpdateCartItemDto } from './dto/add-cart-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderManageQueryDto } from './dto/order-manage-query.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('cart')
  @UseGuards(JwtAuthGuard)
  getCart(
    @Request() req: AuthenticatedRequest,
    @Query('merchantId') merchantId: string
  ) {
    return this.orderService.getCart(req.user.userId, merchantId);
  }

  @Post('cart/items')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:create')
  addCartItem(
    @Request() req: AuthenticatedRequest,
    @Body() dto: AddCartItemDto
  ) {
    return this.orderService.addCartItem(req.user.userId, dto);
  }

  @Patch('cart/items/:productId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:create')
  updateCartItem(
    @Request() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Query('merchantId') merchantId: string,
    @Body() dto: UpdateCartItemDto
  ) {
    return this.orderService.updateCartItem(
      req.user.userId,
      merchantId,
      productId,
      dto.quantity
    );
  }

  @Delete('cart/items/:productId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:create')
  removeCartItem(
    @Request() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Query('merchantId') merchantId: string
  ) {
    return this.orderService.removeCartItem(
      req.user.userId,
      merchantId,
      productId
    );
  }

  @Delete('cart')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:create')
  clearCart(
    @Request() req: AuthenticatedRequest,
    @Query('merchantId') merchantId: string
  ) {
    return this.orderService.clearCart(req.user.userId, merchantId);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:create')
  createOrder(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateOrderDto
  ) {
    return this.orderService.createOrder(req.user.userId, dto);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:read')
  findUserOrders(@Request() req: AuthenticatedRequest) {
    return this.orderService.findUserOrders(req.user.userId);
  }

  @Get('orders/manage/list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:read')
  findManageOrders(
    @Request() req: AuthenticatedRequest,
    @Query() query: OrderManageQueryDto
  ) {
    return this.orderService.findAllForManagement(req.user.userId, query);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('order:read')
  findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id') externalId: string
  ) {
    return this.orderService.findOrderByExternalId(
      req.user.userId,
      externalId
    );
  }
}
