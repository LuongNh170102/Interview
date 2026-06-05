import { Exclude } from 'class-transformer';
import { Courier } from '@prisma/client';
import { BaseEntity } from '../../common/entities/base.entity';

export class CourierEntity extends BaseEntity {
  externalId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  vehicleType: string | null;
  currentLocation: unknown;
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
  userId: number;

  @Exclude()
  approvedBy: number | null;

  @Exclude()
  rejectedBy: number | null;

  @Exclude()
  statusChangedBy: number | null;

  constructor(partial: Partial<Courier>) {
    super(partial);
    Object.assign(this, partial);
  }
}
