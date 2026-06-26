import { Exclude } from 'class-transformer';
import { Courier } from '@prisma/client';

export class CourierEntity {
  id: number;
  name: string | null;
  phone: string | null;
  status: string | null; // available, busy, offline
  vehicleType: string | null;
  currentLocation: any;
  approvalStatus: string;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;

  @Exclude()
  userId: number;

  @Exclude()
  approvedBy: number | null;

  @Exclude()
  rejectedBy: number | null;

  constructor(partial: Partial<Courier>) {
    Object.assign(this, partial);
  }
}
