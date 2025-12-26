import { SetMetadata } from '@nestjs/common';
import { DECORATOR_KEYS } from '../constants/decorator.constant';

export const ROLES_KEY = DECORATOR_KEYS.ROLES;
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
