import {
  Prisma,
  ApprovalStatus,
  OperationalStatus,
  CourierAvailabilityStatus,
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
      this.where.status = status as CourierAvailabilityStatus;
    }
    return this;
  }

  withSearch(search?: string): this {
    if (search) {
      this.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { vehicleType: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }
    return this;
  }
}
