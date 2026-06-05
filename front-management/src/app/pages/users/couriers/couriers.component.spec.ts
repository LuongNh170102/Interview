import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  APPROVAL_STATUS,
  CourierListResponse,
  CourierResponse,
  CourierService as SharedCourierService,
  TranslationService,
} from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import { CouriersComponent } from './couriers.component';

describe('CouriersComponent', () => {
  const courierApiResponse: CourierResponse = {
    externalId: 'courier-external-id',
    name: 'Jane Rider',
    phone: '0123456789',
    vehicleType: 'motorbike',
    status: 'OFFLINE',
    approvalStatus: 'PENDING',
    operationalStatus: 'ACTIVE',
    rejectionReason: null,
    currentLocation: null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    orderCount: 0,
    user: {
      externalId: 'user-external-id',
      email: 'courier@example.com',
      username: 'Jane Rider',
      phone: '0123456789',
    },
  };

  const courierServiceMock = {
    findAll: vi.fn(),
    updateApproval: vi.fn(),
  };

  const modalServiceMock = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  };

  const translationServiceMock = {
    ensureCurrentLanguageLoaded: vi.fn(),
    getLanguage: vi.fn(() => 'en'),
    translate: vi.fn((key: string) => key),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response: CourierListResponse = {
      data: [courierApiResponse],
      total: 1,
      page: 1,
      limit: 10,
      statistics: {
        totalApproved: 1,
        totalPending: 1,
        totalOnline: 0,
      },
    };

    courierServiceMock.findAll.mockReturnValue(of(response));
    courierServiceMock.updateApproval.mockReturnValue(of(courierApiResponse));

    await TestBed.configureTestingModule({
      imports: [CouriersComponent],
      providers: [
        {
          provide: SharedCourierService,
          useValue: courierServiceMock,
        },
        {
          provide: GlobalModalService,
          useValue: modalServiceMock,
        },
        {
          provide: TranslationService,
          useValue: translationServiceMock,
        },
      ],
    }).compileComponents();
  });

  it('loads pending couriers on init', () => {
    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();

    expect(courierServiceMock.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: 'statistics',
        approvalStatus: APPROVAL_STATUS.PENDING,
      })
    );
  });

  it('approves a courier from the list', () => {
    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.approveCourier(component.couriers()[0]);

    expect(courierServiceMock.updateApproval).toHaveBeenCalledWith(
      'courier-external-id',
      { status: APPROVAL_STATUS.APPROVED }
    );
    expect(component.couriers()).toHaveLength(0);
    expect(component.statisticsData().totalPending).toBe(0);
    expect(component.statisticsData().totalApproved).toBe(2);
    expect(courierServiceMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('rejects a courier with a reason', () => {
    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.openRejectModal(component.couriers()[0]);
    component.rejectionReason.set('Missing verification documents');
    component.submitReject();

    expect(courierServiceMock.updateApproval).toHaveBeenCalledWith(
      'courier-external-id',
      {
        status: APPROVAL_STATUS.REJECTED,
        rejectionReason: 'Missing verification documents',
      }
    );
    expect(component.couriers()).toHaveLength(0);
    expect(component.showRejectModal()).toBe(false);
    expect(component.statisticsData().totalPending).toBe(0);
    expect(courierServiceMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('restores the pending queue when approval update fails', () => {
    courierServiceMock.updateApproval.mockReturnValueOnce(
      throwError(() => new Error('Approval failed'))
    );

    const fixture = TestBed.createComponent(CouriersComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.approveCourier(component.couriers()[0]);

    expect(component.couriers()).toHaveLength(1);
    expect(component.statisticsData().totalPending).toBe(1);
    expect(component.statisticsData().totalApproved).toBe(1);
    expect(modalServiceMock.showError).toHaveBeenCalled();
  });
});
