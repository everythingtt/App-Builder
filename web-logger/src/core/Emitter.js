/**
 * Simple event emitter implementation.
 * @example
 * const emitter = new Emitter();
 * emitter.on('log', (entry) => console.log(entry));
 * emitter.emit('log', { message: 'Hello' });
 */
export class Emitter {
  #listeners = new Map();

  /**
   * Registers an event listener.
   * @param {string} event - The event name.
   * @param {Function} handler - The event handler.
   * @returns {Emitter} This emitter instance for chaining.
   */
  on(event, handler) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(handler);
    return this;
  }

  /**
   * Removes an event listener.
   * @param {string} event - The event name.
   * @param {Function} handler - The handler to remove.
   * @returns {Emitter} This emitter instance for chaining.
   */
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

  /**
   * Registers a one-time event listener.
   * @param {string} event - The event name.
   * @param {Function} handler - The event handler.
   * @returns {Emitter} This emitter instance for chaining.
   */
  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  /**
   * Emits an event.
   * @param {string} event - The event name.
   * @param {...*} args - Arguments to pass to handlers.
   * @returns {Emitter} This emitter instance for chaining.
   */
  emit(event, ...args) {
    const handlers = this.#listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
    return this;
  }

  /**
   * Gets the number of listeners for an event.
   * @param {string} event - The event name.
   * @returns {number} The number of listeners.
   */
  listenerCount(event) {
    return this.#listeners.get(event)?.size ?? 0;
  }

  /**
   * Removes all listeners.
   * @param {string} [event] - Optional event name. If not provided, removes all listeners for all events.
   * @returns {Emitter} This emitter instance for chaining.
   */
  removeAllListeners(event) {
    if (event) {
      this.#listeners.delete(event);
    } else {
      this.#listeners.clear();
    }
    return this;
  }
}
