import { LogLevel } from './LogLevel.js';
import { LogEntry } from './LogEntry.js';
import { Emitter } from './Emitter.js';

/**
 * Default error handler that emits errors and optionally logs to console.
 * @param {Error} error - The error that occurred.
 * @param {object} context - Error context.
 * @param {string} context.phase - The phase where the error occurred.
 * @param {object} [context.transport] - The transport that caused the error.
 */
function defaultErrorHandler(error, context) {
  if (typeof console !== 'undefined' && console.error) {
    console.error(`[Logger] Error during ${context.phase}:`, error);
  }
}

/**
 * Main Logger class for creating and managing log entries.
 * @example
 * const logger = new Logger({ level: LogLevel.INFO });
 * logger.addTransport(new ConsoleTransport());
 * logger.info('Application started');
 */
export class Logger {
  #transports = [];
  #level = LogLevel.INFO;
  #context = {};
  #emitter;
  #parent = null;
  #inheritTransports = true;
  #onError;

  /**
   * Creates a new Logger instance.
   * @param {object} [options={}] - Logger configuration options.
   * @param {LogLevel} [options.level=LogLevel.INFO] - Minimum log level.
   * @param {object} [options.context={}] - Initial context data.
   * @param {boolean} [options.inheritTransports=true] - Whether child loggers inherit transports.
   * @param {Function} [options.onError] - Custom error handler function.
   * @param {Emitter} [options.emitter] - Custom Emitter instance for event handling.
   */
  constructor(options = {}) {
    this.#level = options.level ?? LogLevel.INFO;
    this.#context = options.context ?? {};
    this.#inheritTransports = options.inheritTransports ?? true;
    this.#onError = options.onError ?? defaultErrorHandler;
    this.#emitter = options.emitter ?? new Emitter();
  }

  /**
   * Gets the current log level.
   * @returns {LogLevel} The current log level.
   */
  get level() {
    return this.#level;
  }

  /**
   * Sets the log level.
   * @param {LogLevel} value - The new log level.
   */
  set level(value) {
    this.#level = value;
  }

