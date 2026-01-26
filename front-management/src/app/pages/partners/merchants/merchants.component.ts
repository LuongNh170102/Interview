import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@vhandelivery/shared-ui';

@Component({
  selector: 'app-merchants',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">
          {{ 'admin.partners.tabs.merchants' | translate }}
        </h1>
        <p class="page-subtitle">
          {{ 'admin.partners.merchants.subtitle' | translate }}
        </p>
      </div>
      <div class="page-content">
        <p class="coming-soon">{{ 'admin.common.comingSoon' | translate }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'variables' as *;

      .page-container {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-6);
      }

      .page-header {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2);
      }

      .page-title {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--color-text-primary);
      }

      .page-subtitle {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .page-content {
        padding: var(--spacing-8);
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        text-align: center;
      }

      .coming-soon {
        font-size: var(--font-size-lg);
        color: var(--color-text-tertiary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MerchantsComponent {}
