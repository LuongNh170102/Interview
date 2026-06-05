import { ApprovalStatus, Prisma, ProductStatus } from '@prisma/client';
import { QueryBuilder } from '../../common/builders/query.builder';

export class ProductQueryBuilder extends QueryBuilder<Prisma.ProductWhereInput> {
  private appendCondition(condition: Prisma.ProductWhereInput): this {
    if (!this.where.AND) {
      this.where.AND = [];
    }

    if (Array.isArray(this.where.AND)) {
      this.where.AND.push(condition);
    } else {
      this.where.AND = [this.where.AND, condition];
    }

    return this;
  }

  withStatus(status?: ProductStatus): this {
    if (status) {
      this.where.status = status;
    }

    return this;
  }

  withIsActive(isActive?: boolean): this {
    if (typeof isActive === 'boolean') {
      this.where.isActive = isActive;
    }

    return this;
  }

  withMerchantExternalId(merchantExternalId?: string): this {
    if (merchantExternalId) {
      this.appendCondition({
        merchant: {
          is: {
            externalId: merchantExternalId,
          },
        },
      });
    }

    return this;
  }

  withCategoryExternalId(categoryExternalId?: string): this {
    if (categoryExternalId) {
      this.appendCondition({
        category: {
          is: {
            externalId: categoryExternalId,
          },
        },
      });
    }

    return this;
  }

  withApprovedMerchantOnly(): this {
    this.appendCondition({
      merchant: {
        is: {
          approvalStatus: ApprovalStatus.APPROVED,
        },
      },
    });

    return this;
  }

  withSearch(search?: string): this {
    if (search) {
      this.appendCondition({
        OR: [
          {
            name: {
              path: ['vi'],
              string_contains: search,
            },
          },
          {
            name: {
              path: ['en'],
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
            sku: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            merchant: {
              is: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      });
    }

    return this;
  }

  forPublicCatalog(): this {
    this.where.status = ProductStatus.PUBLISHED;
    this.where.isActive = true;
    this.withApprovedMerchantOnly();

    return this;
  }
}
