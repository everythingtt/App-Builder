import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogLevel, LogEntry } from '../src/core/index.js';
import {
  ConsoleTransport,
  MemoryTransport,
  FetchTransport,
  LocalStorageTransport,
  DOMTransport,
  WebSocketTransport,
  MultiTransport
} from '../src/transports/index.js';

const createEntry = (level = LogLevel.INFO, message = 'Test') =>
  new LogEntry({ level, message, data: null, context: {}, timestamp: Date.now() });

describe('ConsoleTransport', () => {
  it('should write to console', () => {
    const transport = new ConsoleTransport({ colors: false });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    transport.write(createEntry());

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should respect log level', () => {
    const transport = new ConsoleTransport({ level: LogLevel.WARN });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    transport.write(createEntry(LogLevel.DEBUG));
    expect(consoleSpy).not.toHaveBeenCalled();

    transport.write(createEntry(LogLevel.ERROR));
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should support colors option', () => {
    const transport = new ConsoleTransport({ colors: true });
    expect(transport.colors).toBe(true);

    transport.colors = false;
    expect(transport.colors).toBe(false);
  });

  it('should support timestamps option', () => {
    const transport = new ConsoleTransport({ timestamps: true });
    expect(transport.timestamps).toBe(true);

    transport.timestamps = false;
    expect(transport.timestamps).toBe(false);
  });
});

describe('MemoryTransport', () => {
  let transport;

  beforeEach(() => {
    transport = new MemoryTransport({ maxSize: 5 });
  });

  it('should store entries', () => {
    transport.write(createEntry());
    expect(transport.size).toBe(1);
  });

  it('should return copy of entries', () => {
    transport.write(createEntry());
    const entries = transport.entries;
    entries.push('modified');

    expect(transport.size).toBe(1);
  });

  it('should respect max size', () => {
    for (let i = 0; i < 10; i++) {
      transport.write(createEntry(LogLevel.INFO, `Message ${i}`));
    }

    expect(transport.size).toBe(5);
  });

  it('should clear entries', () => {
    transport.write(createEntry());
    transport.clear();

    expect(transport.size).toBe(0);
  });

  it('should filter entries by level', () => {
    transport.write(createEntry(LogLevel.ERROR, 'Error 1'));
    transport.write(createEntry(LogLevel.INFO, 'Info 1'));
    transport.write(createEntry(LogLevel.ERROR, 'Error 2'));

    const errors = transport.getEntriesByLevel(LogLevel.ERROR);
    expect(errors.length).toBe(2);
  });

  it('should filter entries by timestamp', () => {
    const now = Date.now();
    transport.write(createEntry(LogLevel.INFO, 'Old'));
    transport.write(createEntry(LogLevel.INFO, 'New'));

    const recent = transport.getEntriesSince(now);
    expect(recent.length).toBeGreaterThanOrEqual(1);
  });

  it('should search entries', () => {
    transport.write(createEntry(LogLevel.INFO, 'Hello world'));
    transport.write(createEntry(LogLevel.Info, 'Goodbye'));

    const results = transport.search('hello');
    expect(results.length).toBe(1);
  });

  it('should trim when max size changes', () => {
    for (let i = 0; i < 5; i++) {
      transport.write(createEntry());
    }

    transport.maxSize = 3;
    expect(transport.size).toBe(3);
  });
});

describe('FetchTransport', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, statusText: 'OK' })
    );
  });

  it('should queue entries', () => {
    const transport = new FetchTransport({
      url: 'https://example.com/logs',
      batchSize: 5
    });

    transport.write(createEntry());
    expect(transport.queueSize).toBe(1);
  });

  it('should flush when batch size reached', async () => {
    const transport = new FetchTransport({
      url: 'https://example.com/logs',
      batchSize: 2
    });

    transport.write(createEntry());
    expect(transport.queueSize).toBe(1);

    transport.write(createEntry());
    expect(transport.queueSize).toBe(0);
    expect(fetch).toHaveBeenCalled();
  });

  it('should flush manually', async () => {
    const transport = new FetchTransport({
      url: 'https://example.com/logs',
      batchSize: 10
    });

    transport.write(createEntry());
    await transport.flush();

    expect(fetch).toHaveBeenCalled();
    expect(transport.queueSize).toBe(0);
  });

  it('should retry on failure', async () => {
    let attempts = 0;
    global.fetch = vi.fn(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ ok: true, status: 200 });
    });

    const transport = new FetchTransport({
      url: 'https://example.com/logs',
      batchSize: 1,
      retries: 3,
      retryDelay: 10
    });

    transport.write(createEntry());
    await transport.flush();

    expect(attempts).toBe(3);
  });

  it('should throw after max retries', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    const transport = new FetchTransport({
      url: 'https://example.com/logs',
      batchSize: 1,
      retries: 2,
      retryDelay: 10
    });

    transport.write(createEntry());

    await expect(transport.flush()).rejects.toThrow('Network error');
  });
});

