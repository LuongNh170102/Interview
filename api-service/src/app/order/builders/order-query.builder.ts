import { Prisma } from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';

/**
 * Query Builder for Order entity
 * Provides fluent API for building order search queries
 */
export class OrderQueryBuilder extends QueryBuilder<Prisma.OrderWhereInput> {
  /**
   * Filter by status
   */
  withStatus(status?: string): this {
    if (status) {
      this.where.status = status;
    }
    return this;
  }

  /**
   * Filter by payment status
   */
  withPaymentStatus(status?: string): this {
    if (status) {
      this.where.paymentStatus = status;
    }
    return this;
  }

  /**
   * Filter by merchant
   */
  withMerchant(merchantId?: number): this {
    if (merchantId) {
      this.where.merchantId = merchantId;
    }
    return this;
  }

  /**
   * Filter by user
   */
  withUser(userId?: number): this {
    if (userId) {
      this.where.userId = userId;
    }
    return this;
  }

  /**
   * Filter by date range (createdAt) registration date
   */
  withDateRange(startDate?: Date | string, endDate?: Date | string): this {
    if (startDate || endDate) {
      this.where.createdAt = {};
      if (startDate) {
        this.where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        this.where.createdAt.lte = new Date(endDate);
      }
    }
    return this;
  }
}
