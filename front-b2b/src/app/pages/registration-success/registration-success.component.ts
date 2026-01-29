import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@vhandelivery/shared-ui';

@Component({
  selector: 'app-registration-success',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './registration-success.component.html',
  styleUrls: ['./registration-success.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationSuccessComponent {}
