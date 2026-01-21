import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@vhandelivery/shared-ui';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';
import { ModalType } from '../../types/modal-type.type';

@Component({
  selector: 'app-global-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './global-modal.component.html',
  styleUrls: ['./global-modal.component.scss'],
  animations: [
    trigger('backdropAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }),
        animate(
          '300ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' })
        ),
      ]),
    ]),
  ],
})
export class GlobalModalComponent {
  @Input() isOpen = false;
  @Input() type: ModalType = 'info';
  @Input() title = '';
  @Input() message = '';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

  onConfirm() {
    this.confirm.emit();
  }

  get iconClass(): string {
    switch (this.type) {
      case 'success':
        return 'modal-icon--success';
      case 'error':
        return 'modal-icon--error';
      case 'warning':
        return 'modal-icon--warning';
      default:
        return 'modal-icon--info';
    }
  }
}
