/**
 * Storage Utility for safe localStorage/sessionStorage operations
 * - SSR safe (checks for window/storage availability)
 * - Type-safe with generics
 * - Supports JSON serialization/deserialization
 * - Supports validation with custom validators
 */

export type StorageType = 'local' | 'session';

interface StorageOptions<T> {
  /** Storage type: 'local' for localStorage, 'session' for sessionStorage */
  type?: StorageType;
  /** Default value if key not found or invalid */
  defaultValue: T;
  /** Optional validator function to validate stored value */
  validator?: (value: unknown) => value is T;
}

/**
 * Check if storage is available (SSR safe)
 */
function isStorageAvailable(type: StorageType): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storage =
      type === 'local' ? window.localStorage : window.sessionStorage;
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage instance based on type
 */
function getStorage(type: StorageType): Storage | null {
  if (!isStorageAvailable(type)) {
    return null;
  }
  return type === 'local' ? window.localStorage : window.sessionStorage;
}

/**
 * Get a value from storage
 * @param key - Storage key
 * @param options - Storage options with default value and optional validator
 * @returns The stored value or default value
 */
export function getFromStorage<T>(key: string, options: StorageOptions<T>): T {
  const { type = 'local', defaultValue, validator } = options;
  const storage = getStorage(type);

  if (!storage) {
    return defaultValue;
  }

  try {
    const item = storage.getItem(key);
    if (item === null) {
      return defaultValue;
    }

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(item) as unknown;

      // If validator provided, use it
      if (validator) {
        return validator(parsed) ? parsed : defaultValue;
      }

      return parsed as T;
    } catch {
      // If JSON parse fails, return raw string (if T is string)
      if (validator) {
        return validator(item) ? (item as T) : defaultValue;
      }
      return item as T;
    }
  } catch {
    return defaultValue;
  }
}

/**
 * Save a value to storage
 * @param key - Storage key
 * @param value - Value to store
 * @param type - Storage type (default: 'local')
 * @returns true if saved successfully, false otherwise
 */
export function saveToStorage<T>(
  key: string,
  value: T,
  type: StorageType = 'local'
): boolean {
  const storage = getStorage(type);

  if (!storage) {
    return false;
  }

  try {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
    storage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Failed to save to ${type}Storage:`, error);
    return false;
  }
}

/**
 * Remove a value from storage
 * @param key - Storage key
 * @param type - Storage type (default: 'local')
 * @returns true if removed successfully, false otherwise
 */
export function removeFromStorage(
  key: string,
  type: StorageType = 'local'
): boolean {
  const storage = getStorage(type);

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all items from storage
 * @param type - Storage type (default: 'local')
 * @returns true if cleared successfully, false otherwise
 */
export function clearStorage(type: StorageType = 'local'): boolean {
  const storage = getStorage(type);

  if (!storage) {
    return false;
  }

  try {
    storage.clear();
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a typed storage helper for a specific key
 * Useful for creating reusable storage accessors
 */
export function createStorageAccessor<T>(
  key: string,
  options: StorageOptions<T>
) {
  return {
    get: (): T => getFromStorage(key, options),
    set: (value: T): boolean => saveToStorage(key, value, options.type),
    remove: (): boolean => removeFromStorage(key, options.type),
  };
}

// ============================================
// Pre-defined Storage Keys (centralized)
// ============================================

export const STORAGE_KEYS = {
  LANGUAGE: 'vhandelivery_language',
  TABLE_COLUMN_VISIBILITY_PREFIX: 'vhandelivery_table_columns_',
  REGISTRATION_COMPLETED: 'vhandelivery_registration_completed',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
