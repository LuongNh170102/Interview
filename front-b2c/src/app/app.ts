import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  imports: [RouterModule, ToastComponent],
  selector: 'app-root',
  template: `
    <router-outlet />
    <app-toast />
  `,
  styleUrl: './app.scss',
})
export class App {}
