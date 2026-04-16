import { Injectable, signal } from '@angular/core';
import { Toast } from '../../interfaces/toast-state.interface';
import { ToastPosition, ToastType } from '../../types/toast-type';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  private generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  show(
    message: string,
    type: ToastType = 'info',
    position: ToastPosition = 'top-right',
    duration = 3000
  ) {
    const id = this.generateId();

    const toast: Toast = {
      id,
      message,
      type,
      position,
      duration,
    };

    this.toasts.update((t) => [...t, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string) {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  // Helpers
  success(msg: string) {
    this.show(msg, 'success');
  }

  error(msg: string) {
    this.show(msg, 'error');
  }

  warning(msg: string) {
    this.show(msg, 'warning');
  }

  info(msg: string) {
    this.show(msg, 'info');
  }
}