describe('LocalStorageTransport', () => {
  let mockStorage;

  beforeEach(() => {
    const store = {};
    mockStorage = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value; }),
      removeItem: vi.fn((key) => { delete store[key]; })
    };
  });

  it('should throw if no storage available', () => {
    expect(() => new LocalStorageTransport({ storage: null }))
      .toThrow('LocalStorageTransport requires localStorage');
  });

  it('should store entries', () => {
    const transport = new LocalStorageTransport({
      storage: mockStorage,
      storageKey: 'test-logs'
    });

    transport.write(createEntry());

    expect(mockStorage.setItem).toHaveBeenCalled();
  });

  it('should retrieve entries', () => {
    const transport = new LocalStorageTransport({
      storage: mockStorage,
      storageKey: 'test-logs'
    });

    transport.write(createEntry());
    const entries = transport.getEntries();

    expect(entries).toBeDefined();
  });

  it('should clear entries', () => {
    const transport = new LocalStorageTransport({
      storage: mockStorage,
      storageKey: 'test-logs'
    });

    transport.write(createEntry());
    transport.clear();

    expect(mockStorage.removeItem).toHaveBeenCalledWith('test-logs');
  });

  it('should respect max entries', () => {
    const transport = new LocalStorageTransport({
      storage: mockStorage,
      storageKey: 'test-logs',
      maxEntries: 3
    });

    for (let i = 0; i < 5; i++) {
      transport.write(createEntry(LogLevel.INFO, `Message ${i}`));
    }

    const entries = transport.getEntries();
    expect(entries.length).toBeLessThanOrEqual(3);
  });
});

describe('DOMTransport', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('should render entries to DOM', () => {
    const transport = new DOMTransport({ container, maxEntries: 10 });

    transport.write(createEntry());

    expect(container.children.length).toBe(1);
  });

  it('should respect max entries', () => {
    const transport = new DOMTransport({ container, maxEntries: 3 });

    for (let i = 0; i < 5; i++) {
      transport.write(createEntry());
    }

    expect(container.children.length).toBe(3);
  });

  it('should clear entries', () => {
    const transport = new DOMTransport({ container });

    transport.write(createEntry());
    transport.clear();

    expect(container.children.length).toBe(0);
  });

  it('should add level-specific CSS class', () => {
    const transport = new DOMTransport({ container });

    transport.write(createEntry(LogLevel.ERROR));

    const entry = container.firstChild;
    expect(entry.className).toContain('log-entry--error');
  });

  it('should handle null container gracefully', () => {
    const transport = new DOMTransport({ container: null });

    expect(() => transport.write(createEntry())).not.toThrow();
  });
});

describe('WebSocketTransport', () => {
  beforeEach(() => {
    global.WebSocket = vi.fn(() => ({
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onclose: null,
      onerror: null
    }));
  });

  it('should create WebSocket connection', () => {
    new WebSocketTransport({ url: 'ws://localhost:8080' });

    expect(WebSocket).toHaveBeenCalledWith('ws://localhost:8080', []);
  });

  it('should queue messages when disconnected', () => {
    const transport = new WebSocketTransport({ url: 'ws://localhost:8080' });

    transport.write(createEntry());

    expect(transport.queueSize).toBe(1);
    expect(transport.isConnected).toBe(false);
  });

  it('should send messages when connected', () => {
    const transport = new WebSocketTransport({ url: 'ws://localhost:8080' });
    const socket = WebSocket.mock.results[0].value;

    socket.onopen();
    transport.write(createEntry());

    expect(socket.send).toHaveBeenCalled();
  });

  it('should close connection', async () => {
    const transport = new WebSocketTransport({ url: 'ws://localhost:8080' });
    const socket = WebSocket.mock.results[0].value;

    await transport.close();

    expect(socket.close).toHaveBeenCalled();
  });
});

describe('MultiTransport', () => {
  it('should write to all transports', () => {
    const transport1 = { write: vi.fn() };
    const transport2 = { write: vi.fn() };
    const multi = new MultiTransport({ transports: [transport1, transport2] });

    multi.write(createEntry());

    expect(transport1.write).toHaveBeenCalled();
    expect(transport2.write).toHaveBeenCalled();
  });

  it('should add and remove transports', () => {
    const transport = { write: vi.fn() };
    const multi = new MultiTransport();

    multi.addTransport(transport);
    expect(multi.transports).toContain(transport);

    multi.removeTransport(transport);
    expect(multi.transports).not.toContain(transport);
  });

  it('should handle transport errors gracefully', () => {
    const transport1 = { write: () => { throw new Error('Error'); } };
    const transport2 = { write: vi.fn() };
    const multi = new MultiTransport({ transports: [transport1, transport2] });

    expect(() => multi.write(createEntry())).not.toThrow();
    expect(transport2.write).toHaveBeenCalled();
  });

  it('should flush all transports', async () => {
    const transport1 = { write: vi.fn(), flush: vi.fn() };
    const transport2 = { write: vi.fn(), flush: vi.fn() };
    const multi = new MultiTransport({ transports: [transport1, transport2] });

    await multi.flush();

    expect(transport1.flush).toHaveBeenCalled();
    expect(transport2.flush).toHaveBeenCalled();
  });

  it('should close all transports', async () => {
    const transport1 = { write: vi.fn(), close: vi.fn() };
    const transport2 = { write: vi.fn(), close: vi.fn() };
    const multi = new MultiTransport({ transports: [transport1, transport2] });

    await multi.close();

    expect(transport1.close).toHaveBeenCalled();
    expect(transport2.close).toHaveBeenCalled();
  });
});
