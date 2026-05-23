import { describe, it, expect } from 'vitest';
import { LogLevel, LogEntry } from '../src/core/index.js';
import {
  JsonFormatter,
  TextFormatter,
  ColorFormatter,
  CsvFormatter,
  CustomFormatter,
  TemplateFormatter
} from '../src/formatters/index.js';

const createEntry = (options = {}) =>
  new LogEntry({
    level: options.level ?? LogLevel.INFO,
    message: options.message ?? 'Test message',
    data: options.data ?? null,
    context: options.context ?? {},
    timestamp: options.timestamp ?? 1234567890
  });

describe('JsonFormatter', () => {
  it('should format as JSON string', () => {
    const formatter = new JsonFormatter();
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(typeof output).toBe('string');
    const parsed = JSON.parse(output);

    expect(parsed.level).toBe('INFO');
    expect(parsed.message).toBe('Test message');
    expect(parsed.id).toBeDefined();
    expect(parsed.timestamp).toBe(1234567890);
  });

  it('should format pretty when enabled', () => {
    const formatter = new JsonFormatter({ pretty: true });
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).toContain('\n');
    expect(output).toContain('  ');
  });

  it('should include data when enabled', () => {
    const formatter = new JsonFormatter({ includeData: true });
    const entry = createEntry({ data: { foo: 'bar' } });
    const output = formatter.format(entry);

    expect(output).toContain('"data"');
  });

  it('should exclude data when disabled', () => {
    const formatter = new JsonFormatter({ includeData: false });
    const entry = createEntry({ data: { foo: 'bar' } });
    const output = formatter.format(entry);

    expect(output).not.toContain('"data"');
  });

  it('should include context when enabled', () => {
    const formatter = new JsonFormatter({ includeContext: true });
    const entry = createEntry({ context: { app: 'test' } });
    const output = formatter.format(entry);

    expect(output).toContain('"context"');
  });

  it('should exclude context when disabled', () => {
    const formatter = new JsonFormatter({ includeContext: false });
    const entry = createEntry({ context: { app: 'test' } });
    const output = formatter.format(entry);

    expect(output).not.toContain('"context"');
  });
});

describe('TextFormatter', () => {
  it('should format as text', () => {
    const formatter = new TextFormatter();
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(typeof output).toBe('string');
    expect(output).toContain('Test message');
    expect(output).toContain('INFO');
  });

  it('should use custom template', () => {
    const formatter = new TextFormatter({ template: '{level}: {message}' });
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).toBe('INFO: Test message');
  });

  it('should include data when enabled', () => {
    const formatter = new TextFormatter({ includeData: true, separator: ' | ' });
    const entry = createEntry({ data: { foo: 'bar' } });
    const output = formatter.format(entry);

    expect(output).toContain('"foo":"bar"');
  });

  it('should use custom separator', () => {
    const formatter = new TextFormatter({ separator: ' || ' });
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).toContain(' || ');
  });
});

describe('ColorFormatter', () => {
  it('should format with ANSI colors', () => {
    const formatter = new ColorFormatter();
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).toContain('\x1b[');
    expect(output).toContain('Test message');
  });

  it('should use different colors per level', () => {
    const formatter = new ColorFormatter();
    const infoEntry = createEntry({ level: LogLevel.INFO });
    const errorEntry = createEntry({ level: LogLevel.ERROR });

    const infoOutput = formatter.format(infoEntry);
    const errorOutput = formatter.format(errorEntry);

    expect(infoOutput).not.toBe(errorOutput);
  });

  it('should include data', () => {
    const formatter = new ColorFormatter();
    const entry = createEntry({ data: { foo: 'bar' } });
    const output = formatter.format(entry);

    expect(output).toContain('Data:');
    expect(output).toContain('"foo":"bar"');
  });

  it('should include context', () => {
    const formatter = new ColorFormatter();
    const entry = createEntry({ context: { app: 'test' } });
    const output = formatter.format(entry);

    expect(output).toContain('Context:');
    expect(output).toContain('"app":"test"');
  });

  it('should provide static color codes', () => {
    expect(ColorFormatter.getColorCode('red')).toBe('\x1b[31m');
    expect(ColorFormatter.getColorCode('green')).toBe('\x1b[32m');
    expect(ColorFormatter.getColorCode('unknown')).toBe('\x1b[0m');
  });
});

describe('CsvFormatter', () => {
  it('should format as CSV', () => {
    const formatter = new CsvFormatter({ includeHeader: false });
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).toContain('INFO');
    expect(output).toContain('Test message');
  });

  it('should include header when enabled', () => {
    const formatter = new CsvFormatter({ includeHeader: true });
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).toContain('timestamp,level,message');
  });

  it('should escape special characters', () => {
    const formatter = new CsvFormatter({ includeHeader: false });
    const entry = createEntry({ message: 'Hello, "World"' });
    const output = formatter.format(entry);

    expect(output).toContain('""World""');
  });

  it('should include data when enabled', () => {
    const formatter = new CsvFormatter({ includeHeader: false, includeData: true });
    const entry = createEntry({ data: { foo: 'bar' } });
    const output = formatter.format(entry);

    expect(output).toContain('"foo":"bar"');
  });

  it('should reset header flag', () => {
    const formatter = new CsvFormatter({ includeHeader: true });
    const entry = createEntry();

    const output1 = formatter.format(entry);
    expect(output1).toContain('timestamp');

    formatter.reset();
    const output2 = formatter.format(entry);
    expect(output2).toContain('timestamp');
  });
});

describe('CustomFormatter', () => {
  it('should use custom transform function', () => {
    const formatter = new CustomFormatter({
      transform: (entry) => `Custom: ${entry.message}`
    });
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).toBe('Custom: Test message');
  });

  it('should return entry by default', () => {
    const formatter = new CustomFormatter({ transform: (e) => e });
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).toBe(entry);
  });

  it('should have static create method', () => {
    const formatter = CustomFormatter.create((e) => e.message);
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).toBe('Test message');
  });
});

describe('TemplateFormatter', () => {
  it('should format using template', () => {
    const formatter = new TemplateFormatter({
      template: '{timestamp} [{level}] {message}'
    });
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).toContain('INFO');
    expect(output).toContain('Test message');
  });

  it('should support all tokens', () => {
    const formatter = new TemplateFormatter({
      template: '{id} {timestamp} {level} {message} {date} {time} {ms}'
    });
    const entry = createEntry();
    const output = formatter.format(entry);

    expect(output).not.toContain('{');
  });

  it('should handle data and context tokens', () => {
    const formatter = new TemplateFormatter({
      template: '{message} {data} {context}'
    });
    const entry = createEntry({
      data: { foo: 'bar' },
      context: { app: 'test' }
    });
    const output = formatter.format(entry);

    expect(output).toContain('"foo":"bar"');
    expect(output).toContain('"app":"test"');
  });

  it('should support partials', () => {
    const formatter = new TemplateFormatter({
      template: '{message} {>details}',
      partials: {
        details: 'Data: {data}'
      }
    });
    const entry = createEntry({ data: { x: 1 } });
    const output = formatter.format(entry);

    expect(output).toContain('Data:');
    expect(output).toContain('"x":1');
  });

  it('should add and remove partials', () => {
    const formatter = new TemplateFormatter({ template: '{>test}' });
    formatter.addPartial('test', '{message}');

    const entry = createEntry();
    const output1 = formatter.format(entry);
    expect(output1).toBe('Test message');

    formatter.removePartial('test');
    const output2 = formatter.format(entry);
    expect(output2).toBe('');
  });
});
