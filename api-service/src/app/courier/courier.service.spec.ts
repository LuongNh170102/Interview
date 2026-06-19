import { Test, TestingModule } from '@nestjs/testing';
import { CourierService } from './courier.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalStatus } from '@prisma/client';

describe('CourierService', () => {
  let service: CourierService;
  let prisma: PrismaService;

  const mockPrismaService = {
    otpToken: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    courier: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    role: {
      findFirst: vi.fn(),
    },
    userRole: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourierService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CourierService>(CourierService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('requestOtp', () => {
    it('should generate a 6-digit OTP code', async () => {
      mockPrismaService.otpToken.create.mockResolvedValue({
        id: 1,
        phone: '0901234567',
        code: '123456',
      });

      const result = await service.requestOtp('0901234567');
      expect(result).toBeDefined();
      expect(result.phone).toBe('0901234567');
      expect(prisma.otpToken.create).toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('should throw BadRequestException if OTP not found', async () => {
      mockPrismaService.otpToken.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp('0901234567', '123456')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should verify OTP and return a token', async () => {
      mockPrismaService.otpToken.findFirst.mockResolvedValue({
        id: 1,
        phone: '0901234567',
        code: '123456',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 600000),
      });
      mockPrismaService.otpToken.delete.mockResolvedValue({});

      const result = await service.verifyOtp('0901234567', '123456');
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(prisma.otpToken.delete).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a new courier and set status to PENDING', async () => {
      const createCourierDto = {
        name: 'John Doe',
        phone: '0901234567',
        verificationToken: 'valid-token',
        vehicleType: 'Motorbike',
      };

      // Mock user not existing
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      // Mock created user
      mockPrismaService.user.create.mockResolvedValue({
        id: 100,
        phone: '0901234567',
      });
      // Mock created courier
      mockPrismaService.courier.create.mockResolvedValue({
        id: 1,
        userId: 100,
        name: 'John Doe',
        vehicleType: 'Motorbike',
        approvalStatus: ApprovalStatus.PENDING,
        createdAt: new Date(),
      });

      const result = await service.register(createCourierDto);
      expect(result).toBeDefined();
      expect(result.name).toBe('John Doe');
      expect(result.approvalStatus).toBe(ApprovalStatus.PENDING);
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if courier not found', async () => {
      mockPrismaService.courier.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus(999, { status: ApprovalStatus.APPROVED }, 1)
      ).rejects.toThrow(NotFoundException);
    });

    it('should approve courier and grant COURIER role', async () => {
      mockPrismaService.courier.findUnique.mockResolvedValue({
        id: 1,
        userId: 100,
        name: 'John Doe',
        approvalStatus: ApprovalStatus.PENDING,
      });
      mockPrismaService.courier.update.mockResolvedValue({
        id: 1,
        userId: 100,
        name: 'John Doe',
        approvalStatus: ApprovalStatus.APPROVED,
      });
      mockPrismaService.role.findFirst.mockResolvedValue({
        id: 5,
        code: 'COURIER',
      });
      mockPrismaService.userRole.create.mockResolvedValue({
        id: 1,
        userId: 100,
        roleId: 5,
      });

      const result = await service.updateStatus(
        1,
        { status: ApprovalStatus.APPROVED },
        1
      );
      expect(result).toBeDefined();
      expect(result.approvalStatus).toBe(ApprovalStatus.APPROVED);
      expect(prisma.userRole.create).toHaveBeenCalled();
    });

    it('should reject courier and save rejection reason', async () => {
      mockPrismaService.courier.findUnique.mockResolvedValue({
        id: 1,
        userId: 100,
        name: 'John Doe',
        approvalStatus: ApprovalStatus.PENDING,
      });
      mockPrismaService.courier.update.mockResolvedValue({
        id: 1,
        userId: 100,
        name: 'John Doe',
        approvalStatus: ApprovalStatus.REJECTED,
        rejectionReason: 'Invalid documents',
      });

      const result = await service.updateStatus(
        1,
        { status: ApprovalStatus.REJECTED, rejectionReason: 'Invalid documents' },
        1
      );
      expect(result).toBeDefined();
      expect(result.approvalStatus).toBe(ApprovalStatus.REJECTED);
      expect(prisma.courier.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            approvalStatus: ApprovalStatus.REJECTED,
            rejectionReason: 'Invalid documents',
          }),
        })
      );
    });
  });
});
