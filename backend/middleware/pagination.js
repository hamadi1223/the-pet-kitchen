/**
 * Pagination Middleware
 * Adds pagination support to API endpoints
 */

/**
 * Parse pagination parameters from query string
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function parsePagination(req, res, next) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20)); // Max 100, default 20
  const offset = (page - 1) * limit;

  req.pagination = {
    page,
    limit,
    offset
  };

  next();
}

/**
 * Format paginated response
 * @param {Array} data - Array of results
 * @param {Number} total - Total count of all results
 * @param {Object} pagination - Pagination object from req.pagination
 * @returns {Object} Formatted paginated response
 */
function formatPaginatedResponse(data, total, pagination) {
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages: Math.ceil(total / pagination.limit),
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1
    }
  };
}

module.exports = {
  parsePagination,
  formatPaginatedResponse
};

