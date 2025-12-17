import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Prisma, RoleScope } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ROLE } from '../common/constants/role.constants';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findOneById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async create(data: Prisma.UserCreateInput, roleName = ROLE.CUSTOMER): Promise<User> {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    // Ensure role exists
    let role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      // Create default role if not exists (optional, but good for dev)
      role = await this.prisma.role.create({
        data: {
          name: roleName,
          scope: RoleScope.PLATFORM, // Default scope
        },
      });
    }

    return this.prisma.user.create({
      data: {
        ...data,
        passwordHash,
        userRoles: {
          create: {
            roleId: role.id,
          },
        },
      },
    });
  }
}
