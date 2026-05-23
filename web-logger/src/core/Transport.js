/**
 * Base class for log transports.
 * @abstract
 * @example
 * class MyTransport extends Transport {
 *   write(entry) {
 *     // Send entry to external service
 *   }
 * }
 */
export class Transport {
  #formatter;
  #level;

  /**
   * Creates a new Transport instance.
   * @param {object} [options={}] - Transport options.
   * @param {object} [options.formatter=null] - Formatter to use.
   * @param {number} [options.level=0] - Minimum log level.
   */
  constructor(options = {}) {
    this.#formatter = options.formatter ?? null;
    this.#level = options.level ?? 0;
  }

  /**
   * Gets the formatter.
   * @returns {object|null} The formatter or null.
   */
  get formatter() {
    return this.#formatter;
  }

  /**
   * Sets the formatter.
   * @param {object|null} value - The formatter to set.
   */
  set formatter(value) {
    this.#formatter = value;
  }

  /**
   * Gets the minimum log level.
   * @returns {number} The minimum log level.
   */
  get level() {
    return this.#level;
  }

  /**
   * Sets the minimum log level.
   * @param {number} value - The log level to set.
   */
  set level(value) {
    this.#level = value;
  }

  /**
   * Checks if an entry should be written based on level.
   * @param {object} entry - The log entry.
   * @returns {boolean} True if the entry should be written.
   */
  shouldWrite(entry) {
    return entry.level >= this.#level;
  }

  /**
   * Formats an entry using the configured formatter.
   * @param {object} entry - The log entry.
   * @returns {string|object} The formatted entry.
   */
  format(entry) {
    if (this.#formatter) {
      return this.#formatter.format(entry);
    }
    return entry;
  }

  /**
   * Writes a log entry.
   * Must be implemented by subclasses.
   * @param {object} entry - The log entry to write.
   * @throws {Error} If not implemented by subclass.
   */
  write(entry) {
    throw new Error('Transport.write() must be implemented by subclass');
  }

  /**
   * Flushes any buffered data.
   * @returns {Promise<void>}
   */
  flush() {
    return Promise.resolve();
  }

  /**
   * Closes the transport and releases resources.
   * @returns {Promise<void>}
   */
  close() {
    return Promise.resolve();
  }
}
