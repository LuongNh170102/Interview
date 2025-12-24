import { SetMetadata } from '@nestjs/common';
import { ResourceTarget } from '../constants/resource.constant';
import { DECORATOR_KEYS } from '../constants/decorator.constant';

export const CheckStatus = (target: ResourceTarget) => SetMetadata(DECORATOR_KEYS.CHECK_STATUS, target);
