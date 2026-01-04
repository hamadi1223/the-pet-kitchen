# Analytics & Metrics Tracking Implementation

## ✅ Complete Analytics System

A comprehensive analytics and metrics tracking system has been implemented to track all e-commerce KPIs and user engagement metrics.

---

## 📊 Tracked Metrics

### E-Commerce KPIs
- ✅ **Conversion Rate** - Percentage of visitors who make a purchase
- ✅ **Average Order Value (AOV)** - Average amount per order
- ✅ **Cart Abandonment Rate** - Percentage of carts abandoned
- ✅ **Customer Lifetime Value (CLV)** - Average customer value
- ✅ **Return Rate** - Percentage of orders returned
- ✅ **Customer Acquisition Cost (CAC)** - Cost to acquire customers (requires cost data)

### User Engagement
- ✅ **Time on Site** - Average session duration
- ✅ **Pages per Session** - Average pages viewed
- ✅ **Bounce Rate** - Single-page sessions
- ✅ **Search Usage** - Search queries and results
- ✅ **Wishlist Additions** - Products added to wishlist

### Business Metrics
- ✅ **Revenue per Visitor** - Total revenue / unique visitors
- ✅ **Product Views** - Total product page views
- ✅ **Add to Cart Rate** - Percentage of sessions with add to cart
- ✅ **Checkout Completion Rate** - Percentage of carts that complete checkout
- ✅ **Repeat Purchase Rate** - Percentage of customers who purchase again

---

## 🗄️ Database Schema

### Tables Created

1. **analytics_events** - All tracked events
2. **ecommerce_metrics** - Aggregated daily metrics
3. **user_sessions** - Session tracking
4. **product_views** - Product view tracking
5. **cart_events** - Cart activity tracking

---

## 🔌 API Endpoints

### Track Event (Public)
```
POST /api/analytics/track
Body: {
  event_type: string,
  event_data: object,
  session_id: string (optional),
  page_path: string (optional),
  referrer: string (optional)
}
```

### Track Product View
```
POST /api/analytics/track/product-view
Body: {
  product_id: integer,
  view_duration: integer (seconds, optional),
  session_id: string (optional)
}
```

### Track Cart Event
```
POST /api/analytics/track/cart-event
Body: {
  event_type: 'add' | 'remove' | 'update' | 'abandon' | 'checkout',
  product_id: integer (optional),
  quantity: integer (optional),
  cart_value: float (optional),
  session_id: string (optional)
}
```

### Get Metrics (Admin Only)
```
GET /api/analytics/metrics?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
Returns: All calculated metrics for the date range
```

### Get Events (Admin Only, Paginated)
```
GET /api/analytics/events?page=1&limit=20&event_type=string&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
Returns: Paginated list of events
```

---

## 💻 Frontend Integration

### 1. Add Analytics Script

Add to your HTML pages:
```html
<script src="js/analytics.js" defer></script>
```

### 2. Automatic Tracking

The following are tracked automatically:
- ✅ Page views
- ✅ Session start/end
- ✅ Product views (if product ID detected)

### 3. Manual Tracking

Use the `window.analytics` object:

```javascript
// Track add to cart
window.analytics.trackAddToCart(productId, quantity, cartValue);

// Track remove from cart
window.analytics.trackRemoveFromCart(productId, quantity, cartValue);

// Track checkout start
window.analytics.trackCheckoutStart(cartValue);

// Track purchase
window.analytics.trackPurchase(orderId, orderValue, items);

// Track search
window.analytics.trackSearch(query, resultsCount);

// Track wishlist
window.analytics.trackWishlistAdd(productId);
window.analytics.trackWishlistRemove(productId);

// Track custom event
window.analytics.trackEvent('custom_event', { data: 'value' });

// Track button click
window.analytics.trackButtonClick('Subscribe Button', 'homepage');
```

---

## 🔗 Integration Examples

### Cart Integration

Update `js/cart.js`:
```javascript
// When adding item to cart
async function addToCart(productId, quantity) {
  // ... existing cart logic ...
  
  // Track analytics
  const cartValue = calculateCartTotal();
  window.analytics.trackAddToCart(productId, quantity, cartValue);
}

// When removing item
async function removeFromCart(itemId) {
  // ... existing logic ...
  
  const cartValue = calculateCartTotal();
  window.analytics.trackRemoveFromCart(productId, quantity, cartValue);
}
```

### Checkout Integration

Update `js/checkout.js`:
```javascript
// When checkout starts
function initiateCheckout() {
  const cartValue = getCartTotal();
  window.analytics.trackCheckoutStart(cartValue);
}

// When order completes
function onOrderComplete(order) {
  window.analytics.trackPurchase(
    order.id,
    order.total_amount,
    order.items
  );
}
```

