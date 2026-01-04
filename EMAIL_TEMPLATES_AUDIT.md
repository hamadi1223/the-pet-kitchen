# Email Templates Audit

## Templates Found

### 1. **Questionnaire Email** (Reference Design)
- **Location**: `backend/routes/email.js` - `getQuestionnaireEmailTemplate()`
- **Sending Mechanism**: Nodemailer (via `/api/v1/email/questionnaire` endpoint)
- **Recipient**: Admin
- **Subject**: `New Pet Food Inquiry - {pet_name} ({pet_type})`
- **Variables**: `formData.*`, `recommendation.*`

### 2. **Order Confirmation Email**
- **Location**: `backend/services/email.js` - `getOrderConfirmationTemplate()`
- **Sending Mechanism**: Nodemailer
- **Recipient**: Customer
- **Subject**: `Order Confirmation - Order #{order.id}`
- **Variables**: `order.*`, `user.*`, `items[]`, `pet.*`

### 3. **New Order Notification Email**
- **Location**: `backend/services/email.js` - `getNewOrderNotificationTemplate()`
- **Sending Mechanism**: Nodemailer
- **Recipient**: Admin
- **Subject**: `🔔 New Order #{order.id} - {total} KD`
- **Variables**: `order.*`, `user.*`, `items[]`, `pet.*`

### 4. **Password Reset Email**
- **Location**: `backend/services/email.js` - `getPasswordResetTemplate()`
- **Sending Mechanism**: Nodemailer
- **Recipient**: Customer
- **Subject**: `Password Reset Request - The Pet Kitchen`
- **Variables**: `userEmail`, `userName`, `resetLink`, `resetToken`

### 5. **Welcome Email**
- **Location**: `backend/services/email.js` - `getWelcomeEmailTemplate()`
- **Sending Mechanism**: Nodemailer
- **Recipient**: Customer
- **Subject**: `🐾 Welcome to The Pet Kitchen - Your Pet's Wellness Journey Starts Here!`
- **Variables**: `userEmail`, `userName`, `websiteUrl`

### 6. **Email Verification Email**
- **Location**: `backend/services/email.js` - `getEmailVerificationTemplate()`
- **Sending Mechanism**: Nodemailer
- **Recipient**: Customer
- **Subject**: `Verify Your Email Address - The Pet Kitchen`
- **Variables**: `userEmail`, `userName`, `verificationLink`, `verificationToken`

### 7. **Subscription Reminder Email**
- **Location**: `backend/services/email.js` - `getSubscriptionReminderTemplate()`
- **Sending Mechanism**: Nodemailer
- **Recipient**: Customer
- **Subject**: `⏰ Your Pet Kitchen Subscription Expires in {days} Day(s)`
- **Variables**: `userEmail`, `userName`, `subscription.*`, `pet.*`

### 8. **Order Cancelled Email**
- **Location**: `backend/services/email.js` - `getOrderCancelledTemplate()`
- **Sending Mechanism**: Nodemailer
- **Recipient**: Customer
- **Subject**: `Order #{order.id} Has Been Cancelled - The Pet Kitchen`
- **Variables**: `order.*`, `user.*`, `items[]`, `pet.*`, `reason`

## Reference Design Analysis

Based on the questionnaire template and welcome email, the reference design includes:

- **Outer Background**: `#f5f5f5`
- **Container**: `max-width: 600px`, `margin: 0 auto`, `background: #ffffff`, rounded corners, shadow
- **Header**: Gradient background (`linear-gradient(135deg, #C6A769 0%, #A8925A 100%)`), white text, centered
- **Brand Title**: Large serif/sans-serif font, centered
- **Tagline**: Smaller text below title, opacity 0.95
- **Content Padding**: `40px 30px`
- **Section Cards**: Light background (`#F8F9FA` or `#FFFBF0`), rounded corners, left border accent (`4px solid #C6A769`), padding
- **Section Titles**: Color `#C6A769`, with icons
- **Detail Rows**: Label/value pairs
- **Recommendation Block**: Light gold background (`#FFF8E7`), left accent border, metrics grid
- **Divider**: Gradient line or border
- **Footer**: Top border, centered text, `#F8F9FA` background

## Next Steps

1. Create base email wrapper function
2. Refactor all 8 templates to use the base
3. Ensure all variables/placeholders are preserved
4. Test email client compatibility

