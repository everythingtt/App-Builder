import { Transport } from '../core/Transport.js';
import { LogLevelNames } from '../core/LogLevel.js';

const ConsoleMethods = Object.freeze({
  [0]: 'log',
  [1]: 'log',
  [2]: 'info',
  [3]: 'warn',
  [4]: 'error',
  [5]: 'error'
});

export class ConsoleTransport extends Transport {
  #useColors;
  #timestamps;

  constructor(options = {}) {
    super(options);
    this.#useColors = options.colors ?? true;
    this.#timestamps = options.timestamps ?? true;
  }

  get colors() {
    return this.#useColors;
  }

  set colors(value) {
    this.#useColors = value;
  }

  get timestamps() {
    return this.#timestamps;
  }

  set timestamps(value) {
    this.#timestamps = value;
  }

  write(entry) {
    if (!this.shouldWrite(entry)) return;

    const formatted = this.format(entry);
    const method = ConsoleMethods[entry.level] ?? 'log';
    const prefix = this.#buildPrefix(entry);

    if (this.#useColors && typeof formatted === 'string') {
      const color = this.#getColor(entry.level);
      console[method](`%c${prefix}${formatted}`, `color: ${color}`);
    } else if (typeof formatted === 'string') {
      console[method](`${prefix}${formatted}`);
    } else {
      console[method](prefix, formatted);
    }
  }

  #buildPrefix(entry) {
    const parts = [];
    if (this.#timestamps) {
      parts.push(`[${entry.date.toISOString()}]`);
    }
    parts.push(`[${entry.levelName}]`);
    return parts.join(' ') + ' ';
  }

  #getColor(level) {
    const colors = {
      0: '#80808',
      1: '#00BCD4',
      2: '#4CAF50',
      3: '#FF9800',
      4: '#F44336',
      5: '#B71C1C'
    };
    return colors[level] ?? '#000000';
  }
}
