import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  effect,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@vhandelivery/shared-ui';

export interface SlideOverConfig {
  /** Title translation key */
  titleKey?: string;
  /** Title text (alternative to titleKey) */
  title?: string;
  /** Width of the panel */
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Show close button */
  showCloseButton?: boolean;
  /** Show backdrop */
  showBackdrop?: boolean;
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Show header */
  showHeader?: boolean;
  /** Custom header icon */
  headerIcon?: string;
}

const DEFAULT_CONFIG: SlideOverConfig = {
  width: 'lg',
  showCloseButton: true,
  showBackdrop: true,
  closeOnBackdropClick: true,
  closeOnEscape: true,
  showHeader: true,
};

@Component({
  selector: 'app-slide-over-panel',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './slide-over-panel.component.html',
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideOverPanelComponent {
  /** Whether the panel is open */
  readonly isOpen = input<boolean>(false);

  /** Panel configuration */
  readonly config = input<SlideOverConfig>({});

  /** Emitted when the panel should close */
  readonly closePanel = output<void>();

  /** Internal animation state */
  readonly isAnimating = signal(false);

  /** Merged configuration with defaults */
  readonly mergedConfig = computed(() => ({
    ...DEFAULT_CONFIG,
    ...this.config(),
  }));

  /** Width class based on config */
  readonly widthClass = computed(() => {
    const width = this.mergedConfig().width;
    switch (width) {
      case 'sm':
        return 'w-full sm:max-w-md';
      case 'md':
        return 'w-full sm:max-w-lg';
      case 'lg':
        return 'w-full sm:max-w-2xl';
      case 'xl':
        return 'w-full sm:max-w-4xl';
      case 'full':
        return 'w-full';
      default:
        return 'w-full sm:max-w-2xl';
    }
  });

  constructor() {
    // Animate when isOpen changes
    effect(() => {
      if (this.isOpen()) {
        // Delay animation to allow DOM to render
        requestAnimationFrame(() => {
          this.isAnimating.set(true);
        });
        // Prevent body scroll when panel is open
        document.body.style.overflow = 'hidden';
      } else {
        this.isAnimating.set(false);
        document.body.style.overflow = '';
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen() && this.mergedConfig().closeOnEscape) {
      this.close();
    }
  }

  onBackdropClick(): void {
    if (this.mergedConfig().closeOnBackdropClick) {
      this.close();
    }
  }

  close(): void {
    this.isAnimating.set(false);
    // Wait for animation to complete before emitting close
    setTimeout(() => {
      this.closePanel.emit();
    }, 300);
  }
}
