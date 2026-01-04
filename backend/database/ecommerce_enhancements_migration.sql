-- E-Commerce Enhancements Migration
-- Adds missing tables and columns for production-ready e-commerce

-- ==================== INVENTORY TRACKING ====================
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_low_stock (quantity, low_stock_threshold),
  UNIQUE KEY unique_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory movements log
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  order_id INT NULL,
  movement_type ENUM('reserve', 'deduct', 'release', 'adjust') NOT NULL,
  quantity INT NOT NULL,
  reason TEXT NULL,
  admin_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product_id (product_id),
  INDEX idx_order_id (order_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize inventory for existing products
INSERT INTO inventory (product_id, quantity, low_stock_threshold)
SELECT id, 100, 10 FROM products
ON DUPLICATE KEY UPDATE product_id=product_id;

-- ==================== ADDRESSES ====================
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('billing', 'shipping', 'both') NOT NULL DEFAULT 'both',
  full_name VARCHAR(191) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Kuwait',
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== COUPONS/DISCOUNTS ====================
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,3) NULL,
  max_discount DECIMAL(10,3) NULL,
  usage_limit INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_active (is_active, valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ORDER ENHANCEMENTS ====================
-- Add missing columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(191) NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS shipping_address_id INT NULL,
  ADD COLUMN IF NOT EXISTS billing_address_id INT NULL,
  ADD COLUMN IF NOT EXISTS coupon_id INT NULL,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS shipped_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS delivered_at DATETIME NULL,
  ADD INDEX IF NOT EXISTS idx_idempotency_key (idempotency_key),
  ADD INDEX IF NOT EXISTS idx_tracking (tracking_number),
  ADD FOREIGN KEY IF NOT EXISTS fk_shipping_address (shipping_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  ADD FOREIGN KEY IF NOT EXISTS fk_billing_address (billing_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  ADD FOREIGN KEY IF NOT EXISTS fk_coupon (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

-- Update order status enum to include missing statuses
ALTER TABLE orders
  MODIFY COLUMN status ENUM('created', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'fulfilled', 'refunded') NOT NULL DEFAULT 'created';

-- ==================== ORDER NOTES ====================
CREATE TABLE IF NOT EXISTS order_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  user_id INT NULL,
  note TEXT NOT NULL,
  is_internal TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== REFUNDS ====================
CREATE TABLE IF NOT EXISTS refunds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  amount DECIMAL(10,3) NOT NULL,
  reason TEXT NULL,
  status ENUM('requested', 'approved', 'processing', 'completed', 'rejected') NOT NULL DEFAULT 'requested',
  processed_by INT NULL,
  processed_at DATETIME NULL,
  payment_reference VARCHAR(191) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_id (order_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== EMAIL QUEUE ====================
CREATE TABLE IF NOT EXISTS email_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  to_email VARCHAR(191) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NULL,
  status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  error_message TEXT NULL,
  sent_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status, created_at),
  INDEX idx_to_email (to_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ABANDONED CARTS ====================
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  user_id INT NULL,
  email VARCHAR(191) NULL,
  reminder_sent_at DATETIME NULL,
  reminder_count INT NOT NULL DEFAULT 0,
  recovered_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_cart_id (cart_id),
  INDEX idx_email (email),
  INDEX idx_recovered (recovered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PRODUCT VARIANTS (for future use) ====================
CREATE TABLE IF NOT EXISTS product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  sku VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  price_adjustment DECIMAL(10,3) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PRODUCT IMAGES ====================
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== DAILY REPORTS ====================
CREATE TABLE IF NOT EXISTS daily_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  orders_count INT NOT NULL DEFAULT 0,
  gross_revenue DECIMAL(10,3) NOT NULL DEFAULT 0,
  net_revenue DECIMAL(10,3) NOT NULL DEFAULT 0,
  average_order_value DECIMAL(10,3) NOT NULL DEFAULT 0,
  refunds_count INT NOT NULL DEFAULT 0,
  refunds_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  payments_succeeded INT NOT NULL DEFAULT 0,
  payments_failed INT NOT NULL DEFAULT 0,
  new_customers INT NOT NULL DEFAULT 0,
  returning_customers INT NOT NULL DEFAULT 0,
  low_stock_items INT NOT NULL DEFAULT 0,
  out_of_stock_items INT NOT NULL DEFAULT 0,
  report_data JSON NULL,
  sent_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_report_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== BACK-IN-STOCK ALERTS ====================
CREATE TABLE IF NOT EXISTS stock_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  email VARCHAR(191) NOT NULL,
  notified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_notified (notified_at),
  UNIQUE KEY unique_alert (product_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

