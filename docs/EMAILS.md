# Email System Documentation

**Last Updated**: January 2025  
**Total Templates**: 23 (15 customer-facing, 8 admin-facing)

---

## Overview

The Pet Kitchen uses a comprehensive email system built on:
- **Nodemailer** for email delivery
- **Office 365 SMTP** for sending
- **Base template system** (`emailBase.js`) for consistent design
- **Email queue** for reliability and retries

All templates follow a consistent design system with:
- Branded header with gradient background
- Consistent typography and spacing
- Responsive design for email clients
- Plain-text fallback support

---

## Email Templates

### Customer-Facing Emails

#### 1. Welcome Email
**Trigger**: User signs up  
**Function**: `sendWelcomeEmail(userEmail, userName, websiteUrl)`  
**Subject**: `Welcome to The Pet Kitchen!`  
**Content**: Welcome message, introduction to the brand, call-to-action to browse products

#### 2. Email Verification
**Trigger**: User signs up  
**Function**: `sendEmailVerificationEmail(userEmail, userName, verificationToken)`  
**Subject**: `Verify Your Email - The Pet Kitchen`  
**Content**: Verification link, instructions

#### 3. Password Reset
**Trigger**: User requests password reset  
**Function**: `sendPasswordResetEmail(userEmail, userName, resetToken)`  
**Subject**: `Reset Your Password - The Pet Kitchen`  
**Content**: Reset link, expiration notice

#### 4. Order Confirmation
**Trigger**: Order is created  
**Function**: `sendOrderConfirmationToUser(order, user, items, pet)`  
**Subject**: `Order Confirmation - Order #${order.id} - The Pet Kitchen`  
**Content**: Order summary, items table, payment details

#### 5. Payment Received / Invoice
**Trigger**: Payment is confirmed  
**Function**: `sendPaymentReceivedEmail(order, user, items, pet)`  
**Subject**: `Payment Received - Order #${order.id} - The Pet Kitchen`  
**Content**: Invoice details, payment confirmation, order items

#### 6. Order Processing Update
**Trigger**: Order status changes to "processing"  
**Function**: `sendOrderProcessingEmail(order, user, updateMessage)`  
**Subject**: `Order Update - Order #${order.id} - The Pet Kitchen`  
**Content**: Status update, order details

#### 7. Shipping Confirmation
**Trigger**: Order is shipped  
**Function**: `sendShippingConfirmationEmail(order, user, trackingNumber, estimatedDelivery)`  
**Subject**: `Your Order Has Shipped - Order #${order.id} - The Pet Kitchen`  
**Content**: Tracking number, tracking link, estimated delivery

#### 8. Delivered Confirmation
**Trigger**: Order is marked as delivered  
**Function**: `sendDeliveredConfirmationEmail(order, user)`  
**Subject**: `Order Delivered - Order #${order.id} - The Pet Kitchen`  
**Content**: Delivery confirmation, thank you message

#### 9. Order Cancelled
**Trigger**: Order is cancelled (by user or admin)  
**Function**: `sendOrderCancelledEmail(order, user, items, pet, reason)`  
**Subject**: `Order Cancelled - Order #${order.id} - The Pet Kitchen`  
**Content**: Cancellation notice, refund information if applicable

#### 10. Refund Initiated
**Trigger**: Refund is requested/initiated  
**Function**: `sendRefundInitiatedEmail(refund, order, user)`  
**Subject**: `Refund Initiated - Order #${order.id} - The Pet Kitchen`  
**Content**: Refund details, amount, processing timeline

#### 11. Refund Completed
**Trigger**: Refund is processed  
**Function**: `sendRefundCompletedEmail(refund, order, user)`  
**Subject**: `Refund Completed - Order #${order.id} - The Pet Kitchen`  
**Content**: Refund confirmation, payment reference

#### 12. Abandoned Cart Reminder
**Trigger**: Cart abandoned for 24+ hours (scheduled job)  
**Function**: `sendAbandonedCartEmail(cart, user, items)`  
**Subject**: `Don't Forget Your Cart - The Pet Kitchen`  
**Content**: Cart items, total amount, call-to-action

#### 13. Back-in-Stock Alert
**Trigger**: Product comes back in stock  
**Function**: `sendBackInStockEmail(product, user)`  
**Subject**: `${product.name} is Back in Stock! - The Pet Kitchen`  
**Content**: Product name, link to product page

#### 14. Subscription Reminder
**Trigger**: Subscription expiring soon (7 days)  
**Function**: `sendSubscriptionReminderEmail(subscription, user, pet)`  
**Subject**: `Your Subscription is Expiring Soon - The Pet Kitchen`  
**Content**: Subscription details, renewal link

#### 15. Contact Form Receipt
**Trigger**: User submits contact form  
**Function**: `sendContactFormReceipt(formData)`  
**Subject**: `Thank You for Contacting Us - The Pet Kitchen`  
**Content**: Confirmation, message copy, response timeline

---

### Admin-Facing Emails

#### 16. New Order Notification
**Trigger**: New order is created  
**Function**: `sendNewOrderNotificationToOwner(order, user, items, pet)`  
**Subject**: `New Order #${order.id} - The Pet Kitchen`  
**Content**: Order summary, customer details, items list

#### 17. Payment Failed Alert
**Trigger**: Payment fails  
**Function**: `sendPaymentFailedAlert(order, user, errorMessage)`  
**Subject**: `⚠️ Payment Failed - Order #${order.id} - The Pet Kitchen`  
**Content**: Order details, error message, customer contact

#### 18. High-Risk Order Flag
**Trigger**: Order flagged by fraud detection  
**Function**: `sendHighRiskOrderAlert(order, user, riskFactors)`  
**Subject**: `🚨 High-Risk Order - Order #${order.id} - The Pet Kitchen`  
**Content**: Risk factors, order details, review recommendation

