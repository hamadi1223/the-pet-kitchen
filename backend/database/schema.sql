-- The Pet Kitchen Database Schema
-- Run this in GoDaddy's phpMyAdmin or via MySQL command line

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(191) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(191) NULL,
  role            ENUM('user', 'admin') DEFAULT 'user',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pets table
CREATE TABLE IF NOT EXISTS pets (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  name            VARCHAR(191) NOT NULL,
  type            ENUM('dog', 'cat') NOT NULL,
  breed           VARCHAR(191) NULL,
  weight_kg       DECIMAL(5,2) NULL,
  age_group       ENUM('puppy', 'kitten', 'adult', 'senior') NULL,
  activity_level  ENUM('low', 'normal', 'high') NULL,
  goal            ENUM('maintain', 'lose_weight', 'gain_weight') NULL,
  notes           TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  sku             VARCHAR(191) NOT NULL UNIQUE,
  name            VARCHAR(191) NOT NULL,
  description     TEXT NULL,
  species         ENUM('dog', 'cat', 'both') NOT NULL DEFAULT 'both',
  price_per_pouch DECIMAL(10,3) NOT NULL,
  pouch_grams     INT NOT NULL DEFAULT 150,
  is_subscription TINYINT(1) NOT NULL DEFAULT 0,
  subscription_type ENUM('weekly', 'monthly', 'quarterly') NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  stock_quantity  INT DEFAULT 0,
  stock_reserved  INT DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sku (sku),
  INDEX idx_species (species),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carts table
CREATE TABLE IF NOT EXISTS carts (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NULL,
  session_id      VARCHAR(191) NULL,
  status          ENUM('active', 'converted', 'abandoned') NOT NULL DEFAULT 'active',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  cart_id         INT NOT NULL,
  product_id      INT NOT NULL,
  quantity        INT NOT NULL,
  unit_price      DECIMAL(10,3) NOT NULL,
  meta            JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_cart_id (cart_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NULL,
  pet_id              INT NULL,
  email               VARCHAR(191) NOT NULL,
  status              ENUM('created', 'paid', 'cancelled', 'failed', 'fulfilled') NOT NULL DEFAULT 'created',
  total_amount        DECIMAL(10,3) NOT NULL,
  payment_provider    VARCHAR(50) NOT NULL DEFAULT 'myfatoorah',
  payment_invoice_id  VARCHAR(191) NULL,
  payment_reference   VARCHAR(191) NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_pet_id (pet_id),
  INDEX idx_status (status),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_id        INT NOT NULL,
  product_id      INT NOT NULL,
  quantity        INT NOT NULL,
  unit_price      DECIMAL(10,3) NOT NULL,
  meta            JSON NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default products (adjust prices as needed)
INSERT INTO products (sku, name, description, species, price_per_pouch, pouch_grams, is_subscription, subscription_type, is_active) VALUES
('DOG-CHICKEN', 'Chicken & Brown Rice', 'Premium chicken meal for dogs', 'dog', 1.13, 150, 0, NULL, 1),
('DOG-BEEF', 'Beef & Sweet Potato', 'Premium beef meal for dogs', 'dog', 1.13, 150, 0, NULL, 1),
('DOG-FISH', 'White Fish & Quinoa', 'Premium fish meal for dogs', 'dog', 1.13, 150, 0, NULL, 1),
('CAT-CHICKEN', 'Chicken Recipe', 'Premium chicken meal for cats', 'cat', 1.13, 150, 0, NULL, 1),
('CAT-BEEF', 'Beef Recipe', 'Premium beef meal for cats', 'cat', 1.13, 150, 0, NULL, 1),
('CAT-FISH', 'White Fish & Sardine', 'Premium fish meal for cats', 'cat', 1.13, 150, 0, NULL, 1),
('SAMPLE-BOX', 'Sample Box', '6 pouches variety pack', 'both', 12.00, 150, 0, NULL, 1),
('SUB-WEEKLY-DOG', 'Weekly Subscription (Dog)', 'Weekly fresh food delivery for dogs', 'dog', 1.28, 150, 1, 'weekly', 1),
('SUB-MONTHLY-DOG', 'Monthly Subscription (Dog)', 'Monthly fresh food delivery for dogs', 'dog', 1.13, 150, 1, 'monthly', 1),
('SUB-QUARTERLY-DOG', '3-Month Subscription (Dog)', '3-month fresh food delivery for dogs', 'dog', 1.08, 150, 1, 'quarterly', 1),
('SUB-WEEKLY-CAT', 'Weekly Subscription (Cat)', 'Weekly fresh food delivery for cats', 'cat', 1.28, 150, 1, 'weekly', 1),
('SUB-MONTHLY-CAT', 'Monthly Subscription (Cat)', 'Monthly fresh food delivery for cats', 'cat', 1.13, 150, 1, 'monthly', 1),
('SUB-QUARTERLY-CAT', '3-Month Subscription (Cat)', '3-month fresh food delivery for cats', 'cat', 1.08, 150, 1, 'quarterly', 1)
ON DUPLICATE KEY UPDATE name=name;

