import { Transport } from '../core/Transport.js';

export class LocalStorageTransport extends Transport {
  #storageKey;
  #maxEntries;
  #storage;

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

  write(entry) {
    if (!this.shouldWrite(entry)) return;

    const entries = this.#loadEntries();
    entries.push(this.format(entry));

    while (entries.length > this.#maxEntries) {
      entries.shift();
    }

    this.#saveEntries(entries);
  }

  #loadEntries() {
    try {
      const data = this.#storage.getItem(this.#storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  #saveEntries(entries) {
    try {
      this.#storage.setItem(this.#storageKey, JSON.stringify(entries));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        entries.shift();
        this.#saveEntries(entries);
      }
    }
  }

  getEntries() {
    return this.#loadEntries();
  }

  clear() {
    this.#storage.removeItem(this.#storageKey);
    return this;
  }

  flush() {
    return Promise.resolve();
  }
}
