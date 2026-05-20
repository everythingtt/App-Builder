export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
export const isNode = typeof process !== 'undefined' && process.versions?.node != null;
export const isWorker = typeof importScripts === 'function' && typeof window === 'undefined';
export const isDeno = typeof Deno !== 'undefined';

export function getEnvironment() {
  if (isDeno) return 'deno';
  if (isNode) return 'node';
  if (isWorker) return 'worker';
  if (isBrowser) return 'browser';
  return 'unknown';
}

export function hasLocalStorage() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

export function hasSessionStorage() {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage !== null;
  } catch {
    return false;
  }
}

export function hasFetch() {
  return typeof fetch === 'function';
}

export function hasWebSocket() {
  return typeof WebSocket === 'function';
}

export function hasCrypto() {
  return typeof crypto !== 'undefined' && crypto !== null;
}

export function hasPerformance() {
  return typeof performance !== 'undefined' && performance !== null;
}
