import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateOrderDto) {
    return this.orderService.create(req.user.userId, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  getUserOrders(@Request() req) {
    return this.orderService.getUserOrders(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.orderService.findById(id);
  }
}
