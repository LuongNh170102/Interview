import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CouriersComponent } from './couriers.component';
import { CourierService, TranslationService } from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../shared/components/global-modal/global-modal.service';
import { of, throwError } from 'rxjs';

describe('CouriersComponent', () => {
  let component: CouriersComponent;
  let fixture: ComponentFixture<CouriersComponent>;
  let courierServiceMock: any;
  let modalServiceMock: any;

  const mockCouriersResponse = {
    data: [
      {
        externalId: 'uuid-courier-1',
        userId: 1,
        name: 'Nguyen Van A',
        phone: '0909123456',
        status: 'offline',
        vehicleType: 'motorbike',
        vehicleNumber: '59A-12345',
        approvalStatus: 'PENDING',
        operationalStatus: 'ACTIVE',
        createdAt: '2026-01-15T08:00:00Z',
        user: { email: 'nguyenvana@test.com', username: 'nguyenvana', phone: '0909123456' },
      },
      {
        externalId: 'uuid-courier-2',
        userId: 2,
        name: 'Tran Van B',
        phone: '0909987654',
        status: 'available',
        vehicleType: 'bike',
        vehicleNumber: '',
        approvalStatus: 'APPROVED',
        operationalStatus: 'ACTIVE',
        createdAt: '2026-01-10T08:00:00Z',
        user: { email: 'tranvanb@test.com', username: 'tranvanb', phone: '0909987654' },
        approvedByUser: { email: 'admin@vhandelivery.com', username: 'SuperAdmin' },
      },
    ],
    total: 2,
    page: 1,
    limit: 10,
    statistics: { totalApproved: 1, totalPending: 1, totalRejected: 0, totalActive: 1 },
  };

  beforeEach(async () => {
    courierServiceMock = {
      findAll: vi.fn().mockReturnValue(of(mockCouriersResponse)),
      approve: vi.fn().mockReturnValue(of({ message: 'approved' })),
      reject: vi.fn().mockReturnValue(of({ message: 'rejected' })),
    };

    modalServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CouriersComponent],
      providers: [
        { provide: CourierService, useValue: courierServiceMock },
        { provide: GlobalModalService, useValue: modalServiceMock },
        { provide: TranslationService, useValue: { getLocalizedValue: vi.fn().mockReturnValue('test') } },
      ],
    }).compileComponents();

    // Override to suppress child component rendering issues
    TestBed.overrideComponent(CouriersComponent, {
      set: { template: '<div>Test</div>' },
    });

    fixture = TestBed.createComponent(CouriersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load couriers on init', () => {
    expect(courierServiceMock.findAll).toHaveBeenCalled();
    expect(component.couriers().length).toBe(2);
    expect(component.statisticsData().totalPending).toBe(1);
    expect(component.statisticsData().totalApproved).toBe(1);
  });

  it('should map API response correctly', () => {
    const couriers = component.couriers();
    expect(couriers[0].name).toBe('Nguyen Van A');
    expect(couriers[0].phone).toBe('0909123456');
    expect(couriers[0].email).toBe('nguyenvana@test.com');
    expect(couriers[0].approvalStatus).toBe('PENDING');
    expect(couriers[0].externalId).toBe('uuid-courier-1');
  });

  it('should generate initials from name', () => {
    expect(component.getInitials('Nguyen Van A')).toBe('NA');
    expect(component.getInitials('John')).toBe('J');
    expect(component.getInitials('')).toBe('?');
  });

  it('should open approve modal on menu action', () => {
    const courier = component.couriers()[0];
    component.onMenuAction('approve', courier);
    const state = component.actionModalState();
    expect(state.visible).toBe(true);
    expect(state.action).toBe('approve');
    expect(state.courier?.externalId).toBe('uuid-courier-1');
  });

  it('should open reject modal on menu action', () => {
    const courier = component.couriers()[1];
    component.onMenuAction('reject', courier);
    const state = component.actionModalState();
    expect(state.visible).toBe(true);
    expect(state.action).toBe('reject');
  });

  it('should show action menu items only for PENDING couriers', () => {
    const pendingCourier = component.couriers()[0];
    const approvedCourier = component.couriers()[1];

    expect(component.getActionMenuItems(pendingCourier).length).toBe(2);
    expect(component.getActionMenuItems(approvedCourier).length).toBe(0);
  });

  it('should approve courier and reload list', () => {
    const courier = component.couriers()[0];
    component.onMenuAction('approve', courier);
    component.confirmAction();

    expect(courierServiceMock.approve).toHaveBeenCalledWith('uuid-courier-1');
    expect(modalServiceMock.showSuccess).toHaveBeenCalledWith(
      'Thành công',
      'Đã duyệt tài xế thành công'
    );
    expect(courierServiceMock.findAll).toHaveBeenCalledTimes(2);
  });

  it('should reject courier with reason and reload list', () => {
    const courier = component.couriers()[0];
    component.onMenuAction('reject', courier);
    component.rejectionReason.set('Thiếu giấy tờ tùy thân');
    component.confirmAction();

    expect(courierServiceMock.reject).toHaveBeenCalledWith('uuid-courier-1', 'Thiếu giấy tờ tùy thân');
    expect(modalServiceMock.showSuccess).toHaveBeenCalled();
  });

  it('should handle approve error gracefully', () => {
    courierServiceMock.approve.mockReturnValue(throwError(() => ({
      error: { message: 'Lỗi server' },
    })));

    const courier = component.couriers()[0];
    component.onMenuAction('approve', courier);
    component.confirmAction();

    expect(modalServiceMock.showError).toHaveBeenCalledWith('Lỗi', 'Lỗi server');
  });

  it('should close action modal', () => {
    component.onMenuAction('approve', component.couriers()[0]);
    component.rejectionReason.set('some reason');
    component.closeActionModal();

    expect(component.actionModalState().visible).toBe(false);
    expect(component.actionModalState().courier).toBeNull();
    expect(component.actionModalState().action).toBeNull();
    expect(component.rejectionReason()).toBe('');
  });

  it('should handle page change', () => {
    component.onPageChange({ page: 2 } as any);
    expect(component.pagination().page).toBe(2);
    expect(courierServiceMock.findAll).toHaveBeenCalledTimes(2);
  });

  it('should toggle PENDING status filter', () => {
    component.onHeaderFilter({ filterId: 'status', value: '' });
    expect(component.statusFilter()).toBe('PENDING');
    expect(courierServiceMock.findAll).toHaveBeenCalledTimes(2);

    component.onHeaderFilter({ filterId: 'status', value: '' });
    expect(component.statusFilter()).toBe('');
    expect(courierServiceMock.findAll).toHaveBeenCalledTimes(3);
  });
});
