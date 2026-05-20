import { Transport } from '../core/Transport.js';

export class WebSocketTransport extends Transport {
  #url;
  #socket = null;
  #queue = [];
  #connected = false;
  #reconnectInterval;
  #maxReconnects;
  #reconnectCount = 0;
  #protocols;

  constructor(options = {}) {
    super(options);
    this.#url = options.url;
    this.#protocols = options.protocols ?? [];
    this.#reconnectInterval = options.reconnectInterval ?? 5000;
    this.#maxReconnects = options.maxReconnects ?? 10;
    this.#connect();
  }

  get url() {
    return this.#url;
  }

  get isConnected() {
    return this.#connected;
  }

  get queueSize() {
    return this.#queue.length;
  }

  #connect() {
    try {
      this.#socket = new WebSocket(this.#url, this.#protocols);
      this.#socket.onopen = () => {
        this.#connected = true;
        this.#reconnectCount = 0;
        this.#flushQueue();
      };
      this.#socket.onclose = () => {
        this.#connected = false;
        this.#attemptReconnect();
      };
      this.#socket.onerror = () => {
        this.#connected = false;
      };
    } catch {
      this.#attemptReconnect();
    }
  }

  #attemptReconnect() {
    if (this.#reconnectCount >= this.#maxReconnects) return;
    this.#reconnectCount++;
    setTimeout(() => this.#connect(), this.#reconnectInterval);
  }

  write(entry) {
    if (!this.shouldWrite(entry)) return;
    const formatted = this.format(entry);

    if (this.#connected) {
      this.#send(formatted);
    } else {
      this.#queue.push(formatted);
    }
  }

  #send(data) {
    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.#socket.send(payload);
    } catch {
      this.#queue.push(data);
    }
  }

  #flushQueue() {
    while (this.#queue.length > 0 && this.#connected) {
      const data = this.#queue.shift();
      this.#send(data);
    }
  }

  async flush() {
    this.#flushQueue();
    return Promise.resolve();
  }

  async close() {
    if (this.#socket) {
      this.#socket.close();
      this.#socket = null;
    }
    this.#connected = false;
    this.#queue = [];
  }
}
