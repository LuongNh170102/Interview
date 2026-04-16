import { Prisma, ApprovalStatus, OperationalStatus, CourierActiveStatus } from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';

/**
 * Query Builder for Courier entity
 * Provides fluent API for building agency search queries
 */
export class CourierQueryBuilder extends QueryBuilder<Prisma.CourierWhereInput> {
  /**
   * Filter by approval status
   */
  withApprovalStatus(status?: string): this {
    if (status) {
      this.where.approvalStatus = status as ApprovalStatus;
    }
    return this;
  }

  /**
   * Filter by active status
   */
  withActiveStatus(status?: string): this {
    if (status) {
      this.where.activeStatus = status as CourierActiveStatus;
    }
    return this;
  }

  /**
   * Search by name, email, or phone
   */
  withSearch(search?: string): this {
    if (search) {
      this.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
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
