import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-viewport" aria-live="polite" aria-relevant="additions">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class.toast--success]="toast.type === 'success'" [class.toast--error]="toast.type === 'error'">
          @if (toast.type === 'success') {
            <svg class="toast__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clip-rule="evenodd"
              />
            </svg>
          } @else {
            <svg class="toast__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clip-rule="evenodd"
              />
            </svg>
          }
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-viewport {
        position: fixed;
        top: 1rem;
        left: 50%;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        width: min(360px, calc(100vw - 2rem));
        transform: translateX(-50%);
        pointer-events: none;
      }

      .toast {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.75rem 1rem;
        border-radius: 0.625rem;
        background: #fff;
        border: 1px solid #eaecf0;
        box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.4;
        color: #344054;
        animation: toast-in 0.22s ease-out;
        pointer-events: auto;
      }

      .toast--success {
        border-color: #abefc6;
        color: #027a48;
      }

      .toast--error {
        border-color: #fecdca;
        color: #d92d20;
      }

      .toast__icon {
        width: 1.125rem;
        height: 1.125rem;
        flex-shrink: 0;
      }

      @keyframes toast-in {
        from {
          opacity: 0;
          transform: translateY(-0.5rem) scale(0.98);
        }

        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
