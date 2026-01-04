# 🧪 Test Mode - MyFatoorah Mock System

This document explains how to use the test mode to disable MyFatoorah API calls and test the complete checkout flow without making external payment requests.

## 🎯 Purpose

Test mode allows you to:
- ✅ Test the complete checkout → order creation → payment flow
- ✅ Verify order creation in the database
- ✅ Test cart conversion to orders
- ✅ Test order_items creation
- ✅ Test user tracking and order visibility
- ✅ Test subscription logic
- ❌ **NO external API calls to MyFatoorah**
- ❌ **NO real payment processing**

## 🔧 How to Enable Test Mode

### Option 1: Environment Variable (Recommended)

Add to your `backend/.env` file:

```bash
TEST_DISABLE_MYFATOORAH=true
```

### Option 2: Node Environment

Set `NODE_ENV` to `test`:

```bash
NODE_ENV=test
```

### Option 3: Alternative Flag

```bash
DISABLE_MYFATOORAH=true
```

**Note:** Any of these flags will enable test mode. The system checks all three.

## 📋 What Happens in Test Mode

### 1. Payment Initiation (`/api/checkout/myfatoorah`)

**Normal Mode:**
- Makes real API call to MyFatoorah
- Returns real payment URL
- Creates real invoice

**Test Mode:**
- ❌ **NO API call to MyFatoorah**
- ✅ Returns mock invoice ID: `test-invoice-{timestamp}-{random}`
- ✅ Returns mock payment URL: `/checkout-success-test.html?invoiceId=...&orderId=...`
- ✅ Order is still created in database
- ✅ Order items are still created
- ✅ Cart is still converted

### 2. Payment Verification (`/api/checkout/myfatoorah/callback`)

**Normal Mode:**
- Makes real API call to verify payment status
- Returns actual payment status from MyFatoorah

**Test Mode:**
- ❌ **NO API call to MyFatoorah**
- ✅ Always returns `Paid` status
- ✅ Order status is updated to `paid`
- ✅ Cart is marked as `converted`
- ✅ Order is visible in user's account

### 3. Email Sending

By default, emails are still sent in test mode. To disable emails:

```bash
TEST_DISABLE_EMAILS=true
```

## 🧪 Testing the Flow

### Step 1: Enable Test Mode

Add to `backend/.env`:
```bash
TEST_DISABLE_MYFATOORAH=true
```

### Step 2: Restart Backend Server

```bash
cd backend
npm start
```

### Step 3: Test Checkout Flow

1. **Add items to cart** (meals or subscriptions)
2. **Go to cart page** (`/cart.html`)
3. **Click "Proceed to Checkout"**
4. **You'll be redirected to** `/checkout-success-test.html`
5. **Order is created** in database with status `paid`
6. **View order** in account page (`/account.html` → "My Orders")

### Step 4: Verify in Database

Check your database:

```sql
-- View recent orders
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- View order items
SELECT oi.*, p.name as product_name 
FROM order_items oi 
JOIN products p ON oi.product_id = p.id 
WHERE oi.order_id = ?;

-- Check cart status
SELECT * FROM carts WHERE user_id = ?;
```

## 📊 Console Logs

When test mode is active, you'll see detailed logs:

```
🧪 [TEST MODE] Mock MyFatoorah Payment Initiated
🧪 [TEST MODE] Order Data: { amount: 12.5, customerName: 'John', ... }
🧪 [TEST MODE] Mock Invoice ID: test-invoice-1234567890-abc123
🧪 [TEST MODE] ⚠️  NO EXTERNAL API CALL MADE TO MYFATOORAH
📦 [CHECKOUT] Creating order: { orderId: 42, userId: 1, ... }
📞 [CALLBACK] Payment callback received
✅ [CALLBACK] Payment successful. Updating order: { orderId: 42, status: 'paid' }
```

## 🔄 Disabling Test Mode

To return to production mode:

1. **Remove or set to false** in `backend/.env`:
   ```bash
   TEST_DISABLE_MYFATOORAH=false
   # OR remove the line entirely
   ```

2. **Restart backend server**

3. **Verify** - Check logs for `💳 [PRODUCTION]` instead of `🧪 [TEST MODE]`

## ⚠️ Important Notes

1. **Test mode is for development/testing only**
   - Never enable in production
   - Always verify test mode is disabled before deployment

2. **Orders created in test mode**
   - Are real database records
   - Have `payment_invoice_id` starting with `test-invoice-`
   - Can be identified by the test prefix

3. **No real payments**
   - No money is charged
   - No real MyFatoorah invoices are created
   - All payment data is simulated

4. **Code is reversible**
   - All real MyFatoorah code remains intact
   - Test mode is wrapped in conditional logic
   - Easy to enable/disable

## 🐛 Troubleshooting

### Test mode not working?

1. **Check environment variable:**
   ```bash
   # In backend directory
   cat .env | grep TEST_DISABLE_MYFATOORAH
   ```

2. **Verify server restart:**
   - Environment variables are loaded on server start
   - Must restart after changing `.env`

3. **Check console logs:**
   - Look for `🧪 [TEST MODE]` prefix
   - If you see `💳 [PRODUCTION]`, test mode is not active

### Orders not appearing?

1. **Check database connection**
2. **Verify user is logged in**
3. **Check order status** - should be `paid` in test mode
4. **Verify cart was converted**

## 📝 Example Test Session

```bash
# 1. Enable test mode
echo "TEST_DISABLE_MYFATOORAH=true" >> backend/.env

# 2. Start server
cd backend && npm start

# 3. In browser:
# - Login
# - Add meal to cart
# - Go to cart
# - Click checkout
# - Should redirect to /checkout-success-test.html
# - Order should appear in account page

# 4. Check database
mysql> SELECT id, status, total_amount, payment_invoice_id FROM orders ORDER BY id DESC LIMIT 1;
# Should show: status='paid', payment_invoice_id='test-invoice-...'
```

## ✅ Verification Checklist

After enabling test mode, verify:

- [ ] Console shows `🧪 [TEST MODE]` logs
- [ ] No network requests to `api.myfatoorah.com` or `apitest.myfatoorah.com`
- [ ] Orders are created in database
- [ ] Order items are created correctly
- [ ] Cart status changes to `converted`
- [ ] Order appears in user's account page
- [ ] Order status is `paid`
- [ ] Payment invoice ID starts with `test-invoice-`

---

**Last Updated:** 2025-11-26  
**Maintained By:** Development Team

