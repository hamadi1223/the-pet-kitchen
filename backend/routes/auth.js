const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendPasswordResetEmail, sendEmailVerificationEmail, sendWelcomeEmail, sendNewUserRegisteredNotification } = require('../services/email');
const { authRateLimiter, authCheckRateLimiter, clearRateLimit } = require('../middleware/rateLimiter');
const { isDisposableEmail, isValidEmailFormat, checkEmailDomain } = require('../services/emailVerification');

const router = express.Router();

// Sign up (strict rate limit - 10 attempts per 15 minutes)
router.post('/signup', authRateLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').optional().trim(),
  body('phone').notEmpty().withMessage('Phone number is required').trim()
    .custom((value) => {
      // Remove formatting and check if it's a valid Kuwait number (8 digits) or has country code
      const cleanPhone = value.replace(/[\s\-()]/g, '');
      // Allow 8 digits (Kuwait local) or international format starting with +
      if (cleanPhone.length === 8 && /^[0-9]{8}$/.test(cleanPhone)) {
        return true; // Kuwait local number
      }
      if (cleanPhone.startsWith('+') && cleanPhone.length >= 10) {
        return true; // International format
      }
      throw new Error('Phone number must be 8 digits (Kuwait) or valid international format');
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, phone } = req.body;
    
    // Additional validation: phone is required
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Email validation: format check
    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Email validation: domain check
    const domainCheck = checkEmailDomain(email);
    if (!domainCheck.valid) {
      return res.status(400).json({ error: domainCheck.reason });
    }

    // Check for disposable/temporary emails
    const isDisposable = await isDisposableEmail(email);
    if (isDisposable) {
      return res.status(400).json({ 
        error: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.' 
      });
    }

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Format phone number (add +965 if not present and it's a Kuwait number)
    let formattedPhone = phone ? phone.trim() : null;
    if (formattedPhone) {
      // Remove any existing country code or formatting
      formattedPhone = formattedPhone.replace(/[\s\-()]/g, '');
      // If it doesn't start with +, assume it's a Kuwait number and add +965
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+965${formattedPhone}`;
      }
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours expiry

    // Insert user with email verification fields
    let result;
    try {
      // Try with all columns including verification
      [result] = await pool.execute(
        `INSERT INTO users (email, password_hash, name, phone, email_verified, verification_token, verification_token_expires_at) 
         VALUES (?, ?, ?, ?, FALSE, ?, ?)`,
        [email, passwordHash, name || null, formattedPhone, verificationToken, verificationExpires]
      );
    } catch (error) {
      // If verification columns don't exist, try without them (backward compatibility)
      if (error.code === 'ER_BAD_FIELD_ERROR' && 
          (error.message.includes('email_verified') || error.message.includes('verification_token'))) {
        console.warn('⚠️ Email verification columns not found, inserting without verification');
        try {
          // Try with phone column
          [result] = await pool.execute(
            'INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)',
            [email, passwordHash, name || null, formattedPhone]
          );
        } catch (phoneError) {
          // If phone column doesn't exist either, insert without it
          if (phoneError.code === 'ER_BAD_FIELD_ERROR' && phoneError.message.includes('phone')) {
            console.warn('⚠️ Phone column not found, inserting without phone');
        [result] = await pool.execute(
          'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
          [email, passwordHash, name || null]
        );
          } else {
            throw phoneError;
          }
        }
      } else {
        throw error;
      }
    }

    // Send verification email (non-blocking)
    try {
      await sendEmailVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', emailError);
      // Don't fail signup if email fails - user can request resend later
    }

    // Send welcome email (non-blocking - send after verification email)
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
      await sendWelcomeEmail(email, name, frontendUrl);
    } catch (welcomeEmailError) {
      console.error('⚠️ Failed to send welcome email:', welcomeEmailError);
      // Don't fail signup if welcome email fails
    }

    // Send admin notification for new user registration (non-blocking)
    try {
      const newUser = {
        id: result.insertId,
        email,
        name: name || null,
        phone: formattedPhone,
        created_at: new Date(),
        email_verified: false
      };
      await sendNewUserRegisteredNotification(newUser);
    } catch (adminEmailError) {
      console.error('⚠️ Failed to send admin notification for new user:', adminEmailError);
      // Don't fail signup if admin notification fails
    }

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId, email, role: 'user' },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        email,
        name,
        role: 'user',
        emailVerified: false
      },
      message: 'Account created successfully. Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Login (strict rate limit - 10 attempts per 15 minutes)
router.post('/login', authRateLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Clear rate limit on successful login (prevents lockout after successful auth)
    // This allows users to login even if they had failed attempts before
    const rateLimitKey = req.ip || req.connection.remoteAddress || email;
    if (rateLimitKey) {
      clearRateLimit(rateLimitKey);
      clearRateLimit(email); // Also clear by email if it was used as key
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user (lenient rate limit - 30 requests per minute for authenticated users)
router.get('/me', authCheckRateLimiter, authenticate, async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role
  });
});

// Forgot Password - Request password reset (strict rate limit)
router.post('/forgot-password', authRateLimiter, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const { email } = req.body;

    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, email, name FROM users WHERE email = ?',
      [email]
    );

    // Always return success (security: don't reveal if email exists)
    // But only send email if user exists
    if (users.length > 0) {
      const user = users[0];

      // Generate secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Set expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Invalidate any existing reset tokens for this user
      await pool.execute(
        'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
        [user.id]
      );

      // Store new reset token in database
      try {
        await pool.execute(
          'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
          [user.id, resetToken, expiresAt]
        );
      } catch (error) {
        // If table doesn't exist yet, log error but don't fail
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.error('❌ password_reset_tokens table does not exist. Please run the migration:');
          console.error('   backend/database/password_reset_migration.sql');
          // For development, we can still proceed but token won't be stored
          console.warn('⚠️ Continuing without database storage (development mode)');
        } else {
          throw error;
        }
      }

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, user.name, resetToken);
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Don't fail the request if email fails - token is still valid
      }
    }

    // Always return success message (security best practice)
    res.json({
      message: 'If an account with that email exists, we\'ve sent a reset link.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Still return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, we\'ve sent a reset link.'
    });
  }
});

// Reset Password - Submit new password with token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { token, password } = req.body;

    // Find valid reset token
    let tokenRecord;
    try {
      [tokenRecord] = await pool.execute(
        `SELECT prt.*, u.id as user_id, u.email 
         FROM password_reset_tokens prt
         JOIN users u ON prt.user_id = u.id
         WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > NOW()`,
        [token]
      );
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ 
          error: 'Password reset functionality not configured. Please contact support.' 
        });
      }
      throw error;
    }

    if (!tokenRecord || tokenRecord.length === 0) {
      return res.status(400).json({ 
        error: 'This reset link is invalid or has expired. Please request a new one.' 
      });
    }

    const resetToken = tokenRecord[0];
    const userId = resetToken.user_id;

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    // Mark token as used
    await pool.execute(
      'UPDATE password_reset_tokens SET used = 1 WHERE token = ?',
      [token]
    );

    // Invalidate all other reset tokens for this user
    await pool.execute(
      'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
      [userId]
    );

    res.json({
      message: 'Your password has been reset successfully.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// Verify Email - Verify email address with token
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { token } = req.body;

    // Find user with valid verification token
    let [users] = await pool.execute(
      `SELECT id, email, email_verified, verification_token_expires_at 
       FROM users 
       WHERE verification_token = ? AND (verification_token_expires_at IS NULL OR verification_token_expires_at > NOW())`,
      [token]
    );

    if (!users || users.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token. Please request a new verification email.' 
      });
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return res.json({ 
        message: 'Email is already verified.',
        verified: true 
      });
    }

    // Mark email as verified
    await pool.execute(
      `UPDATE users 
       SET email_verified = TRUE, 
           email_verified_at = NOW(),
           verification_token = NULL,
           verification_token_expires_at = NULL
       WHERE id = ?`,
      [user.id]
    );

    res.json({
      message: 'Email verified successfully!',
      verified: true
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Server error during email verification' });
  }
});

// Resend Verification Email
router.post('/resend-verification', authRateLimiter, [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const { email } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, email, name, email_verified FROM users WHERE email = ?',
      [email]
    );

    // Always return success (security: don't reveal if email exists)
    if (users.length > 0) {
      const user = users[0];

      // If already verified, don't send
      if (user.email_verified) {
        return res.json({
          message: 'Email is already verified.'
        });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24);

      // Update user with new token
      try {
        await pool.execute(
          `UPDATE users 
           SET verification_token = ?, 
               verification_token_expires_at = ?
           WHERE id = ?`,
          [verificationToken, verificationExpires, user.id]
        );

        // Send verification email
        await sendEmailVerificationEmail(user.email, user.name, verificationToken);
      } catch (error) {
        // If columns don't exist, skip
        if (error.code !== 'ER_BAD_FIELD_ERROR') {
          throw error;
        }
      }
    }

    // Always return success
    res.json({
      message: 'If an account with that email exists and is unverified, we\'ve sent a verification email.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.json({
      message: 'If an account with that email exists and is unverified, we\'ve sent a verification email.'
    });
  }
});

// Development endpoint to clear rate limits (only in development)
if (process.env.NODE_ENV !== 'production') {
  router.post('/clear-rate-limit', (req, res) => {
    const { clearRateLimit, clearAllRateLimits } = require('../middleware/rateLimiter');
    const { email, ip } = req.body;
    
    if (email) {
      clearRateLimit(email);
    }
    if (ip) {
      clearRateLimit(ip);
    }
    if (!email && !ip) {
      // Clear all if no specific key provided
      clearAllRateLimits();
    }
    
    res.json({ 
      message: 'Rate limit cleared',
      cleared: { email: !!email, ip: !!ip, all: !email && !ip }
    });
  });
}

module.exports = router;

