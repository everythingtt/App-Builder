import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger, LogLevel, LogEntry, Emitter } from '../src/core/index.js';

describe('LogLevel', () => {
  it('should have correct level values', () => {
    expect(LogLevel.TRACE).toBe(0);
    expect(LogLevel.DEBUG).toBe(1);
    expect(LogLevel.INFO).toBe(2);
    expect(LogLevel.WARN).toBe(3);
    expect(LogLevel.ERROR).toBe(4);
    expect(LogLevel.FATAL).toBe(5);
    expect(LogLevel.SILENT).toBe(6);
  });
});

describe('LogEntry', () => {
  it('should create entry with all properties', () => {
    const entry = new LogEntry({
      level: LogLevel.INFO,
      message: 'Test message',
      data: { foo: 'bar' },
      context: { app: 'test' },
      timestamp: 1234567890
    });

    expect(entry.level).toBe(LogLevel.INFO);
    expect(entry.levelName).toBe('INFO');
    expect(entry.message).toBe('Test message');
    expect(entry.data).toEqual({ foo: 'bar' });
    expect(entry.context).toEqual({ app: 'test' });
    expect(entry.timestamp).toBe(1234567890);
    expect(entry.id).toBeDefined();
  });

  it('should generate unique IDs', () => {
    const entry1 = new LogEntry({ level: LogLevel.INFO, message: 'Test', timestamp: 1 });
    const entry2 = new LogEntry({ level: LogLevel.INFO, message: 'Test', timestamp: 2 });

    expect(entry1.id).not.toBe(entry2.id);
  });

  it('should clone with overrides', () => {
    const entry = new LogEntry({
      level: LogLevel.INFO,
      message: 'Original',
      data: { a: 1 },
      context: { x: 'y' },
      timestamp: 1000
    });

    const cloned = entry.clone({ message: 'Modified', data: { b: 2 } });

    expect(cloned.message).toBe('Modified');
    expect(cloned.data).toEqual({ b: 2 });
    expect(cloned.level).toBe(LogLevel.INFO);
    expect(cloned.context).toEqual({ x: 'y' });
  });

  it('should serialize to JSON', () => {
    const entry = new LogEntry({
      level: LogLevel.WARN,
      message: 'Warning',
      timestamp: 1234567890
    });

    const json = entry.toJSON();

    expect(json.level).toBe(LogLevel.WARN);
    expect(json.levelName).toBe('WARN');
    expect(json.message).toBe('Warning');
    expect(json.date).toBeDefined();
  });
});

