import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Courier } from '@prisma/client';

/**
 * Courier entity for API responses.
 * Excludes internal IDs and sensitive metadata.
 */
export class CourierEntity extends BaseEntity {
  externalId: string;
  userId: number;
  name: string | null;
  phone: string | null;
  status: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  approvalStatus: string;
  operationalStatus: string;
  createdAt: Date;

  // User info (populated when relations are included)
  user?: {
    email: string;
    username: string | null;
    phone: string | null;
  } | null;

  // Approval info
  approvedByUser?: {
    email: string;
    username: string | null;
  } | null;

  rejectedByUser?: {
    email: string;
    username: string | null;
  } | null;

  // Excluded fields - sensitive identity fields
  @Exclude()
  idCardNumber: string | null;

  @Exclude()
  dateOfBirth: Date | null;

  @Exclude()
  approvedAt: Date | null;

  @Exclude()
  approvedBy: number | null;

  @Exclude()
  rejectedAt: Date | null;

  @Exclude()
  rejectedBy: number | null;

  @Exclude()
  rejectionReason: string | null;

  @Exclude()
  currentLocation: unknown;

  @Exclude()
  updatedAt: Date | null;

  constructor(partial: Partial<Courier>, relations?: {
    user?: { email: string; username: string | null; phone: string | null } | null;
    approvedByUser?: { email: string; username: string | null } | null;
    rejectedByUser?: { email: string; username: string | null } | null;
  }) {
    super(partial);
    Object.assign(this, partial);

    this.user = relations?.user ?? null;
    this.approvedByUser = relations?.approvedByUser ?? null;
    this.rejectedByUser = relations?.rejectedByUser ?? null;
  }
}
