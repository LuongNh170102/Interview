import { Prisma, ApprovalStatus, OperationalStatus, CourierActiveStatus, ProductStatus } from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';

/**
 * Query Builder for Courier entity
 * Provides fluent API for building agency search queries
 */
export class ProductQueryBuilder extends QueryBuilder<Prisma.ProductWhereInput> {

  /**
   * Filter by price range
   */
  withPriceRange(startPrice?: number, endPrice?: number): this {
    if (startPrice !== undefined || endPrice !== undefined) {
      this.where.price = {
        ...(startPrice !== undefined && { gte: startPrice }),
        ...(endPrice !== undefined && { lte: endPrice }),
      };
    }
    return this;
  }

  /**
   * Filter by status
   */
  withStatus(status?: string): this {
    if (status) {
      this.where.status = status as ProductStatus;
    }
    return this;
  }

  /**
   * Search by name, sku, or phone
   */
  withSearch(search?: string): this {
    if (search) {
      this.where.OR = [
        {
          name: {
            path: ['vi'],
            string_contains: search,
          },
        },
        {
          name: {
            path: ['ko'],
            string_contains: search,
          },
        },
        {
          name: {
            path: ['en'],
            string_contains: search,
          },
        },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
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
