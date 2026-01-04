/**
 * Automated Reminder Script
 * Run this script daily (via cron) to send reminder emails for expiring subscriptions
 * 
 * Usage:
 *   node backend/scripts/send-reminders.js
 * 
 * Cron example (daily at 9 AM):
 *   0 9 * * * cd /path/to/project && node backend/scripts/send-reminders.js
 */

// Load environment variables
const path = require('path');
const dotenvPath = path.join(__dirname, '../../.env');
require('dotenv').config({ path: dotenvPath });

// Check if .env file exists
const fs = require('fs');
if (!fs.existsSync(dotenvPath)) {
  console.error('❌ Error: .env file not found at:', dotenvPath);
  console.error('Please ensure .env file exists with required configuration.');
  process.exit(1);
}

const { sendExpiringSubscriptionReminders } = require('../services/reminders');

async function main() {
  const startTime = new Date();
  console.log('='.repeat(60));
  console.log('⏰ Starting automated reminder process...');
  console.log(`📅 Date: ${startTime.toISOString()}`);
  console.log(`📅 Local time: ${startTime.toLocaleString()}`);
  console.log('='.repeat(60));
  
  try {
    // Send reminders for subscriptions expiring in the next 7 days
    const results = await sendExpiringSubscriptionReminders(7);
    
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Reminder process completed!');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Results:`);
    console.log(`   Total subscriptions: ${results.total}`);
    console.log(`   Emails sent: ${results.sent}`);
    console.log(`   Failed: ${results.failed}`);
    
    if (results.errors && results.errors.length > 0) {
      console.log(`\n⚠️  Errors (${results.errors.length}):`);
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(error)}`);
      });
    }
    
    console.log('='.repeat(60));
    
    // Exit with appropriate code (0 = success, 1 = failure)
    // Only exit with 1 if there were failures AND total > 0 (don't fail if just no subscriptions to process)
    const exitCode = (results.total > 0 && results.failed > 0) ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Fatal error in reminder process:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };

