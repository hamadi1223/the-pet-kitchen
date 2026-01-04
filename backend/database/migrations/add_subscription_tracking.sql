-- Migration: Add Subscription Tracking
-- Date: 2025-11-27
-- Purpose: Add subscription status, dates, and renewal tracking

-- Add subscription tracking fields to orders table
ALTER TABLE orders 
ADD COLUMN subscription_start_date DATETIME NULL AFTER payment_reference,
ADD COLUMN subscription_end_date DATETIME NULL AFTER subscription_start_date,
ADD COLUMN subscription_renewal_date DATETIME NULL AFTER subscription_end_date,
ADD COLUMN subscription_status ENUM('active', 'expiring_soon', 'expired', 'cancelled') NULL AFTER subscription_renewal_date,
ADD INDEX idx_subscription_status (subscription_status),
ADD INDEX idx_subscription_end_date (subscription_end_date);

-- Create subscriptions table for better tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pet_id INT NULL,
  order_id INT NOT NULL,
  order_item_id INT NOT NULL,
  plan_type ENUM('weekly', 'monthly', 'quarterly') NOT NULL,
  status ENUM('active', 'expiring_soon', 'expired', 'cancelled', 'renewed') NOT NULL DEFAULT 'active',
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  renewal_date DATETIME NULL,
  daily_grams DECIMAL(8,2) NULL,
  pouches_per_day DECIMAL(5,2) NULL,
  total_pouches INT NULL,
  price_per_period DECIMAL(10,3) NOT NULL,
  auto_renew TINYINT(1) NOT NULL DEFAULT 0,
  reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_pet_id (pet_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date),
  INDEX idx_renewal_date (renewal_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

