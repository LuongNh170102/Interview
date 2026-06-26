import { Prisma, ApprovalStatus } from '@prisma/client';
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
      this.where.status = status;
    }
    return this;
  }

  withSearch(search?: string): this {
    if (search) {
      this.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
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
        this.where.createdAt.lte = new Date(endDate);
      }
    }
    return this;
  }

  withUserId(userId?: number): this {
    if (userId) {
      this.where.userId = userId;
    }
    return this;
  }

  excludeDeleted(): this {
    this.where.deletedAt = null;
    return this;
  }
}
