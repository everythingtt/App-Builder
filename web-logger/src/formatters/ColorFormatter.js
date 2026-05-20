import { Formatter } from '../core/Formatter.js';

export class ColorFormatter extends Formatter {
  #colors;
  #bgColors;

  constructor(options = {}) {
    super(options);
    this.#colors = {
      reset: '\x1b[0m',
      trace: '\x1b[90m',
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      fatal: '\x1b[35m',
      ...options.colors
    };
    this.#bgColors = {
      trace: '\x1b[100m',
      debug: '\x1b[46m',
      info: '\x1b[42m',
      warn: '\x1b[43m',
      error: '\x1b[41m',
      fatal: '\x1b[45m',
      ...options.bgColors
    };
  }

  format(entry) {
    const colorKey = entry.levelName.toLowerCase();
    const color = this.#colors[colorKey] ?? this.#colors.reset;
    const reset = this.#colors.reset;

    const timestamp = entry.date.toISOString();
    const level = entry.levelName.padEnd(5);
    const message = entry.message;

    let output = `${color}[${timestamp}] [${level}] ${message}${reset}`;

    if (entry.data !== null) {
      output += `\n${color}  Data: ${this.#formatData(entry.data)}${reset}`;
    }

    if (Object.keys(entry.context).length > 0) {
      output += `\n${color}  Context: ${this.#formatData(entry.context)}${reset}`;
    }

    return output;
  }

  #formatData(data) {
    if (data === null) return '';
    if (typeof data === 'object') {
      try {
        return JSON.stringify(data, null, 2);
      } catch {
        return '[Circular]';
      }
    }
    return String(data);
  }

  static getColorCode(name) {
    const codes = {
      black: '\x1b[30m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',
      reset: '\x1b[0m'
    };
    return codes[name] ?? codes.reset;
  }
}
