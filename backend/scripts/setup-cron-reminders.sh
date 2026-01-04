#!/bin/bash

# Setup script for automated reminder cron job
# This script helps you add the reminder cron job to your system

PROJECT_DIR="/Users/hamadi/Downloads/The Pet Kitchen Website"
NODE_PATH="/opt/homebrew/bin/node"
SCRIPT_PATH="$PROJECT_DIR/backend/scripts/send-reminders.js"
LOG_FILE="$PROJECT_DIR/logs/reminders.log"

echo "🔧 Setting up automated reminder cron job..."
echo ""

# Check if Node.js exists
if [ ! -f "$NODE_PATH" ]; then
    echo "❌ Node.js not found at $NODE_PATH"
    echo "   Please update NODE_PATH in this script with the correct path"
    echo "   Find it with: which node"
    exit 1
fi

# Check if script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Script not found at $SCRIPT_PATH"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"
echo "✅ Logs directory created/verified"

# Create the cron command
CRON_COMMAND="0 9 * * * cd \"$PROJECT_DIR\" && $NODE_PATH \"$SCRIPT_PATH\" >> \"$LOG_FILE\" 2>&1"

echo ""
echo "📋 Cron command to add:"
echo "   $CRON_COMMAND"
echo ""
echo "⚠️  To add this cron job manually:"
echo "   1. Run: crontab -e"
echo "   2. Add the line above"
echo "   3. Save and exit"
echo ""
read -p "Would you like to add this cron job automatically? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "send-reminders.js"; then
        echo "⚠️  A reminder cron job already exists. Skipping..."
        echo "   To update it, remove the existing entry first: crontab -e"
    else
        # Add to crontab
        (crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -
        echo "✅ Cron job added successfully!"
        echo ""
        echo "📅 The reminder script will run daily at 9:00 AM"
        echo "📝 Logs will be written to: $LOG_FILE"
        echo ""
        echo "To verify, run: crontab -l"
        echo "To view logs: tail -f \"$LOG_FILE\""
    fi
else
    echo "❌ Cron job not added. You can add it manually using the command above."
fi

echo ""
echo "✨ Setup complete!"

