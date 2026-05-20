export const LogLevel = Object.freeze({
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
  SILENT: 6
});

export const LogLevelNames = Object.freeze({
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
  [LogLevel.SILENT]: 'SILENT'
});

export function parseLogLevel(value) {
  if (typeof value === 'number' && value in LogLevelNames) {
    return value;
  }
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (upper in LogLevel) {
      return LogLevel[upper];
    }
  }
  return LogLevel.INFO;
}
