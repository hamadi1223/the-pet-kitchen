/**
 * Audit Log Middleware
 * Logs admin actions for security and compliance
 */

const pool = require('../config/database');

/**
 * Create audit log entry
 * @param {Object} options - Audit log options
 * @param {Number} options.userId - User ID performing the action
 * @param {String} options.action - Action type (e.g., 'create', 'update', 'delete')
 * @param {String} options.resource - Resource type (e.g., 'order', 'product', 'user')
 * @param {Number} options.resourceId - ID of the resource
 * @param {Object} options.changes - Object describing what changed
 * @param {String} options.ipAddress - IP address of the request
 * @param {String} options.userAgent - User agent string
 */
async function createAuditLog({
  userId,
  action,
  resource,
  resourceId,
  changes = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    // Check if audit_logs table exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        resource VARCHAR(50) NOT NULL,
        resource_id INT,
        changes JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_resource (resource, resource_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(
      `INSERT INTO audit_logs 
       (user_id, action, resource, resource_id, changes, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        resource,
        resourceId,
        changes ? JSON.stringify(changes) : null,
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Audit log error:', error);
  }
}

/**
 * Audit log middleware for admin actions
 */
function auditLogMiddleware(action, resource) {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after response
    res.json = function(data) {
      // Only log successful admin actions
      if (req.user && req.user.role === 'admin' && res.statusCode < 400) {
        const resourceId = req.params.id || req.body.id || null;
        const changes = {
          before: req.body._before || null,
          after: req.body._after || req.body || null
        };

        createAuditLog({
          userId: req.user.id,
          action,
          resource,
          resourceId,
          changes: Object.keys(changes).length > 0 ? changes : null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent')
        }).catch(err => {
          console.error('Failed to create audit log:', err);
        });
      }

      return originalJson(data);
    };

    next();
  };
}

module.exports = {
  createAuditLog,
  auditLogMiddleware
};