  /**
   * Gets a copy of the current context.
   * @returns {object} A copy of the context object.
   */
  get context() {
    return { ...this.#context };
  }

  /**
   * Gets the inherit transports flag.
   * @returns {boolean} Whether child loggers inherit transports.
   */
  get inheritTransports() {
    return this.#inheritTransports;
  }

  /**
   * Sets the inherit transports flag.
   * @param {boolean} value - Whether child loggers should inherit transports.
   */
  set inheritTransports(value) {
    this.#inheritTransports = value;
  }

  /**
   * Gets the parent logger.
   * @returns {Logger|null} The parent logger or null if this is a root logger.
   */
  get parent() {
    return this.#parent;
  }

  /**
   * Gets the emitter instance.
   * @returns {Emitter} The Emitter instance used by this logger.
   */
  get emitter() {
    return this.#emitter;
  }

  /**
   * Adds a transport to the logger.
   * @param {object} transport - The transport to add.
   * @returns {Logger} This logger instance for chaining.
   */
  addTransport(transport) {
    this.#transports.push(transport);
    return this;
  }

  /**
   * Removes a transport from the logger.
   * @param {object} transport - The transport to remove.
   * @returns {Logger} This logger instance for chaining.
   */
  removeTransport(transport) {
    this.#transports = this.#transports.filter(t => t !== transport);
    return this;
  }

  /**
   * Gets all effective transports (including inherited ones).
   * @returns {object[]} Array of transport instances.
   */
  get transports() {
    if (this.#inheritTransports && this.#parent) {
      return [...this.#parent.transports, ...this.#transports];
    }
    return [...this.#transports];
  }

  /**
   * Sets the context data.
   * @param {object} context - The new context data.
   * @returns {Logger} This logger instance for chaining.
   */
  setContext(context) {
    this.#context = { ...context };
    return this;
  }

  /**
   * Merges data into the existing context.
   * @param {object} context - The context data to merge.
   * @returns {Logger} This logger instance for chaining.
   */
  mergeContext(context) {
    this.#context = { ...this.#context, ...context };
    return this;
  }

  /**
   * Gets all effective transports recursively.
   * @returns {object[]} Array of transport instances.
   * @private
   */
  #getEffectiveTransports() {
    if (this.#inheritTransports && this.#parent) {
      return [...this.#parent.#getEffectiveTransports(), ...this.#transports];
    }
    return this.#transports;
  }

  /**
   * Handles an error that occurred during logging.
   * @param {Error} error - The error that occurred.
   * @param {string} phase - The phase where the error occurred.
   * @param {object} [transport] - The transport that caused the error.
   * @private
   */
  #handleError(error, phase, transport) {
    this.#onError(error, { phase, transport });
    this.#emitter.emit('error', error, { phase, transport });
  }

  /**
   * Core logging method.
   * @param {LogLevel} level - The log level.
   * @param {string} message - The log message.
   * @param {object} [data] - Additional data to log.
   * @private
   */
  #log(level, message, data) {
    if (level < this.#level) return;

    const entry = new LogEntry({
      level,
      message,
      data,
      context: this.#context,
      timestamp: Date.now()
    });

    try {
      this.#emitter.emit('log', entry);
    } catch (error) {
      this.#handleError(error, 'emit:log');
    }

    const transports = this.#getEffectiveTransports();
    for (const transport of transports) {
      try {
        transport.write(entry);
      } catch (error) {
        this.#handleError(error, 'transport:write', transport);
      }
    }
  }

  /**
   * Logs a trace message.
   * @param {string} message - The log message.
   * @param {object} [data] - Additional data to log.
   * @returns {Logger} This logger instance for chaining.
   */
  trace(message, data) {
    this.#log(LogLevel.TRACE, message, data);
    return this;
  }

  /**
   * Logs a debug message.
   * @param {string} message - The log message.
   * @param {object} [data] - Additional data to log.
   * @returns {Logger} This logger instance for chaining.
   */
  debug(message, data) {
    this.#log(LogLevel.DEBUG, message, data);
    return this;
  }

  /**
   * Logs an info message.
   * @param {string} message - The log message.
   * @param {object} [data] - Additional data to log.
   * @returns {Logger} This logger instance for chaining.
   */
  info(message, data) {
    this.#log(LogLevel.INFO, message, data);
    return this;
  }

  /**
   * Logs a warning message.
   * @param {string} message - The log message.
   * @param {object} [data] - Additional data to log.
   * @returns {Logger} This logger instance for chaining.
   */
  warn(message, data) {
    this.#log(LogLevel.WARN, message, data);
    return this;
  }

  /**
   * Logs an error message.
   * @param {string} message - The log message.
   * @param {object|Error} [data] - Additional data or Error object.
   * @returns {Logger} This logger instance for chaining.
   */
  error(message, data) {
    this.#log(LogLevel.ERROR, message, data);
    return this;
  }

  /**
   * Logs a fatal message.
   * @param {string} message - The log message.
   * @param {object|Error} [data] - Additional data or Error object.
   * @returns {Logger} This logger instance for chaining.
   */
  fatal(message, data) {
    this.#log(LogLevel.FATAL, message, data);
    return this;
  }

  /**
   * Registers an event listener.
   * @param {string} event - The event name.
   * @param {Function} handler - The event handler.
   * @returns {Logger} This logger instance for chaining.
   */
  on(event, handler) {
    this.#emitter.on(event, handler);
    return this;
  }

  /**
   * Removes an event listener.
   * @param {string} event - The event name.
   * @param {Function} handler - The event handler to remove.
   * @returns {Logger} This logger instance for chaining.
   */
  off(event, handler) {
    this.#emitter.off(event, handler);
    return this;
  }

  /**
   * Registers a one-time event listener.
   * @param {string} event - The event name.
   * @param {Function} handler - The event handler.
   * @returns {Logger} This logger instance for chaining.
   */
  once(event, handler) {
    this.#emitter.once(event, handler);
    return this;
  }

  /**
   * Creates a child logger with inherited context and optionally inherited transports.
   * @param {object} [additionalContext={}] - Additional context data to merge.
   * @param {object} [options={}] - Child logger options.
   * @param {boolean} [options.inheritTransports=true] - Whether to inherit parent transports.
   * @returns {Logger} A new child Logger instance.
   */
  createChild(additionalContext = {}, options = {}) {
    const child = new Logger({
      level: this.#level,
      context: { ...this.#context, ...additionalContext },
      inheritTransports: options.inheritTransports ?? true,
      onError: this.#onError,
      emitter: this.#emitter
    });
    child.#parent = this;
    return child;
  }

  /**
   * Detaches this logger from its parent, copying parent transports to this logger.
   * @returns {Logger} This logger instance for chaining.
   */
  detach() {
    if (this.#parent) {
      const parentTransports = this.#parent.#getEffectiveTransports();
      for (const transport of parentTransports) {
        if (!this.#transports.includes(transport)) {
          this.#transports.push(transport);
        }
      }
      this.#parent = null;
      this.#inheritTransports = false;
    }
    return this;
  }

  /**
   * Flushes all transports.
   * @returns {Promise<void>} A promise that resolves when all transports are flushed.
   */
  async flush() {
    const transports = this.#getEffectiveTransports();
    const results = await Promise.allSettled(
      transports.map(async (t) => {
        if (t.flush) {
          await t.flush();
        }
      })
    );

    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        this.#handleError(results[i].reason, 'transport:flush', transports[i]);
      }
    }
  }

  /**
   * Closes all transports and clears the transport list.
   * @returns {Promise<void>} A promise that resolves when all transports are closed.
   */
  async close() {
    try {
      await this.flush();
    } catch (error) {
      this.#handleError(error, 'flush');
    }

    const transports = this.#getEffectiveTransports();
    const results = await Promise.allSettled(
      transports.map(async (t) => {
        if (t.close) {
          await t.close();
        }
      })
    );

    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        this.#handleError(results[i].reason, 'transport:close', transports[i]);
      }
    }

    this.#transports = [];
  }
}
