import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Courier, User } from '@prisma/client';

export interface CourierUserInfo {
  email: string;
  username: string | null;
  phone: string | null;
}

export interface CourierRelations {
  user?: Partial<User> | null;
}

export class CourierEntity extends BaseEntity {
  externalId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  vehicleType: string | null;
  approvalStatus: string;
  operationalStatus: string;
  availabilityStatus: string;
  createdAt: Date;
  updatedAt: Date | null;
  user: CourierUserInfo | null;

  @Exclude()
  userId: number;

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
  latitude: number | null;

  @Exclude()
  longitude: number | null;

  @Exclude()
  currentLocation: unknown;

  constructor(partial: Partial<Courier>, relations?: CourierRelations) {
    super(partial);
    Object.assign(this, partial);

    this.user = relations?.user?.email
      ? {
          email: relations.user.email,
          username: relations.user.username ?? null,
          phone: relations.user.phone ?? null,
        }
      : null;
  }
}
