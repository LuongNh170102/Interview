import { Component } from '@angular/core';
import { TranslatePipe } from '@deliveryk/shared-ui';

@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {}
