import { LogLevel as LogLevelJS, LogLevelNames, parseLogLevel } from './core/LogLevel.js';

export { LogLevelJS as LogLevel, LogLevelNames, parseLogLevel };

export type LogLevelValue = typeof LogLevelJS[keyof typeof LogLevelJS];

export interface LogEntryData {
  [key: string]: unknown;
}

export interface LogEntryContext {
  [key: string]: string | number | boolean;
}

export interface LogEntryOptions {
  level: LogLevelValue;
  message: string;
  data?: LogEntryData | null;
  context?: LogEntryContext;
  timestamp: number;
}

export interface LogEntryJSON {
  id: string;
  level: LogLevelValue;
  levelName: string;
  message: string;
  data: LogEntryData | null;
  context: LogEntryContext;
  timestamp: number;
  date: string;
}

export interface TransportOptions {
  formatter?: Formatter;
  level?: LogLevelValue;
}

export interface FormatterOptions {
  [key: string]: unknown;
}

export interface Formatter {
  format(entry: LogEntry): string | LogEntryData;
  options: FormatterOptions;
}

export interface Transport {
  formatter: Formatter | null;
  level: LogLevelValue;
  shouldWrite(entry: LogEntry): boolean;
  format(entry: LogEntry): string | LogEntryData;
  write(entry: LogEntry): void;
  flush(): Promise<void>;
  close(): Promise<void>;
}

export type ErrorHandler = (error: Error, context: { phase: string; transport?: Transport }) => void;

export interface LoggerOptions {
  level?: LogLevelValue;
  context?: LogEntryContext;
  transports?: Transport[];
  inheritTransports?: boolean;
  onError?: ErrorHandler;
  emitter?: Emitter;
}

export interface Logger {
  level: LogLevelValue;
  context: LogEntryContext;
  inheritTransports: boolean;
  parent: Logger | null;
  addTransport(transport: Transport): Logger;
  removeTransport(transport: Transport): Logger;
  transports: Transport[];
  setContext(context: LogEntryContext): Logger;
  mergeContext(context: LogEntryContext): Logger;
  trace(message: string, data?: LogEntryData): Logger;
  debug(message: string, data?: LogEntryData): Logger;
  info(message: string, data?: LogEntryData): Logger;
  warn(message: string, data?: LogEntryData): Logger;
  error(message: string, data?: LogEntryData | Error): Logger;
  fatal(message: string, data?: LogEntryData | Error): Logger;
  on(event: string, handler: (...args: unknown[]) => void): Logger;
  off(event: string, handler: (...args: unknown[]) => void): Logger;
  once(event: string, handler: (...args: unknown[]) => void): Logger;
  createChild(additionalContext?: LogEntryContext, options?: { inheritTransports?: boolean }): Logger;
  detach(): Logger;
  flush(): Promise<void>;
  close(): Promise<void>;
}

export interface ConsoleTransportOptions extends TransportOptions {
  colors?: boolean;
  timestamps?: boolean;
}

export interface MemoryTransportOptions extends TransportOptions {
  maxSize?: number;
}

export interface FetchTransportOptions extends TransportOptions {
  url: string;
  headers?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
  retries?: number;
  retryDelay?: number;
}

export interface LocalStorageTransportOptions extends TransportOptions {
  storageKey?: string;
  maxEntries?: number;
  storage?: Storage;
}

export interface DOMTransportOptions extends TransportOptions {
  container?: HTMLElement | null;
  maxEntries?: number;
  entryClass?: string;
  autoScroll?: boolean;
}

export interface WebSocketTransportOptions extends TransportOptions {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnects?: number;
}

export interface MultiTransportOptions extends TransportOptions {
  transports?: Transport[];
}

export interface JsonFormatterOptions extends FormatterOptions {
  pretty?: boolean;
  includeData?: boolean;
  includeContext?: boolean;
}

export interface TextFormatterOptions extends FormatterOptions {
  template?: string;
  includeData?: boolean;
  includeContext?: boolean;
  separator?: string;
}

export interface ColorFormatterOptions extends FormatterOptions {
  colors?: Record<string, string>;
  bgColors?: Record<string, string>;
}

export interface CsvFormatterOptions extends FormatterOptions {
  delimiter?: string;
  includeHeader?: boolean;
  includeData?: boolean;
  includeContext?: boolean;
}

export interface CustomFormatterOptions extends FormatterOptions {
  transform: (entry: LogEntry) => string | LogEntryData;
}

export interface TemplateFormatterOptions extends FormatterOptions {
  template?: string;
  partials?: Record<string, string>;
}

export interface LogEntry {
  level: LogLevelValue;
  levelName: string;
  message: string;
  data: LogEntryData | null;
  context: LogEntryContext;
  timestamp: number;
  id: string;
  date: Date;
  toJSON(): LogEntryJSON;
  clone(overrides?: Partial<LogEntryOptions>): LogEntry;
}

export interface CreateLoggerOptions {
  level?: LogLevelValue | string;
  context?: LogEntryContext;
  console?: boolean;
  colors?: boolean;
  timestamps?: boolean;
  formatter?: Formatter;
  transports?: Transport[];
  onError?: ErrorHandler;
}

export interface Emitter {
  on(event: string, handler: (...args: unknown[]) => void): Emitter;
  off(event: string, handler: (...args: unknown[]) => void): Emitter;
  once(event: string, handler: (...args: unknown[]) => void): Emitter;
  emit(event: string, ...args: unknown[]): Emitter;
  listenerCount(event: string): number;
  removeAllListeners(event?: string): Emitter;
}
