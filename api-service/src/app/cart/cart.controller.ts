import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post('add')
  @UseGuards(JwtAuthGuard)
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, dto);
  }

  @Patch('update')
  @UseGuards(JwtAuthGuard)
  updateCartItem(@Request() req, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateCartItem(req.user.userId, dto);
  }
}
