import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CouriersComponent } from './couriers.component';
import { CourierService } from '@vhandelivery/shared-ui';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const mockCourierService = {
  findAll: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
};

describe('CouriersComponent', () => {
  let component: CouriersComponent;
  let fixture: ComponentFixture<CouriersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CouriersComponent, HttpClientTestingModule],
      providers: [
        { provide: CourierService, useValue: mockCourierService },
      ],
    }).compileComponents();

    mockCourierService.findAll.mockReturnValue(
      of({ data: [], total: 0, page: 1, limit: 10 })
    );

    fixture = TestBed.createComponent(CouriersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load couriers on init', () => {
    expect(mockCourierService.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      approvalStatus: 'PENDING',
      search: undefined,
    });
  });

  it('should approve courier and reload list', () => {
    const mockCourier = { externalId: 'abc-123' } as any;
    mockCourierService.approve.mockReturnValue(of({}));
    component.onApprove(mockCourier);
    expect(mockCourierService.approve).toHaveBeenCalledWith('abc-123');
  });

  it('should open reject modal with correct courier id', () => {
    const mockCourier = { externalId: 'xyz-456' } as any;
    component.openRejectModal(mockCourier);
    expect(component.showRejectModal()).toBe(true);
    expect(component.selectedCourierId()).toBe('xyz-456');
  });

  it('should not confirm reject if reason is empty', () => {
    component.selectedCourierId.set('abc-123');
    component.rejectReason.set('');
    component.confirmReject();
    expect(mockCourierService.reject).not.toHaveBeenCalled();
  });

  it('should reject courier with reason and reload list', () => {
    mockCourierService.reject.mockReturnValue(of({}));
    component.openRejectModal({ externalId: 'abc-123' } as any);
    component.rejectReason.set('Hồ sơ không hợp lệ');
    component.confirmReject();
    expect(mockCourierService.reject).toHaveBeenCalledWith('abc-123', {
      rejectionReason: 'Hồ sơ không hợp lệ',
    });
    expect(component.showRejectModal()).toBe(false);
  });

  it('should close modal and reset state', () => {
    component.showRejectModal.set(true);
    component.selectedCourierId.set('abc-123');
    component.rejectReason.set('some reason');
    component.closeRejectModal();
    expect(component.showRejectModal()).toBe(false);
    expect(component.selectedCourierId()).toBeNull();
    expect(component.rejectReason()).toBe('');
  });
});