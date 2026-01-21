import { Exclude } from 'class-transformer';

/**
 * Base entity class that excludes internal database ID from API responses.
 * All entity classes should extend this to ensure consistent serialization.
 *
 * @example
 * export class UserEntity extends BaseEntity {
 *   externalId: string;
 *   email: string;
 *   // id is automatically excluded from response
 * }
 */
export abstract class BaseEntity {
  @Exclude()
  id: number;

  constructor(partial: Partial<BaseEntity>) {
    Object.assign(this, partial);
  }
}
