import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourierManagementService } from './courier-management.service';
import {
  Courier,
  CourierListResponse,
  CourierResponse,
} from '../../../shared/interfaces/courier.interface';

interface RejectModalState {
  isOpen: boolean;
  courierId: string | null;
  reason: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

@Component({
  selector: 'app-couriers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Toast Notification -->
    @if (toast().visible) {
      <div
        class="toast-container"
        [class.toast-success]="toast().type === 'success'"
        [class.toast-error]="toast().type === 'error'"
      >
        {{ toast().message }}
      </div>
    }

    <section class="couriers-page">
      <!-- Header -->
      <header class="page-header">
        <h1>Pending Courier Approvals</h1>
        <p>{{ statisticsLabel() }}</p>
      </header>

      <!-- Status Filter Tabs -->
      <div class="filter-tabs">
        @for (tab of statusTabs; track tab.value) {
          <button
            class="tab-btn"
            [class.active]="activeStatus() === tab.value"
            (click)="setStatusFilter(tab.value)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-indicator">Loading couriers…</div>
      }

      <!-- Courier Table -->
      @if (!isLoading() && couriers().length > 0) {
        <table class="courier-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Vehicle</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (courier of couriers(); track courier.id) {
              <tr>
                <td>{{ courier.name }}</td>
                <td>{{ courier.phone }}</td>
                <td>{{ courier.email }}</td>
                <td>{{ courier.vehicleType || '—' }}</td>
                <td>
                  <span class="badge" [class]="'badge-' + courier.approvalStatus">
                    {{ courier.approvalStatus | uppercase }}
                  </span>
                </td>
                <td>{{ courier.registeredAt }}</td>
                <td class="action-cell">
                  @if (courier.approvalStatus === 'pending') {
                    <button
                      class="btn btn-approve"
                      [disabled]="processing().has(courier.id)"
                      (click)="approveCourier(courier.id)"
                    >
                      Approve
                    </button>
                    <button
                      class="btn btn-reject"
                      [disabled]="processing().has(courier.id)"
                      (click)="openRejectModal(courier.id)"
                    >
                      Reject
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination">
          <button
            [disabled]="pagination().page === 1"
            (click)="changePage(pagination().page - 1)"
          >
            Previous
          </button>
          <span>Page {{ pagination().page }} / {{ totalPages() }}</span>
          <button
            [disabled]="pagination().page >= totalPages()"
            (click)="changePage(pagination().page + 1)"
          >
            Next
          </button>
        </div>
      }

      @if (!isLoading() && couriers().length === 0) {
        <div class="empty-state">No couriers found for the selected filter.</div>
      }
    </section>

    <!-- Reject Modal -->
    @if (rejectModal().isOpen) {
      <div class="modal-backdrop" (click)="closeRejectModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Reject Courier</h2>
          <p>Please provide a reason so the courier can understand and reapply.</p>
          <textarea
            [(ngModel)]="rejectReason"
            rows="4"
            placeholder="Minimum 10 characters…"
            class="reject-textarea"
          ></textarea>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="closeRejectModal()">
              Cancel
            </button>
            <button
              class="btn btn-reject"
              [disabled]="rejectReason.length < 10"
              (click)="confirmReject()"
            >
              Confirm Reject
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .couriers-page { padding: 24px; }
    .page-header h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .filter-tabs { display: flex; gap: 8px; margin: 16px 0; }
    .tab-btn { padding: 6px 16px; border-radius: 20px; border: 1px solid #ddd; cursor: pointer; background: #f5f5f5; }
    .tab-btn.active { background: #1a1a2e; color: white; border-color: #1a1a2e; }
    .courier-table { width: 100%; border-collapse: collapse; }
    .courier-table th, .courier-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; }
    .badge { padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .badge-pending { background: #FFF7D7; color: #b77d00; }
    .badge-approved { background: #E7F7EC; color: #1a7f37; }
    .badge-rejected { background: #FFE3DC; color: #c0392b; }
    .action-cell { display: flex; gap: 8px; }
    .btn { padding: 6px 14px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; }
    .btn-approve { background: #1a7f37; color: white; }
    .btn-reject { background: #c0392b; color: white; }
    .btn-secondary { background: #f0f0f0; color: #333; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination { display: flex; align-items: center; gap: 16px; margin-top: 16px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 12px; padding: 24px; width: 480px; max-width: 90vw; }
    .modal h2 { margin-bottom: 8px; }
    .reject-textarea { width: 100%; margin-top: 12px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; resize: vertical; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
    .toast-container { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; font-weight: 600; z-index: 2000; }
    .toast-success { background: #1a7f37; }
    .toast-error { background: #c0392b; }
    .empty-state { text-align: center; padding: 48px; color: #888; }
    .loading-indicator { padding: 24px; text-align: center; color: #888; }
  `],
})
export class CouriersComponent implements OnInit {
  private readonly courierService = inject(CourierManagementService);
  private readonly destroyRef = inject(DestroyRef);

  // ---------------------------------------------------------------------------
  // State signals
  // ---------------------------------------------------------------------------
  readonly isLoading = signal(false);
  readonly couriers = signal<Courier[]>([]);
  readonly processing = signal<Set<string>>(new Set());
  readonly activeStatus = signal<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  readonly pagination = signal({ page: 1, pageSize: 10, total: 0 });
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.pagination().total / this.pagination().pageSize)),
  );

  readonly rejectModal = signal<RejectModalState>({
    isOpen: false,
    courierId: null,
    reason: '',
  });
  rejectReason = '';

  readonly toast = signal<ToastState>({
    message: '',
    type: 'success',
    visible: false,
  });

  readonly statisticsLabel = computed(() => {
    const p = this.pagination();
    return `Showing page ${p.page} — ${p.total} total couriers`;
  });

  readonly statusTabs = [
    { label: 'Pending', value: 'PENDING' as const },
    { label: 'Approved', value: 'APPROVED' as const },
    { label: 'Rejected', value: 'REJECTED' as const },
  ];

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  ngOnInit(): void {
    this.loadCouriers();
  }

  // ---------------------------------------------------------------------------
  // Load data
  // ---------------------------------------------------------------------------
  private loadCouriers(): void {
    this.isLoading.set(true);
    const { page, pageSize } = this.pagination();

    this.courierService
      .findAll({
        page,
        limit: pageSize,
        approvalStatus: this.activeStatus(),
        include: 'statistics',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: CourierListResponse) => {
          this.couriers.set(response.data.map(this.mapToUI));
          this.pagination.update((p) => ({ ...p, total: response.total }));
          this.isLoading.set(false);
        },
        error: () => {
          this.showToast('Failed to load couriers.', 'error');
          this.isLoading.set(false);
        },
      });
  }

  private mapToUI(c: CourierResponse): Courier {
    const statusMap: Record<string, 'pending' | 'approved' | 'rejected'> = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
    };
    return {
      id: c.externalId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      vehicleType: c.vehicleType ?? '—',
      approvalStatus: statusMap[c.approvalStatus] ?? 'pending',
      rejectionReason: c.rejectionReason,
      registeredAt: new Date(c.createdAt).toISOString().split('T')[0],
    };
  }

  // ---------------------------------------------------------------------------
  // Filter & pagination
  // ---------------------------------------------------------------------------
  setStatusFilter(status: 'PENDING' | 'APPROVED' | 'REJECTED'): void {
    this.activeStatus.set(status);
    this.pagination.update((p) => ({ ...p, page: 1 }));
    this.loadCouriers();
  }

  changePage(page: number): void {
    this.pagination.update((p) => ({ ...p, page }));
    this.loadCouriers();
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  approveCourier(courierId: string): void {
    this.setProcessing(courierId, true);

    this.courierService
      .approve(courierId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showToast('Courier approved successfully.', 'success');
          // Optimistic UI — remove from PENDING list immediately
          this.couriers.update((list) => list.filter((c) => c.id !== courierId));
          this.setProcessing(courierId, false);
        },
        error: () => {
          this.showToast('Failed to approve courier. Please try again.', 'error');
          this.setProcessing(courierId, false);
        },
      });
  }

  openRejectModal(courierId: string): void {
    this.rejectReason = '';
    this.rejectModal.set({ isOpen: true, courierId, reason: '' });
  }

  closeRejectModal(): void {
    this.rejectModal.set({ isOpen: false, courierId: null, reason: '' });
  }

  confirmReject(): void {
    const { courierId } = this.rejectModal();
    if (!courierId || this.rejectReason.length < 10) return;

    this.setProcessing(courierId, true);
    this.closeRejectModal();

    this.courierService
      .reject(courierId, { reason: this.rejectReason })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showToast('Courier rejected.', 'success');
          // Optimistic UI — remove from PENDING list immediately
          this.couriers.update((list) => list.filter((c) => c.id !== courierId));
          this.setProcessing(courierId, false);
        },
        error: () => {
          this.showToast('Failed to reject courier. Please try again.', 'error');
          this.setProcessing(courierId, false);
        },
      });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  private setProcessing(id: string, value: boolean): void {
    this.processing.update((set) => {
      const next = new Set(set);
      value ? next.add(id) : next.delete(id);
      return next;
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast.set({ message, type, visible: true });
    setTimeout(() => this.toast.update((t) => ({ ...t, visible: false })), 3000);
  }
}
