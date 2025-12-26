import { SetMetadata } from '@nestjs/common';
import { DECORATOR_KEYS } from '../constants/decorator.constant';

export const PERMISSIONS_KEY = DECORATOR_KEYS.PERMISSIONS;
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
