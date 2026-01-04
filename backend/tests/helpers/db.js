/**
 * Database Test Helpers
 * Provides utilities for test database setup and cleanup
 */

const pool = require('../../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Create test database schema
 */
async function setupTestDatabase() {
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await pool.execute(statement);
      } catch (err) {
        // Ignore "table already exists" errors
        if (!err.message.includes('already exists')) {
          console.warn('Schema statement failed:', err.message);
        }
      }
    }
    
    // Run enhancements migration
    const migrationPath = path.join(__dirname, '../../database/ecommerce_enhancements_migration.sql');
    if (fs.existsSync(migrationPath)) {
      const migration = fs.readFileSync(migrationPath, 'utf8');
      const migrationStatements = migration
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of migrationStatements) {
        try {
          await pool.execute(statement);
        } catch (err) {
          if (!err.message.includes('already exists') && !err.message.includes('Duplicate column')) {
            console.warn('Migration statement failed:', err.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Clean test database (truncate all tables)
 */
async function cleanTestDatabase() {
  const tables = [
    'order_items',
    'orders',
    'cart_items',
    'carts',
    'subscriptions',
    'pets',
    'users',
    'inventory',
    'addresses',
    'coupons',
    'order_notes',
    'refunds',
    'email_queue',
    'abandoned_carts',
    'product_variants',
    'product_images',
    'daily_reports',
    'stock_alerts',
    'products'
  ];
  
  try {
    // Disable foreign key checks
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    for (const table of tables) {
      try {
        await pool.execute(`TRUNCATE TABLE ${table}`);
      } catch (err) {
        // Table might not exist, ignore
        if (!err.message.includes("doesn't exist")) {
          console.warn(`Failed to truncate ${table}:`, err.message);
        }
      }
    }
    
    // Re-enable foreign key checks
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    console.error('Failed to clean test database:', error);
    throw error;
  }
}

/**
 * Reset database to clean state
 */
async function resetDatabase() {
  await cleanTestDatabase();
  await setupTestDatabase();
}

module.exports = {
  setupTestDatabase,
  cleanTestDatabase,
  resetDatabase
};

