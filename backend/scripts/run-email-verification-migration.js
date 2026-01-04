/**
 * Run Email Verification Migration
 * 
 * This script runs the email verification database migration.
 * It adds the necessary columns to the users table for email verification.
 * 
 * Usage: node backend/scripts/run-email-verification-migration.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'petkitchen',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/email_verification_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running email verification migration...');

    // Execute migration
    await connection.query(migrationSQL);

    console.log('✅ Email verification migration completed successfully!');
    console.log('');
    console.log('The following columns have been added to the users table:');
    console.log('  - email_verified (BOOLEAN)');
    console.log('  - email_verified_at (DATETIME)');
    console.log('  - verification_token (VARCHAR)');
    console.log('  - verification_token_expires_at (DATETIME)');
    console.log('');
    console.log('You can now use the email verification system!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('');
      console.log('ℹ️  Some columns may already exist. This is okay - the migration will skip existing columns.');
    } else {
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run migration
runMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

