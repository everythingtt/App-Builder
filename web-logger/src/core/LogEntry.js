import { LogLevelNames } from './LogLevel.js';

/**
 * Represents a single log entry.
 * @example
 * const entry = new LogEntry({
 *   level: LogLevel.INFO,
 *   message: 'User logged in',
 *   data: { userId: 123 },
 *   context: { requestId: 'abc' },
 *   timestamp: Date.now()
 * });
 */
export class LogEntry {
  #level;
  #message;
  #data;
  #context;
  #timestamp;
  #id;

  /**
   * Creates a new LogEntry instance.
   * @param {object} options - Entry options.
   * @param {number} options.level - Log level.
   * @param {string} options.message - Log message.
   * @param {*} [options.data=null] - Additional data.
   * @param {object} [options.context={}] - Context data.
   * @param {number} options.timestamp - Unix timestamp.
   */
  constructor({ level, message, data, context, timestamp }) {
    this.#level = level;
    this.#message = message;
    this.#data = data ?? null;
    this.#context = context ?? {};
    this.#timestamp = timestamp;
    this.#id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  /**
   * Gets the log level.
   * @returns {number} The log level number.
   */
  get level() {
    return this.#level;
  }

  /**
   * Gets the log level name.
   * @returns {string} The log level name (e.g., 'INFO').
   */
  get levelName() {
    return LogLevelNames[this.#level] ?? 'UNKNOWN';
  }

  /**
   * Gets the log message.
   * @returns {string} The log message.
   */
  get message() {
    return this.#message;
  }

  /**
   * Gets the additional data.
   * @returns {*} The data or null.
   */
  get data() {
    return this.#data;
  }

  /**
   * Gets a copy of the context.
   * @returns {object} A copy of the context object.
   */
  get context() {
    return { ...this.#context };
  }

  /**
   * Gets the timestamp.
   * @returns {number} The Unix timestamp.
   */
  get timestamp() {
    return this.#timestamp;
  }

  /**
   * Gets the unique entry ID.
   * @returns {string} The entry ID.
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets the Date object from timestamp.
   * @returns {Date} The Date object.
   */
  get date() {
    return new Date(this.#timestamp);
  }

  /**
   * Converts the entry to a JSON object.
   * @returns {object} JSON representation of the entry.
   */
  toJSON() {
    return {
      id: this.#id,
      level: this.#level,
      levelName: this.levelName,
      message: this.#message,
      data: this.#data,
      context: this.#context,
      timestamp: this.#timestamp,
      date: this.date.toISOString()
    };
  }

  /**
   * Creates a clone of this entry with optional overrides.
   * @param {object} [overrides={}] - Properties to override.
   * @returns {LogEntry} A new LogEntry instance.
   */
  clone(overrides = {}) {
    return new LogEntry({
      level: overrides.level ?? this.#level,
      message: overrides.message ?? this.#message,
      data: overrides.data ?? this.#data,
      context: { ...this.#context, ...(overrides.context ?? {}) },
      timestamp: overrides.timestamp ?? this.#timestamp
    });
  }
}
