import { BaseEntity } from '../../common/entities/base.entity';
import { Courier, User } from '@prisma/client';

export interface CourierUserInfo {
  externalId: string;
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
  vehicleType: string | null;
  status: string;
  approvalStatus: string;
  operationalStatus: string;
  currentLocation: unknown | null;
  createdAt: Date;
  updatedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: number | null;
  rejectedAt: Date | null;
  rejectedBy: number | null;
  rejectionReason: string | null;
  statusChangedAt: Date | null;
  statusChangedBy: number | null;
  statusReason: string | null;
  user: CourierUserInfo | null;

  constructor(partial: Partial<Courier>, relations?: CourierRelations) {
    super(partial);
    Object.assign(this, partial);

    this.user = relations?.user?.externalId
      ? {
          externalId: relations.user.externalId,
          email: relations.user.email ?? '',
          username: relations.user.username ?? null,
          phone: relations.user.phone ?? null,
        }
      : null;
  }
}
