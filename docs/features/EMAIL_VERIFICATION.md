# Email Verification System

## Overview

The Pet Kitchen now includes a comprehensive email verification system that ensures:
1. **Email addresses are real** - Users must verify they have access to their email
2. **No disposable/temporary emails** - Blocks temporary email services
3. **Email format validation** - Validates email format and domain
4. **Security** - Prevents fake accounts and spam

## Features

### ✅ Email Validation
- **Format validation** - RFC 5322 compliant email format checking
- **Domain validation** - Checks for suspicious patterns
- **Disposable email detection** - Blocks 30+ known temporary email services
- **API integration** - Optional integration with AbstractAPI for enhanced detection

### ✅ Email Verification Flow
1. User signs up with email
2. System checks if email is disposable/temporary
3. Verification email sent automatically
4. User clicks verification link
5. Email marked as verified in database

### ✅ Security Features
- **24-hour token expiry** - Verification links expire after 24 hours
- **One-time use tokens** - Tokens are cleared after verification
- **Rate limiting** - Prevents abuse of resend functionality
- **Secure token generation** - Cryptographically secure random tokens

## Database Schema

The system adds the following columns to the `users` table:

```sql
email_verified BOOLEAN DEFAULT FALSE
email_verified_at DATETIME NULL
verification_token VARCHAR(255) NULL
verification_token_expires_at DATETIME NULL
```

## Installation

### 1. Run Database Migration

```bash
mysql -u your_user -p your_database < backend/database/email_verification_migration.sql
```

Or manually run the SQL in your database client.

### 2. Environment Variables (Optional)

For enhanced disposable email detection, add to `.env`:

```env
ABSTRACT_API_KEY=your_api_key_here
```

Get a free API key from: https://www.abstractapi.com/api/email-validation

**Note:** The system works without this API key - it uses a built-in list of disposable email domains.

### 3. Frontend URL Configuration

Make sure `FRONTEND_URL` is set in your `.env`:

```env
FRONTEND_URL=http://localhost:8000  # For development
# or
FRONTEND_URL=https://thepetkitchen.net  # For production
```

## API Endpoints

### POST `/api/v1/auth/verify-email`

Verify an email address using a verification token.

**Request:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response (Success):**
```json
{
  "message": "Email verified successfully!",
  "verified": true
}
```

**Response (Already Verified):**
```json
{
  "message": "Email is already verified.",
  "verified": true
}
```

**Response (Error):**
```json
{
  "error": "Invalid or expired verification token. Please request a new verification email."
}
```

### POST `/api/v1/auth/resend-verification`

Resend verification email to user.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists and is unverified, we've sent a verification email."
}
```

## Frontend Usage

### Verify Email Page

Users are automatically redirected to `/verify-email.html?token=...` when they click the verification link in their email.

### Programmatic Verification

```javascript
// Verify email
const result = await window.authAPI.verifyEmail(token);
if (result.verified) {
  console.log('Email verified!');
}

// Resend verification email
await window.authAPI.resendVerification(email);
```

## Disposable Email Detection

The system blocks emails from known temporary email services including:
- 10minutemail.com
- tempmail.com
- guerrillamail.com
- mailinator.com
- And 25+ more...

### Adding Custom Domains

Edit `backend/services/emailVerification.js` and add to the `knownDisposableDomains` array.

## Email Templates

Verification emails include:
- Professional HTML template
- Clear call-to-action button
- Manual verification code (fallback)
- Security warnings
- 24-hour expiry notice

## User Experience

1. **Signup** - User creates account
2. **Email Sent** - Verification email sent automatically
3. **Verification** - User clicks link in email
4. **Success** - Email verified, user can access account

If verification fails:
- User can request resend
- Link expires after 24 hours
- New token generated on resend

## Security Considerations

1. **Token Security**
   - 32-byte cryptographically secure random tokens
   - Stored hashed in database (if needed)
   - One-time use only

2. **Rate Limiting**
   - Resend verification: 10 requests per 15 minutes
   - Prevents abuse and spam

3. **Privacy**
   - Doesn't reveal if email exists (security best practice)
   - Always returns success message for resend requests

## Testing

### Test Disposable Email Blocking

Try signing up with:
- `test@10minutemail.com` ❌ (Blocked)
- `user@tempmail.com` ❌ (Blocked)
- `real@example.com` ✅ (Allowed)

### Test Verification Flow

1. Sign up with a real email
2. Check email for verification link
3. Click link or use token
4. Verify email is marked as verified

### Test Resend

1. Sign up but don't verify
2. Use resend endpoint
3. Check email for new verification link

## Troubleshooting

### Emails Not Sending

1. Check email service configuration in `.env`
2. Verify SMTP credentials
3. Check server logs for errors
4. Test email service: `node -e "require('./backend/services/email').verifyConnection()"`

### Verification Not Working

1. Check database migration ran successfully
2. Verify token hasn't expired (24 hours)
3. Check token format in database
4. Review server logs for errors

### Disposable Emails Not Blocked

1. Check if domain is in the list
2. Add domain to `knownDisposableDomains` array
3. Verify API key if using AbstractAPI

## Future Enhancements

- [ ] Email deliverability checking (SMTP verification)
- [ ] Domain reputation checking
- [ ] Custom disposable email list management
- [ ] Admin dashboard for email verification status
- [ ] Bulk email verification for existing users

