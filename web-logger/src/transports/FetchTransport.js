import { Transport } from '../core/Transport.js';

export class FetchTransport extends Transport {
  #url;
  #headers;
  #batchSize;
  #flushInterval;
  #queue = [];
  #timer = null;
  #retries;
  #retryDelay;

  constructor(options = {}) {
    super(options);
    this.#url = options.url;
    this.#headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    this.#batchSize = options.batchSize ?? 10;
    this.#flushInterval = options.flushInterval ?? 5000;
    this.#retries = options.retries ?? 3;
    this.#retryDelay = options.retryDelay ?? 1000;

    if (this.#flushInterval > 0) {
      this.#startTimer();
    }
  }

  get url() {
    return this.#url;
  }

  get queueSize() {
    return this.#queue.length;
  }

  write(entry) {
    if (!this.shouldWrite(entry)) return;
    this.#queue.push(this.format(entry));

    if (this.#queue.length >= this.#batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.#queue.length === 0) return;

    const batch =.splice(this.#queue, 0, this.#queue.length);
    await this.#sendWithRetry(batch);
  }

  async #sendWithRetry(batch, attempt = 0) {
    try {
      const response = await fetch(this.#url, {
        method: 'POST',
        headers: this.#headers,
        body: JSON.stringify(batch)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (attempt < this.#retries) {
        await this.#delay(this.#retryDelay * Math.pow(2, attempt));
        return this.#sendWithRetry(batch, attempt + 1);
      }
      throw error;
    }
  }

  #delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  #startTimer() {
    this.#timer = setInterval(() => this.flush(), this.#flushInterval);
  }

  #stopTimer() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  async close() {
    this.#stopTimer();
    await this.flush();
  }
}
