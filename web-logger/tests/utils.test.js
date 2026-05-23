import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  sanitize,
  sanitizeString,
  sanitizeObject,
  parseStacktrace,
  formatStacktrace,
  deepMerge,
  deepClone,
  isPlainObject,
  serializeError,
  deserializeError,
  toError
} from '../src/utils/index.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(100);

    expect(fn).not.toHaveBeenCalled();
  });

  it('should flush immediately', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.flush();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute immediately', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should ignore calls during throttle period', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute trailing call after throttle period', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('first');
    throttled('second');

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  it('should cancel pending execution', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled.cancel();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('sanitize', () => {
  it('should sanitize strings', () => {
    const result = sanitize('password: secret123');
    expect(result).not.toContain('secret123');
  });

  it('should sanitize objects', () => {
    const result = sanitize({ password: 'secret', name: 'test' });
    expect(result.password).toBe('***REDACTED***');
    expect(result.name).toBe('test');
  });

  it('should handle nested objects', () => {
    const result = sanitize({
      user: { password: 'secret', email: 'test@test.com' }
    });
    expect(result.user.password).toBe('***REDACTED***');
    expect(result.user.email).toBe('test@test.com');
  });

  it('should handle arrays', () => {
    const result = sanitize([{ password: 'secret' }, { name: 'test' }]);
    expect(result[0].password).toBe('***REDACTED***');
    expect(result[1].name).toBe('test');
  });

  it('should handle non-string/non-object values', () => {
    expect(sanitize(123)).toBe(123);
    expect(sanitize(null)).toBe(null);
    expect(sanitize(undefined)).toBe(undefined);
  });

  it('should redact credit card numbers', () => {
    const result = sanitize('Card: 1234-5678-9012-3456');
    expect(result).not.toContain('1234-5678-9012-3456');
  });

  it('should redact SSN patterns', () => {
    const result = sanitize('SSN: 123-45-6789');
    expect(result).not.toContain('123-45-6789');
  });
});

describe('sanitizeString', () => {
  it('should redact passwords', () => {
    const result = sanitizeString('password: mypassword');
    expect(result).not.toContain('mypassword');
  });

  it('should redact tokens', () => {
    const result = sanitizeString('token: abc123xyz');
    expect(result).not.toContain('abc123xyz');
  });

  it('should redact API keys', () => {
    const result = sanitizeString('api_key: secret123');
    expect(result).not.toContain('secret123');
  });

  it('should redact bearer tokens', () => {
    const result = sanitizeString('Authorization: Bearer token123');
    expect(result).not.toContain('token123');
  });
});

describe('sanitizeObject', () => {
  it('should redact sensitive keys', () => {
    const result = sanitizeObject({
      password: 'secret',
      apiKey: 'key123',
      name: 'test'
    });

    expect(result.password).toBe('***REDACTED***');
    expect(result.apiKey).toBe('***REDACTED***');
    expect(result.name).toBe('test');
  });
});

describe('parseStacktrace', () => {
  it('should parse Chrome/Firefox stack traces', () => {
    const error = new Error('Test');
    const frames = parseStacktrace(error);

    expect(Array.isArray(frames)).toBe(true);
    expect(frames.length).toBeGreaterThan(0);
  });

  it('should return empty array for null error', () => {
    expect(parseStacktrace(null)).toEqual([]);
  });

  it('should return empty array for error without stack', () => {
    expect(parseStacktrace({ message: 'test' })).toEqual([]);
  });

  it('should parse frame properties', () => {
    const error = new Error('Test');
    const frames = parseStacktrace(error);
    const frame = frames[0];

    expect(frame).toHaveProperty('functionName');
    expect(frame).toHaveProperty('fileName');
    expect(frame).toHaveProperty('lineNumber');
    expect(frame).toHaveProperty('columnNumber');
  });
});

describe('formatStacktrace', () => {
  it('should format stack trace as string', () => {
    const error = new Error('Test');
    const formatted = formatStacktrace(error);

    expect(typeof formatted).toBe('string');
    expect(formatted).toContain('at ');
  });

  it('should limit frames', () => {
    const error = new Error('Test');
    const formatted = formatStacktrace(error, { maxFrames: 2 });

    const lines = formatted.split('\n');
    expect(lines.length).toBeLessThanOrEqual(2);
  });

  it('should hide column numbers', () => {
    const error = new Error('Test');
    const formatted = formatStacktrace(error, { showColumn: false });

    expect(formatted).not.toMatch(/:\d+:\d+\)$/);
  });
});

describe('deepMerge', () => {
  it('should merge simple objects', () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should merge nested objects', () => {
    const result = deepMerge(
      { a: { b: 1 } },
      { a: { c: 2 } }
    );
    expect(result).toEqual({ a: { b: 1, c: 2 } });
  });

  it('should not mutate target', () => {
    const target = { a: 1 };
    deepMerge(target, { b: 2 });
    expect(target).toEqual({ a: 1 });
  });

  it('should handle multiple sources', () => {
    const result = deepMerge({ a: 1 }, { b: 2 }, { c: 3 });
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should handle null/undefined sources', () => {
    const result = deepMerge({ a: 1 }, null, undefined, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should replace arrays', () => {
    const result = deepMerge({ a: [1, 2] }, { a: [3, 4] });
    expect(result.a).toEqual([3, 4]);
  });
});

describe('deepClone', () => {
  it('should clone simple objects', () => {
    const obj = { a: 1, b: 'test' };
    const cloned = deepClone(obj);

    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
  });

  it('should clone nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const cloned = deepClone(obj);

    expect(cloned).toEqual(obj);
    expect(cloned.a).not.toBe(obj.a);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, { a: 3 }];
    const cloned = deepClone(arr);

    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
  });

  it('should handle primitives', () => {
    expect(deepClone(123)).toBe(123);
    expect(deepClone('test')).toBe('test');
    expect(deepClone(null)).toBe(null);
  });
});

