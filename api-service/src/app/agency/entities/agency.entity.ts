import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Agency } from '@prisma/client';

/**
 * Agency entity for API responses.
 * Excludes internal IDs and sensitive approval metadata.
 */
export class AgencyEntity extends BaseEntity {
  externalId: string;
  name: string;
  taxCode: string | null;
  bankAccount: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  businessLicenseUrl: string | null;
  approvalStatus: string;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  operationalStatus: string;
  statusChangedAt: Date | null;
  statusReason: string | null;
  createdAt: Date;
  updatedAt: Date | null;

  @Exclude()
  ownerId: number | null;

  @Exclude()
  approvedBy: number | null;

  @Exclude()
  rejectedBy: number | null;

  @Exclude()
  statusChangedBy: number | null;

  constructor(partial: Partial<Agency>) {
    super(partial);
    Object.assign(this, partial);
  }
}
