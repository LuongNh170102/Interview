import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { CART_MESSAGES, PRODUCT_MESSAGES } from '../common/constants/messages.constant';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: number) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        cartItems: {
          include: {
            product: {
              select: {
                externalId: true,
                name: true,
                price: true,
                isActive: true,
                metadata: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return { items: [], totalAmount: 0 };
    }

    return cart;
  }

  async addToCart(userId: number, dto: AddToCartDto) {
    // Find active cart or create new one
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Verify product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { externalId: dto.productId },
      select: { id: true, price: true, isActive: true, merchantId: true },
    });

    if (!product || product.isActive === false) {
      throw new BadRequestException(CART_MESSAGES.PRODUCT_NOT_AVAILABLE);
    }

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, merchantId: product.merchantId },
      });
    } else if (cart.merchantId !== product.merchantId) {
      // If cart has items from a different merchant, create a new cart
      cart = await this.prisma.cart.create({
        data: { userId, merchantId: product.merchantId },
      });
    }

    // Check if product already in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: product.id },
    });

    const quantity = dto.quantity || 1;

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity! + quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity,
          price: product.price,
        },
      });
    }

    // Update total
    await this.updateCartTotal(cart.id);

    return { message: CART_MESSAGES.ADDED_TO_CART };
  }

  async updateCartItem(userId: number, dto: UpdateCartItemDto) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!cart) {
      throw new NotFoundException(CART_MESSAGES.CART_NOT_FOUND);
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: dto.itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException(CART_MESSAGES.CART_NOT_FOUND);
    }

    if (dto.quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: dto.quantity },
      });
    }

    await this.updateCartTotal(cart.id);
    return { message: CART_MESSAGES.UPDATED };
  }

  private async updateCartTotal(cartId: number) {
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
    });

    const total = items.reduce((sum, item) => {
      return sum + Number(item.price || 0) * (item.quantity || 0);
    }, 0);

    await this.prisma.cart.update({
      where: { id: cartId },
      data: { totalAmount: total },
    });
  }
}
