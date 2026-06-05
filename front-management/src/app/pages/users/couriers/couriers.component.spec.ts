import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { APPROVAL_STATUS, CourierService } from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import { CouriersComponent } from './couriers.component';

describe('CouriersComponent', () => {
  let fixture: ComponentFixture<CouriersComponent>;
  let component: CouriersComponent;

  const courier = {
    externalId: '8e1c43d8-3dc4-4f83-8ff3-1e6a08db2839',
    name: 'Courier One',
    phone: '0900000000',
    email: 'courier@example.com',
    vehicleType: 'motorbike',
    approvalStatus: APPROVAL_STATUS.PENDING,
    operationalStatus: 'ACTIVE' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const courierServiceMock = {
    findAll: vi.fn().mockReturnValue(
      of({
        data: [courier],
        total: 1,
        page: 1,
        limit: 10,
      })
    ),
    approve: vi.fn().mockReturnValue(
      of({
        ...courier,
        approvalStatus: APPROVAL_STATUS.APPROVED,
      })
    ),
    reject: vi.fn().mockReturnValue(
      of({
        ...courier,
        approvalStatus: APPROVAL_STATUS.REJECTED,
        rejectionReason: 'Missing documents',
      })
    ),
  };

  const modalServiceMock = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [CouriersComponent],
      providers: [
        { provide: CourierService, useValue: courierServiceMock },
        { provide: GlobalModalService, useValue: modalServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CouriersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads pending couriers on init', () => {
    expect(courierServiceMock.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      approvalStatus: APPROVAL_STATUS.PENDING,
      search: '',
    });
    expect(component.couriers()).toEqual([courier]);
  });

  it('approves a courier and reloads the list', () => {
    component.approve(courier);

    expect(courierServiceMock.approve).toHaveBeenCalledWith(courier.externalId);
    expect(modalServiceMock.showSuccess).toHaveBeenCalled();
    expect(courierServiceMock.findAll).toHaveBeenCalledTimes(2);
  });

  it('rejects a courier with reason', () => {
    component.openRejectModal(courier);
    component.rejectionReason.set('Missing documents');

    component.reject();

    expect(courierServiceMock.reject).toHaveBeenCalledWith(courier.externalId, {
      rejectionReason: 'Missing documents',
    });
    expect(modalServiceMock.showSuccess).toHaveBeenCalled();
    expect(component.rejectTarget()).toBeNull();
  });
});