### Product Page Integration

Update `meal-plans.html` or product pages:
```javascript
// Track when product is viewed
document.addEventListener('DOMContentLoaded', () => {
  const productId = getProductIdFromPage();
  if (productId) {
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      window.analytics.trackProductView(productId, duration);
    });
  }
});
```

### Search Integration

Update search functionality:
```javascript
function performSearch(query) {
  // ... search logic ...
  
  const resultsCount = searchResults.length;
  window.analytics.trackSearch(query, resultsCount);
}
```

---

## 📈 Admin Dashboard

### View Metrics

Access metrics in admin panel:
```javascript
// Fetch metrics
async function loadMetrics(startDate, endDate) {
  const response = await fetch(
    `/api/analytics/metrics?start_date=${startDate}&end_date=${endDate}`,
    {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    }
  );
  const data = await response.json();
  return data.metrics;
}
```

### Metrics Response Format

```json
{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "metrics": {
    "conversion_rate": "2.45",
    "average_order_value": "12.500",
    "cart_abandonment_rate": "65.23",
    "customer_lifetime_value": "45.250",
    "return_rate": "1.20",
    "avg_session_duration": 180,
    "avg_pages_per_session": "3.45",
    "total_sessions": 1250,
    "bounce_rate": "42.30",
    "total_product_views": 5432,
    "add_to_cart_rate": "15.67",
    "checkout_completion_rate": "34.77",
    "revenue_per_visitor": "0.305",
    "total_revenue": "15625.000",
    "repeat_purchase_rate": "25.50",
    "total_orders": 450,
    "total_customers": 345
  }
}
```

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
cd backend
node scripts/run-analytics-migration.js
```

### 2. Add Analytics Script to Pages

Add to all HTML pages (or in a common template):
```html
<script src="js/analytics.js" defer></script>
```

### 3. Integrate Tracking Calls

Add tracking calls to your existing JavaScript files:
- `cart.js` - Track cart events
- `checkout.js` - Track checkout and purchases
- `meal-plans.js` - Track product views
- Search functionality - Track searches

### 4. Restart Server

The analytics routes are already added to `server.js`, just restart:
```bash
cd backend
npm start
```

---

## 📊 Viewing Metrics

### Option 1: API Endpoint

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8000/api/analytics/metrics?start_date=2024-01-01&end_date=2024-01-31"
```

### Option 2: Admin Dashboard

Add a metrics section to `admin.html`:
```javascript
// Load and display metrics
async function displayMetrics() {
  const metrics = await loadMetrics('2024-01-01', '2024-01-31');
  
  document.getElementById('conversionRate').textContent = 
    metrics.conversion_rate + '%';
  document.getElementById('aov').textContent = 
    metrics.average_order_value + ' KD';
  // ... etc
}
```

### Option 3: Direct Database Query

```sql
-- View recent events
SELECT * FROM analytics_events 
ORDER BY created_at DESC 
LIMIT 100;

-- View cart abandonment
SELECT 
  COUNT(DISTINCT CASE WHEN event_type = 'checkout' THEN session_id END) as checkouts,
  COUNT(DISTINCT CASE WHEN event_type = 'add' THEN session_id END) as carts_started
FROM cart_events
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## 🎯 Best Practices

### 1. Privacy
- Analytics respects user privacy
- No personally identifiable information stored
- IP addresses stored but can be anonymized

### 2. Performance
- Analytics calls are non-blocking
- Failures don't interrupt user experience
- Events are sent asynchronously

### 3. Data Retention
- Consider archiving old events (older than 1 year)
- Aggregate daily metrics for long-term storage
- Clean up old sessions periodically

### 4. Error Handling
- Analytics failures are silent (won't break site)
- Check console for warnings in development
- Monitor analytics endpoint health

---

## 🔍 Troubleshooting

### Events Not Tracking
- Check browser console for errors
- Verify analytics.js is loaded
- Check API endpoint is accessible
- Verify database tables exist

### Metrics Showing Zero
- Ensure events are being tracked
- Check date range in query
- Verify admin authentication
- Check database for events

### Performance Issues
- Consider adding indexes (already included)
- Archive old events regularly
- Use aggregated metrics table for reports

---

## 📈 Next Steps

### Enhancements
- [ ] Add Google Analytics integration
- [ ] Create visual dashboard with charts
- [ ] Add email reports (weekly/monthly)
- [ ] Implement real-time metrics
- [ ] Add cohort analysis
- [ ] Add funnel analysis
- [ ] Add A/B testing support

---

**Last Updated:** December 2024  
**Status:** ✅ Fully Implemented  
**Ready for:** Production Use

