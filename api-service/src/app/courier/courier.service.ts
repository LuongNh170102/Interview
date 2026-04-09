import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { calculateDistance } from '../common/utils/geo.utils';
import { ApproveCourierDto } from './dto/approve-courier.dto';
import { RegisterCourierDto } from './dto/register-courier.dto';
import { VerifyOtpDto } from '../otp/dto/otp.dto';
@Injectable()
export class CourierService {
  constructor(private prisma: PrismaService) {}

  //* Task 2B:
  async register(data: RegisterCourierDto, userId: number) {
    return this.prisma.courier.create({
      data: {
        userId,
        phone: data.phone,
        name: data.name,
        approvalStatus: 'PENDING',
      },
    });
  }

  async approve(id: number, adminId: number) {
    return this.prisma.courier.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
        operationalStatus: 'INACTIVE',
      },
    });
  }

  async reject(id: number, adminId: number, reason: string) {
    return this.prisma.courier.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectedBy: adminId,
        rejectionReason: reason,
      },
    });
  }

  async findAll(query: any) {
    return this.prisma.courier.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });
  }

  async findOne(id: number) {
    const courier = await this.prisma.courier.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
    });
    if (!courier) throw new NotFoundException('Không tìm thấy tài xế');
    return courier;
  }

  async softDelete(id: number) {
    return this.prisma.courier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createCourierProfile(dto: VerifyOtpDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: dto.phone,
          phone: dto.phone,
          email: `${dto.phone}@temp.com`,
          userRoles: {
            create: {
              role: { connect: { name: 'COURIER' } },
            },
          },
        },
      });

      const courier = await tx.courier.create({
        data: {
          userId: user.id,
          phone: dto.phone,
          approvalStatus: 'PENDING',
        },
      });

      return { user, courier };
    });
  }

  //* TASK 3A: Only couriers with status APPROVED and ONLINE are eligible
  async getEligibleCouriers() {
    return this.prisma.courier.findMany({
      where: {
        // Condition 1: MUST be approved by Admin (Task 3)
        approvalStatus: 'APPROVED',

        // Condition 2: MUST be Active (ONLINE/ACTIVE)
        operationalStatus: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            username: true,
            phoneNumber: true,
          },
        },
      },
    });
  }

  //* Task 3: Implement logic for selecting the nearest courier during order creation
  async findNearestCourier(merchantLat: number, merchantLng: number) {
    const availableCouriers = await this.prisma.courier.findMany({
      where: {
        approvalStatus: 'APPROVED',
        operationalStatus: 'ACTIVE',
      },
    });

    if (availableCouriers.length === 0) return null;

    const couriersWithDistance = availableCouriers.map((courier) => {
      const distance = calculateDistance(
        merchantLat,
        merchantLng,
        (courier as any).lat || 0,
        (courier as any).lng || 0
      );
      return { ...courier, distance };
    });

    return couriersWithDistance.sort((a, b) => a.distance - b.distance)[0];
  }

  async updateApprovalStatus(id: number, dto: ApproveCourierDto) {
    const courier = await this.prisma.courier.findUnique({ where: { id } });
    if (!courier) throw new NotFoundException('Không tìm thấy tài xế');

    if (courier.approvalStatus === dto.status) return courier;

    if (dto.status === 'REJECTED' && !dto.reason) {
      throw new BadRequestException('Phải có lý do khi từ chối tài xế');
    }

    return this.prisma.courier.update({
      where: { id },
      data: {
        approvalStatus: dto.status,
        rejectionReason: dto.status === 'REJECTED' ? dto.reason : null,
      },
    });
  }
}
