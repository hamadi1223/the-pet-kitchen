/**
 * Error Handling Utilities
 * Provides consistent error responses and error classes
 */

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * Format error response
 */
function formatErrorResponse(error, req = null) {
  const response = {
    error: error.message || 'An error occurred',
    statusCode: error.statusCode || 500
  };

  // Add request ID if available
  if (req && req.id) {
    response.requestId = req.id;
  }

  // Add validation errors if present
  if (error.errors && Array.isArray(error.errors)) {
    response.errors = error.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  const logger = require('./logger');
  const log = logger.createRequestLogger(req);

  // Log error
  if (err.isOperational !== false) {
    log.error('Operational error', {
      error: err.message,
      statusCode: err.statusCode,
      stack: err.stack
    });
  } else {
    log.error('Unexpected error', {
      error: err.message,
      stack: err.stack
    });
  }

  // Format response
  const statusCode = err.statusCode || 500;
  const response = formatErrorResponse(err, req);

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    response.error = 'Internal server error';
    delete response.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Async error wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  formatErrorResponse,
  errorHandler,
  asyncHandler
};

