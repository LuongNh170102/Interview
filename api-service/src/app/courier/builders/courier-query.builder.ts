import { Prisma, ApprovalStatus, OperationalStatus } from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';

/**
 * Query Builder for Courier entity
 * Provides fluent API for building courier search queries
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
   * Filter by operational status
   */
  withOperationalStatus(status?: string): this {
    if (status) {
      this.where.operationalStatus = status as OperationalStatus;
    }
    return this;
  }

  /**
   * Search by name, phone, or user email
   */
  withSearch(search?: string): this {
    if (search) {
      this.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    return this;
  }

  /**
   * Filter by vehicle type
   */
  withVehicleType(vehicleType?: string): this {
    if (vehicleType) {
      this.where.vehicleType = vehicleType;
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
}
