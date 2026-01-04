-- Technical Improvements Migration
-- Adds soft deletes, indexes, and audit logs table
-- Note: Run this migration - it will skip columns/indexes that already exist

-- ==================== SOFT DELETES ====================
-- Add deleted_at columns to existing tables for soft deletes
-- These will fail gracefully if columns already exist

-- Users table
ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;
CREATE INDEX idx_users_deleted_at ON users (deleted_at);

-- Products table
ALTER TABLE products ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;
CREATE INDEX idx_products_deleted_at ON products (deleted_at);

-- Orders table
ALTER TABLE orders ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;
CREATE INDEX idx_orders_deleted_at ON orders (deleted_at);

-- Pets table
ALTER TABLE pets ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL;
CREATE INDEX idx_pets_deleted_at ON pets (deleted_at);

-- ==================== PERFORMANCE INDEXES ====================
-- Add indexes for better query performance
-- These will fail gracefully if indexes already exist

-- Orders table indexes
CREATE INDEX idx_user_status ON orders (user_id, status);
CREATE INDEX idx_status_created ON orders (status, created_at);
CREATE INDEX idx_email_status ON orders (email, status);

-- Cart items indexes
CREATE INDEX idx_cart_status ON cart_items (cart_id, product_id);

-- Order items indexes
CREATE INDEX idx_order_product ON order_items (order_id, product_id);

-- Products indexes
CREATE INDEX idx_species_active ON products (species, is_active);
CREATE INDEX idx_subscription_type ON products (is_subscription, subscription_type);

-- Users indexes (only if deleted_at exists)
CREATE INDEX idx_role_active ON users (role, deleted_at);

-- ==================== AUDIT LOGS TABLE ====================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  resource_id INT NULL,
  changes JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_resource (resource, resource_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== API RATE LIMIT TRACKING ====================
-- Optional: Table for persistent rate limit tracking (if using database instead of memory)
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL, -- IP address or user identifier
  endpoint VARCHAR(255) NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  window_start DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_identifier_endpoint (identifier, endpoint),
  INDEX idx_window_start (window_start),
  INDEX idx_identifier (identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
