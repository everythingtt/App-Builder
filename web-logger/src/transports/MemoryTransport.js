import { Transport } from '../core/Transport.js';

export class MemoryTransport extends Transport {
  #entries = [];
  #maxSize;

  constructor(options = {}) {
    super(options);
    this.#maxSize = options.maxSize ?? 1000;
  }

  get entries() {
    return [...this.#entries];
  }

  get size() {
    return this.#entries.length;
  }

  get maxSize() {
    return this.#maxSize;
  }

  set maxSize(value) {
    this.#maxSize = value;
    this.#trim();
  }

  write(entry) {
    if (!this.shouldWrite(entry)) return;
    this.#entries.push(this.format(entry));
    this.#trim();
  }

  #trim() {
    while (this.#entries.length > this.#maxSize) {
      this.#entries.shift();
    }
  }

  clear() {
    this.#entries = [];
    return this;
  }

  getEntriesByLevel(level) {
    return this.#entries.filter(e => e.level === level);
  }

  getEntriesSince(timestamp) {
    return this.#entries.filter(e => e.timestamp >= timestamp);
  }

  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.#entries.filter(e =>
      e.message.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(e.data).toLowerCase().includes(lowerQuery)
    );
  }

  flush() {
    return Promise.resolve();
  }
}
