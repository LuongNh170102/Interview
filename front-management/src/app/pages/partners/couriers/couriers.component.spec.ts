import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CouriersComponent } from './couriers.component';
import { CourierService, TranslationService } from '@vhandelivery/shared-ui';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('CouriersComponent', () => {
  let component: CouriersComponent;
  let fixture: ComponentFixture<CouriersComponent>;
  let mockCourierService: any;
  let mockModalService: any;
  let mockTranslationService: any;

  beforeEach(async () => {
    mockCourierService = {
      findAll: vi.fn().mockReturnValue(of({ data: [], total: 0 })),
      updateStatus: vi.fn().mockReturnValue(of({})),
    };

    mockModalService = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showConfirmation: vi.fn().mockImplementation((title, msg, confirmCb) => confirmCb()),
    };

    mockTranslationService = {
      translate: vi.fn().mockImplementation((key) => key),
      getLocalizedValue: vi.fn().mockImplementation((val) => val?.en || val?.vi || ''),
    };

    await TestBed.configureTestingModule({
      imports: [CouriersComponent],
      providers: [
        { provide: CourierService, useValue: mockCourierService },
        { provide: GlobalModalService, useValue: mockModalService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CouriersComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load couriers on init', () => {
    mockCourierService.findAll.mockReturnValue(
      of({
        data: [
          {
            externalId: '1',
            name: 'John Doe',
            phone: '0123456789',
            email: 'john@example.com',
            vehicleType: 'MOTORBIKE',
            licensePlate: '29A-12345',
            approvalStatus: 'PENDING',
          },
        ],
        total: 1,
      })
    );

    fixture.detectChanges();

    expect(mockCourierService.findAll).toHaveBeenCalled();
    expect(component.couriers().length).toBe(1);
    expect(component.couriers()[0].name).toBe('John Doe');
  });

  it('should approve courier successfully', () => {
    const courier = {
      id: '1',
      code: 'C-1',
      name: 'John Doe',
      phone: '0123456789',
      email: 'john@example.com',
      vehicleType: 'MOTORBIKE',
      licensePlate: '29A-12345',
      approvalStatus: 'PENDING',
      rejectedReason: '',
      operationalStatus: 'ACTIVE',
      createdAt: '2026-06-19',
    };

    component.onApprove(courier);

    expect(mockCourierService.updateStatus).toHaveBeenCalledWith('1', {
      approvalStatus: 'APPROVED',
    });
    expect(mockModalService.showSuccess).toHaveBeenCalled();
  });

  it('should handle rejection reason input and submit rejection', () => {
    const courier = {
      id: '2',
      code: 'C-2',
      name: 'Jane Doe',
      phone: '0123456788',
      email: 'jane@example.com',
      vehicleType: 'CAR',
      licensePlate: '29A-54321',
      approvalStatus: 'PENDING',
      rejectedReason: '',
      operationalStatus: 'ACTIVE',
      createdAt: '2026-06-19',
    };

    // Open rejection dialog
    component.openRejectionDialog(courier);
    expect(component.isRejectionDialogOpen()).toBe(true);
    expect(component.selectedCourierForRejection()).toEqual(courier);

    // Set rejection reason and submit
    component.rejectionReason.set('Invalid license plate documents');
    component.submitRejection();

    expect(mockCourierService.updateStatus).toHaveBeenCalledWith('2', {
      approvalStatus: 'REJECTED',
      rejectionReason: 'Invalid license plate documents',
    });
    expect(component.isRejectionDialogOpen()).toBe(false);
    expect(mockModalService.showSuccess).toHaveBeenCalled();
  });
});
