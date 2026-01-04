/**
 * Generate Test Password Reset Link
 * Creates a reset token for a user and outputs the reset link
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

async function generateTestResetLink(email) {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'petkitchen'
  };

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node generate-test-reset-link.js user@example.com');
    process.exit(1);
  }

  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Find user by email
    const [users] = await connection.execute(
      'SELECT id, email, name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.error(`❌ No user found with email: ${email}`);
      console.log('💡 Tip: Make sure the user exists in the database');
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log(`🔑 Generated token: ${resetToken.substring(0, 16)}...`);

    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Invalidate any existing reset tokens for this user
    await connection.execute(
      'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
      [user.id]
    );

    // Store new reset token in database
    await connection.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    // Get frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000' || 'https://thepetkitchen.net';
    const resetLink = `${frontendUrl}/reset-password.html?token=${resetToken}`;

    console.log('\n' + '='.repeat(60));
    console.log('🔗 PASSWORD RESET LINK:');
    console.log('='.repeat(60));
    console.log(resetLink);
    console.log('='.repeat(60));
    console.log('\n📋 Token Details:');
    console.log(`   User: ${user.name || user.email}`);
    console.log(`   Token: ${resetToken}`);
    console.log(`   Expires: ${expiresAt.toLocaleString()}`);
    console.log(`   Frontend URL: ${frontendUrl}`);
    console.log('\n💡 Copy the link above and open it in your browser to test the reset password flow.\n');

  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('❌ password_reset_tokens table does not exist.');
      console.log('💡 Run the migration first:');
      console.log('   node scripts/run-password-reset-migration.js');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Get email from command line argument
const email = process.argv[2];
generateTestResetLink(email);

