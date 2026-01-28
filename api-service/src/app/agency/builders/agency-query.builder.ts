import { Prisma, ApprovalStatus, OperationalStatus } from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';

/**
 * Query Builder for Agency entity
 * Provides fluent API for building agency search queries
 */
export class AgencyQueryBuilder extends QueryBuilder<Prisma.AgencyWhereInput> {
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
   * Filter by operational status
   */
  withOperationalStatus(status?: string): this {
    if (status) {
      this.where.operationalStatus = status as OperationalStatus;
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
   * Filter by city (from address)
   */
  withCity(city?: string): this {
    if (city) {
      this.where.address = { contains: city, mode: 'insensitive' };
    }
    return this;
  }

  /**
   * Filter by date range (createdAt)
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

  /**
   * Filter by owner ID
   */
  withOwnerId(ownerId?: number): this {
    if (ownerId) {
      this.where.ownerId = ownerId;
    }
    return this;
  }
}
