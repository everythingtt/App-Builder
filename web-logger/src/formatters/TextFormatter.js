import { Formatter } from '../core/Formatter.js';

export class TextFormatter extends Formatter {
  #template;
  #includeData;
  #includeContext;
  #separator;

  constructor(options = {}) {
    super(options);
    this.#template = options.template ?? null;
    this.#includeData = options.includeData ?? true;
    this.#includeContext = options.includeContext ?? false;
    this.#separator = options.separator ?? ' | ';
  }

  get template() {
    return this.#template;
  }

  set template(value) {
    this.#template = value;
  }

  format(entry) {
    if (this.#template) {
      return this.#applyTemplate(entry);
    }

    return this.#formatDefault(entry);
  }

  #applyTemplate(entry) {
    return this.#template
      .replace('{timestamp}', entry.date.toISOString())
      .replace('{level}', entry.levelName)
      .replace('{message}', entry.message)
      .replace('{data}', this.#formatData(entry.data))
      .replace('{context}', this.#formatData(entry.context));
  }

  #formatDefault(entry) {
    const parts = [
      entry.date.toISOString(),
      `[${entry.levelName}]`,
      entry.message
    ];

    if (this.#includeData && entry.data !== null) {
      parts.push(this.#formatData(entry.data));
    }

    if (this.#includeContext && Object.keys(entry.context).length > 0) {
      parts.push(this.#formatData(entry.context));
    }

    return parts.join(this.#separator);
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
}