#### 19. Low Stock Alert
**Trigger**: Product stock falls below threshold (scheduled check)  
**Function**: `sendLowStockAlert(products)`  
**Subject**: `📦 Low Stock Alert - ${products.length} Product(s) - The Pet Kitchen`  
**Content**: List of low stock products, quantities, thresholds

#### 20. Daily Digest Report
**Trigger**: Daily at 8 AM (scheduled job)  
**Function**: `sendDailyReport(reportDate)`  
**Subject**: `📊 Daily Report - ${date} - The Pet Kitchen`  
**Content**: Orders, revenue, payments, customers, inventory, top products, failed payments

#### 21. Weekly KPI Summary (Optional)
**Trigger**: Weekly on Monday (scheduled job)  
**Status**: Not yet implemented  
**Content**: Weekly aggregated metrics, trends, comparisons

---

## Email Queue System

### Overview

The email queue system (`emailQueue.js`) provides:
- **Reliability**: Failed emails are retried automatically
- **Tracking**: All emails are logged in `email_queue` table
- **Retry Logic**: Up to 3 attempts per email
- **Status Tracking**: pending → sent / failed

### Usage

```javascript
const { queueEmail } = require('./services/emailQueue');

// Queue an email (non-blocking)
await queueEmail(
  'user@example.com',
  'Subject',
  '<html>...</html>',
  'Plain text version'
);
```

### Processing Queue

The queue is processed by:
1. **Scheduled job**: Run `processEmailQueue()` every 5 minutes
2. **Manual trigger**: Admin endpoint (to be added)
3. **On-demand**: Call `processEmailQueue()` directly

### Queue Statistics

```javascript
const { getQueueStats } = require('./services/emailQueue');
const stats = await getQueueStats();
// Returns: [{ status: 'pending', count: 5, total_attempts: 10 }, ...]
```

---

## Email Configuration

### Environment Variables

```env
OUTLOOK_EMAIL=no-reply@thepetkitchen.net
OUTLOOK_PASSWORD=your-password
OUTLOOK_NAME=The Pet Kitchen
ADMIN_EMAIL=no-reply@thepetkitchen.net
FRONTEND_URL=https://thepetkitchen.net
```

### SMTP Settings

- **Host**: `smtp.office365.com`
- **Port**: `587`
- **Security**: STARTTLS
- **Authentication**: Username/password

---

## Template Design System

All templates use the base template system (`emailBase.js`) which provides:

### Components

1. **Base Template**: Wrapper with header, content, footer
2. **Section**: Content section with title and optional icon
3. **Detail Row**: Label-value pair
4. **Metrics Grid**: Grid of key metrics
5. **Highlight Tip**: Alert/notice box
6. **Button**: Call-to-action button

### Design Tokens

- **Primary Color**: `#C6A769` (gold)
- **Background**: `#FDFBF7` (light beige)
- **Text**: `#333` (dark gray)
- **Border**: `#F0E8D9` (light border)
- **Font**: Georgia serif for headings, system sans-serif for body

---

## Email Client Compatibility

Templates are tested and optimized for:
- ✅ Gmail (web, iOS, Android)
- ✅ Outlook (desktop, web, mobile)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ⚠️ Outlook 2007-2016 (limited CSS support)

### Best Practices

- Inline styles for critical CSS
- Table-based layouts for compatibility
- Fallback fonts
- Plain-text version included
- Preheader text for preview

---

## Scheduled Jobs

### Daily Reports
```bash
# Cron: Daily at 8 AM
0 8 * * * cd /path/to/backend && node scripts/send-daily-report.js
```

### Subscription Reminders
```bash
# Cron: Daily at 9 AM
0 9 * * * cd /path/to/backend && node scripts/send-reminders.js
```

### Email Queue Processing
```bash
# Cron: Every 5 minutes
*/5 * * * * cd /path/to/backend && node scripts/process-email-queue.js
```

### Abandoned Cart Reminders
```bash
# Cron: Daily at 10 AM
0 10 * * * cd /path/to/backend && node scripts/send-abandoned-cart-reminders.js
```

---

## Testing Emails

### Preview Templates

Create a test script:
```javascript
const { getOrderConfirmationTemplate } = require('./services/email');
const fs = require('fs');

const html = getOrderConfirmationTemplate(orderData, userData, items, pet);
fs.writeFileSync('preview.html', html);
// Open preview.html in browser
```

### Send Test Email

```javascript
const { sendEmail } = require('./services/email');
await sendEmail('test@example.com', 'Test', '<html>Test email</html>');
```

---

## Troubleshooting

### Emails Not Sending

1. Check SMTP credentials in `.env`
2. Verify Office 365 SMTP is enabled
3. Check email queue for failed emails
4. Review server logs for errors

### Queue Not Processing

1. Ensure cron job is running
2. Check database connection
3. Review `email_queue` table for stuck emails
4. Manually trigger `processEmailQueue()`

### Template Rendering Issues

1. Test in multiple email clients
2. Check for unclosed HTML tags
3. Verify base template is included
4. Test with sample data

---

## Future Enhancements

- [ ] i18n support (Arabic/English)
- [ ] Email preferences/unsubscribe
- [ ] A/B testing for subject lines
- [ ] Email analytics (open rates, clicks)
- [ ] Template preview tool in admin
- [ ] Custom email templates per product category

---

## Support

For email-related issues:
1. Check `backend/logs/` for error logs
2. Review `email_queue` table for failed emails
3. Test SMTP connection: `node -e "require('./services/email').verifyConnection()"`

