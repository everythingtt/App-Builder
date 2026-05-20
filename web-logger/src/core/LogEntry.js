import { LogLevelNames } from './LogLevel.js';

export class LogEntry {
  #level;
  #message;
  #data;
  #context;
  #timestamp;
  #id;

  constructor({ level, message, data, context, timestamp }) {
    this.#level = level;
    this.#message = message;
    this.#data = data ?? null;
    this.#context = context ?? {};
    this.#timestamp = timestamp;
    this.#id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  get level() {
    return this.#level;
  }

  get levelName() {
    return LogLevelNames[this.#level] ?? 'UNKNOWN';
  }

  get message() {
    return this.#message;
  }

  get data() {
    return this.#data;
  }

  get context() {
    return { ...this.#context };
  }

  get timestamp() {
    return this.#timestamp;
  }

  get id() {
    return this.#id;
  }

  get date() {
    return new Date(this.#timestamp);
  }

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
