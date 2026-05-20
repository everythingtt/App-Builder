const SensitivePatterns = [
  /password["\s:=]+["']?([^"'\s,}]+)/gi,
  /token["\s:=]+["']?([^"'\s,}]+)/gi,
  /secret["\s:=]+["']?([^"'\s,}]+)/gi,
  /api[_-]?key["\s:=]+["']?([^"'\s,}]+)/gi,
  /authorization["\s:=]+["']?([^"'\s,}]+)/gi,
  /bearer\s+([^\s]+)/gi,
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  /\b\d{3}-\d{2}-\d{4}\b/g
];

const Mask = '***REDACTED***';

export function sanitize(data) {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }
  if (typeof data === 'object' && data !== null) {
    return sanitizeObject(data);
  }
  return data;
}

export function sanitizeString(str) {
  let result = str;
  for (const pattern of SensitivePatterns) {
    result = result.replace(pattern, (match, group) => {
      return match.replace(group, Mask);
    });
  }
  return result;
}

export function sanitizeObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      result[key] = Mask;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function isSensitiveKey(key) {
  const sensitiveKeys = [
    'password', 'passwd', 'pwd',
    'token', 'access_token', 'refresh_token',
    'secret', 'client_secret',
    'api_key', 'apikey', 'api-key',
    'authorization', 'auth',
    'credit_card', 'cc', 'card_number',
    'ssn', 'social_security'
  ];
  return sensitiveKeys.includes(key.toLowerCase());
}
