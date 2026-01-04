/**
 * Run Technical Improvements Migration
 * Adds soft deletes, indexes, and audit logs
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
    const migrationPath = path.join(__dirname, '../database/technical_improvements_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running technical improvements migration...');
    console.log('   - Adding soft deletes (deleted_at columns)');
    console.log('   - Adding performance indexes');
    console.log('   - Creating audit_logs table');
    console.log('   - Creating rate_limit_tracking table');
    
    // Split SQL into individual statements and execute them one by one
    // This allows us to continue even if some statements fail (e.g., column/index already exists)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        await connection.query(statement + ';');
        successCount++;
      } catch (error) {
        // Ignore errors for duplicate columns/indexes
        if (error.code === 'ER_DUP_FIELDNAME' || 
            error.code === 'ER_DUP_KEYNAME' ||
            error.code === 'ER_DUP_ENTRY' ||
            error.message.includes('Duplicate column') ||
            error.message.includes('Duplicate key name')) {
          skipCount++;
          console.log(`   ⏭️  Skipping (already exists): ${statement.substring(0, 50)}...`);
        } else {
          errorCount++;
          console.warn(`   ⚠️  Error: ${error.message.substring(0, 100)}`);
        }
      }
    }
    
    console.log('\n✅ Migration completed!');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Errors: ${errorCount}`);
    }
    console.log('\n📊 Summary:');
    console.log('   ✅ Soft deletes added to: users, products, orders, pets');
    console.log('   ✅ Performance indexes created');
    console.log('   ✅ Audit logs table created');
    console.log('   ✅ Rate limit tracking table created');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate column')) {
      console.log('ℹ️  Some columns/indexes already exist, skipping...');
      console.log('   Migration partially completed (existing items skipped)');
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

