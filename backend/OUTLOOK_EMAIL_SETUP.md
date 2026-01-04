# Outlook Email Setup Guide

This guide explains how to configure Outlook SMTP for sending emails from The Pet Kitchen application.

## 📧 Required Environment Variables

Add these to your `.env` file in the `backend` directory:

```env
# Outlook Email Configuration
OUTLOOK_EMAIL=your-email@outlook.com
OUTLOOK_PASSWORD=your-app-password
OUTLOOK_NAME=The Pet Kitchen
ADMIN_EMAIL=admin@outlook.com  # Optional: defaults to OUTLOOK_EMAIL
FRONTEND_URL=http://localhost:8000  # For password reset links
```

## 🔐 Setting Up Outlook App Password

Outlook requires an **App Password** for SMTP authentication (not your regular password).

### Steps to Create App Password:

1. **Go to Microsoft Account Security:**
   - Visit: https://account.microsoft.com/security
   - Sign in with your Outlook account

2. **Enable Two-Factor Authentication (if not already enabled):**
   - Go to "Security" → "Advanced security options"
   - Enable "Two-step verification"

3. **Create App Password:**
   - Go to "Security" → "Advanced security options"
   - Click "Create a new app password"
   - Give it a name (e.g., "Pet Kitchen Backend")
   - Copy the generated password (you'll only see it once!)

4. **Use the App Password:**
   - Use this app password in your `.env` file as `OUTLOOK_PASSWORD`
   - **Never use your regular Outlook password**

## 📝 Email Templates Included

The system includes three email templates:

1. **Order Confirmation** - Sent to customers when they place an order
2. **New Order Notification** - Sent to admin when a new order is received
3. **Password Reset** - Sent to users when they request a password reset

All templates are HTML-formatted and mobile-responsive.

## ✅ Testing

To test the email service:

1. Make sure your `.env` file has the correct Outlook credentials
2. Restart the backend server
3. Check the console for: `✅ Outlook SMTP connection verified`
4. Place a test order or request a password reset to verify emails are sent

## 🔧 Troubleshooting

### "Connection failed" error:
- Verify your Outlook email and app password are correct
- Make sure two-factor authentication is enabled
- Check that you're using an App Password, not your regular password

### "Authentication failed" error:
- Double-check your `OUTLOOK_EMAIL` and `OUTLOOK_PASSWORD`
- Ensure you're using an App Password (16 characters, no spaces)

### Emails not sending:
- Check server logs for error messages
- Verify the `OUTLOOK_EMAIL` and `OUTLOOK_PASSWORD` are set in `.env`
- Test the connection using the `verifyConnection()` function

## 📧 SMTP Settings

- **Host:** smtp-mail.outlook.com
- **Port:** 587
- **Security:** TLS (STARTTLS)
- **Authentication:** Required (email + app password)

## 🚀 Production Notes

- For production, use environment variables (never hardcode credentials)
- Consider using a dedicated Outlook account for sending emails
- Monitor email sending limits (Outlook has daily sending limits)
- Set up email monitoring/alerts for failed sends

