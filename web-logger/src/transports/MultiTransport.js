import { Transport } from '../core/Transport.js';

/**
 * Transport that delegates to multiple transports.
 * @example
 * const transport = new MultiTransport({
 *   transports: [
 *     new ConsoleTransport(),
 *     new FetchTransport({ url: '/api/logs' })
 *   ]
 * });
 */
export class MultiTransport extends Transport {
  #transports = [];

  /**
   * Creates a new MultiTransport instance.
   * @param {object} options - Transport options.
   * @param {object[]} [options.transports] - Initial transports.
   */
  constructor(options = {}) {
    super(options);
    if (options.transports) {
      for (const transport of options.transports) {
        this.addTransport(transport);
      }
    }
  }

  /**
   * Gets the list of transports.
   * @returns {object[]} Array of transport instances.
   */
  get transports() {
    return [...this.#transports];
  }

  /**
   * Adds a transport.
   * @param {object} transport - The transport to add.
   * @returns {MultiTransport} This transport instance.
   */
  addTransport(transport) {
    this.#transports.push(transport);
    return this;
  }

  /**
   * Removes a transport.
   * @param {object} transport - The transport to remove.
   * @returns {MultiTransport} This transport instance.
   */
  removeTransport(transport) {
    this.#transports = this.#transports.filter(t => t !== transport);
    return this;
  }

  /**
   * Writes an entry to all transports.
   * @param {object} entry - The log entry to write.
   */
  write(entry) {
    if (!this.shouldWrite(entry)) return;

    for (const transport of this.#transports) {
      try {
        transport.write(entry);
      } catch (error) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[MultiTransport] Transport error:', error);
        }
      }
    }
  }

  /**
   * Flushes all transports.
   * @returns {Promise<void>}
   */
  async flush() {
    const results = await Promise.allSettled(
      this.#transports.map(async (t) => {
        if (t.flush) {
          await t.flush();
        }
      })
    );

    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[MultiTransport] Flush error:', results[i].reason);
        }
      }
    }
  }

  /**
   * Closes all transports.
   * @returns {Promise<void>}
   */
  async close() {
    const results = await Promise.allSettled(
      this.#transports.map(async (t) => {
        if (t.close) {
          await t.close();
        }
      })
    );

    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[MultiTransport] Close error:', results[i].reason);
        }
      }
    }

    this.#transports = [];
  }
}
