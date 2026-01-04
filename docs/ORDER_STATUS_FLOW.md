# Order Status Flow Documentation

## How Orders Go From "Created" to "Paid"

### 1. Order Creation (Status: "created")
When a user initiates checkout:
- Order is created in database with status `"created"`
- Order items are created
- Subscriptions are created (if applicable) with status `"pending"` or `"active"`
- Payment is initiated via MyFatoorah API (or mocked in test mode)

**Location:** `backend/routes/checkout.js` - `POST /api/checkout/myfatoorah`

### 2. Payment Processing
- User is redirected to MyFatoorah payment page
- User completes payment on MyFatoorah
- MyFatoorah redirects back to callback URL

**Callback URL:** `/api/checkout/myfatoorah/callback`

### 3. Payment Verification (Status: "paid")
The callback handler:
1. Receives payment ID/invoice ID from MyFatoorah
2. Calls `verifyPayment(invoiceId)` to verify payment status
3. If payment status is `"Paid"`:
   - Updates order status to `"paid"`
   - Activates any associated subscriptions (sets status to `"active"`)
   - Marks cart as `"converted"`
   - Sends confirmation emails (if not in test mode)
4. If payment failed/cancelled:
   - Updates order status to `"failed"`

**Location:** `backend/routes/checkout.js` - `POST /api/checkout/myfatoorah/callback`

### 4. Test Mode Behavior
When `TEST_DISABLE_MYFATOORAH=true`:
- Payment is automatically verified as "Paid"
- No actual payment gateway is called
- Order status is immediately set to "paid"
- Redirects to order confirmation page

## Order Statuses

- **`created`**: Order created, payment pending
- **`paid`**: Payment successful, order confirmed
- **`fulfilled`**: Order has been processed and delivered
- **`cancelled`**: Order was cancelled
- **`failed`**: Payment failed or was cancelled

## Cancelling Orders

### Admin Cancellation
Admins can cancel orders via the admin dashboard:
- Navigate to Orders tab
- Click on an order
- Change status dropdown to "cancelled"
- Or use the "Cancel Order" button

**Location:** `js/admin.js` - `updateOrderStatus()` function

### Customer Cancellation
Customers can now cancel their own orders:
- Navigate to Account page
- Find the order in "Order History"
- Click "Cancel Order" button (only shown for `created` or `paid` orders)
- Confirm cancellation

**Restrictions:**
- Cannot cancel `fulfilled` orders
- Cannot cancel already `cancelled` orders
- Paid orders can be cancelled (refund may be needed - note shown to customer)

**Location:** 
- Frontend: `js/account.js` - `handleCancelOrder()` function
- Backend: `backend/routes/orders.js` - `PATCH /api/orders/:id/cancel`

## Order Status Transitions

```
created → paid (via payment callback)
paid → fulfilled (admin marks as fulfilled)
created → cancelled (admin or customer cancels)
created → failed (payment fails)
paid → cancelled (admin cancels paid order - refund may be needed)
```

## Important Notes

1. **Subscriptions**: When an order with subscriptions is marked as "paid", all associated subscriptions are automatically activated.

2. **Cart Status**: When payment succeeds, the user's active cart is marked as "converted" so it's no longer active.

3. **Email Notifications**: Confirmation emails are sent when payment succeeds (unless in test mode with `TEST_DISABLE_EMAILS=true`).

4. **Test Mode**: In test mode, all payments are automatically approved, allowing full testing without real transactions.

