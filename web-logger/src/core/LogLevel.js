/**
 * Log level constants.
 * @readonly
 * @enum {number}
 */
export const LogLevel = Object.freeze({
  /** Trace level - most verbose */
  TRACE: 0,
  /** Debug level */
  DEBUG: 1,
  /** Info level - default */
  INFO: 2,
  /** Warning level */
  WARN: 3,
  /** Error level */
  ERROR: 4,
  /** Fatal level - least verbose before silent */
  FATAL: 5,
  /** Silent level - no logging */
  SILENT: 6
});

/**
 * Mapping of log level numbers to their string names.
 * @readonly
 */
export const LogLevelNames = Object.freeze({
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
  [LogLevel.SILENT]: 'SILENT'
});

/**
 * Parses a log level from various input types.
 * @param {number|string} value - The value to parse.
 * @returns {number} The parsed log level number.
 * @example
 * parseLogLevel('debug') // returns 1
 * parseLogLevel(2) // returns 2
 * parseLogLevel('invalid') // returns 2 (INFO)
 */
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
