export function serializeError(error) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const serialized = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };

  for (const key of Object.keys(error)) {
    if (!serialized[key]) {
      serialized[key] = error[key];
    }
  }

  if (error.cause) {
    serialized.cause = serializeError(error.cause);
  }

  return serialized;
}

export function deserializeError(data) {
  if (!data || typeof data !== 'object') {
    return new Error(String(data));
  }

  const error = new Error(data.message);
  error.name = data.name ?? 'Error';

  if (data.stack) {
    error.stack = data.stack;
  }

  for (const [key, value] of Object.entries(data)) {
    if (!['name', 'message', 'stack', 'cause'].includes(key)) {
      error[key] = value;
    }
  }

  if (data.cause) {
    error.cause = deserializeError(data.cause);
  }

  return error;
}

export function toError(value) {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'string') {
    return new Error(value);
  }

  if (typeof value === 'object' && value !== null) {
    const message = value.message ?? value.error ?? JSON.stringify(value);
    return new Error(message);
  }

  return new Error(String(value));
}
