# Web Logger

A modern, vanilla, zero-third-party-dependency web logger library.

## Features

- Zero dependencies - pure JavaScript
- Multiple log levels (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
- Multiple transports (Console, Memory, Fetch, LocalStorage, DOM, WebSocket, Multiple)
- Flexible formatters (JSON, Text, Color, CSV, Custom, Template)
- Child loggers with context inheritance
- Event emitter pattern
- Isomorphic (works in browser, Node.js, Deno, Web Workers)

## Installation

```bash
npm install web-logger
```

## Quick Start

```javascript
import { createLogger } from 'web-logger';

const logger = createLogger({ level: 'DEBUG' });

logger.info('Application started');
logger.debug('Debug information', { userId: 123 });
logger.warn('Warning message');
logger.error('Error occurred', new Error('Something went wrong'));
```

## Core

### Logger

```javascript
import { Logger, LogLevel } from 'web-logger/core';

const logger = new Logger({
  level: LogLevel.DEBUG,
  context: { app: 'my-app' }
});

// Add transports
logger.addTransport(new ConsoleTransport());

// Log methods
logger.trace('Trace message');
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.fatal('Fatal message');

// Child logger with additional context
const childLogger = logger.createChild({ requestId: 'abc123' });
childLogger.info('Processing request'); // Includes both app and requestId

// Event handling
logger.on('log', (entry) => {
  console.log('Log entry:', entry);
});

// Cleanup
await logger.close();
```

## Transports

### ConsoleTransport

```javascript
import { ConsoleTransport } from 'web-logger/transports';

const transport = new ConsoleTransport({
  colors: true,
  timestamps: true
});
```

### MemoryTransport

```javascript
import { MemoryTransport } from 'web-logger/transports';

const transport = new MemoryTransport({
  maxSize: 1000
});

// Query entries
const entries = transport.entries;
const errors = transport.getEntriesByLevel(4); // ERROR level
const recent = transport.getEntriesSince(Date.now() - 60000);
const results = transport.search('error');
```

### FetchTransport

```javascript
import { FetchTransport } from 'web-logger/transports';

const transport = new FetchTransport({
  url: '/api/logs',
  batchSize: 10,
  flushInterval: 5000,
  headers: { 'Authorization': 'Bearer token' }
});
```

### LocalStorageTransport

```javascript
import { LocalStorageTransport } from 'web-logger/transports';

const transport = new LocalStorageTransport({
  storageKey: 'app-logs',
  maxEntries: 500
});

// Retrieve stored logs
const logs = transport.getEntries();
```

### DOMTransport

```javascript
import { DOMTransport } from 'web-logger/transports';

const container = document.getElementById('log-container');
const transport = new DOMTransport({
  container,
  maxEntries: 100,
  autoScroll: true
});
```

### WebSocketTransport

```javascript
import { WebSocketTransport } from 'web-logger/transports';

const transport = new WebSocketTransport({
  url: 'wss://logs.example.com',
  reconnectInterval: 5000,
  maxReconnects: 10
});
```

### MultiTransport

```javascript
import { MultiTransport, ConsoleTransport, FetchTransport } from 'web-logger/transports';

const transport = new MultiTransport({
  transports: [
    new ConsoleTransport(),
    new FetchTransport({ url: '/api/logs' })
  ]
});
```

## Formatters

### JsonFormatter

```javascript
import { JsonFormatter } from 'web-logger/formatters';

const formatter = new JsonFormatter({
  pretty: true,
  includeData: true,
  includeContext: true
});
```

### TextFormatter

```javascript
import { TextFormatter } from 'web-logger/formatters';

const formatter = new TextFormatter({
  template: '{timestamp} [{level}] {message}',
  includeData: true,
  separator: ' | '
});
```

### ColorFormatter

```javascript
import { ColorFormatter } from 'web-logger/formatters';

const formatter = new ColorFormatter();
```

### CsvFormatter

```javascript
import { CsvFormatter } from 'web-logger/formatters';

const formatter = new CsvFormatter({
  delimiter: ',',
  includeHeader: true,
  includeData: true
});
```

### CustomFormatter

```javascript
import { CustomFormatter } from 'web-logger/formatters';

const formatter = new CustomFormatter({
  transform: (entry) => `${entry.levelName}: ${entry.message}`
});
```

### TemplateFormatter

```javascript
import { TemplateFormatter } from 'web-logger/formatters';

const formatter = new TemplateFormatter({
  template: '{timestamp} [{level}] {message} | Data: {data}'
});
```

## Utils

```javascript
import {
  debounce,
  throttle,
  sanitize,
  parseStacktrace,
  deepMerge,
  isBrowser,
  isNode,
  serializeError
} from 'web-logger/utils';
```

## License

MIT
