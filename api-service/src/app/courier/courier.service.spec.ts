import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CourierService } from './courier.service';
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { COURIER_REGISTRATION_OTP } from '../common/constants/courier.constant';

describe('CourierService', () => {
  let service: CourierService;

  // Mock functions
  const mockTransaction = vi.fn();
  const mockFindMany = vi.fn();
  const mockFindUnique = vi.fn();
  const mockFindFirst = vi.fn();
  const mockCount = vi.fn();
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockUserFindFirst = vi.fn();
  const mockUserCreate = vi.fn();
  const mockRoleFindUnique = vi.fn();
  const mockRoleCreate = vi.fn();
  const mockUserRoleFindFirst = vi.fn();
  const mockUserRoleCreate = vi.fn();
  const mockJwtVerify = vi.fn();
  const mockJwtSign = vi.fn();
  const mockOtpRequestOtp = vi.fn();
  const mockOtpVerifyOtp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const mockPrisma = {
      $transaction: mockTransaction,
      courier: {
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        findFirst: mockFindFirst,
        count: mockCount,
        create: mockCreate,
        update: mockUpdate,
      },
      user: {
        findFirst: mockUserFindFirst,
        create: mockUserCreate,
      },
      role: {
        findUnique: mockRoleFindUnique,
        create: mockRoleCreate,
      },
      userRole: {
        findFirst: mockUserRoleFindFirst,
        create: mockUserRoleCreate,
      },
    };

    const mockJwt = {
      verify: mockJwtVerify,
      sign: mockJwtSign,
    };

    const mockOtp = {
      requestOtp: mockOtpRequestOtp,
      verifyOtp: mockOtpVerifyOtp,
    };

    service = new CourierService(mockPrisma as any, mockJwt as any, mockOtp as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findAll', () => {
    const mockCourierItems = [
      { id: 1, externalId: 'uuid-1', userId: 1, name: 'Nguyen Van A', phone: '0900000001', approvalStatus: 'PENDING', operationalStatus: 'ACTIVE', status: 'offline', vehicleType: 'motorbike', createdAt: new Date(), user: { email: 'a@test.com', username: 'nguyenvana', phone: '0900000001' }, approvedByUser: null, rejectedByUser: null },
      { id: 2, externalId: 'uuid-2', userId: 2, name: 'Tran Van B', phone: '0900000002', approvalStatus: 'APPROVED', operationalStatus: 'ACTIVE', status: 'available', vehicleType: 'bike', createdAt: new Date(), user: { email: 'b@test.com', username: 'tranvanb', phone: '0900000002' }, approvedByUser: { email: 'admin@test.com', username: 'admin' }, rejectedByUser: null },
    ];

    it('should return paginated courier list', async () => {
      mockTransaction.mockResolvedValue([mockCourierItems, 2]);

      const result = await service.findAll({ page: 1, limit: 10 } as any);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should include statistics when requested', async () => {
      mockTransaction
        .mockResolvedValueOnce([mockCourierItems, 2])
        .mockResolvedValueOnce([5, 3, 2, 4]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        include: 'statistics',
        shouldIncludeStatistics: true,
      } as any);

      expect(result.statistics).toBeDefined();
      expect(result.statistics!.totalApproved).toBe(5);
      expect(result.statistics!.totalPending).toBe(3);
      expect(result.statistics!.totalRejected).toBe(2);
      expect(result.statistics!.totalActive).toBe(4);
    });

    it('should filter by approval status', async () => {
      mockTransaction.mockResolvedValue([[mockCourierItems[0]], 1]);

      const result = await service.findAll({ page: 1, limit: 10, approvalStatus: 'PENDING' } as any);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].approvalStatus).toBe('PENDING');
    });
  });

  describe('findByExternalId', () => {
    it('should return courier when found', async () => {
      const mockCourier = {
        id: 1, externalId: 'uuid-1', userId: 1, name: 'Nguyen Van A',
        phone: '0900000001', approvalStatus: 'APPROVED', operationalStatus: 'ACTIVE',
        status: 'available', vehicleType: 'motorbike', createdAt: new Date(),
        user: { email: 'a@test.com', username: 'nguyenvana', phone: '0900000001' },
        approvedByUser: null, rejectedByUser: null,
      };
      mockFindUnique.mockResolvedValue(mockCourier);

      const result = await service.findByExternalId('uuid-1');
      expect(result.externalId).toBe('uuid-1');
      expect(result.name).toBe('Nguyen Van A');
    });

    it('should throw NotFoundException when not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(service.findByExternalId('invalid-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('register', () => {
    const registerDto = {
      name: 'Le Van C',
      phone: '0900000003',
      vehicleType: 'motorbike',
      vehicleNumber: '59A-12345',
      idCardNumber: '0123456789',
      dateOfBirth: '1990-01-01',
      verificationToken: 'valid-token',
    };

    it('should register a courier with PENDING status', async () => {
      mockJwtVerify.mockReturnValue({
        phone: '0900000003',
        type: COURIER_REGISTRATION_OTP,
      });
      mockFindFirst.mockResolvedValue(null);
      mockUserFindFirst.mockResolvedValue(null);
      mockRoleFindUnique.mockResolvedValue({ id: 1, name: 'CUSTOMER', scope: 'PLATFORM' });
      mockUserCreate.mockResolvedValue({ id: 3, email: '0900000003@courier.vhandelivery.com' });
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: 3, externalId: 'uuid-3', approvalStatus: 'PENDING',
      });

      const result = await service.register(registerDto as any);

      expect(result.approvalStatus).toBe('PENDING');
      expect(mockJwtVerify).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException when verification token is invalid', async () => {
      mockJwtVerify.mockImplementation(() => { throw new Error('Invalid token'); });

      await expect(service.register(registerDto as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token type is wrong', async () => {
      mockJwtVerify.mockReturnValue({
        phone: '0900000003',
        type: 'WRONG_TYPE',
      });

      await expect(service.register(registerDto as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when phone already has courier profile', async () => {
      mockJwtVerify.mockReturnValue({
        phone: '0900000003',
        type: COURIER_REGISTRATION_OTP,
      });
      mockFindFirst.mockResolvedValue({ id: 1, phone: '0900000003' });

      await expect(service.register(registerDto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    const adminUserId = 1;
    const externalId = 'uuid-pending';

    it('should approve a PENDING courier and assign COURIER role', async () => {
      const pendingCourier = {
        id: 2, externalId, userId: 2, name: 'Pending Courier',
        phone: '0900000004', approvalStatus: 'PENDING', operationalStatus: 'ACTIVE',
        status: 'offline', vehicleType: 'bike', createdAt: new Date(),
      };
      mockFindUnique.mockResolvedValue(pendingCourier);

      const approvedCourier = {
        ...pendingCourier,
        approvalStatus: 'APPROVED',
        operationalStatus: 'ACTIVE',
        status: 'available',
        approvedAt: new Date(),
        approvedBy: adminUserId,
        user: { email: 'c@test.com', username: 'pending', phone: '0900000004' },
        approvedByUser: { email: 'admin@test.com', username: 'admin' },
      };
      mockUpdate.mockResolvedValue(approvedCourier);
      mockRoleFindUnique.mockResolvedValue({ id: 3, name: 'COURIER' });
      mockUserRoleFindFirst.mockResolvedValue(null);
      mockUserRoleCreate.mockResolvedValue({ id: 10 });

      const result = await service.approve(adminUserId, externalId);

      expect(result.message).toBe('Courier has been approved successfully');
      expect(result.courier.approvalStatus).toBe('APPROVED');
      expect(mockUserRoleCreate).toHaveBeenCalled();
    });

    it('should throw NotFoundException when courier not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(service.approve(adminUserId, 'invalid-uuid')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when courier is not PENDING', async () => {
      mockFindUnique.mockResolvedValue({
        id: 1, externalId: 'uuid-1', approvalStatus: 'APPROVED',
      });

      await expect(service.approve(adminUserId, 'uuid-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    const adminUserId = 1;
    const externalId = 'uuid-pending';

    it('should reject a PENDING courier with reason', async () => {
      const pendingCourier = {
        id: 2, externalId, userId: 2, name: 'Pending Courier',
        phone: '0900000004', approvalStatus: 'PENDING', operationalStatus: 'ACTIVE',
        status: 'offline', vehicleType: 'bike', createdAt: new Date(),
      };
      mockFindUnique.mockResolvedValue(pendingCourier);
      mockUpdate.mockResolvedValue({
        ...pendingCourier,
        approvalStatus: 'REJECTED',
        operationalStatus: 'INACTIVE',
        status: 'offline',
        rejectedAt: new Date(),
        rejectedBy: adminUserId,
        rejectionReason: 'Missing documents',
        user: { email: 'c@test.com', username: 'pending', phone: '0900000004' },
        rejectedByUser: { email: 'admin@test.com', username: 'admin' },
      });

      const result = await service.reject(adminUserId, externalId, 'Missing documents');

      expect(result.message).toBe('Courier has been rejected');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should reject without reason when not provided', async () => {
      mockFindUnique.mockResolvedValue({
        id: 2, externalId: 'uuid-pending', userId: 2, name: 'Pending Courier',
        phone: '0900000004', approvalStatus: 'PENDING', operationalStatus: 'ACTIVE',
        status: 'offline', vehicleType: 'bike', createdAt: new Date(),
      });
      mockUpdate.mockResolvedValue({
        approvalStatus: 'REJECTED',
        rejectionReason: null,
      } as any);

      const result = await service.reject(adminUserId, externalId);

      expect(result.courier.approvalStatus).toBe('REJECTED');
    });

    it('should throw BadRequestException when courier is already approved', async () => {
      mockFindUnique.mockResolvedValue({
        id: 1, externalId: 'uuid-1', approvalStatus: 'APPROVED',
      });

      await expect(service.reject(adminUserId, 'uuid-1', 'reason')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when courier does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(service.reject(adminUserId, 'invalid-uuid', 'reason')).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestOtp / verifyOtp', () => {
    it('should delegate requestOtp to OtpService', async () => {
      const dto = { phone: '0900000005' };
      mockOtpRequestOtp.mockResolvedValue({ message: 'OTP sent successfully' });

      const result = await service.requestOtp(dto as any);
      expect(mockOtpRequestOtp).toHaveBeenCalledWith(dto);
      expect(result.message).toBe('OTP sent successfully');
    });

    it('should delegate verifyOtp to OtpService with correct type', async () => {
      const dto = { phone: '0900000005', code: '123456' };
      mockOtpVerifyOtp.mockResolvedValue({
        message: 'OTP verified successfully',
        verificationToken: 'token-123',
      });

      const result = await service.verifyOtp(dto as any);
      expect(mockOtpVerifyOtp).toHaveBeenCalledWith(dto, COURIER_REGISTRATION_OTP);
      expect(result.verificationToken).toBe('token-123');
    });
  });
});
