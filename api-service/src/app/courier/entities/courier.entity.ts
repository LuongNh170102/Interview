import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Courier } from '@prisma/client';

/**
 * Courier entity for API responses.
 * Excludes internal integer IDs and sensitive approval metadata (approvedBy, rejectedBy).
 * Mirrors the AgencyEntity / MerchantEntity pattern.
 */
export class CourierEntity extends BaseEntity {
  externalId: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string | null;
  licenseNumber: string | null;
  avatarUrl: string | null;
  address: string | null;
  onlineStatus: string;
  currentLocation: unknown;
  approvalStatus: string;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;

  @Exclude()
  userId: number | null;

  @Exclude()
  approvedBy: number | null;

  @Exclude()
  rejectedBy: number | null;

  constructor(partial: Partial<Courier>) {
    super(partial);
    Object.assign(this, partial);
  }
}
