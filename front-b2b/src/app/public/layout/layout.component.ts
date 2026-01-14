import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LANDING_NAV_CONFIG } from '../shared/menu.config';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  readonly navItems = LANDING_NAV_CONFIG;
}
