import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@vhandelivery/shared-ui';

@Component({
  selector: 'app-under-development',
  standalone: true,
  imports: [RouterModule, TranslatePipe],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div class="text-center max-w-md">
        <!-- Icon -->
        <div
          class="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-[var(--color-primary)]"
          >
            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            <path d="M2 2l7.586 7.586"></path>
            <circle cx="11" cy="11" r="2"></circle>
          </svg>
        </div>

        <!-- Title -->
        <h1 class="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
          {{ 'admin.underDevelopment.title' | translate }}
        </h1>

        <!-- Description -->
        <p class="text-[var(--color-text-secondary)] mb-6">
          {{ 'admin.underDevelopment.description' | translate }}
        </p>

        <!-- Back button -->
        <a
          routerLink="/dashboard"
          class="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m12 19-7-7 7-7"></path>
            <path d="M19 12H5"></path>
          </svg>
          {{ 'admin.underDevelopment.backToDashboard' | translate }}
        </a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnderDevelopmentComponent {}
