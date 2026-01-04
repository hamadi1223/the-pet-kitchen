-- SQL script to create admin account
-- Email: admin@admin.com
-- Password: admin123
-- Role: admin
-- 
-- This uses a pre-generated bcrypt hash for password "admin123"
-- Run this in phpMyAdmin or MySQL command line
--
-- RECOMMENDED: Use the Node.js script instead (scripts/create-admin.js)
-- It will generate the hash properly using the same bcrypt library as the backend

INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'admin@admin.com',
  '$2a$10$rOzJqJqJqJqJqJqJqJqJ.uJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',
  'Admin',
  'admin'
)
ON DUPLICATE KEY UPDATE 
  password_hash = '$2a$10$rOzJqJqJqJqJqJqJqJqJ.uJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',
  name = 'Admin',
  role = 'admin';

-- Note: The hash above is a placeholder. 
-- Please use the Node.js script (scripts/create-admin.js) to generate the correct hash.

