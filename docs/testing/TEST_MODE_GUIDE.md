# 🧪 Complete Test Mode Guide

## ✅ Test Mode Status: **ENABLED**

Test mode is currently **ACTIVE**. All MyFatoorah API calls are **DISABLED** and replaced with mock responses.

---

## 🎯 What Works in Test Mode

### ✅ Full Checkout Flow (No Real Payments)
1. **Add to Cart** - Products and subscriptions
2. **Checkout** - Creates order in database
3. **Mock Payment** - No real MyFatoorah API calls
4. **Auto-Payment** - Order automatically marked as "paid"
5. **Order Confirmation** - Redirects to confirmation page
6. **Subscription Creation** - Subscriptions created in database
7. **Order Tracking** - Orders visible in user account

### ✅ Features Tested
- ✅ Product checkout
- ✅ Subscription checkout with customer start date
- ✅ Order creation and tracking
- ✅ Subscription lifecycle management
- ✅ Order confirmation page
- ✅ User account order history
- ✅ Admin dashboard order management

---

## 🧪 How Test Mode Works

### Payment Initiation
- **Real Mode**: Calls MyFatoorah API to create invoice
- **Test Mode**: Returns mock invoice ID and redirects to confirmation page
- **No External Calls**: Zero HTTP requests to MyFatoorah

### Payment Verification
- **Real Mode**: Calls MyFatoorah API to verify payment status
- **Test Mode**: Always returns "Paid" status
- **Auto-Update**: Order status automatically set to "paid"

### Order Flow
1. User clicks "Checkout"
2. Order created in database (status: "created")
3. Mock payment initiated (no real API call)
4. Redirects to: `/order-confirmation.html?orderId=X&test=true`
5. Callback automatically verifies payment (mock)
6. Order status updated to "paid"
7. Subscriptions activated

---

## 📋 Testing Checklist

### Test 1: Product Checkout
- [ ] Add a product to cart
- [ ] Go to cart page
- [ ] Click "Checkout"
- [ ] Verify redirect to order confirmation
- [ ] Check order appears in account page
- [ ] Verify order status is "paid"

### Test 2: Subscription Checkout
- [ ] Go to subscriptions page
- [ ] Complete questionnaire or select existing pet
- [ ] Select a subscription plan
- [ ] (Optional) Select a start date
- [ ] Add to cart
- [ ] Go to cart and checkout
- [ ] Verify subscription created in database
- [ ] Check subscription appears in account page
- [ ] Verify start/end dates are correct

### Test 3: Order Confirmation
- [ ] Complete a checkout
- [ ] Verify redirect to confirmation page
- [ ] Check "TEST MODE" badge is visible
- [ ] Verify order details are displayed
- [ ] Check all items are listed correctly
- [ ] Verify total amount is correct

### Test 4: Account Page
- [ ] Log in as user
- [ ] Go to account page
- [ ] Verify orders are listed
- [ ] Check subscriptions section
- [ ] Verify subscription details (dates, status, etc.)

### Test 5: Admin Dashboard
- [ ] Log in as admin
- [ ] Go to admin dashboard
- [ ] Check orders tab - verify test orders appear
- [ ] Check subscriptions tab - verify test subscriptions appear
- [ ] Test order status updates
- [ ] Test subscription management

---

## 🔍 How to Verify Test Mode is Active

### Check Server Logs
Look for these log messages:
```
🧪 [TEST MODE] Mock MyFatoorah Payment Initiated
🧪 [TEST MODE] ⚠️  NO EXTERNAL API CALL MADE TO MYFATOORAH
🧪 [TEST MODE] Mock MyFatoorah Payment Verification
```

### Check Browser Console
- Order confirmation page shows "TEST MODE" badge
- URL contains `?test=true` parameter

### Check Database
- Orders have status = "paid" immediately
- Payment invoice IDs start with "test-invoice-"

---

## 🚫 What Does NOT Happen in Test Mode

- ❌ No real payment processing
- ❌ No money is charged
- ❌ No external API calls to MyFatoorah
- ❌ No real invoice creation
- ❌ No payment gateway redirects

---

## 🔄 Switching to Production Mode

When ready to use real MyFatoorah:

1. **Update `.env` file:**
   ```bash
   TEST_DISABLE_MYFATOORAH=false
   ```

2. **Add real API credentials:**
   ```bash
   MYFATOORAH_API_KEY=your_real_api_key_here
   MYFATOORAH_BASE_URL=https://api.myfatoorah.com
   ```

3. **Restart server:**
   ```bash
   pkill -f "node.*server.js"
   cd backend && npm start
   ```

4. **Verify production mode:**
   - Check logs for `💳 [PRODUCTION]` instead of `🧪 [TEST MODE]`
   - Real API calls will be made

---

## 📊 Test Mode Features

### Automatic Features
- ✅ Orders auto-marked as "paid"
- ✅ Subscriptions auto-activated
- ✅ No payment delays
- ✅ Instant order confirmation

### Mock Data
- Invoice IDs: `test-invoice-{timestamp}-{random}`
- Invoice Reference: `TEST-REF-{timestamp}`
- Payment Gateway: `TEST_MODE`
- Status: Always `Paid`

---

## 🐛 Troubleshooting

### Issue: Orders not being created
**Check:**
- Server is running (`http://localhost:8000/api/health`)
- User is logged in
- Cart has items

### Issue: Order status not updating to "paid"
**Check:**
- Test mode is enabled in `.env`
- Server logs show `🧪 [TEST MODE]`
- Callback is being triggered

### Issue: Subscription not created
**Check:**
- Subscription metadata is correct
- Database has `subscriptions` table
- Server logs for subscription creation errors

---

## ✅ Current Status

- **Test Mode**: ✅ ENABLED
- **Server**: ✅ Running on port 8000
- **Database**: ✅ Connected
- **All Features**: ✅ Ready for Testing

**You can now test the complete checkout flow without any real payments!**

