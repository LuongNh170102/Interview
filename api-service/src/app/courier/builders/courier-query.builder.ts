import { Prisma, ApprovalStatus } from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';

/**
 * Query Builder for Courier entity.
 * Provides fluent API for building courier search queries.
 * Mirrors AgencyQueryBuilder / MerchantQueryBuilder pattern.
 */
export class CourierQueryBuilder extends QueryBuilder<Prisma.CourierWhereInput> {
  /**
   * Filter by approval status (PENDING | APPROVED | REJECTED)
   */
  withApprovalStatus(status?: string): this {
    if (status) {
      this.where.approvalStatus = status as ApprovalStatus;
    }
    return this;
  }

  /**
   * Search by name, email, or phone (case-insensitive)
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
   * Filter by vehicle type (bike | motorbike | car)
   */
  withVehicleType(vehicleType?: string): this {
    if (vehicleType) {
      this.where.vehicleType = vehicleType;
    }
    return this;
  }

  /**
   * Exclude soft-deleted records (deletedAt IS NULL)
   */
  excludeDeleted(): this {
    this.where.deletedAt = null;
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
}
