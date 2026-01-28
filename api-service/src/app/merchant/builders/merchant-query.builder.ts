import { Prisma, ApprovalStatus, OperationalStatus } from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';

/**
 * Query Builder for Merchant entity
 * Provides fluent API for building merchant search queries
 */
export class MerchantQueryBuilder extends QueryBuilder<Prisma.MerchantWhereInput> {
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
   * Search by name, phone, or contact name
   */
  withSearch(search?: string): this {
    if (search) {
      this.where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this;
  }

  /**
   * Filter by city
   */
  withCity(city?: string): this {
    if (city) {
      this.where.city = { contains: city, mode: 'insensitive' };
    }
    return this;
  }

  /**
   * Filter by agency ID
   */
  withAgencyId(agencyId?: number): this {
    if (agencyId) {
      this.where.agencyId = agencyId;
    }
    return this;
  }

  /**
   * Filter by brand ID
   */
  withBrandId(brandId?: number): this {
    if (brandId) {
      this.where.brandId = brandId;
    }
    return this;
  }

  /**
   * Filter by business category
   */
  withBusinessCategory(category?: string): this {
    if (category) {
      this.where.businessCategory = category;
    }
    return this;
  }

  /**
   * Filter by business type
   */
  withBusinessType(type?: string): this {
    if (type) {
      this.where.businessType = type;
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
