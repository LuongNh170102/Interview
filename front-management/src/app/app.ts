import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcome } from './nx-welcome';
import { GlobalModalComponent } from './shared/components/global-modal/global-modal.component';
import { GlobalModalService } from './shared/components/global-modal/global-modal.service';
import { GlobalToastComponent } from './shared/components/toast/toast.component';

@Component({
  standalone: true,
  imports: [NxWelcome, RouterModule, GlobalModalComponent, GlobalToastComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'front-management';
  readonly modalService = inject(GlobalModalService);
}
