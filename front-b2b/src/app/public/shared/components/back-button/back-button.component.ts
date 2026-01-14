import { Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="goBack()"
      class="flex items-center gap-2 hover:opacity-70 transition-opacity focus:outline-none"
      [attr.aria-label]="label || 'Go back'"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="51"
        height="22"
        viewBox="0 0 51 22"
        fill="none"
        class="text-text-primary stroke-current"
      >
        <path
          d="M11 0.707153L1 10.7072L11 20.7072"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path d="M1 10.7072H51" stroke-width="2" stroke-linejoin="round" />
      </svg>
    </button>
  `,
})
export class BackButtonComponent {
  private readonly location = inject(Location);
  @Input() label?: string;

  goBack(): void {
    this.location.back();
  }
}
