import { Formatter } from '../core/Formatter.js';

export class CsvFormatter extends Formatter {
  #delimiter;
  #includeHeader;
  #includeData;
  #includeContext;
  #headerWritten = false;

  constructor(options = {}) {
    super(options);
    this.#delimiter = options.delimiter ?? ',';
    this.#includeHeader = options.includeHeader ?? false;
    this.#includeData = options.includeData ?? false;
    this.#includeContext = options.includeContext ?? false;
  }

  get delimiter() {
    return this.#delimiter;
  }

  set delimiter(value) {
    this.#delimiter = value;
  }

  format(entry) {
    if (this.#includeHeader && !this.#headerWritten) {
      this.#headerWritten = true;
      return this.#formatHeader();
    }

    return this.#formatRow(entry);
  }

  #formatHeader() {
    const headers = ['timestamp', 'level', 'message'];
    if (this.#includeData) headers.push('data');
    if (this.#includeContext) headers.push('context');
    return headers.join(this.#delimiter);
  }

  #formatRow(entry) {
    const values = [
      this.#escape(entry.date.toISOString()),
      this.#escape(entry.levelName),
      this.#escape(entry.message)
    ];

    if (this.#includeData) {
      values.push(this.#escape(this.#formatData(entry.data)));
    }

    if (this.#includeContext) {
      values.push(this.#escape(this.#formatData(entry.context)));
    }

    return values.join(this.#delimiter);
  }

  #escape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(this.#delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  #formatData(data) {
    if (data === null) return '';
    if (typeof data === 'object') {
      try {
        return JSON.stringify(data);
      } catch {
        return '[Circular]';
      }
    }
    return String(data);
  }

  reset() {
    this.#headerWritten = false;
    return this;
  }
}
