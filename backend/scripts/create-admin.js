// Script to create admin account
// 
// Usage:
//   1. Make sure you have installed dependencies: npm install
//   2. Make sure your .env file is configured with database credentials
//   3. Run: node scripts/create-admin.js
//
// This will create an admin account with:
//   Email: admin@admin.com
//   Password: admin123
//   Role: admin

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');

// Try to load .env file
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  console.log('Note: .env file not found, using environment variables');
}

async function createAdmin() {
  let connection;
  
  try {
    // Check for required environment variables
    if (!process.env.DB_USER || process.env.DB_PASSWORD === undefined || !process.env.DB_NAME) {
      throw new Error('Missing database credentials. Please configure your .env file with DB_HOST, DB_USER, DB_PASSWORD (can be empty), and DB_NAME.');
    }

    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to database');

    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);
    console.log('Password hashed');

    const adminEmail = 'admin@admin.com';

    // Check if admin already exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existing.length > 0) {
      // Update existing admin
      await connection.execute(
        'UPDATE users SET password_hash = ?, name = ?, role = ? WHERE email = ?',
        [passwordHash, 'Admin', 'admin', adminEmail]
      );
      console.log('✅ Admin account updated successfully!');
      console.log('   Email: admin@admin.com');
      console.log('   Password: admin123');
      console.log('   Role: admin');
    } else {
      // Create new admin
      await connection.execute(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [adminEmail, passwordHash, 'Admin', 'admin']
      );
      console.log('✅ Admin account created successfully!');
      console.log('   Email: admin@admin.com');
      console.log('   Password: admin123');
      console.log('   Role: admin');
    }

  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Access denied')) {
      console.error('\n💡 Tip: Make sure your database is running and .env file is configured.');
      console.error('   Required .env variables:');
      console.error('   - DB_HOST');
      console.error('   - DB_USER');
      console.error('   - DB_PASSWORD');
      console.error('   - DB_NAME');
    } else if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      console.error('\n💡 Tip: Missing database credentials in .env file.');
      console.error('   Create a .env file in the backend directory with:');
      console.error('   DB_HOST=localhost');
      console.error('   DB_USER=your_db_user');
      console.error('   DB_PASSWORD=your_db_password');
      console.error('   DB_NAME=petkitchen');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
createAdmin();

