import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import { StatisticCardConfig } from '../../interfaces/statistic-card-config.interface';
import { StatisticCardVariant } from '../../types/statistic-card-variant.type';

@Component({
  selector: 'app-statistic-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './statistic-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticCardComponent {
  readonly config = input.required<StatisticCardConfig>();

  protected readonly iconBgClass = computed(() => {
    const variant = this.config().variant ?? 'primary';
    const bgClasses: Record<StatisticCardVariant, string> = {
      primary: 'bg-[var(--color-avatar-cyan-bg)]',
      info: 'bg-[var(--color-avatar-cyan-bg)]',
      warning: 'bg-[var(--color-avatar-yellow-bg)]',
      success: 'bg-[var(--color-avatar-green-bg)]',
      error: 'bg-[var(--color-avatar-orange-bg)]',
    };
    return bgClasses[variant];
  });

  protected readonly iconColorFilter = computed(() => {
    const variant = this.config().variant ?? 'primary';
    // CSS filters to colorize SVG icons
    const filters: Record<StatisticCardVariant, string> = {
      primary:
        'brightness(0) saturate(100%) invert(56%) sepia(52%) saturate(544%) hue-rotate(143deg) brightness(92%) contrast(87%)', // #27A4C1
      info: 'brightness(0) saturate(100%) invert(56%) sepia(52%) saturate(544%) hue-rotate(143deg) brightness(92%) contrast(87%)', // #27A4C1
      warning:
        'brightness(0) saturate(100%) invert(86%) sepia(35%) saturate(1055%) hue-rotate(341deg) brightness(96%) contrast(91%)', // #EDAD4F
      success:
        'brightness(0) saturate(100%) invert(60%) sepia(65%) saturate(471%) hue-rotate(101deg) brightness(93%) contrast(91%)', // #22BC72
      error:
        'brightness(0) saturate(100%) invert(36%) sepia(85%) saturate(1352%) hue-rotate(345deg) brightness(94%) contrast(95%)', // #F35B2A
    };
    return filters[variant];
  });

  protected readonly trendColorClass = computed(() => {
    const direction = this.config().trend?.direction;
    if (!direction) return '';
    return direction === 'up'
      ? 'text-[var(--color-status-info)]'
      : 'text-[var(--color-status-error)]';
  });

  protected readonly trendBgClass = computed(() => {
    const direction = this.config().trend?.direction;
    if (!direction) return '';
    return direction === 'up'
      ? 'bg-[var(--color-avatar-cyan-bg)] text-[var(--color-status-info)]'
      : 'bg-[var(--color-avatar-orange-bg)] text-[var(--color-status-error)]';
  });

  protected readonly subtitleColorClass = computed(() => {
    const variant = this.config().variant ?? 'primary';
    const colorClasses: Record<StatisticCardVariant, string> = {
      primary: 'text-[var(--color-status-info)]',
      info: 'text-[var(--color-status-info)]',
      warning: 'text-[var(--color-status-warning)]',
      success: 'text-[var(--color-text-tertiary)]',
      error: 'text-[var(--color-status-error)]',
    };
    return colorClasses[variant];
  });

  protected readonly progressPercentage = computed(() => {
    const progress = this.config().progress;
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  });
}
