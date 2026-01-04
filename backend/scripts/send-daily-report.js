/**
 * Daily Admin Report Script
 * Run this script daily (via cron) to send daily reports to admins
 * 
 * Usage:
 *   node backend/scripts/send-daily-report.js
 * 
 * Cron example (daily at 8 AM):
 *   0 8 * * * cd /path/to/project && node backend/scripts/send-daily-report.js
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

const { sendDailyReport } = require('../services/reports');

async function main() {
  const startTime = new Date();
  console.log('='.repeat(60));
  console.log('📊 Starting daily report generation...');
  console.log(`📅 Date: ${startTime.toISOString()}`);
  console.log(`📅 Local time: ${startTime.toLocaleString()}`);
  console.log('='.repeat(60));
  
  try {
    // Send report for yesterday (default) or today if specified
    const reportDate = process.argv[2] ? new Date(process.argv[2]) : null;
    
    const result = await sendDailyReport(reportDate);
    
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    if (result.success) {
      console.log('✅ Daily report sent successfully!');
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(`📊 Report Data:`);
      console.log(`   Orders: ${result.reportData.orders.count}`);
      console.log(`   Gross Revenue: ${result.reportData.orders.grossRevenue.toFixed(3)} KD`);
      console.log(`   Net Revenue: ${result.reportData.orders.netRevenue.toFixed(3)} KD`);
      console.log(`   Payments Succeeded: ${result.reportData.payments.succeeded}`);
      console.log(`   Payments Failed: ${result.reportData.payments.failed}`);
      console.log(`   New Customers: ${result.reportData.customers.new}`);
      console.log(`   Returning Customers: ${result.reportData.customers.returning}`);
    } else {
      console.log('❌ Daily report failed!');
      console.log(`   Error: ${result.error}`);
    }
    console.log('='.repeat(60));
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Fatal error in daily report process:');
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

