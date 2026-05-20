import { Formatter } from '../core/Formatter.js';

export class JsonFormatter extends Formatter {
  #pretty;
  #includeData;
  #includeContext;

  constructor(options = {}) {
    super(options);
    this.#pretty = options.pretty ?? false;
    this.#includeData = options.includeData ?? true;
    this.#includeContext = options.includeContext ?? true;
  }

  get pretty() {
    return this.#pretty;
  }

  set pretty(value) {
    this.#pretty = value;
  }

  format(entry) {
    const obj = {
      id: entry.id,
      level: entry.levelName,
      message: entry.message,
      timestamp: entry.timestamp,
      date: entry.date.toISOString()
    };

    if (this.#includeData && entry.data !== null) {
      obj.data = entry.data;
    }

    if (this.#includeContext && Object.keys(entry.context).length > 0) {
      obj.context = entry.context;
    }

    return this.#pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  }
}
