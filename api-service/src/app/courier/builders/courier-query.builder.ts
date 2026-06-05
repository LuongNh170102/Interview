import {
  ApprovalStatus,
  CourierAvailabilityStatus,
  OperationalStatus,
  Prisma,
} from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';

export class CourierQueryBuilder extends QueryBuilder<Prisma.CourierWhereInput> {
  withApprovalStatus(status?: string): this {
    if (status) {
      this.where.approvalStatus = status as ApprovalStatus;
    }
    return this;
  }

  withOperationalStatus(status?: string): this {
    if (status) {
      this.where.operationalStatus = status as OperationalStatus;
    }
    return this;
  }

  withAvailabilityStatus(status?: string): this {
    if (status) {
      this.where.availabilityStatus = status as CourierAvailabilityStatus;
    }
    return this;
  }

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

  withDateRange(startDate?: Date | string, endDate?: Date | string): this {
    if (startDate || endDate) {
      this.where.createdAt = {};
      if (startDate) {
        this.where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        this.where.createdAt.lte = end;
      }
    }
    return this;
  }

  withNotDeleted(): this {
    this.where.deletedAt = null;
    return this;
  }
}
