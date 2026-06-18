import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Courier } from '@prisma/client';

export class CourierEntity extends BaseEntity {
  externalId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  vehicleType: string | null;
  currentLocation: any;
  approvalStatus: string;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date | null;

  @Exclude()
  userId: number;

  @Exclude()
  approvedBy: number | null;

  @Exclude()
  rejectedBy: number | null;

  constructor(partial: Partial<Courier>) {
    super(partial);
    Object.assign(this, partial);
  }
}