export * from './core/index.js';
export * from './transports/index.js';
export * from './formatters/index.js';
export * from './utils/index.js';

import { Logger } from './core/Logger.js';
import { ConsoleTransport } from './transports/ConsoleTransport.js';
import { TextFormatter } from './formatters/TextFormatter.js';
import { LogLevel, parseLogLevel } from './core/LogLevel.js';

export function createLogger(options = {}) {
  const logger = new Logger({
    level: options.level ?? LogLevel.INFO,
    context: options.context ?? {}
  });

  if (options.console !== false) {
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

export const logger = createLogger();

export default logger;
