import { Component } from '@angular/core';
import { TranslatePipe } from '@vhandelivery/shared-ui';

@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {}
