import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GlobalModalComponent } from './shared/components/global-modal/global-modal.component';
import { GlobalModalService } from './shared/components/global-modal/global-modal.service';

@Component({
  standalone: true,
  imports: [RouterModule, GlobalModalComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'front-management';
  readonly modalService = inject(GlobalModalService);
}
