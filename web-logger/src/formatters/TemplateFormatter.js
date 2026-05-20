import { Formatter } from '../core/Formatter.js';

export class TemplateFormatter extends Formatter {
  #template;
  #partials = {};

  constructor(options = {}) {
    super(options);
    this.#template = options.template ?? '{timestamp} [{level}] {message}';
    this.#partials = options.partials ?? {};
  }

  get template() {
    return this.#template;
  }

  set template(value) {
    this.#template = value;
  }

  addPartial(name, template) {
    this.#partials[name] = template;
    return this;
  }

  removePartial(name) {
    delete this.#partials[name];
    return this;
  }

  format(entry) {
    let result = this.#template;

    const tokens = {
      '{id}': entry.id,
      '{timestamp}': entry.date.toISOString(),
      '{level}': entry.levelName,
      '{message}': entry.message,
      '{data}': this.#formatValue(entry.data),
      '{context}': this.#formatValue(entry.context),
      '{date}': entry.date.toLocaleDateString(),
      '{time}': entry.date.toLocaleTimeString(),
      '{ms}': entry.timestamp.toString()
    };

    for (const [token, value] of Object.entries(tokens)) {
      result = result.replaceAll(token, value);
    }

    for (const [name, template] of Object.entries(this.#partials)) {
      const partialToken = `{>${name}}`;
      if (result.includes(partialToken)) {
        const partialFormatter = new TemplateFormatter({ template });
        result = result.replace(partialToken, partialFormatter.format(entry));
      }
    }

    return result;
  }

  #formatValue(value) {
    if (value === null) return '';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Circular]';
      }
    }
    return String(value);
  }
}
