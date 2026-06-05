import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CouriersComponent } from './couriers.component';
import {
  CourierService,
  TranslationService,
  APPROVAL_STATUS,
} from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

describe('CouriersComponent', () => {
  const mockCourier = {
    externalId: 'uuid-1',
    name: 'Nguyen Van A',
    phone: '0901234567',
    email: 'courier@test.com',
    address: 'HCM',
    vehicleType: 'motorbike',
    approvalStatus: APPROVAL_STATUS.PENDING,
    operationalStatus: 'ACTIVE',
    availabilityStatus: 'OFFLINE',
    createdAt: '2026-06-05T00:00:00.000Z',
    user: {
      email: 'courier@test.com',
      username: 'courier1',
      phone: '0901234567',
    },
  };

  const courierService = {
    findAll: vi.fn(() =>
      of({
        data: [mockCourier],
        total: 1,
        page: 1,
        limit: 10,
        statistics: { totalApproved: 0, totalPending: 1, totalActive: 0 },
      })
    ),
    approve: vi.fn(() => of({ ...mockCourier, approvalStatus: APPROVAL_STATUS.APPROVED })),
    reject: vi.fn(() => of({ ...mockCourier, approvalStatus: APPROVAL_STATUS.REJECTED })),
  };

  const modalService = {
    showConfirmation: vi.fn((_title: string, _message: string, onConfirm?: () => void) => {
      onConfirm?.();
    }),
    showSuccess: vi.fn(),
    showError: vi.fn(),
  };

  const translationService = {
    translate: vi.fn((key: string) => key),
    getLanguage: vi.fn(() => 'vi' as const),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [CouriersComponent],
      providers: [
        { provide: CourierService, useValue: courierService },
        { provide: GlobalModalService, useValue: modalService },
        { provide: TranslationService, useValue: translationService },
      ],
    }).compileComponents();
  });

  it('should reload couriers when status filter changes', () => {
    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();
    courierService.findAll.mockClear();

    fixture.componentInstance.onHeaderFilter({
      filterId: 'status',
      value: APPROVAL_STATUS.APPROVED,
    });

    expect(courierService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalStatus: APPROVAL_STATUS.APPROVED,
        page: 1,
      })
    );
  });

  it('should load pending couriers on init', () => {
    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();

    expect(courierService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalStatus: APPROVAL_STATUS.PENDING,
        include: 'statistics',
      })
    );
    expect(fixture.componentInstance.couriers().length).toBe(1);
  });

  it('should approve courier from table action', () => {
    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();

    const courier = fixture.componentInstance.couriers()[0];
    fixture.componentInstance.onAction({
      actionId: 'approve',
      row: courier,
      index: 0,
    });

    expect(courierService.approve).toHaveBeenCalledWith(courier.id);
    expect(modalService.showSuccess).toHaveBeenCalled();
  });

  it('should reject courier with reason', () => {
    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();

    const courier = fixture.componentInstance.couriers()[0];
    fixture.componentInstance.openRejectModal(courier);
    fixture.componentInstance.rejectForm.setValue({
      rejectionReason: 'Invalid documents',
    });
    fixture.componentInstance.submitReject();

    expect(courierService.reject).toHaveBeenCalledWith(courier.id, {
      rejectionReason: 'Invalid documents',
    });
    expect(modalService.showSuccess).toHaveBeenCalled();
  });

  it('should restore list when approve fails', () => {
    courierService.approve.mockReturnValueOnce(
      throwError(() => new Error('approve failed'))
    );

    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();

    const courier = fixture.componentInstance.couriers()[0];
    fixture.componentInstance.onAction({
      actionId: 'approve',
      row: courier,
      index: 0,
    });

    expect(fixture.componentInstance.couriers().length).toBe(1);
    expect(modalService.showError).toHaveBeenCalled();
  });

  it('should load next page when pagination changes', () => {
    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();
    courierService.findAll.mockClear();

    fixture.componentInstance.onPageChange({ page: 2, pageSize: 10 });

    expect(courierService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });

  it('should pass date filters to API', () => {
    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();
    courierService.findAll.mockClear();

    fixture.componentInstance.registeredFrom.set('2026-06-01');
    fixture.componentInstance.registeredTo.set('2026-06-30');
    fixture.componentInstance.onRegisteredFromChange({
      target: { value: '2026-06-01' },
    } as unknown as Event);

    expect(courierService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      })
    );
  });

  it('should restore list when reject fails', () => {
    courierService.reject.mockReturnValueOnce(
      throwError(() => new Error('reject failed'))
    );

    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();

    const courier = fixture.componentInstance.couriers()[0];
    fixture.componentInstance.openRejectModal(courier);
    fixture.componentInstance.rejectForm.setValue({
      rejectionReason: 'Invalid documents',
    });
    fixture.componentInstance.submitReject();

    expect(fixture.componentInstance.couriers().length).toBe(1);
    expect(modalService.showError).toHaveBeenCalled();
  });
});
