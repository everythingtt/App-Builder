import { Transport } from '../core/Transport.js';

export class DOMTransport extends Transport {
  #container;
  #maxEntries;
  #entries = [];
  #entryClass;
  #autoScroll;

  constructor(options = {}) {
    super(options);
    this.#container = options.container ?? null;
    this.#maxEntries = options.maxEntries ?? 100;
    this.#entryClass = options.entryClass ?? 'log-entry';
    this.#autoScroll = options.autoScroll ?? true;
  }

  get container() {
    return this.#container;
  }

  set container(value) {
    this.#container = value;
  }

  get maxEntries() {
    return this.#maxEntries;
  }

  set maxEntries(value) {
    this.#maxEntries = value;
    this.#trimDOM();
  }

  write(entry) {
    if (!this.shouldWrite(entry)) return;

    const formatted = this.format(entry);
    this.#entries.push(formatted);
    this.#renderEntry(entry, formatted);
    this.#trimDOM();
  }

  #renderEntry(entry, formatted) {
    if (!this.#container) return;

    const el = document.createElement('div');
    el.className = `${this.#entryClass} ${this.#entryClass}--${entry.levelName.toLowerCase()}`;
    el.dataset.level = entry.level;
    el.dataset.timestamp = entry.timestamp;

    if (typeof formatted === 'string') {
      el.textContent = formatted;
    } else {
      el.appendChild(this.#createStructuredElement(formatted));
    }

    this.#container.appendChild(el);

    if (this.#autoScroll) {
      this.#container.scrollTop = this.#container.scrollHeight;
    }
  }

  #createStructuredElement(data) {
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(data, null, 2);
    return pre;
  }

  #trimDOM() {
    if (!this.#container) return;

    while (this.#container.children.length > this.#maxEntries) {
      this.#container.removeChild(this.#container.firstChild);
    }

    while (this.#entries.length > this.#maxEntries) {
      this.#entries.shift();
    }
  }

  clear() {
    this.#entries = [];
    if (this.#container) {
      this.#container.innerHTML = '';
    }
    return this;
  }

  getEntries() {
    return [...this.#entries];
  }

  flush() {
    return Promise.resolve();
  }
}
