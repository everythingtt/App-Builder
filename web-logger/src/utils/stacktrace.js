export function parseStacktrace(error) {
  if (!error || !error.stack) {
    return [];
  }

  const stack = error.stack;
  const lines = stack.split('\n');
  const frames = [];

  for (const line of lines) {
    const frame = parseStackFrame(line);
    if (frame) {
      frames.push(frame);
    }
  }

  return frames;
}

function parseStackFrame(line) {
  const chromeFirefoxMatch = line.match(/^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/);
  if (chromeFirefoxMatch) {
    return {
      functionName: chromeFirefoxMatch[1] || '<anonymous>',
      fileName: chromeFirefoxMatch[2],
      lineNumber: parseInt(chromeFirefoxMatch[3], 10),
      columnNumber: parseInt(chromeFirefoxMatch[4], 10)
    };
  }

  const chromeFirefoxMatchNoFunc = line.match(/^\s*at\s+(.+?):(\d+):(\d+)$/);
  if (chromeFirefoxMatchNoFunc) {
    return {
      functionName: '<anonymous>',
      fileName: chromeFirefoxMatchNoFunc[1],
      lineNumber: parseInt(chromeFirefoxMatchNoFunc[2], 10),
      columnNumber: parseInt(chromeFirefoxMatchNoFunc[3], 10)
    };
  }

  const safariMatch = line.match(/^(.+?)@(.+?):(\d+):(\d+)$/);
  if (safariMatch) {
    return {
      functionName: safariMatch[1] || '<anonymous>',
      fileName: safariMatch[2],
      lineNumber: parseInt(safariMatch[3], 10),
      columnNumber: parseInt(safariMatch[4], 10)
    };
  }

  return null;
}

export function formatStacktrace(error, options = {}) {
  const frames = parseStacktrace(error);
  const maxFrames = options.maxFrames ?? 10;
  const showColumn = options.showColumn ?? true;

  const limitedFrames = frames.slice(0, maxFrames);
  const lines = limitedFrames.map(frame => {
    const location = showColumn
      ? `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`
      : `${frame.fileName}:${frame.lineNumber}`;
    return `    at ${frame.functionName} (${location})`;
  });

  return lines.join('\n');
}

export function getCallerInfo() {
  const error = new Error();
  const frames = parseStacktrace(error);

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (!frame.fileName.includes('stacktrace.js')) {
      return frame;
    }
  }

  return null;
}
