import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';

export class CourierEntity extends BaseEntity {
  externalId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  identityCard?: string | null;
  approvalStatus: string;
  operationalStatus: string;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;

  @Exclude()
  userId: number;
  @Exclude()
  approvedBy?: number | null;
  @Exclude()
  rejectedBy?: number | null;

  constructor(partial: Partial<any>) {
    super(partial);
    Object.assign(this, partial);
  }
}
