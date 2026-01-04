# Automated Reminders Cron Job Setup

This guide explains how to set up automated daily reminders for expiring subscriptions.

## Overview

The `send-reminders.js` script automatically sends email reminders to customers whose subscriptions are expiring within the next 7 days.

## Setup Options

### Option 1: System Cron (Recommended for Production)

1. **Open your crontab file:**
   ```bash
   crontab -e
   ```

2. **Add the following line to run daily at 9:00 AM:**
   ```bash
   0 9 * * * cd /path/to/The\ Pet\ Kitchen\ Website && /usr/bin/node backend/scripts/send-reminders.js >> /path/to/The\ Pet\ Kitchen\ Website/logs/reminders.log 2>&1
   ```

   **For the user's system:**
   ```bash
   0 9 * * * cd "/Users/hamadi/Downloads/The Pet Kitchen Website" && /usr/bin/node backend/scripts/send-reminders.js >> "/Users/hamadi/Downloads/The Pet Kitchen Website/logs/reminders.log" 2>&1
   ```

3. **Create logs directory (if it doesn't exist):**
   ```bash
   mkdir -p "/Users/hamadi/Downloads/The Pet Kitchen Website/logs"
   ```

4. **Find Node.js path (if `/usr/bin/node` doesn't work):**
   ```bash
   which node
   ```
   Use the output path instead of `/usr/bin/node`

### Option 2: Run at Different Times

To run at different times, modify the cron schedule:

- **Daily at 9 AM (current):** `0 9 * * *`
- **Daily at 8 AM:** `0 8 * * *`
- **Every 12 hours (9 AM and 9 PM):** `0 9,21 * * *`
- **Every Monday at 9 AM:** `0 9 * * 1`
- **Every weekday at 9 AM:** `0 9 * * 1-5`

Cron format: `minute hour day-of-month month day-of-week`

### Option 3: Test Run (Manual)

To test the script manually:

```bash
cd "/Users/hamadi/Downloads/The Pet Kitchen Website"
node backend/scripts/send-reminders.js
```

### Option 4: Node.js Cron Library (Alternative)

If you prefer to run it within your Node.js application, you can use a library like `node-cron`:

1. Install node-cron:
   ```bash
   npm install node-cron
   ```

2. Add to your server.js:
   ```javascript
   const cron = require('node-cron');
   const { main: sendReminders } = require('./scripts/send-reminders');

   // Run daily at 9 AM
   cron.schedule('0 9 * * *', () => {
     console.log('⏰ Running scheduled reminder emails...');
     sendReminders();
   });
   ```

## Verification

1. **Check cron is installed:**
   ```bash
   which crontab
   ```

2. **List your cron jobs:**
   ```bash
   crontab -l
   ```

3. **Check script has execute permissions:**
   ```bash
   ls -l backend/scripts/send-reminders.js
   ```

4. **Test the script:**
   ```bash
   cd "/Users/hamadi/Downloads/The Pet Kitchen Website"
   node backend/scripts/send-reminders.js
   ```

## Logs

Logs will be written to `logs/reminders.log` (if using the recommended cron setup above).

To view logs:
```bash
tail -f "/Users/hamadi/Downloads/The Pet Kitchen Website/logs/reminders.log"
```

## Troubleshooting

### Script doesn't run
- Check Node.js path is correct: `which node`
- Check script path is correct (use absolute paths in cron)
- Check file permissions: `chmod +x backend/scripts/send-reminders.js`
- Check cron service is running: `sudo service cron status` (Linux) or check System Preferences > Users & Groups > Login Items (macOS)

### Environment variables not loading
- Ensure `.env` file exists in project root
- Cron jobs don't inherit your shell environment, so the script uses `dotenv` to load variables

### Email sending fails
- Check SMTP credentials in `.env` file
- Verify email service is configured correctly
- Check server logs for detailed error messages

### No reminders sent
- Check if there are subscriptions expiring in the next 7 days
- Verify subscription statuses are 'active' or 'confirmed'
- Check that `reminder_sent` flag is not already set (script only sends once per subscription)

## Best Practices

1. **Run during business hours** (e.g., 9 AM) so you can monitor results
2. **Monitor logs regularly** to ensure the script is running
3. **Test in development** before deploying to production
4. **Keep logs** for at least 30 days to track reminder history
5. **Set up log rotation** to prevent log files from growing too large

## Log Rotation Setup

To prevent logs from growing too large, add log rotation:

Create `/etc/logrotate.d/pet-kitchen-reminders` (Linux):
```
/path/to/The Pet Kitchen Website/logs/reminders.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
}
```

