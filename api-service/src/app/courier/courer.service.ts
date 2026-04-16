import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import {
    CourierQueryDto,
    CourierStatistics,
    CourierListResponse,
} from './dto/courier-query.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import {
    COURIER_STATUS,
    COURIER_REGISTRATION_OTP,
    COURIER_ACTIVE_STATUS,
} from '../common/constants/courier.constant';
import { AUTH_MESSAGES, COURIER_MESSAGES } from '../common/constants/messages.constant';
import { OtpService } from '../otp/otp.service';
import { CourierEntity } from './entities/courier.entity';
import { CourierQueryBuilder } from './builders/courier-query.builder';
import { ApprovalStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';
import { UpdateCourierStatusDto } from './dto/update-courier-status.dto';
import { ROLE } from '../common/constants/role.constants';

@Injectable()
export class CourierService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private otpService: OtpService
    ) { }

    async requestOtp(dto: RequestOtpDto) {
        return this.otpService.requestOtp(dto);
    }

    async verifyOtp(dto: VerifyOtpDto) {
        return this.otpService.verifyOtp(dto, COURIER_REGISTRATION_OTP);
    }

    async findAll(
        query: CourierQueryDto
    ): Promise<CourierListResponse<CourierEntity>> {
        const take = query.limit ?? 10;
        const skip = query.skip;

        const where = new CourierQueryBuilder()
            .withApprovalStatus(query.approvalStatus)
            .withActiveStatus(query.operationalStatus)
            .withDateRange(query.startDate, query.endDate)
            .withSearch(query.search)
            .build();

        const [items, total] = await this.prisma.$transaction([
            this.prisma.courier.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.courier.count({ where }),
        ]);

        const response: CourierListResponse<CourierEntity> = {
            data: items.map((item) => new CourierEntity(item)),
            total,
            page: query.page ?? 1,
            limit: take,
        };

        if (query.shouldIncludeStatistics) {
            response.statistics = await this.getStatistics();
        }

        return response;
    }

    private async getStatistics(): Promise<CourierStatistics> {
        const [totalApproved, totalPending, totalActive] =
            await this.prisma.$transaction([
                this.prisma.courier.count({
                    where: { approvalStatus: COURIER_STATUS.APPROVED },
                }),
                this.prisma.courier.count({
                    where: { approvalStatus: COURIER_STATUS.PENDING },
                }),
                this.prisma.courier.count({
                    where: {
                        approvalStatus: COURIER_STATUS.APPROVED,
                        activeStatus: COURIER_ACTIVE_STATUS.AVAILABLE,
                    },
                }),
            ]);

        return { totalApproved, totalPending, totalActive };
    }

    async findByExternalId(externalId: string): Promise<CourierEntity> {
        const courier = await this.prisma.agency.findUnique({
            where: { externalId },
        });

        if (!courier) {
            throw new NotFoundException(COURIER_MESSAGES.NOT_FOUND);
        }

        return new CourierEntity(courier);
    }

    async create(userId: number, dto: CreateCourierDto): Promise<CourierEntity> {
        let payload;
        try {
            payload = this.jwtService.verify(dto.verificationToken);
        } catch (e) {
            throw new UnauthorizedException(
                AUTH_MESSAGES.INVALID_OR_EXPIRED_VERIFICATION_TOKEN
            );
        }

        if (payload.type !== COURIER_REGISTRATION_OTP) {
            throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN_TYPE);
        }

        if (payload.phone !== dto.phone) {
            throw new UnauthorizedException(AUTH_MESSAGES.PHONE_NUMBER_MISMATCH);
        }

        const courier = await this.prisma.courier.create({
            data: {
                name: dto.name,
                phone: dto.phone,
                email: dto.email,
                userId,
                vehiclePlate: dto.vehiclePlate,
                vehicleType: dto.vehicleType,
                approvalStatus: COURIER_STATUS.PENDING,
            },
        });

        return new CourierEntity(courier);
    }

    async updateStatus(externalId: string, dto: UpdateCourierStatusDto, req: AuthenticatedRequest) {
        const courier = await this.prisma.courier.findUnique({
            where: { externalId },
        });

        if (!courier) {
            throw new NotFoundException(COURIER_MESSAGES.NOT_FOUND);
        }

        if (dto.status === COURIER_STATUS.REJECTED && (!dto.rejectionReason || dto.rejectionReason.trim() === '')) {
            throw new BadRequestException(COURIER_MESSAGES.REJECT_REASON_REQUIRED)
        }

        const updatedCourier = await this.prisma.courier.update({
            where: { externalId },
            data: {
                approvalStatus: dto.status as ApprovalStatus,
                rejectionReason: dto.rejectionReason,
                ...(dto.status === COURIER_STATUS.APPROVED && { approvedAt: new Date() }),
                ...(dto.status === COURIER_STATUS.APPROVED && { approvedBy: req.user.userId }),
                ...(dto.status === COURIER_STATUS.REJECTED && { rejectedAt: new Date() }),
                ...(dto.status === COURIER_STATUS.APPROVED && { rejectedBy: req.user.userId })
            },
        });
        // If status is APPROVED, assign COURIER role to user
        if (dto.status === COURIER_STATUS.APPROVED && updatedCourier.userId) {
            const courierRole = await this.prisma.role.findUnique({
                where: { name: ROLE.COURIER },
            });
            if (courierRole) {
                const existingCourierRole = await this.prisma.userRole.findFirst({
                    where: {
                        userId: updatedCourier.userId,
                        roleId: courierRole.id,
                    },
                });
                if (!existingCourierRole) {
                    await this.prisma.userRole.create({
                        data: {
                            userId: updatedCourier.userId,
                            roleId: courierRole.id,
                        },
                    });
                }
            }
        }

        return updatedCourier;
    }

    async delete(externalId: string) {
        const courier = await this.prisma.courier.findUnique({
            where: { externalId },
        });

        if (!courier) {
            throw new NotFoundException(COURIER_MESSAGES.NOT_FOUND);
        }

        const deletedCourier = await this.prisma.courier.update({
            where: { externalId },
            data: {
                deletedAt: new Date()
            }
        });

        // Since the courier deleted, might as well remove the role because they are not allowed to do anything related to courier
        if (deletedCourier.userId) {
            const courierRole = await this.prisma.role.findUnique({
                where: { name: ROLE.COURIER },
            });
            if (courierRole) {
                const existingCourierRole = await this.prisma.userRole.findFirst({
                    where: {
                        userId: deletedCourier.userId,
                        roleId: courierRole.id,
                    },
                });
                if (existingCourierRole) {
                    await this.prisma.userRole.deleteMany({
                        where: {
                            userId: deletedCourier.userId,
                            roleId: courierRole.id,
                        }
                    });
                }
            }
        }
        return deletedCourier;
    }
}