# SMTP Setup Guide - Office 365 / Microsoft 365

## Configuration Complete ✅

Your SMTP has been configured to use Office 365 SMTP for sending emails from `no-reply@thepetkitchen.net`.

### Current Configuration

- **SMTP Server:** `smtp.office365.com`
- **Port:** `587` (STARTTLS)
- **Email:** `no-reply@thepetkitchen.net`
- **Display Name:** The Pet Kitchen
- **Secure:** STARTTLS (not SSL)

### Environment Variables Added

The following variables have been added to your `.env` file:

```env
OUTLOOK_EMAIL=no-reply@thepetkitchen.net
OUTLOOK_PASSWORD=m0443Bl7tpC5
OUTLOOK_NAME=The Pet Kitchen
ADMIN_EMAIL=no-reply@thepetkitchen.net
FRONTEND_URL=http://localhost:8000
```

### Testing

Run this command to test the SMTP connection:

```bash
cd backend
node -e "require('dotenv').config(); const { verifyConnection } = require('./services/email'); verifyConnection().then(result => console.log(result ? '✅ Connected' : '❌ Failed')).catch(err => console.error('Error:', err.message));"
```

### Important Notes

1. **Microsoft Entra ID (Azure AD) Integration:**
   - For basic SMTP authentication, the password you provided should work
   - If 2FA is enabled, you may need to create an **App Password** in Microsoft 365
   - App passwords can be created at: https://account.microsoft.com/security

2. **If Authentication Fails:**
   - Check if the account has SMTP enabled in Microsoft 365 admin center
   - Verify the password is correct
   - Try creating an app-specific password if 2FA is enabled
   - Check if the account requires OAuth2 instead of basic auth

3. **OAuth2 Authentication (Optional - More Secure):**
   If you want to use OAuth2 instead of password authentication (recommended for production), you'll need to:
   - Register your app in Microsoft Entra ID (Azure AD)
   - Configure API permissions for `Mail.Send`
   - Generate client ID and client secret
   - Update `backend/services/email.js` to use OAuth2

4. **Production Deployment:**
   - Update `FRONTEND_URL` to your production domain
   - Ensure `OUTLOOK_PASSWORD` is stored securely (consider using secrets management)
   - Consider using OAuth2 for better security

### Next Steps

1. ✅ SMTP configuration is complete
2. ✅ Email service is ready to use
3. 🔄 Restart your backend server to load the new environment variables
4. 🧪 Test sending an email through your application

### Restart Server

After updating `.env`, restart your backend server:

```bash
# If using node directly
cd backend
pkill -f "node.*server.js" || true
node server.js

# Or if using PM2
pm2 restart pet-kitchen-backend
```

