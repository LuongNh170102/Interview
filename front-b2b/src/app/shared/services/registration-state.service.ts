import { Injectable, signal } from '@angular/core';
import { RegistrationType, STORAGE_KEYS } from '@vhandelivery/shared-ui';

@Injectable({
  providedIn: 'root',
})
export class RegistrationStateService {
  private readonly _isCompleted = signal(false);
  private readonly _registrationType = signal<RegistrationType | null>(null);

  constructor() {
    // Restore state from sessionStorage on initialization
    this.restoreFromStorage();
  }

  /**
   * Mark registration as completed
   * Call this after successful registration API call
   */
  markAsCompleted(type: RegistrationType): void {
    this._isCompleted.set(true);
    this._registrationType.set(type);
    this.saveToStorage(type);
  }

  /**
   * Check if registration is completed
   */
  isCompleted(): boolean {
    return this._isCompleted();
  }

  /**
   * Get registration type
   */
  getRegistrationType(): RegistrationType | null {
    return this._registrationType();
  }

  /**
   * Clear registration state
   * Call this after user views success page
   */
  clear(): void {
    this._isCompleted.set(false);
    this._registrationType.set(null);
    this.removeFromStorage();
  }

  /**
   * Save to sessionStorage for navigation persistence
   */
  private saveToStorage(type: RegistrationType): void {
    try {
      sessionStorage.setItem(
        STORAGE_KEYS.REGISTRATION_COMPLETED,
        JSON.stringify({ completed: true, type })
      );
    } catch {
      // Storage not available
    }
  }

  /**
   * Restore from sessionStorage
   */
  private restoreFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(
        STORAGE_KEYS.REGISTRATION_COMPLETED
      );
      if (stored) {
        const data = JSON.parse(stored) as {
          completed: boolean;
          type: RegistrationType;
        };
        if (data.completed) {
          this._isCompleted.set(true);
          this._registrationType.set(data.type);
        }
      }
    } catch {
      // Storage not available or invalid data
    }
  }

  /**
   * Remove from sessionStorage
   */
  private removeFromStorage(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.REGISTRATION_COMPLETED);
    } catch {
      // Storage not available
    }
  }
}
