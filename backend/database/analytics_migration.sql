-- Analytics and Metrics Tracking Migration
-- Tracks e-commerce KPIs and user engagement metrics

-- ==================== ANALYTICS EVENTS TABLE ====================
CREATE TABLE IF NOT EXISTS analytics_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  user_id INT NULL,
  session_id VARCHAR(255) NULL,
  page_path VARCHAR(500) NULL,
  referrer VARCHAR(500) NULL,
  user_agent TEXT NULL,
  ip_address VARCHAR(45) NULL,
  event_data JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type),
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at),
  INDEX idx_event_type_created (event_type, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== E-COMMERCE METRICS TABLE ====================
-- Aggregated metrics for faster reporting
CREATE TABLE IF NOT EXISTS ecommerce_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric_date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  metric_value DECIMAL(15,3) NOT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_metric_date_type (metric_date, metric_type),
  INDEX idx_metric_date (metric_date),
  INDEX idx_metric_type (metric_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== USER SESSIONS TABLE ====================
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_id INT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  duration_seconds INT NULL,
  page_views INT DEFAULT 0,
  referrer VARCHAR(500) NULL,
  user_agent TEXT NULL,
  ip_address VARCHAR(45) NULL,
  device_type VARCHAR(50) NULL,
  browser VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id),
  INDEX idx_started_at (started_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PRODUCT VIEWS TABLE ====================
CREATE TABLE IF NOT EXISTS product_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NULL,
  user_id INT NULL,
  session_id VARCHAR(255) NULL,
  view_duration INT NULL, -- seconds
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== CART EVENTS TABLE ====================
CREATE TABLE IF NOT EXISTS cart_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  session_id VARCHAR(255) NULL,
  event_type ENUM('add', 'remove', 'update', 'abandon', 'checkout') NOT NULL,
  product_id INT NULL,
  quantity INT NULL,
  cart_value DECIMAL(10,3) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

