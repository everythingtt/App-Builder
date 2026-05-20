export class Emitter {
  #listeners = new Map();

  on(event, handler) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(handler);
    return this;
  }

  off(event, handler) {
    const handlers = this.#listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.#listeners.delete(event);
      }
    }
    return this;
  }

  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  emit(event, ...args) {
    const handlers = this.#listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
    return this;
  }

  listenerCount(event) {
    return this.#listeners.get(event)?.size ?? 0;
  }

  removeAllListeners(event) {
    if (event) {
      this.#listeners.delete(event);
    } else {
      this.#listeners.clear();
    }
    return this;
  }
}
