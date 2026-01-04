# MyFatoorah Integration Setup Guide

This guide will help you configure MyFatoorah in your dashboard to complete the payment integration.

## Current Integration Status

✅ **Already Implemented:**
- Cart → Checkout flow
- MyFatoorah payment initiation
- Payment verification callback
- Order number generation
- Invoice creation in MyFatoorah

## What You Need to Do in MyFatoorah Dashboard

### Step 1: Get Your API Credentials

1. **Log into MyFatoorah Dashboard** (portal.myfatoorah.com)
2. Go to **Settings** → **API Settings** (or **Integration Settings**)
3. You'll need:
   - **API Key** (also called "Token" or "API Token")
   - **Base URL** (usually one of these):
     - Test: `https://apitest.myfatoorah.com`
     - Production: `https://api.myfatoorah.com`

4. **Copy your API Key** - You'll add this to your backend `.env` file

### Step 2: Configure Your Backend Environment

1. **Navigate to your backend folder:**
   ```bash
   cd backend
   ```

2. **Edit or create `.env` file:**
   ```bash
   # MyFatoorah Configuration
   MYFATOORAH_API_KEY=your_api_key_here
   MYFATOORAH_BASE_URL=https://api.myfatoorah.com
   
   # For testing, use:
   # MYFATOORAH_BASE_URL=https://apitest.myfatoorah.com
   
   # Frontend URL (your website URL)
   FRONTEND_URL=https://yourdomain.com
   # For local testing:
   # FRONTEND_URL=http://localhost:8000
   
   # Disable test mode (set to false for production)
   TEST_DISABLE_MYFATOORAH=false
   ```

3. **Replace `your_api_key_here`** with your actual API key from MyFatoorah

### Step 3: Configure Invoice Settings in MyFatoorah

1. **Go to Settings** → **Invoice Settings** (or **Business Settings**)
2. **Enable Email Notifications:**
   - ✅ Send invoice to customer
   - ✅ Send invoice copy to merchant (you)
   - ✅ Auto-send invoices

3. **Configure Invoice Email Template:**
   - Make sure customer email is included
   - Include order details
   - Include payment link

### Step 4: Configure Callback URLs (Optional - Already Handled)

Your code already sets these automatically, but you can verify in MyFatoorah:

**Success Callback URL:**
```
https://yourdomain.com/api/checkout/myfatoorah/callback
```

**Error Callback URL:**
```
https://yourdomain.com/payment-failed.html
```

**Note:** These are set automatically in the code, so you don't need to configure them manually in MyFatoorah dashboard.

### Step 5: Enable Webhook Notifications (Recommended)

1. **Go to Settings** → **Webhooks** (or **Notifications**)
2. **Add Webhook URL:**
   ```
   https://yourdomain.com/api/checkout/myfatoorah/callback
   ```
3. **Select Events to Listen For:**
   - ✅ Payment Success
   - ✅ Payment Failed
   - ✅ Invoice Created
   - ✅ Invoice Paid

**Note:** Your callback endpoint already handles these, but webhooks provide real-time updates.

### Step 6: Test the Integration

1. **Start your backend server:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Test the flow:**
   - Add items to cart
   - Click "Proceed to Checkout"
   - You should be redirected to MyFatoorah payment page
   - Complete payment (use test card if in test mode)
   - You'll be redirected back with order confirmation

3. **Check for:**
   - ✅ Customer receives invoice email from MyFatoorah
   - ✅ You receive merchant invoice copy
   - ✅ Order number is generated
   - ✅ Payment status updates correctly

## How the Flow Works

```
1. Customer clicks "Proceed to Checkout" in Cart
   ↓
2. Backend creates order in database
   ↓
3. Backend calls MyFatoorah API to create invoice
   ↓
4. Customer is redirected to MyFatoorah payment page
   ↓
5. Customer completes payment
   ↓
6. MyFatoorah redirects back to your callback URL
   ↓
7. Backend verifies payment with MyFatoorah
   ↓
8. Backend updates order status to "paid"
   ↓
9. Customer sees order confirmation page
   ↓
10. MyFatoorah sends invoice emails:
    - Customer receives invoice
    - You receive merchant copy
```

## Invoice & Order Number Details

### Order Number
- **Your System:** Each order gets a unique `order_id` in your database
- **MyFatoorah:** Each invoice gets an `InvoiceId` and `InvoiceReference`
- Both are stored and linked in your database

### Invoice Details
- **Customer Invoice:** Sent automatically by MyFatoorah to customer email
- **Merchant Invoice:** Sent to your business email (configured in MyFatoorah)
- **Invoice Contains:**
  - Order items
  - Quantities
  - Prices
  - Total amount
  - Payment method
  - Invoice reference number

## Environment Variables Checklist

Make sure these are set in `backend/.env`:

```env
# Required
MYFATOORAH_API_KEY=your_api_key_here
MYFATOORAH_BASE_URL=https://api.myfatoorah.com
FRONTEND_URL=https://yourdomain.com

# Optional (for testing)
TEST_DISABLE_MYFATOORAH=false  # Set to true to disable real API calls
```

## Testing vs Production

### Test Mode
- Use: `https://apitest.myfatoorah.com`
- Use test API key from MyFatoorah test account
- No real payments processed
- Good for development

### Production Mode
- Use: `https://api.myfatoorah.com`
- Use production API key
- Real payments processed
- Real invoices sent

## Troubleshooting

### Issue: "API Key Invalid"
- ✅ Check you copied the full API key
- ✅ Verify you're using the correct base URL (test vs production)
- ✅ Make sure API key matches the environment (test/production)

### Issue: "No Invoice Email Received"
- ✅ Check MyFatoorah invoice settings → Email notifications enabled
- ✅ Verify customer email is correct
- ✅ Check spam folder
- ✅ Verify your merchant email in MyFatoorah settings

### Issue: "Payment Not Redirecting Back"
- ✅ Check `FRONTEND_URL` in `.env` is correct
- ✅ Verify callback URL is accessible (not blocked by firewall)
- ✅ Check MyFatoorah webhook/callback settings

### Issue: "Order Status Not Updating"
- ✅ Check backend logs for callback errors
- ✅ Verify callback endpoint is working: `/api/checkout/myfatoorah/callback`
- ✅ Check database connection

## Next Steps After Setup

1. ✅ Test with a small order
2. ✅ Verify invoice emails are received
3. ✅ Check order appears in your admin dashboard
4. ✅ Verify payment status updates correctly
5. ✅ Test error scenarios (failed payment, cancelled payment)

## Support

- **MyFatoorah Support:** Check their dashboard help section
- **API Documentation:** https://myfatoorah.readme.io/
- **Your Backend Logs:** Check `backend/logs/` for detailed error messages

---

**Status:** Ready for configuration  
**Last Updated:** Integration setup guide

