export class Formatter {
  #options;

  constructor(options = {}) {
    this.#options = options;
  }

  get options() {
    return { ...this.#options };
  }

  format(entry) {
    throw new Error('Formatter.format() must be implemented by subclass');
  }

  clone(overrides = {}) {
    return new this.constructor({ ...this.#options, ...overrides });
  }
}
