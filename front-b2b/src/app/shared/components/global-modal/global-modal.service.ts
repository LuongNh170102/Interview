import { Injectable, signal } from '@angular/core';
import { ModalState } from '../../interfaces/modal-state.interface';
import { ModalType } from '../../types/modal-type.type';

@Injectable({
  providedIn: 'root',
})
export class GlobalModalService {
  readonly state = signal<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: undefined,
  });

  show(
    type: ModalType,
    title: string,
    message: string,
    onConfirm?: () => void
  ) {
    this.state.set({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
    });
  }

  showSuccess(title: string, message: string) {
    this.show('success', title, message);
  }

  showError(title: string, message: string) {
    this.show('error', title, message);
  }

  showWarning(title: string, message: string) {
    this.show('warning', title, message);
  }

  showInfo(title: string, message: string) {
    this.show('info', title, message);
  }

  showConfirmation(title: string, message: string, onConfirm: () => void) {
    this.show('warning', title, message, onConfirm);
  }

  confirm() {
    const state = this.state();
    if (state.onConfirm) {
      state.onConfirm();
    }
    this.close();
  }

  close() {
    this.state.update((s) => ({ ...s, isOpen: false }));
  }
}
