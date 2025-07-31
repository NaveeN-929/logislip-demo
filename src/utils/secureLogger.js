// Secure logging utility for production-ready applications
// Only logs in development mode and sanitizes sensitive data

const isDevelopment = process.env.NODE_ENV === 'development';

// Sensitive data patterns to sanitize
const SENSITIVE_PATTERNS = [
  /token/i,
  /password/i,
  /secret/i,
  /key/i,
  /auth/i,
  /credential/i,
  /session/i,
  /cookie/i,
  /email/i,
  /phone/i,
  /address/i,
  /ssn/i,
  /credit/i,
  /card/i,
  /payment/i,
  /billing/i
];

// Sanitize sensitive data from objects
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Secure logger that only works in development
const secureLogger = {
  // Critical errors that should always be logged (but sanitized)
  error: (message, ...args) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...args.map(arg => sanitizeData(arg)));
    }
  },

  // Warnings for development only
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args.map(arg => sanitizeData(arg)));
    }
  },

  // Debug logs - development only
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args.map(arg => sanitizeData(arg)));
    }
  },

  // Info logs - development only  
  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args.map(arg => sanitizeData(arg)));
    }
  },

  // Silent logger - never logs anything (for replacing sensitive logs)
  silent: () => {
    // Intentionally empty - for replacing logs that should never appear
  }
};

export default secureLogger; 