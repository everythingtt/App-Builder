import { Transport } from '../core/Transport.js';

/**
 * Transport that stores log entries in localStorage.
 * @example
 * const transport = new LocalStorageTransport({
 *   storageKey: 'my-app-logs',
 *   maxEntries: 1000
 * });
 */
export class LocalStorageTransport extends Transport {
  #storageKey;
  #maxEntries;
  #storage;

  /**
   * Creates a new LocalStorageTransport instance.
   * @param {object} options - Transport options.
   * @param {string} [options.storageKey='web-logger-entries'] - localStorage key.
   * @param {number} [options.maxEntries=500] - Maximum entries to store.
   * @param {Storage} [options.storage] - Storage instance (defaults to localStorage).
   * @throws {Error} If no storage is available.
   */
  constructor(options = {}) {
    super(options);
    this.#storageKey = options.storageKey ?? 'web-logger-entries';
    this.#maxEntries = options.maxEntries ?? 500;
    this.#storage = options.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);

    if (!this.#storage) {
      throw new Error('LocalStorageTransport requires localStorage');
    }
  }

  get storageKey() {
    return this.#storageKey;
  }

  get maxEntries() {
    return this.#maxEntries;
  }

  /**
   * Writes an entry to localStorage.
   * @param {object} entry - The log entry to write.
   */
  write(entry) {
    if (!this.shouldWrite(entry)) return;

    const entries = this.#loadEntries();
    entries.push(this.format(entry));

    while (entries.length > this.#maxEntries) {
      entries.shift();
    }

    this.#saveEntries(entries);
  }

  /**
   * Loads entries from localStorage.
   * @returns {Array} Array of stored entries.
   * @private
   */
  #loadEntries() {
    try {
      const data = this.#storage.getItem(this.#storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[LocalStorageTransport] Failed to load entries:', error);
      }
      return [];
    }
  }

  /**
   * Saves entries to localStorage.
   * @param {Array} entries - Entries to save.
   * @private
   */
  #saveEntries(entries) {
    try {
      this.#storage.setItem(this.#storageKey, JSON.stringify(entries));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        if (entries.length > 0) {
          entries.shift();
          this.#saveEntries(entries);
        }
      } else if (typeof console !== 'undefined' && console.warn) {
        console.warn('[LocalStorageTransport] Failed to save entries:', error);
      }
    }
  }

  /**
   * Gets all stored entries.
   * @returns {Array} Array of stored entries.
   */
  getEntries() {
    return this.#loadEntries();
  }

  /**
   * Clears all stored entries.
   * @returns {LocalStorageTransport} This transport instance.
   */
  clear() {
    this.#storage.removeItem(this.#storageKey);
    return this;
  }

  /**
   * Flushes the transport (no-op for localStorage).
   * @returns {Promise<void>}
   */
  flush() {
    return Promise.resolve();
  }
}
