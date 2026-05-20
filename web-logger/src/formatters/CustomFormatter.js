import { Formatter } from '../core/Formatter.js';

export class CustomFormatter extends Formatter {
  #transform;

  constructor(options = {}) {
    super(options);
    this.#transform = options.transform ?? ((entry) => entry);
  }

  get transform() {
    return this.#transform;
  }

  set transform(value) {
    this.#transform = value;
  }

  format(entry) {
    return this.#transform(entry);
  }

  static create(transform) {
    return new CustomFormatter({ transform });
  }
}
