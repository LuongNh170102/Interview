import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import { DashboardStat } from '../../shared/types/dashboard.type';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [CommonModule, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  readonly stats = signal<readonly DashboardStat[]>([
    {
      key: 'dashboard.cards.pending',
      helper: 'dashboard.cards.pendingHelper',
      value: 12,
    },
    {
      key: 'dashboard.cards.inTransit',
      helper: 'dashboard.cards.inTransitHelper',
      value: 28,
    },
    {
      key: 'dashboard.cards.delivered',
      helper: 'dashboard.cards.deliveredHelper',
      value: 64,
    },
  ]);

  trackByKey(_: number, stat: DashboardStat): string {
    return stat.key;
  }
}
