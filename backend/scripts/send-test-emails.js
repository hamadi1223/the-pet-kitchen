/**
 * Send All Test Emails
 * Sends all email templates to a test email address for testing
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const {
  sendOrderConfirmationToUser,
  sendPaymentReceivedEmail,
  sendShippingConfirmationEmail,
  sendWelcomeEmail,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
  sendSubscriptionReminderEmail,
  sendOrderCancelledEmail,
  sendOrderProcessingEmail,
  sendDeliveredConfirmationEmail,
  sendContactFormReceipt
} = require('../services/email');

const TEST_EMAIL = process.env.TEST_EMAIL || 'hamadeyee@gmail.com';

// Sample test data
const sampleOrder = {
  id: 999,
  total_amount: 25.500,
  created_at: new Date().toISOString(),
  payment_reference: 'TEST-PAY-123',
  payment_invoice_id: 'TEST-INV-456',
  status: 'paid'
};

const sampleUser = {
  email: TEST_EMAIL,
  name: 'Test User'
};

const sampleItems = [
  { product_name: 'Premium Dog Food - Chicken & Rice', quantity: 2, unit_price: 10.000 },
  { product_name: 'Premium Cat Food - Fish & Quinoa', quantity: 1, unit_price: 5.500 }
];

const samplePet = {
  name: 'Fluffy',
  type: 'dog',
  breed: 'Golden Retriever'
};

const sampleSubscription = {
  id: 1,
  plan_type: 'monthly',
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  total_pouches: 60,
  pouches_per_day: 2,
  price_per_period: 67.800
};

const sampleRefund = {
  id: 1,
  amount: 25.500,
  reason: 'Customer request',
  status: 'completed'
};

const sampleFormData = {
  name: 'Test User',
  email: TEST_EMAIL,
  phone: '+965 1234 5678',
  message: 'This is a test contact form submission.'
};

async function sendAllTestEmails() {
  console.log('📧 Starting to send all test emails to:', TEST_EMAIL);
  console.log('='.repeat(60));
  
  const results = [];
  
  try {
    // 1. Order Confirmation Email
    console.log('\n1️⃣ Sending Order Confirmation Email...');
    const result1 = await sendOrderConfirmationToUser(sampleOrder, sampleUser, sampleItems, samplePet);
    results.push({ name: 'Order Confirmation', success: result1.success, error: result1.error });
    console.log(result1.success ? '✅ Sent' : `❌ Failed: ${result1.error}`);
    
    // 2. Payment Received Email
    console.log('\n2️⃣ Sending Payment Received Email...');
    const result2 = await sendPaymentReceivedEmail(sampleOrder, sampleUser, sampleItems, samplePet);
    results.push({ name: 'Payment Received', success: result2.success, error: result2.error });
    console.log(result2.success ? '✅ Sent' : `❌ Failed: ${result2.error}`);
    
    // 3. Shipping Confirmation Email
    console.log('\n3️⃣ Sending Shipping Confirmation Email...');
    const result3 = await sendShippingConfirmationEmail(
      sampleOrder,
      sampleUser,
      'TRACK-TEST-123',
      '2025-01-15'
    );
    results.push({ name: 'Shipping Confirmation', success: result3.success, error: result3.error });
    console.log(result3.success ? '✅ Sent' : `❌ Failed: ${result3.error}`);
    
    // 4. Welcome Email
    console.log('\n4️⃣ Sending Welcome Email...');
    const result4 = await sendWelcomeEmail(TEST_EMAIL, 'Test User', 'http://localhost:8000');
    results.push({ name: 'Welcome Email', success: result4.success, error: result4.error });
    console.log(result4.success ? '✅ Sent' : `❌ Failed: ${result4.error}`);
    
    // 5. Email Verification Email
    console.log('\n5️⃣ Sending Email Verification Email...');
    const result5 = await sendEmailVerificationEmail(TEST_EMAIL, 'Test User', 'test-verification-token-12345');
    results.push({ name: 'Email Verification', success: result5.success, error: result5.error });
    console.log(result5.success ? '✅ Sent' : `❌ Failed: ${result5.error}`);
    
    // 6. Password Reset Email
    console.log('\n6️⃣ Sending Password Reset Email...');
    const result6 = await sendPasswordResetEmail(TEST_EMAIL, 'Test User', 'test-reset-token-67890');
    results.push({ name: 'Password Reset', success: result6.success, error: result6.error });
    console.log(result6.success ? '✅ Sent' : `❌ Failed: ${result6.error}`);
    
    // 7. Subscription Reminder Email
    console.log('\n7️⃣ Sending Subscription Reminder Email...');
    const result7 = await sendSubscriptionReminderEmail(TEST_EMAIL, 'Test User', sampleSubscription, samplePet);
    results.push({ name: 'Subscription Reminder', success: result7.success, error: result7.error });
    console.log(result7.success ? '✅ Sent' : `❌ Failed: ${result7.error}`);
    
    // 8. Order Cancelled Email
    console.log('\n8️⃣ Sending Order Cancelled Email...');
    const result8 = await sendOrderCancelledEmail(sampleOrder, sampleUser, sampleItems, samplePet, 'Customer request');
    results.push({ name: 'Order Cancelled', success: result8.success, error: result8.error });
    console.log(result8.success ? '✅ Sent' : `❌ Failed: ${result8.error}`);
    
    // 9. Order Processing Email
    console.log('\n9️⃣ Sending Order Processing Email...');
    const result9 = await sendOrderProcessingEmail(sampleOrder, sampleUser, 'Your order is being prepared for shipment.');
    results.push({ name: 'Order Processing', success: result9.success, error: result9.error });
    console.log(result9.success ? '✅ Sent' : `❌ Failed: ${result9.error}`);
    
    // 10. Delivered Confirmation Email
    console.log('\n🔟 Sending Delivered Confirmation Email...');
    const result10 = await sendDeliveredConfirmationEmail(sampleOrder, sampleUser);
    results.push({ name: 'Delivered Confirmation', success: result10.success, error: result10.error });
    console.log(result10.success ? '✅ Sent' : `❌ Failed: ${result10.error}`);
    
    // 11. Contact Form Receipt
    console.log('\n1️⃣1️⃣ Sending Contact Form Receipt...');
    const result11 = await sendContactFormReceipt(sampleFormData);
    results.push({ name: 'Contact Form Receipt', success: result11.success, error: result11.error });
    console.log(result11.success ? '✅ Sent' : `❌ Failed: ${result11.error}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Emails:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error || 'Unknown error'}`);
    });
  }
  
  console.log('\n📧 All emails sent to:', TEST_EMAIL);
  console.log('='.repeat(60));
  
  return results;
}

// Run if called directly
if (require.main === module) {
  sendAllTestEmails()
    .then(() => {
      console.log('\n✅ Test email sending completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { sendAllTestEmails };

