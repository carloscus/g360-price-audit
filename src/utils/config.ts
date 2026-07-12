export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

export const DEFAULT_MY_BRAND = 'Mi Marca';
export const APP_LOCALE = 'es-PE';

export function formatDateForFilename(date: Date = new Date()): string {
  return date.toLocaleDateString(APP_LOCALE).replace(/\//g, '-');
}

export function debugLog(...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.log('[DEBUG]', ...args);
  }
}

export function debugWarn(...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.warn('[DEBUG]', ...args);
  }
}

export function debugError(...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.error('[DEBUG]', ...args);
  }
}

