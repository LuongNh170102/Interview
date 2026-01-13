import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { MERCHANT_STATUS } from '../constants/merchant.constant';
import { isUUID } from 'class-validator';
import { DECORATOR_KEYS } from '../constants/decorator.constant';
import {
  RESOURCE_IDENTIFIER_KEYS,
  RESOURCE_TARGETS,
  ResourceTarget,
} from '../constants/resource.constant';
import { RESOURCE_MESSAGES } from '../constants/messages.constant';

@Injectable()
export class ResourceStatusGuard implements CanActivate {
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const target = this.reflector.getAllAndOverride<ResourceTarget>(
      DECORATOR_KEYS.CHECK_STATUS,
      [context.getHandler(), context.getClass()]
    );

    if (!target) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const id = this.extractIdentifier(request, target);

    if (!id) {
      return true;
    }

    await this.validateStatus(target, id);

    return true;
  }

  private extractIdentifier(
    request: any,
    target: ResourceTarget
  ): string | number | undefined {
    const keys = RESOURCE_IDENTIFIER_KEYS[target] || [];

    for (const key of keys) {
      if (request.params?.[key]) return request.params[key];
      if (request.body?.[key]) return request.body[key];
      if (request.query?.[key]) return request.query[key];
    }
    return undefined;
  }

  private async validateStatus(target: ResourceTarget, id: string | number) {
    let entity: any;
    const isIdUUID = isUUID(String(id));
    const idNumber = !isNaN(Number(id)) ? Number(id) : undefined;

    if (target === RESOURCE_TARGETS.MERCHANT) {
      entity = await this.prisma.merchant.findUnique({
        where: isIdUUID ? { externalId: String(id) } : { id: idNumber },
        select: { status: true },
      });
    } else if (target === RESOURCE_TARGETS.AGENCY) {
      entity = await this.prisma.agency.findUnique({
        where: isIdUUID ? { externalId: String(id) } : { id: idNumber },
        select: { status: true },
      });
    }

    if (!entity) {
      throw new NotFoundException(RESOURCE_MESSAGES.NOT_FOUND(target));
    }

    if (entity.status !== MERCHANT_STATUS.APPROVED) {
      throw new ForbiddenException(
        RESOURCE_MESSAGES.OPERATION_DENIED(target, entity.status)
      );
    }
  }
}
