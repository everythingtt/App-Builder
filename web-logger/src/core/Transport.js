export class Transport {
  #formatter;
  #level;

  constructor(options = {}) {
    this.#formatter = options.formatter ?? null;
    this.#level = options.level ?? 0;
  }

  get formatter() {
    return this.#formatter;
  }

  set formatter(value) {
    this.#formatter = value;
  }

  get level() {
    return this.#level;
  }

  set level(value) {
    this.#level = value;
  }

  shouldWrite(entry) {
    return entry.level >= this.#level;
  }

  format(entry) {
    if (this.#formatter) {
      return this.#formatter.format(entry);
    }
    return entry;
  }

  write(entry) {
    throw new Error('Transport.write() must be implemented by subclass');
  }

  flush() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}
