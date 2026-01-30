import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-marketing-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="flex flex-col gap-4 px-4 md:px-0">
      <router-outlet />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketingLayoutComponent {}
