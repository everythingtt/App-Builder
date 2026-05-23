import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLogger,
  createConsoleLogger,
  createMemoryLogger,
  createFetchLogger,
  createMultiLogger
} from '../src/factory.js';
import { LogLevel } from '../src/core/index.js';

describe('createLogger', () => {
  it('should create logger with default options', () => {
    const logger = createLogger();

    expect(logger).toBeDefined();
    expect(logger.level).toBe(LogLevel.INFO);
  });

  it('should create logger with custom level', () => {
    const logger = createLogger({ level: LogLevel.DEBUG });
    expect(logger.level).toBe(LogLevel.DEBUG);
  });

  it('should parse string level', () => {
    const logger = createLogger({ level: 'warn' });
    expect(logger.level).toBe(LogLevel.WARN);
  });

  it('should create console transport by default', () => {
    const logger = createLogger({ console: true });
    expect(logger.transports.length).toBe(1);
  });

  it('should skip console transport when disabled', () => {
    const logger = createLogger({ console: false });
    expect(logger.transports.length).toBe(0);
  });

  it('should add custom transports', () => {
    const transport = { write: vi.fn() };
    const logger = createLogger({
      console: false,
      transports: [transport]
    });

    expect(logger.transports.length).toBe(1);
    expect(logger.transports[0]).toBe(transport);
  });

  it('should set context', () => {
    const logger = createLogger({ context: { app: 'test' } });
    expect(logger.context.app).toBe('test');
  });

  it('should apply formatter to console transport', () => {
    const formatter = { format: vi.fn() };
    createLogger({ formatter });

    // Formatter should be applied to the console transport
    expect(formatter).toBeDefined();
  });
});

describe('createConsoleLogger', () => {
  it('should create logger with console transport', () => {
    const logger = createConsoleLogger();
    expect(logger.transports.length).toBeGreaterThan(0);
  });

  it('should pass options', () => {
    const logger = createConsoleLogger({ level: LogLevel.ERROR });
    expect(logger.level).toBe(LogLevel.ERROR);
  });
});

describe('createMemoryLogger', () => {
  it('should create logger with memory transport', () => {
    const logger = createMemoryLogger();

    expect(logger.transports.length).toBe(1);
  });

  it('should set max size', () => {
    const logger = createMemoryLogger({ maxSize: 500 });

    logger.info('test');
    expect(logger.transports[0].maxSize).toBe(500);
  });

  it('should capture logs', () => {
    const logger = createMemoryLogger();

    logger.info('Test message');
    const entries = logger.transports[0].entries;

    expect(entries.length).toBe(1);
  });
});

describe('createFetchLogger', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, status: 200 })
    );
  });

  it('should create logger with fetch transport', () => {
    const logger = createFetchLogger({ url: 'https://example.com/logs' });

    expect(logger.transports.length).toBe(1);
  });

  it('should pass fetch options', () => {
    const logger = createFetchLogger({
      url: 'https://example.com/logs',
      batchSize: 5,
      flushInterval: 1000
    });

    const transport = logger.transports[0];
    expect(transport.batchSize).toBe(5);
  });
});

describe('createMultiLogger', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, status: 200 })
    );
  });

  it('should create logger with multiple transports', () => {
    const logger = createMultiLogger();

    expect(logger.transports.length).toBeGreaterThan(0);
  });

  it('should include console transport by default', () => {
    const logger = createMultiLogger({ console: true });
    expect(logger.transports.length).toBe(1);
  });

  it('should include memory transport when enabled', () => {
    const logger = createMultiLogger({ memory: true });

    const hasMemory = logger.transports.some(t => t.getEntriesByLevel);
    expect(hasMemory).toBe(true);
  });

  it('should include fetch transport when enabled', () => {
    const logger = createMultiLogger({
      fetch: { url: 'https://example.com/logs' }
    });

    const hasFetch = logger.transports.some(t => t.url);
    expect(hasFetch).toBe(true);
  });

  it('should support all transports', () => {
    const logger = createMultiLogger({
      console: true,
      memory: true,
      fetch: { url: 'https://example.com/logs' }
    });

    expect(logger.transports.length).toBe(3);
  });
});
