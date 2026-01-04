# EmailJS Templates Setup Guide

This guide explains how to set up the three EmailJS email templates for The Pet Kitchen website.

## 📧 Email Templates Required

1. **Order Confirmation** (Customer) - `template_order_confirmation`
2. **New Order Notification** (Owner) - `template_new_order`
3. **Account Confirmation** (Customer) - `template_account_confirmation`

---

## 🔧 Setup Steps

### 1. Create EmailJS Templates

Go to your EmailJS dashboard: https://dashboard.emailjs.com/admin/template

#### Template 1: Order Confirmation (Customer)

**Template ID**: `template_order_confirmation`

**Subject**: `Order Confirmation - Order #{{order_number}}`

**Content** (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #C6A769; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .order-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .total { font-size: 1.2em; font-weight: bold; color: #C6A769; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐾 The Pet Kitchen</h1>
      <h2>Order Confirmation</h2>
    </div>
    <div class="content">
      <p>Dear {{customer_name}},</p>
      
      <p>Thank you for your order! We're excited to prepare fresh, premium meals for your pet.</p>
      
      <div class="order-info">
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> #{{order_number}}</p>
        <p><strong>Order Date:</strong> {{order_date}} at {{order_time}}</p>
        <p><strong>Status:</strong> {{order_status}}</p>
        {{#if invoice_id}}
        <p><strong>Invoice ID:</strong> {{invoice_id}}</p>
        {{/if}}
      </div>

      <div class="order-info">
        <h3>Order Items</h3>
        <pre style="white-space: pre-wrap; font-family: inherit;">{{items_list}}</pre>
      </div>

      <div class="order-info">
        <p class="total">Total: {{total}}</p>
      </div>

      {{#if delivery_info}}
      <div class="order-info">
        <h3>Delivery Information</h3>
        <pre style="white-space: pre-wrap; font-family: inherit;">{{delivery_info}}</pre>
      </div>
      {{/if}}

      <p>{{message}}</p>

      <p>If you have any questions, please don't hesitate to contact us.</p>

      <p>Best regards,<br>
      The Pet Kitchen Team</p>
    </div>
    <div class="footer">
      <p>The Pet Kitchen - Premium Pet Food Delivery</p>
      <p>The heart of Kuwait</p>
    </div>
  </div>
</body>
</html>
```

**Variables Used**:
- `{{customer_name}}`
- `{{customer_email}}`
- `{{order_number}}`
- `{{order_date}}`
- `{{order_time}}`
- `{{items_list}}`
- `{{subtotal}}`
- `{{total}}`
- `{{order_status}}`
- `{{invoice_id}}`
- `{{payment_method}}`
- `{{delivery_info}}`
- `{{message}}`

---

#### Template 2: New Order Notification (Owner)

**Template ID**: `template_new_order`

**Subject**: `New Order #{{order_number}} - {{total}}`

**Content** (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1B8A5A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .urgent { background: #FEE2E2; border-left: 4px solid #DC2626; }
    .total { font-size: 1.3em; font-weight: bold; color: #1B8A5A; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 New Order Received</h1>
    </div>
    <div class="content">
      <p><strong>New order has been placed and paid!</strong></p>
      
      <div class="order-info {{#if urgent}}urgent{{/if}}">
        <h3>Order Information</h3>
        <p><strong>Order Number:</strong> #{{order_number}}</p>
        <p><strong>Date & Time:</strong> {{order_date}} at {{order_time}}</p>
        <p><strong>Status:</strong> {{order_status}}</p>
        <p><strong>Payment Status:</strong> {{payment_status}}</p>
        {{#if invoice_id}}
        <p><strong>Invoice ID:</strong> {{invoice_id}}</p>
        {{/if}}
      </div>

      <div class="order-info">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> {{customer_name}}</p>
        <p><strong>Email:</strong> {{customer_email}}</p>
        <p><strong>Phone:</strong> {{customer_phone}}</p>
      </div>

      <div class="order-info">
        <h3>Order Items ({{item_count}} items, {{total_quantity}} total quantity)</h3>
        <pre style="white-space: pre-wrap; font-family: inherit;">{{items_list}}</pre>
      </div>

      <div class="order-info">
        <p class="total">Total Amount: {{total}}</p>
        <p><strong>Payment Method:</strong> {{payment_method}}</p>
      </div>

      {{#if delivery_address}}
      <div class="order-info">
        <h3>Delivery Address</h3>
        <p>{{delivery_address}}</p>
      </div>
      {{/if}}

      {{#if notes}}
      <div class="order-info">
        <h3>Special Notes</h3>
        <p>{{notes}}</p>
      </div>
      {{/if}}

      <p style="margin-top: 30px;">
        <a href="https://your-admin-url.com/admin.html" style="background: #1B8A5A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Order in Admin
        </a>
      </p>
    </div>
  </div>
</body>
</html>
```

**Variables Used**:
- `{{order_number}}`
- `{{order_date}}`
- `{{order_time}}`
- `{{customer_name}}`
- `{{customer_email}}`
- `{{customer_phone}}`
- `{{items_list}}`
- `{{item_count}}`
- `{{total_quantity}}`
- `{{subtotal}}`
- `{{total}}`
- `{{payment_method}}`
- `{{payment_status}}`
- `{{invoice_id}}`
- `{{delivery_address}}`
- `{{order_status}}`
- `{{urgent}}`
- `{{notes}}`

---

#### Template 3: Account Confirmation (Customer)

**Template ID**: `template_account_confirmation`

**Subject**: `Welcome to The Pet Kitchen! 🐾`

**Content** (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #C6A769; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .welcome-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C6A769; }
    .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .step { padding: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
    .button { display: inline-block; background: #C6A769; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐾 Welcome to The Pet Kitchen!</h1>
    </div>
    <div class="content">
      <p>Dear {{customer_name}},</p>
      
      <div class="welcome-box">
        <p><strong>{{welcome_message}}</strong></p>
        <p>Your account was created on {{account_created_date}} at {{account_created_time}}.</p>
      </div>

      <div class="steps">
        <h3>Get Started:</h3>
        <div class="step">1️⃣ Complete your pet's questionnaire to get personalized meal recommendations</div>
        <div class="step">2️⃣ Browse our meal plans and subscriptions</div>
        <div class="step">3️⃣ Start ordering fresh, premium meals for your pets</div>
      </div>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{website_url}}" class="button">Visit Our Website</a>
      </p>

      <p>If you have any questions, we're here to help:</p>
      <ul>
        <li><strong>Email:</strong> {{support_email}}</li>
        <li><strong>Phone:</strong> {{support_phone}}</li>
      </ul>

      <p>Thank you for choosing The Pet Kitchen!</p>

      <p>Best regards,<br>
      The Pet Kitchen Team</p>
    </div>
    <div class="footer">
      <p>The Pet Kitchen - Premium Pet Food Delivery</p>
      <p>The heart of Kuwait</p>
    </div>
  </div>
</body>
</html>
```

**Variables Used**:
- `{{customer_name}}`
- `{{customer_email}}`
- `{{account_created_date}}`
- `{{account_created_time}}`
- `{{welcome_message}}`
- `{{next_steps}}`
- `{{support_email}}`
- `{{support_phone}}`
- `{{website_url}}`

---

## ⚙️ Configuration

### Update EmailJS Config

In `js/email-service.js`, update the template IDs to match your EmailJS templates:

```javascript
const EMAILJS_CONFIG = {
  publicKey: 'YOUR_PUBLIC_KEY',
  serviceID: 'YOUR_SERVICE_ID',
  templates: {
    orderConfirmation: 'template_order_confirmation',    // Your template ID
    newOrderNotification: 'template_new_order',          // Your template ID
    accountConfirmation: 'template_account_confirmation' // Your template ID
  }
};
```

### Enable Email Sending

In `js/email-service.js`, set:

```javascript
const EMAIL_SENDING_ENABLED = true; // Change to true to enable emails
```

---

## 📋 Testing

### Test Order Confirmation Email

1. Complete a test order
2. Check order confirmation page loads
3. Check browser console for email sending logs
4. Verify email received

### Test Account Confirmation Email

1. Create a new account
2. Check browser console for email sending logs
3. Verify email received

### Test Owner Notification Email

1. Complete a test order
2. Check owner email inbox
3. Verify all order details are correct

---

## 🔍 Troubleshooting

### Emails Not Sending

1. Check `EMAIL_SENDING_ENABLED` is `true`
2. Verify EmailJS library is loaded (check console)
3. Verify template IDs match EmailJS dashboard
4. Check EmailJS service is active
5. Verify public key is correct

### Template Variables Not Showing

1. Verify variable names match exactly (case-sensitive)
2. Check EmailJS template has all required variables
3. Check browser console for errors

### Owner Email Not Received

1. Verify owner email is set in EmailJS service settings
2. Check spam folder
3. Verify template is correctly configured

---

## 📝 Notes

- Emails are sent from the frontend using EmailJS
- Order confirmation emails are sent when user views the confirmation page
- Account confirmation emails are sent immediately after signup
- All emails are non-blocking (won't break flow if they fail)
- Email sending can be disabled for testing by setting `EMAIL_SENDING_ENABLED = false`

---

**Last Updated**: December 2, 2025