describe('isPlainObject', () => {
  it('should return true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it('should return false for non-plain objects', () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject(123)).toBe(false);
    expect(isPlainObject('test')).toBe(false);
  });
});

describe('serializeError', () => {
  it('should serialize Error objects', () => {
    const error = new Error('Test error');
    const serialized = serializeError(error);

    expect(serialized.name).toBe('Error');
    expect(serialized.message).toBe('Test error');
    expect(serialized.stack).toBeDefined();
  });

  it('should serialize non-Error values', () => {
    const serialized = serializeError('string error');
    expect(serialized.message).toBe('string error');
  });

  it('should serialize error cause', () => {
    const cause = new Error('Cause');
    const error = new Error('Main', { cause });
    const serialized = serializeError(error);

    expect(serialized.cause).toBeDefined();
    expect(serialized.cause.message).toBe('Cause');
  });

  it('should copy custom properties', () => {
    const error = new Error('Test');
    error.code = 'ERR_TEST';
    const serialized = serializeError(error);

    expect(serialized.code).toBe('ERR_TEST');
  });
});

describe('deserializeError', () => {
  it('should deserialize to Error object', () => {
    const data = { name: 'CustomError', message: 'Test' };
    const error = deserializeError(data);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('CustomError');
    expect(error.message).toBe('Test');
  });

  it('should handle stack', () => {
    const data = { message: 'Test', stack: 'Error: Test\n    at ...' };
    const error = deserializeError(data);

    expect(error.stack).toBe(data.stack);
  });

  it('should handle cause', () => {
    const data = {
      message: 'Main',
      cause: { message: 'Cause' }
    };
    const error = deserializeError(data);

    expect(error.cause).toBeInstanceOf(Error);
    expect(error.cause.message).toBe('Cause');
  });

  it('should handle non-object data', () => {
    const error = deserializeError('string error');
    expect(error.message).toBe('string error');
  });
});

describe('toError', () => {
  it('should return Error objects unchanged', () => {
    const error = new Error('Test');
    expect(toError(error)).toBe(error);
  });

  it('should convert strings to Error', () => {
    const error = toError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
  });

  it('should convert objects to Error', () => {
    const error = toError({ message: 'Object error' });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Object error');
  });

  it('should use error property if message not present', () => {
    const error = toError({ error: 'Error property' });
    expect(error.message).toBe('Error property');
  });

  it('should convert other values to string', () => {
    const error = toError(123);
    expect(error.message).toBe('123');
  });
});
