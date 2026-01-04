/**
 * Send All Admin Test Emails
 * Sends all admin notification emails to a test email address
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Override ADMIN_EMAIL for testing
process.env.ADMIN_EMAIL = process.env.TEST_EMAIL || 'hamadeyee@gmail.com';

const {
  sendNewOrderNotificationToOwner,
  sendPaymentFailedAlert,
  sendHighRiskOrderAlert,
  sendLowStockAlert,
  sendNewUserRegisteredNotification,
  sendOrderPaidNotification,
  sendOrderShippedNotification,
  sendOrderDeliveredNotification,
  sendSubscriptionCreatedNotification,
  sendSubscriptionExpiringAdminNotification,
  sendOutOfStockAlert,
  sendHighValueOrderAlert,
  sendCustomerSupportInquiryNotification
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
  email: 'customer@example.com',
  name: 'Test Customer',
  phone: '+965 1234 5678'
};

const sampleItems = [
  { product_name: 'Premium Dog Food - Chicken & Rice', quantity: 2, unit_price: 10.000 },
  { product_name: 'Premium Cat Food - Fish & Quinoa', quantity: 1, unit_price: 5.500 }
];

const samplePet = {
  name: 'Fluffy',
  type: 'dog',
  breed: 'Golden Retriever',
  weight_kg: 25.5
};

const sampleProducts = [
  {
    id: 1,
    name: 'Premium Dog Food - Chicken & Rice',
    sku: 'PK-DOG-001',
    quantity: 5,
    low_stock_threshold: 10
  },
  {
    id: 2,
    name: 'Premium Cat Food - Fish & Quinoa',
    sku: 'PK-CAT-001',
    quantity: 3,
    low_stock_threshold: 10
  }
];

const sampleOutOfStockProducts = [
  {
    id: 3,
    name: 'Premium Dog Food - Beef & Sweet Potato',
    sku: 'PK-DOG-002',
    quantity: 0,
    low_stock_threshold: 10
  },
  {
    id: 4,
    name: 'Premium Cat Food - Turkey & Quinoa',
    sku: 'PK-CAT-002',
    quantity: 0,
    low_stock_threshold: 10
  }
];

const sampleSubscription = {
  id: 101,
  plan_type: 'monthly',
  status: 'active',
  start_date: new Date(),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  daily_grams: 300,
  pouches_per_day: 2.5,
  total_pouches: 75,
  price_per_period: 84.750
};

const sampleInquiry = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+965 1234 5678',
  subject: 'Question about meal plans',
  message: 'I would like to know more about your customized meal plans for large breed dogs.',
  created_at: new Date()
};

async function sendAllAdminEmails() {
  console.log('📧 Starting to send all admin emails to:', TEST_EMAIL);
  console.log('='.repeat(60));
  
  const results = [];
  
  try {
    // 1. New Order Notification
    console.log('\n1️⃣ Sending New Order Notification...');
    const result1 = await sendNewOrderNotificationToOwner(sampleOrder, sampleUser, sampleItems, samplePet);
    results.push({ name: 'New Order Notification', success: result1.success, error: result1.error });
    console.log(result1.success ? '✅ Sent' : `❌ Failed: ${result1.error}`);
    
    // 2. Payment Failed Alert
    console.log('\n2️⃣ Sending Payment Failed Alert...');
    const result2 = await sendPaymentFailedAlert(sampleOrder, sampleUser, 'Payment gateway timeout - please retry');
    results.push({ name: 'Payment Failed Alert', success: result2.success, error: result2.error });
    console.log(result2.success ? '✅ Sent' : `❌ Failed: ${result2.error}`);
    
    // 3. High-Risk Order Alert
    console.log('\n3️⃣ Sending High-Risk Order Alert...');
    const result3 = await sendHighRiskOrderAlert(sampleOrder, sampleUser, ['Large order amount', 'New customer', 'Multiple payment attempts']);
    results.push({ name: 'High-Risk Order Alert', success: result3.success, error: result3.error });
    console.log(result3.success ? '✅ Sent' : `❌ Failed: ${result3.error}`);
    
    // 4. Low Stock Alert
    console.log('\n4️⃣ Sending Low Stock Alert...');
    const result4 = await sendLowStockAlert(sampleProducts);
    results.push({ name: 'Low Stock Alert', success: result4.success, error: result4.error });
    console.log(result4.success ? '✅ Sent' : `❌ Failed: ${result4.error}`);
    
    // 5. New User Registered Notification
    console.log('\n5️⃣ Sending New User Registered Notification...');
    const result5 = await sendNewUserRegisteredNotification(sampleUser);
    results.push({ name: 'New User Registered', success: result5.success, error: result5.error });
    console.log(result5.success ? '✅ Sent' : `❌ Failed: ${result5.error}`);
    
    // 6. Order Paid Notification
    console.log('\n6️⃣ Sending Order Paid Notification...');
    const result6 = await sendOrderPaidNotification(sampleOrder, sampleUser, sampleItems, samplePet);
    results.push({ name: 'Order Paid Notification', success: result6.success, error: result6.error });
    console.log(result6.success ? '✅ Sent' : `❌ Failed: ${result6.error}`);
    
    // 7. Order Shipped Notification
    console.log('\n7️⃣ Sending Order Shipped Notification...');
    const result7 = await sendOrderShippedNotification(sampleOrder, sampleUser, 'TPK-TRACK-12345');
    results.push({ name: 'Order Shipped Notification', success: result7.success, error: result7.error });
    console.log(result7.success ? '✅ Sent' : `❌ Failed: ${result7.error}`);
    
    // 8. Order Delivered Notification
    console.log('\n8️⃣ Sending Order Delivered Notification...');
    const result8 = await sendOrderDeliveredNotification(sampleOrder, sampleUser);
    results.push({ name: 'Order Delivered Notification', success: result8.success, error: result8.error });
    console.log(result8.success ? '✅ Sent' : `❌ Failed: ${result8.error}`);
    
    // 9. Subscription Created Notification
    console.log('\n9️⃣ Sending Subscription Created Notification...');
    const result9 = await sendSubscriptionCreatedNotification(sampleSubscription, sampleUser, samplePet);
    results.push({ name: 'Subscription Created Notification', success: result9.success, error: result9.error });
    console.log(result9.success ? '✅ Sent' : `❌ Failed: ${result9.error}`);
    
    // 10. Subscription Expiring Admin Notification
    console.log('\n🔟 Sending Subscription Expiring Admin Notification...');
    const result10 = await sendSubscriptionExpiringAdminNotification(sampleSubscription, sampleUser, samplePet, 7);
    results.push({ name: 'Subscription Expiring Admin Notification', success: result10.success, error: result10.error });
    console.log(result10.success ? '✅ Sent' : `❌ Failed: ${result10.error}`);
    
    // 11. Out of Stock Alert
    console.log('\n1️⃣1️⃣ Sending Out of Stock Alert...');
    const result11 = await sendOutOfStockAlert(sampleOutOfStockProducts);
    results.push({ name: 'Out of Stock Alert', success: result11.success, error: result11.error });
    console.log(result11.success ? '✅ Sent' : `❌ Failed: ${result11.error}`);
    
    // 12. High-Value Order Alert
    console.log('\n1️⃣2️⃣ Sending High-Value Order Alert...');
    const highValueOrder = { ...sampleOrder, total_amount: 75.500 }; // Above 50 KD threshold
    const result12 = await sendHighValueOrderAlert(highValueOrder, sampleUser, sampleItems, 50);
    results.push({ name: 'High-Value Order Alert', success: result12.success, error: result12.error });
    console.log(result12.success ? '✅ Sent' : `❌ Failed: ${result12.error}`);
    
    // 13. Customer Support Inquiry Notification
    console.log('\n1️⃣3️⃣ Sending Customer Support Inquiry Notification...');
    const result13 = await sendCustomerSupportInquiryNotification(sampleInquiry);
    results.push({ name: 'Customer Support Inquiry Notification', success: result13.success, error: result13.error });
    console.log(result13.success ? '✅ Sent' : `❌ Failed: ${result13.error}`);
    
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
  
  console.log('\n📧 All admin emails sent to:', TEST_EMAIL);
  console.log('='.repeat(60));
  
  return results;
}

// Run if called directly
if (require.main === module) {
  sendAllAdminEmails()
    .then(() => {
      console.log('\n✅ Admin test email sending completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { sendAllAdminEmails };

