/**
 * Run Analytics Migration
 * Creates tables for analytics and metrics tracking
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'petkitchen',
    multipleStatements: true
  };

  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/analytics_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running analytics migration...');
    console.log('   - Creating analytics_events table');
    console.log('   - Creating ecommerce_metrics table');
    console.log('   - Creating user_sessions table');
    console.log('   - Creating product_views table');
    console.log('   - Creating cart_events table');
    
    await connection.query(migrationSQL);
    
    console.log('✅ Analytics migration completed successfully!');
    console.log('\n📊 Analytics tables created:');
    console.log('   ✅ analytics_events - Event tracking');
    console.log('   ✅ ecommerce_metrics - Aggregated metrics');
    console.log('   ✅ user_sessions - Session tracking');
    console.log('   ✅ product_views - Product view tracking');
    console.log('   ✅ cart_events - Cart activity tracking');

  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Some tables already exist, skipping...');
      console.log('   Migration partially completed (existing tables skipped)');
    } else {
      console.error('❌ Migration failed:', error.message);
      console.error('   Error code:', error.code);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();

