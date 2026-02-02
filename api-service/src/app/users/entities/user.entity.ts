import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '@prisma/client';

/**
 * User entity for API responses.
 * Excludes internal ID and sensitive fields like password hash.
 */
export class UserEntity extends BaseEntity {
  externalId: string;
  email: string;
  username: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  lastSeenAt: Date | null;

  @Exclude()
  passwordHash: string | null;

  @Exclude()
  hashedRefreshToken: string | null;

  @Exclude()
  profile: unknown;

  constructor(partial: Partial<User>) {
    super(partial);
    Object.assign(this, partial);
  }
}