describe('Emitter', () => {
  it('should register and emit events', () => {
    const emitter = new Emitter();
    const handler = vi.fn();

    emitter.on('test', handler);
    emitter.emit('test', 'arg1', 'arg2');

    expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should support multiple handlers', () => {
    const emitter = new Emitter();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    emitter.on('test', handler1);
    emitter.on('test', handler2);
    emitter.emit('test');

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should remove handlers with off()', () => {
    const emitter = new Emitter();
    const handler = vi.fn();

    emitter.on('test', handler);
    emitter.off('test', handler);
    emitter.emit('test');

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle once() correctly', () => {
    const emitter = new Emitter();
    const handler = vi.fn();

    emitter.once('test', handler);
    emitter.emit('test');
    emitter.emit('test');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should report listener count', () => {
    const emitter = new Emitter();

    emitter.on('test', () => {});
    emitter.on('test', () => {});

    expect(emitter.listenerCount('test')).toBe(2);
  });

  it('should remove all listeners', () => {
    const emitter = new Emitter();

    emitter.on('test1', () => {});
    emitter.on('test2', () => {});
    emitter.removeAllListeners();

    expect(emitter.listenerCount('test1')).toBe(0);
    expect(emitter.listenerCount('test2')).toBe(0);
  });
});

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger({ level: LogLevel.DEBUG });
  });

  it('should create logger with default options', () => {
    const defaultLogger = new Logger();
    expect(defaultLogger.level).toBe(LogLevel.INFO);
    expect(defaultLogger.context).toEqual({});
  });

  it('should create logger with custom options', () => {
    expect(logger.level).toBe(LogLevel.DEBUG);
  });

  it('should add and remove transports', () => {
    const transport = { write: vi.fn() };

    logger.addTransport(transport);
    expect(logger.transports).toContain(transport);

    logger.removeTransport(transport);
    expect(logger.transports).not.toContain(transport);
  });

  it('should set and merge context', () => {
    logger.setContext({ app: 'test' });
    expect(logger.context.app).toBe('test');

    logger.mergeContext({ version: '1.0' });
    expect(logger.context.app).toBe('test');
    expect(logger.context.version).toBe('1.0');
  });

  it('should respect log level filtering', () => {
    const transport = { write: vi.fn() };
    logger.addTransport(transport);

    logger.trace('trace message');
    expect(transport.write).not.toHaveBeenCalled();

    logger.debug('debug message');
    expect(transport.write).toHaveBeenCalledTimes(1);

    logger.info('info message');
    expect(transport.write).toHaveBeenCalledTimes(2);
  });

  it('should emit log events', () => {
    const handler = vi.fn();
    logger.on('log', handler);

    logger.info('test message');

    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toBeInstanceOf(LogEntry);
  });

  it('should emit error events on transport failure', () => {
    const errorHandler = vi.fn();
    const transport = {
      write: () => { throw new Error('Transport error'); }
    };

    logger.addTransport(transport);
    logger.on('error', errorHandler);

    logger.info('test');

    expect(errorHandler).toHaveBeenCalledWith(new Error('Transport error'));
  });

  it('should create child logger with inherited context', () => {
    logger.setContext({ app: 'parent' });
    const child = logger.createChild({ requestId: '123' });

    expect(child.context.app).toBe('parent');
    expect(child.context.requestId).toBe('123');
    expect(child.parent).toBe(logger);
  });

  it('should create child logger with transport inheritance by default', () => {
    const transport = { write: vi.fn() };
    logger.addTransport(transport);

    const child = logger.createChild({ requestId: '123' });
    child.info('child message');

    expect(transport.write).toHaveBeenCalled();
  });

  it('should create child logger without transport inheritance when disabled', () => {
    const transport = { write: vi.fn() };
    logger.addTransport(transport);

    const child = logger.createChild({ requestId: '123' }, { inheritTransports: false });
    child.info('child message');

    expect(transport.write).not.toHaveBeenCalled();
  });

  it('should allow child to have own transports', () => {
    const parentTransport = { write: vi.fn() };
    const childTransport = { write: vi.fn() };

    logger.addTransport(parentTransport);
    const child = logger.createChild({});
    child.addTransport(childTransport);

    child.info('test');

    expect(parentTransport.write).toHaveBeenCalled();
    expect(childTransport.write).toHaveBeenCalled();
  });

  it('should detach child from parent', () => {
    const parentTransport = { write: vi.fn() };
    logger.addTransport(parentTransport);

    const child = logger.createChild({});
    child.detach();

    expect(child.parent).toBeNull();
    expect(child.inheritTransports).toBe(false);

    child.info('detached message');
    expect(parentTransport.write).toHaveBeenCalled();
  });

  it('should flush all transports', async () => {
    const transport = { write: vi.fn(), flush: vi.fn() };
    logger.addTransport(transport);

    logger.info('test');
    await logger.flush();

    expect(transport.flush).toHaveBeenCalled();
  });

  it('should close all transports', async () => {
    const transport = { write: vi.fn(), close: vi.fn() };
    logger.addTransport(transport);

    await logger.close();

    expect(transport.close).toHaveBeenCalled();
  });

  it('should support chaining', () => {
    const result = logger
      .setContext({ a: 1 })
      .mergeContext({ b: 2 })
      .addTransport({ write: vi.fn() });

    expect(result).toBe(logger);
  });
});
