/**
 * Structured Logging Utility
 * Provides consistent logging with levels, request IDs, and structured output
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const CURRENT_LOG_LEVEL = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;

/**
 * Generate request ID for tracking
 */
function generateRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format log message
 */
function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...meta
  };

  // In production, output as JSON for log aggregation
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logEntry);
  }

  // In development, output formatted string
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

/**
 * Log error
 */
function error(message, meta = {}) {
  if (LOG_LEVELS.error <= CURRENT_LOG_LEVEL) {
    console.error(formatLog('error', message, meta));
  }
}

/**
 * Log warning
 */
function warn(message, meta = {}) {
  if (LOG_LEVELS.warn <= CURRENT_LOG_LEVEL) {
    console.warn(formatLog('warn', message, meta));
  }
}

/**
 * Log info
 */
function info(message, meta = {}) {
  if (LOG_LEVELS.info <= CURRENT_LOG_LEVEL) {
    console.log(formatLog('info', message, meta));
  }
}

/**
 * Log debug
 */
function debug(message, meta = {}) {
  if (LOG_LEVELS.debug <= CURRENT_LOG_LEVEL) {
    console.log(formatLog('debug', message, meta));
  }
}

/**
 * Create request logger with request ID
 */
function createRequestLogger(req) {
  const requestId = req.id || generateRequestId();
  req.id = requestId;

  return {
    error: (message, meta = {}) => error(message, { ...meta, requestId }),
    warn: (message, meta = {}) => warn(message, { ...meta, requestId }),
    info: (message, meta = {}) => info(message, { ...meta, requestId }),
    debug: (message, meta = {}) => debug(message, { ...meta, requestId }),
    requestId
  };
}

module.exports = {
  error,
  warn,
  info,
  debug,
  createRequestLogger,
  generateRequestId
};

