# All EmailJS Templates for The Pet Kitchen

This document contains all the email template codes you need to create in EmailJS.

## 📧 Required Templates

1. **Password Reset** (NEW - Required for password reset functionality)
2. **Order Confirmation** (Customer)
3. **New Order Notification** (Owner/Admin)

---

## 🔐 Template 1: Password Reset Email

**Template Name:** `Password Reset`

**Template ID Variable:** `EMAILJS_TEMPLATE_PASSWORD_RESET`

### Subject Line:
```
Reset Your Password - The Pet Kitchen
```

### HTML Content:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f4;
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
    }
    .header { 
      background: linear-gradient(135deg, #C9A36A 0%, #B8925A 100%); 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 500;
      letter-spacing: 1px;
    }
    .content { 
      padding: 40px 30px; 
      background: #ffffff;
    }
    .greeting {
      font-size: 18px;
      color: #2C2C2C;
      margin-bottom: 20px;
    }
    .message {
      color: #5A5A5A;
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .reset-button { 
      display: inline-block; 
      padding: 14px 32px; 
      background-color: #C9A36A; 
      color: white !important; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0.5px;
      transition: background-color 0.3s ease;
    }
    .reset-button:hover {
      background-color: #B8925A;
    }
    .link-fallback {
      background: #FDFCF9;
      border: 1px solid #E9DECE;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      word-break: break-all;
    }
    .link-fallback p {
      margin: 0 0 10px 0;
      font-size: 12px;
      color: #5A5A5A;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .link-fallback a {
      color: #C9A36A;
      word-break: break-all;
      font-size: 14px;
    }
    .warning {
      background: #FFF8E7;
      border-left: 4px solid #C9A36A;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .warning p {
      margin: 0;
      color: #5A5A5A;
      font-size: 14px;
    }
    .warning strong {
      color: #2C2C2C;
    }
    .footer { 
      background: #FDFCF9;
      padding: 30px; 
      text-align: center; 
      color: #5A5A5A; 
      font-size: 14px; 
      border-top: 1px solid #E9DECE;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: #C9A36A;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🐾 THE PET KITCHEN</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hello {{to_name}},
      </div>
      
      <div class="message">
        <p>We received a request to reset your password for your Pet Kitchen account.</p>
        <p>Click the button below to reset your password:</p>
      </div>
      
      <div class="button-container">
        <a href="{{reset_link}}" class="reset-button">Reset Password</a>
      </div>
      
      <div class="link-fallback">
        <p>Or copy and paste this link into your browser:</p>
        <a href="{{reset_link}}">{{reset_link}}</a>
      </div>
      
      <div class="warning">
        <p><strong>⏰ This link will expire in {{expiration_hours}} hour(s).</strong></p>
        <p>For security reasons, this link can only be used once.</p>
      </div>
      
      <div class="message">
        <p><strong>Didn't request this?</strong></p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged and no changes will be made to your account.</p>
      </div>
      
      <div class="message" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E9DECE;">
        <p>If you have any questions or concerns, please contact us.</p>
        <p>Best regards,<br>
        <strong>The Pet Kitchen Team</strong></p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>The Pet Kitchen</strong></p>
      <p>Premium Pet Food Delivery</p>
      <p>The heart of Kuwait</p>
      <p style="margin-top: 15px;">
        <a href="https://thepetkitchen.net">Visit our website</a> | 
        <a href="https://www.instagram.com/thepetkitchen.kw/">Follow us on Instagram</a>
      </p>
    </div>
  </div>
</body>
</html>
```

### Template Variables:
- `{{to_name}}` - User's name (or email if name not available)
- `{{to_email}}` - User's email address
- `{{reset_link}}` - Full reset link URL (e.g., `https://thepetkitchen.net/reset-password.html?token=abc123...`)
- `{{reset_token}}` - The reset token (for reference, usually not displayed)
- `{{expiration_hours}}` - Hours until expiration (always "1")

---

## 🛒 Template 2: Order Confirmation (Customer)

**Template Name:** `Order Confirmation`

**Template ID Variable:** `EMAILJS_TEMPLATE_USER_CONFIRMATION`

### Subject Line:
```
Order Confirmation - Order #{{order_id}} - The Pet Kitchen
```

### HTML Content:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f4;
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
    }
    .header { 
      background: linear-gradient(135deg, #C9A36A 0%, #B8925A 100%); 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 500;
      letter-spacing: 1px;
    }
    .header h2 {
      margin: 10px 0 0 0;
      font-size: 20px;
      font-weight: 400;
    }
    .content { 
      padding: 40px 30px; 
      background: #ffffff;
    }
    .greeting {
      font-size: 18px;
      color: #2C2C2C;
      margin-bottom: 20px;
    }
    .order-info { 
      background: #FDFCF9; 
      border: 1px solid #E9DECE;
      padding: 25px; 
      border-radius: 8px; 
      margin: 20px 0; 
    }
    .order-info h3 {
      color: #2C2C2C;
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 18px;
      border-bottom: 2px solid #C9A36A;
      padding-bottom: 10px;
    }
    .order-info p {
      margin: 10px 0;
      color: #5A5A5A;
    }
    .order-info strong {
      color: #2C2C2C;
      display: inline-block;
      min-width: 140px;
    }
    .order-items {
      background: white;
      border: 1px solid #E9DECE;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .order-item { 
      padding: 12px 0; 
      border-bottom: 1px solid #E9DECE; 
    }
    .order-item:last-child {
      border-bottom: none;
    }
    .total { 
      font-size: 20px; 
      font-weight: 600; 
      color: #C9A36A; 
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #C9A36A;
      text-align: right;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-paid {
      background: #F0FDF4;
      color: #166534;
    }
    .status-created {
      background: #FFF8E7;
      color: #854D0E;
    }
    .message {
      color: #5A5A5A;
      font-size: 16px;
      margin: 20px 0;
      line-height: 1.8;
    }
    .footer { 
      background: #FDFCF9;
      padding: 30px; 
      text-align: center; 
      color: #5A5A5A; 
      font-size: 14px; 
      border-top: 1px solid #E9DECE;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: #C9A36A;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🐾 THE PET KITCHEN</h1>
      <h2>Order Confirmation</h2>
    </div>
    
    <div class="content">
      <div class="greeting">
        Dear {{to_name}},
      </div>
      
      <div class="message">
        <p>Thank you for your order! We're excited to prepare fresh, premium meals for {{pet_name}}.</p>
      </div>
      
      <div class="order-info">
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> #{{order_id}}</p>
        <p><strong>Order Date:</strong> {{order_date}}</p>
        <p><strong>Status:</strong> 
          <span class="status-badge status-{{order_status}}">{{order_status}}</span>
        </p>
        {{#if payment_reference}}
        <p><strong>Payment Reference:</strong> {{payment_reference}}</p>
        {{/if}}
      </div>

      <div class="order-items">
        <h3 style="margin-top: 0; color: #2C2C2C; border-bottom: 2px solid #C9A36A; padding-bottom: 10px;">Order Items</h3>
        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; color: #5A5A5A; line-height: 1.8;">{{items}}</pre>
      </div>

      <div class="order-info">
        <p class="total">Total: {{order_total}} KD</p>
      </div>

      <div class="message">
        <p>We'll prepare your order with care and contact you soon regarding delivery details.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>
        <strong>The Pet Kitchen Team</strong></p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>The Pet Kitchen</strong></p>
      <p>Premium Pet Food Delivery</p>
      <p>The heart of Kuwait</p>
      <p style="margin-top: 15px;">
        <a href="https://thepetkitchen.net">Visit our website</a> | 
        <a href="https://www.instagram.com/thepetkitchen.kw/">Follow us on Instagram</a>
      </p>
    </div>
  </div>
</body>
</html>
```

### Template Variables:
- `{{to_name}}` - Customer's name
- `{{to_email}}` - Customer's email
- `{{order_id}}` - Order ID number
- `{{order_date}}` - Order date (formatted)
- `{{order_total}}` - Total amount in KD
- `{{order_status}}` - Order status (created, paid, etc.)
- `{{pet_name}}` - Pet's name
- `{{pet_type}}` - Pet type (dog/cat)
- `{{items}}` - Order items list (formatted string)
- `{{payment_reference}}` - Payment reference number

---

## 📬 Template 3: New Order Notification (Owner/Admin)

**Template Name:** `New Order Notification`

**Template ID Variable:** `EMAILJS_TEMPLATE_OWNER_NOTIFICATION`

### Subject Line:
```
🆕 New Order #{{order_id}} - {{order_total}} KD - The Pet Kitchen
```

### HTML Content:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: 'Arial', 'Helvetica', sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f4;
    }
    .email-container { 
      max-width: 700px; 
      margin: 0 auto; 
      background-color: #ffffff;
    }
    .header { 
      background: linear-gradient(135deg, #C9A36A 0%, #B8925A 100%); 
      color: white; 
      padding: 30px 20px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 500;
      letter-spacing: 1px;
    }
    .header h2 {
      margin: 10px 0 0 0;
      font-size: 20px;
      font-weight: 400;
    }
    .alert-banner {
      background: #FFF8E7;
      border-left: 4px solid #C9A36A;
      padding: 15px 30px;
      margin: 0;
      text-align: center;
      font-weight: 600;
      color: #2C2C2C;
    }
    .content { 
      padding: 40px 30px; 
      background: #ffffff;
    }
    .order-info { 
      background: #FDFCF9; 
      border: 1px solid #E9DECE;
      padding: 25px; 
      border-radius: 8px; 
      margin: 20px 0; 
    }
    .order-info h3 {
      color: #2C2C2C;
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 18px;
      border-bottom: 2px solid #C9A36A;
      padding-bottom: 10px;
    }
    .order-info p {
      margin: 10px 0;
      color: #5A5A5A;
    }
    .order-info strong {
      color: #2C2C2C;
      display: inline-block;
      min-width: 160px;
    }
    .order-items {
      background: white;
      border: 1px solid #E9DECE;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .order-items h3 {
      margin-top: 0;
      color: #2C2C2C;
      border-bottom: 2px solid #C9A36A;
      padding-bottom: 10px;
    }
    .total { 
      font-size: 22px; 
      font-weight: 600; 
      color: #C9A36A; 
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #C9A36A;
      text-align: right;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-paid {
      background: #F0FDF4;
      color: #166534;
    }
    .status-created {
      background: #FFF8E7;
      color: #854D0E;
    }
    .pet-info {
      background: #F0FDF4;
      border-left: 4px solid #4A8C89;
      padding: 15px 20px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .pet-info p {
      margin: 5px 0;
      color: #5A5A5A;
    }
    .footer { 
      background: #FDFCF9;
      padding: 30px; 
      text-align: center; 
      color: #5A5A5A; 
      font-size: 14px; 
      border-top: 1px solid #E9DECE;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🐾 THE PET KITCHEN</h1>
      <h2>New Order Notification</h2>
    </div>
    
    <div class="alert-banner">
      🆕 You have received a new order!
    </div>
    
    <div class="content">
      <div class="order-info">
        <h3>Order Information</h3>
        <p><strong>Order ID:</strong> #{{order_id}}</p>
        <p><strong>Order Date:</strong> {{order_date}} at {{order_time}}</p>
        <p><strong>Status:</strong> 
          <span class="status-badge status-{{order_status}}">{{order_status}}</span>
        </p>
        <p><strong>Total Amount:</strong> <span style="color: #C9A36A; font-weight: 600; font-size: 18px;">{{order_total}} KD</span></p>
      </div>

      <div class="order-info">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> {{customer_name}}</p>
        <p><strong>Email:</strong> {{customer_email}}</p>
      </div>

      {{#if pet_name}}
      <div class="pet-info">
        <h3 style="margin-top: 0; color: #2C2C2C;">Pet Information</h3>
        <p><strong>Pet Name:</strong> {{pet_name}}</p>
        <p><strong>Pet Type:</strong> {{pet_type}}</p>
        {{#if pet_breed}}
        <p><strong>Breed:</strong> {{pet_breed}}</p>
        {{/if}}
        {{#if pet_weight}}
        <p><strong>Weight:</strong> {{pet_weight}}</p>
        {{/if}}
      </div>
      {{/if}}

      <div class="order-items">
        <h3>Order Items</h3>
        <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; color: #5A5A5A; line-height: 1.8;">{{items}}</pre>
      </div>

      {{#if payment_reference}}
      <div class="order-info">
        <h3>Payment Information</h3>
        <p><strong>Payment Reference:</strong> {{payment_reference}}</p>
        {{#if payment_invoice_id}}
        <p><strong>Invoice ID:</strong> {{payment_invoice_id}}</p>
        {{/if}}
      </div>
      {{/if}}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E9DECE; color: #5A5A5A;">
        <p><strong>Action Required:</strong> Please review this order and proceed with fulfillment.</p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>The Pet Kitchen</strong></p>
      <p>Admin Notification System</p>
      <p>The heart of Kuwait</p>
    </div>
  </div>
</body>
</html>
```

### Template Variables:
- `{{order_id}}` - Order ID number
- `{{customer_name}}` - Customer's name
- `{{customer_email}}` - Customer's email
- `{{order_date}}` - Order date (formatted)
- `{{order_time}}` - Order time (formatted)
- `{{order_total}}` - Total amount in KD
- `{{order_status}}` - Order status
- `{{pet_name}}` - Pet's name (optional)
- `{{pet_type}}` - Pet type (optional)
- `{{pet_breed}}` - Pet breed (optional)
- `{{pet_weight}}` - Pet weight (optional)
- `{{items}}` - Order items list (formatted string)
- `{{payment_reference}}` - Payment reference (optional)
- `{{payment_invoice_id}}` - Payment invoice ID (optional)

---

## 📝 Setup Instructions

1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/admin/template)
2. Click **"Create New Template"** for each template above
3. Copy and paste the HTML content into the template editor
4. Set the subject line as specified
5. Save each template and copy the Template ID
6. Add the Template IDs to your `.env` file:

```env
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
EMAILJS_TEMPLATE_PASSWORD_RESET=template_xxxxx
EMAILJS_TEMPLATE_USER_CONFIRMATION=template_xxxxx
EMAILJS_TEMPLATE_OWNER_NOTIFICATION=template_xxxxx
FRONTEND_URL=https://thepetkitchen.net
```

## ✅ Testing

After creating the templates, test each one:
1. Use the "Test" button in EmailJS dashboard
2. Or trigger the actual emails through your application
3. Verify all variables are displaying correctly

---

**Note:** All templates use The Pet Kitchen brand colors (#C9A36A) and styling for consistency.

