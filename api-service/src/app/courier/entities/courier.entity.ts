import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Courier, User } from '@prisma/client';

/**
 * Courier entity for API responses.
 * Excludes internal IDs and sensitive approval metadata.
 */
export class CourierEntity extends BaseEntity {
  externalId!: string;
  name!: string;
  phone!: string | null;
  email?: string | null;
  approvalStatus!: string;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  vehicleType!: string;
  currentLocation!: string;
  vehiclePlate!: string;
  activeStatus?: string;
  statusChangedAt?: Date | null;
  createdAt!: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;

  @Exclude()
  userId!: number;

  @Exclude()
  approvedBy?: number | null;

  @Exclude()
  rejectedBy?: number | null;

  constructor(partial: Partial<Courier>) {
    super(partial);
    Object.assign(this, partial);
  }
}
