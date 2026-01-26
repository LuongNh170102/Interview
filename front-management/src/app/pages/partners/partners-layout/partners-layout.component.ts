import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService, TranslatePipe } from '@vhandelivery/shared-ui';
import { TabConfig } from '../../../shared/interfaces/tab-config.interface';

@Component({
  selector: 'app-partners-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './partners-layout.component.html',
  styleUrl: './partners-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnersLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly allTabs: TabConfig[] = [
    {
      link: 'agencies',
      labelKey: 'admin.partners.tabs.agencies',
      permission: 'agency:read',
    },
    {
      link: 'merchants',
      labelKey: 'admin.partners.tabs.merchants',
      permission: 'merchant:read',
    },
  ];

  /** Computed tabs filtered by user permissions */
  readonly visibleTabs = computed(() => {
    return this.allTabs.filter((tab) =>
      this.authService.hasPermission(tab.permission)
    );
  });

  /** First available tab based on permissions */
  readonly defaultTab = computed(() => {
    const tabs = this.visibleTabs();
    return tabs.length > 0 ? tabs[0].link : null;
  });

  ngOnInit(): void {
    // Check if we're at the /partners root (no child route active)
    const hasChildRoute = this.route.firstChild !== null;

    if (!hasChildRoute) {
      const defaultTab = this.defaultTab();
      if (defaultTab) {
        // Navigate to first available tab based on permissions
        this.router.navigate([defaultTab], {
          relativeTo: this.route,
          replaceUrl: true,
        });
      }
    }
  }
}
