import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  APPROVAL_STATUS,
  CourierResponse,
  CourierService,
} from '@vhandelivery/shared-ui';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalModalService } from '../../../shared/components/global-modal/global-modal.service';

@Component({
  selector: 'app-couriers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './couriers.component.html',
  styleUrl: './couriers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouriersComponent implements OnInit {
  private readonly courierService = inject(CourierService);
  private readonly modalService = inject(GlobalModalService);
  private readonly destroyRef = inject(DestroyRef);

  readonly couriers = signal<CourierResponse[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly total = signal(0);
  readonly search = signal('');
  readonly rejectTarget = signal<CourierResponse | null>(null);
  readonly rejectionReason = signal('');

  readonly lastPage = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize()))
  );

  ngOnInit(): void {
    this.loadCouriers();
  }

  loadCouriers(): void {
    this.isLoading.set(true);
    this.courierService
      .findAll({
        page: this.page(),
        limit: this.pageSize(),
        approvalStatus: APPROVAL_STATUS.PENDING,
        search: this.search(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.couriers.set(response.data);
          this.total.set(response.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.modalService.showError(
            'Load failed',
            'Could not load pending couriers.'
          );
        },
      });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.loadCouriers();
  }

  approve(courier: CourierResponse): void {
    this.isSubmitting.set(true);
    this.courierService
      .approve(courier.externalId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.modalService.showSuccess(
            'Courier approved',
            `${courier.name ?? 'Courier'} can now receive delivery orders.`
          );
          this.loadCouriers();
        },
        error: () => {
          this.isSubmitting.set(false);
          this.modalService.showError(
            'Approval failed',
            'Could not approve this courier.'
          );
        },
      });
  }

  openRejectModal(courier: CourierResponse): void {
    this.rejectTarget.set(courier);
    this.rejectionReason.set('');
  }

  closeRejectModal(): void {
    this.rejectTarget.set(null);
    this.rejectionReason.set('');
  }

  reject(): void {
    const courier = this.rejectTarget();
    const reason = this.rejectionReason().trim();

    if (!courier || !reason) {
      return;
    }

    this.isSubmitting.set(true);
    this.courierService
      .reject(courier.externalId, { rejectionReason: reason })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeRejectModal();
          this.modalService.showSuccess(
            'Courier rejected',
            'The rejection reason has been saved.'
          );
          this.loadCouriers();
        },
        error: () => {
          this.isSubmitting.set(false);
          this.modalService.showError(
            'Rejection failed',
            'Could not reject this courier.'
          );
        },
      });
  }

  nextPage(): void {
    if (this.page() >= this.lastPage()) return;
    this.page.update((value) => value + 1);
    this.loadCouriers();
  }

  previousPage(): void {
    if (this.page() <= 1) return;
    this.page.update((value) => value - 1);
    this.loadCouriers();
  }
}
