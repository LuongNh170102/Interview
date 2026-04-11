import { Prisma } from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';

export class CourierQueryBuilder extends QueryBuilder<Prisma.CourierWhereInput> {
  withApprovalStatus(status?: string): this {
    if (status) {
      this.where.approvalStatus = status as any;
    }
    return this;
  }

  withSearch(search?: string): this {
    if (search) {
      this.where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this;
  }
}
