import { Logger } from './core/Logger.js';
import { ConsoleTransport } from './transports/ConsoleTransport.js';
import { MemoryTransport } from './transports/MemoryTransport.js';
import { FetchTransport } from './transports/FetchTransport.js';
import { LogLevel, parseLogLevel } from './core/LogLevel.js';

/**
 * Creates a logger with configurable options.
 * @param {import('./types.ts').CreateLoggerOptions} options - Logger configuration options.
 * @returns {import('./types.ts').Logger} A configured Logger instance.
 */
export function createLogger(options = {}) {
  const level = typeof options.level === 'string'
    ? parseLogLevel(options.level)
    : (options.level ?? LogLevel.INFO);

  const logger = new Logger({
    level,
    context: options.context ?? {},
    onError: options.onError
  });

  if (options.transports) {
    for (const transport of options.transports) {
      logger.addTransport(transport);
    }
  } else if (options.console !== false) {
    const consoleTransport = new ConsoleTransport({
      colors: options.colors ?? true,
      timestamps: options.timestamps ?? true
    });

    if (options.formatter) {
      consoleTransport.formatter = options.formatter;
    }

    logger.addTransport(consoleTransport);
  }

  return logger;
}

/**
 * Creates a logger with console transport only.
 * @param {import('./types.ts').CreateLoggerOptions} options - Logger configuration options.
 * @returns {import('./types.ts').Logger} A Logger instance with console transport.
 */
export function createConsoleLogger(options = {}) {
  return createLogger({
    ...options,
    console: true
  });
}

/**
 * Creates a logger with memory transport only.
 * @param {object} options - Logger configuration options.
 * @param {import('./types.ts').LogLevelValue} [options.level] - Log level.
 * @param {import('./types.ts').LogEntryContext} [options.context] - Initial context.
 * @param {number} [options.maxSize=1000] - Maximum number of entries to store.
 * @returns {import('./types.ts').Logger} A Logger instance with memory transport.
 */
export function createMemoryLogger(options = {}) {
  const logger = new Logger({
    level: options.level ?? LogLevel.INFO,
    context: options.context ?? {},
    onError: options.onError
  });

  logger.addTransport(new MemoryTransport({
    maxSize: options.maxSize ?? 1000
  }));

  return logger;
}

/**
 * Creates a logger with fetch transport for remote logging.
 * @param {object} options - Logger configuration options.
 * @param {string} options.url - The URL to send log entries to.
 * @param {import('./types.ts').LogLevelValue} [options.level] - Log level.
 * @param {import('./types.ts').LogEntryContext} [options.context] - Initial context.
 * @param {Record<string, string>} [options.headers] - Additional HTTP headers.
 * @param {number} [options.batchSize=10] - Number of entries to batch before sending.
 * @param {number} [options.flushInterval=5000] - Interval in ms to flush the queue.
 * @param {number} [options.retries=3] - Number of retry attempts on failure.
 * @param {number} [options.retryDelay=1000] - Base delay between retries in ms.
 * @returns {import('./types.ts').Logger} A Logger instance with fetch transport.
 */
export function createFetchLogger(options = {}) {
  const logger = new Logger({
    level: options.level ?? LogLevel.INFO,
    context: options.context ?? {},
    onError: options.onError
  });

  logger.addTransport(new FetchTransport({
    url: options.url,
    headers: options.headers,
    batchSize: options.batchSize ?? 10,
    flushInterval: options.flushInterval ?? 5000,
    retries: options.retries ?? 3,
    retryDelay: options.retryDelay ?? 1000
  }));

  return logger;
}

/**
 * Creates a logger with multiple transports.
 * @param {object} options - Logger configuration options.
 * @param {import('./types.ts').LogLevelValue} [options.level] - Log level.
 * @param {import('./types.ts').LogEntryContext} [options.context] - Initial context.
 * @param {boolean} [options.console=true] - Include console transport.
 * @param {boolean} [options.colors=true] - Enable console colors.
 * @param {boolean} [options.timestamps=true] - Include timestamps in console output.
 * @param {boolean} [options.memory] - Include memory transport.
 * @param {number} [options.memorySize=1000] - Maximum entries for memory transport.
 * @param {object} [options.fetch] - Fetch transport options.
 * @param {string} [options.fetch.url] - URL for fetch transport.
 * @param {number} [options.fetch.batchSize=10] - Batch size for fetch transport.
 * @param {number} [options.fetch.flushInterval=5000] - Flush interval for fetch transport.
 * @returns {import('./types.ts').Logger} A Logger instance with multiple transports.
 */
export function createMultiLogger(options = {}) {
  const logger = new Logger({
    level: options.level ?? LogLevel.INFO,
    context: options.context ?? {},
    onError: options.onError
  });

  const transports = [];

  if (options.console !== false) {
    transports.push(new ConsoleTransport({
      colors: options.colors ?? true,
      timestamps: options.timestamps ?? true
    }));
  }

  if (options.memory) {
    transports.push(new MemoryTransport({
      maxSize: options.memorySize ?? 1000
    }));
  }

  if (options.fetch) {
    transports.push(new FetchTransport({
      url: options.fetch.url,
      batchSize: options.fetch.batchSize ?? 10,
      flushInterval: options.fetch.flushInterval ?? 5000
    }));
  }

  for (const transport of transports) {
    logger.addTransport(transport);
  }

  return logger;
}
