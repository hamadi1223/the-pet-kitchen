/**
 * Database Migration Script
 * Run this script to set up your database tables
 * 
 * Usage:
 *   Locally: node backend/scripts/run-migrations.js
 *   Railway: railway run node backend/scripts/run-migrations.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  console.log('📋 Database Config:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    // Don't log password for security
  });

  // Check required environment variables
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('❌ Missing required database environment variables!');
    console.error('Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    process.exit(1);
  }

  let connection;
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true, // Allow multiple SQL statements
      connectTimeout: 10000, // 10 second timeout
    });

    console.log('✅ Connected to database');

    // Read and execute main schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Running schema.sql...');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await connection.query(statement);
          console.log('✅ Executed statement');
        } catch (error) {
          // Ignore "table already exists" errors
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
            console.log('⚠️  Table already exists, skipping...');
          } else {
            throw error;
          }
        }
      }
    }

    // Run additional migrations if they exist
    const migrationFiles = [
      'email_verification_migration.sql',
      'subscriptions_migration.sql',
      'password_reset_migration.sql',
      'analytics_migration.sql',
      'technical_improvements_migration.sql',
      'ecommerce_enhancements_migration.sql',
      'meal_plans_migration.sql',
      'add_questionnaire_field.sql'
    ];

    console.log('📄 Running additional migrations...');
    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(__dirname, '../database', migrationFile);
      if (fs.existsSync(migrationPath)) {
        try {
          const migration = fs.readFileSync(migrationPath, 'utf8');
          const migrationStatements = migration
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

          for (const statement of migrationStatements) {
            if (statement.length > 0) {
              await connection.query(statement);
              console.log(`✅ Executed ${migrationFile}`);
            }
          }
        } catch (error) {
          // Ignore "already exists" errors for migrations
          if (error.code === 'ER_DUP_FIELDNAME' || 
              error.code === 'ER_TABLE_EXISTS_ERROR' ||
              error.message.includes('already exists') ||
              error.message.includes('Duplicate column')) {
            console.log(`⚠️  ${migrationFile} already applied, skipping...`);
          } else {
            console.error(`❌ Error running ${migrationFile}:`, error.message);
            // Don't exit - continue with other migrations
          }
        }
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('🎉 Database is ready to use!');

  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200));
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('\n✅ Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };

