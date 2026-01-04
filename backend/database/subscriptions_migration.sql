-- Subscriptions Table Migration
-- Run this to add subscription tracking capabilities
-- This extends the existing order_items system with subscription lifecycle management

-- Create subscriptions table for tracking active subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL,
  pet_id              INT NULL,
  order_id            INT NOT NULL,
  order_item_id       INT NOT NULL,
  plan_type           ENUM('weekly', 'monthly', 'quarterly') NOT NULL,
  status              ENUM('pending', 'confirmed', 'active', 'expiring_soon', 'expired', 'cancelled', 'paused') NOT NULL DEFAULT 'pending',
  start_date          DATETIME NOT NULL,
  end_date            DATETIME NOT NULL,
  next_delivery_date  DATETIME NULL,
  daily_grams         DECIMAL(8,2) NULL,
  pouches_per_day     DECIMAL(5,2) NULL,
  total_pouches       INT NULL,
  price_per_period    DECIMAL(10,3) NOT NULL,
  auto_renew          TINYINT(1) NOT NULL DEFAULT 0,
  reminder_sent       TINYINT(1) NOT NULL DEFAULT 0,
  cancelled_at        DATETIME NULL,
  cancellation_reason TEXT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_pet_id (pet_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date),
  INDEX idx_next_delivery (next_delivery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes to order_items for better subscription queries
ALTER TABLE order_items 
  ADD INDEX idx_subscription_meta (meta(255));

-- Migration: Create subscriptions from existing paid orders with subscription items
-- This will backfill subscriptions for existing orders
INSERT INTO subscriptions (
  user_id, 
  pet_id, 
  order_id, 
  order_item_id,
  plan_type,
  status,
  start_date,
  end_date,
  daily_grams,
  pouches_per_day,
  total_pouches,
  price_per_period,
  auto_renew
)
SELECT 
  o.user_id,
  o.pet_id,
  o.id as order_id,
  oi.id as order_item_id,
  CASE 
    WHEN JSON_EXTRACT(oi.meta, '$.plan_type') = 'weekly' THEN 'weekly'
    WHEN JSON_EXTRACT(oi.meta, '$.plan_type') = 'monthly' THEN 'monthly'
    WHEN JSON_EXTRACT(oi.meta, '$.plan_type') = 'quarterly' THEN 'quarterly'
    ELSE 'monthly'
  END as plan_type,
  CASE
    WHEN o.status = 'paid' AND DATE_ADD(o.created_at, INTERVAL 
      CASE JSON_EXTRACT(oi.meta, '$.plan_type')
        WHEN 'weekly' THEN 7
        WHEN 'monthly' THEN 30
        WHEN 'quarterly' THEN 90
        ELSE 30
      END DAY) > NOW() THEN 'active'
    WHEN o.status = 'paid' AND DATE_ADD(o.created_at, INTERVAL 
      CASE JSON_EXTRACT(oi.meta, '$.plan_type')
        WHEN 'weekly' THEN 7
        WHEN 'monthly' THEN 30
        WHEN 'quarterly' THEN 90
        ELSE 30
      END DAY) <= NOW() THEN 'expired'
    ELSE 'active'
  END as status,
  o.created_at as start_date,
  DATE_ADD(o.created_at, INTERVAL 
    CASE JSON_EXTRACT(oi.meta, '$.plan_type')
      WHEN 'weekly' THEN 7
      WHEN 'monthly' THEN 30
      WHEN 'quarterly' THEN 90
      ELSE 30
    END DAY) as end_date,
  JSON_EXTRACT(oi.meta, '$.daily_grams') as daily_grams,
  JSON_EXTRACT(oi.meta, '$.pouches_per_day') as pouches_per_day,
  JSON_EXTRACT(oi.meta, '$.total_pouches') as total_pouches,
  (oi.unit_price * oi.quantity) as price_per_period,
  0 as auto_renew
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE oi.meta IS NOT NULL
  AND JSON_EXTRACT(oi.meta, '$.type') = 'subscription'
  AND o.status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.order_item_id = oi.id
  );

