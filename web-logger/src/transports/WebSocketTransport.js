import { Transport } from '../core/Transport.js';

/**
 * Transport that sends log entries via WebSocket.
 * @example
 * const transport = new WebSocketTransport({
 *   url: 'wss://logs.example.com',
 *   reconnectInterval: 5000,
 *   maxReconnects: 10
 * });
 */
export class WebSocketTransport extends Transport {
  #url;
  #socket = null;
  #queue = [];
  #connected = false;
  #reconnectInterval;
  #maxReconnects;
  #reconnectCount = 0;
  #protocols;

  /**
   * Creates a new WebSocketTransport instance.
   * @param {object} options - Transport options.
   * @param {string} options.url - WebSocket URL.
   * @param {string[]} [options.protocols] - WebSocket protocols.
   * @param {number} [options.reconnectInterval=5000] - Reconnect interval in ms.
   * @param {number} [options.maxReconnects=10] - Maximum reconnect attempts.
   */
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

  /**
   * Establishes WebSocket connection.
   * @private
   */
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
    } catch (error) {
      this.#handleConnectionError(error);
      this.#attemptReconnect();
    }
  }

  /**
   * Handles connection errors.
   * @param {Error} error - The connection error.
   * @private
   */
  #handleConnectionError(error) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[WebSocketTransport] Connection error:', error);
    }
  }

  /**
   * Attempts to reconnect.
   * @private
   */
  #attemptReconnect() {
    if (this.#reconnectCount >= this.#maxReconnects) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[WebSocketTransport] Max reconnects reached');
      }
      return;
    }
    this.#reconnectCount++;
    setTimeout(() => this.#connect(), this.#reconnectInterval);
  }

  /**
   * Writes an entry to the WebSocket.
   * @param {object} entry - The log entry to write.
   */
  write(entry) {
    if (!this.shouldWrite(entry)) return;
    const formatted = this.format(entry);

    if (this.#connected) {
      this.#send(formatted);
    } else {
      this.#queue.push(formatted);
    }
  }

  /**
   * Sends data through the WebSocket.
   * @param {*} data - Data to send.
   * @private
   */
  #send(data) {
    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.#socket.send(payload);
    } catch (error) {
      this.#queue.push(data);
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[WebSocketTransport] Send failed, queuing data:', error);
      }
    }
  }

  /**
   * Flushes the queued messages.
   * @private
   */
  #flushQueue() {
    while (this.#queue.length > 0 && this.#connected) {
      const data = this.#queue.shift();
      this.#send(data);
    }
  }

  /**
   * Flushes the transport.
   * @returns {Promise<void>}
   */
  async flush() {
    this.#flushQueue();
    return Promise.resolve();
  }

  /**
   * Closes the WebSocket connection.
   * @returns {Promise<void>}
   */
  async close() {
    if (this.#socket) {
      try {
        this.#socket.close();
      } catch (error) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[WebSocketTransport] Error closing socket:', error);
        }
      }
      this.#socket = null;
    }
    this.#connected = false;
    this.#queue = [];
  }
}
