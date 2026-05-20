import { Transport } from '../core/Transport.js';

export class MultiTransport extends Transport {
  #transports = [];

  constructor(options = {}) {
    super(options);
    if (options.transports) {
      for (const transport of options.transports) {
        this.addTransport(transport);
      }
    }
  }

  get transports() {
    return [...this.#transports];
  }

  addTransport(transport) {
    this.#transports.push(transport);
    return this;
  }

  removeTransport(transport) {
    this.#transports = this.#transports.filter(t => t !== transport);
    return this;
  }

  write(entry) {
    if (!this.shouldWrite(entry)) return;

    for (const transport of this.#transports) {
      try {
        transport.write(entry);
      } catch (error) {
        console.error('Transport error:', error);
      }
    }
  }

  async flush() {
    await Promise.all(
      this.#transports.map(t => t.flush?.()).filter(Boolean)
    );
  }

  async close() {
    await Promise.all(
      this.#transports.map(t => t.close?.()).filter(Boolean)
    );
    this.#transports = [];
  }
}
