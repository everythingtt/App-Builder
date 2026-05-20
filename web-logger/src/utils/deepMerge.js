export function deepMerge(target, ...sources) {
  if (!sources.length) return target;

  const result = { ...target };

  for (const source of sources) {
    if (source === null || source === undefined) continue;

    for (const key of Object.keys(source)) {
      const targetValue = result[key];
      const sourceValue = source[key];

      if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else if (Array.isArray(sourceValue)) {
        result[key] = [...sourceValue];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

export function isPlainObject(value) {
  if (typeof value !== 'object' || value === null) return false;

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  if (isPlainObject(obj)) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepClone(value);
    }
    return result;
  }

  return obj;
}
