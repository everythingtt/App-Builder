import { LogLevel } from './LogLevel.js';
import { LogEntry } from './LogEntry.js';
import { Emitter } from './Emitter.js';

export class Logger {
  #transports = [];
  #level = LogLevel.INFO;
  #context = {};
  #emitter = new Emitter();

  constructor(options = {}) {
    this.#level = options.level ?? LogLevel.INFO;
    this.#context = options.context ?? {};
  }

  get level() {
    return this.#level;
  }

  set level(value) {
    this.#level = value;
  }

  get context() {
    return { ...this.#context };
  }

  addTransport(transport) {
    this.#transports.push(transport);
    return this;
  }

  removeTransport(transport) {
    this.#transports = this.#transports.filter(t => t !== transport);
    return this;
  }

  setContext(context) {
    this.#context = { ...context };
    return this;
  }

  mergeContext(context) {
    this.#context = { ...this.#context, ...context };
    return this;
  }

  #log(level, message, data) {
    if (level < this.#level) return;

    const entry = new LogEntry({
      level,
      message,
      data,
      context: this.#context,
      timestamp: Date.now()
    });

    this.#emitter.emit('log', entry);

    for (const transport of this.#transports) {
      try {
        transport.write(entry);
      } catch (error) {
        this.#emitter.emit('error', error);
      }
    }
  }

  trace(message, data) {
    this.#log(LogLevel.TRACE, message, data);
    return this;
  }

  debug(message, data) {
    this.#log(LogLevel.DEBUG, message, data);
    return this;
  }

  info(message, data) {
    this.#log(LogLevel.INFO, message, data);
    return this;
  }

  warn(message, data) {
    this.#log(LogLevel.WARN, message, data);
    return this;
  }

  error(message, data) {
    this.#log(LogLevel.ERROR, message, data);
    return this;
  }

  fatal(message, data) {
    this.#log(LogLevel.FATAL, message, data);
    return this;
  }

  on(event, handler) {
    this.#emitter.on(event, handler);
    return this;
  }

  off(event, handler) {
    this.#emitter.off(event, handler);
    return this;
  }

  createChild(additionalContext) {
    const child = new Logger({
      level: this.#level,
      context: { ...this.#context, ...additionalContext }
    });
    for (const transport of this.#transports) {
      child.addTransport(transport);
    }
    return child;
  }

  async flush() {
    await Promise.all(
      this.#transports.map(t => t.flush?.()).filter(Boolean)
    );
  }

  async close() {
    await this.flush();
    await Promise.all(
      this.#transports.map(t => t.close?.()).filter(Boolean)
    );
    this.#transports = [];
  }
}
