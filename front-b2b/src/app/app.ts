import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcome } from './nx-welcome';
import { GlobalModalComponent } from './public/shared/global-modal/global-modal.component';
import { GlobalModalService } from './public/shared/global-modal/global-modal.service';

@Component({
  standalone: true,
  imports: [NxWelcome, RouterModule, GlobalModalComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'front-b2b';
  readonly modalService = inject(GlobalModalService);
}
