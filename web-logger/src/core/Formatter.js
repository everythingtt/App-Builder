/**
 * Base class for log entry formatters.
 * @abstract
 * @example
 * class MyFormatter extends Formatter {
 *   format(entry) {
 *     return `${entry.levelName}: ${entry.message}`;
 *   }
 * }
 */
export class Formatter {
  #options;

  /**
   * Creates a new Formatter instance.
   * @param {object} [options={}] - Formatter options.
   */
  constructor(options = {}) {
    this.#options = options;
  }

  /**
   * Gets a copy of the options.
   * @returns {object} A copy of the options object.
   */
  get options() {
    return { ...this.#options };
  }

  /**
   * Formats a log entry.
   * Must be implemented by subclasses.
   * @param {object} entry - The log entry to format.
   * @returns {string|object} The formatted entry.
   * @throws {Error} If not implemented by subclass.
   */
  format(entry) {
    throw new Error('Formatter.format() must be implemented by subclass');
  }

  /**
   * Creates a clone of this formatter with optional overrides.
   * @param {object} [overrides={}] - Options to override.
   * @returns {Formatter} A new Formatter instance.
   */
  clone(overrides = {}) {
    return new this.constructor({ ...this.#options, ...overrides });
  }
}
