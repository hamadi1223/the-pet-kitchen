# Analytics Quick Start Guide

## 🚀 Setup in 3 Steps

### Step 1: Run Database Migration
```bash
cd backend
node scripts/run-analytics-migration.js
```

### Step 2: Add Analytics Script to Pages
Add to all HTML pages (before closing `</body>` tag):
```html
<script src="js/analytics.js" defer></script>
```

### Step 3: Restart Server
```bash
cd backend
npm start
```

---

## ✅ That's It!

Analytics is now tracking:
- ✅ Page views (automatic)
- ✅ Sessions (automatic)
- ✅ Product views (automatic if product ID detected)

---

## 📊 View Your Metrics

### Option 1: API Call
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8000/api/analytics/metrics"
```

### Option 2: Add to Admin Dashboard

Add this to `admin.html` after line 155 (after Meal Plans tab button):
```html
<button class="tab-btn" data-tab="analytics">Analytics</button>
```

Then add this tab content section (after other tab sections):
```html
<!-- Analytics Tab -->
<section id="analyticsTab" class="admin-tab-content">
  <div class="section-header">
    <h2>E-Commerce Metrics</h2>
    <div>
      <input type="date" id="analyticsStartDate" value="">
      <input type="date" id="analyticsEndDate" value="">
      <button onclick="loadAnalytics()" class="btn btn-primary">Load Metrics</button>
    </div>
  </div>
  <div id="analyticsMetrics" class="metrics-grid">
    <!-- Metrics will be displayed here -->
  </div>
</section>
```

Add this JavaScript to `admin.js`:
```javascript
async function loadAnalytics() {
  const startDate = document.getElementById('analyticsStartDate').value || 
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = document.getElementById('analyticsEndDate').value || 
    new Date().toISOString().split('T')[0];

  try {
    const response = await window.adminAPI.getAnalyticsMetrics(startDate, endDate);
    displayMetrics(response.metrics);
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

function displayMetrics(metrics) {
  const container = document.getElementById('analyticsMetrics');
  container.innerHTML = `
    <div class="metric-card">
      <h3>Conversion Rate</h3>
      <p class="metric-value">${metrics.conversion_rate}%</p>
    </div>
    <div class="metric-card">
      <h3>Average Order Value</h3>
      <p class="metric-value">${metrics.average_order_value} KD</p>
    </div>
    <div class="metric-card">
      <h3>Cart Abandonment</h3>
      <p class="metric-value">${metrics.cart_abandonment_rate}%</p>
    </div>
    <!-- Add more metrics as needed -->
  `;
}
```

---

## 🎯 Track Custom Events

### In Your JavaScript Files

**Cart Events:**
```javascript
// When adding to cart
window.analytics.trackAddToCart(productId, quantity, cartValue);

// When removing from cart
window.analytics.trackRemoveFromCart(productId, quantity, cartValue);

// When starting checkout
window.analytics.trackCheckoutStart(cartValue);

// When purchase completes
window.analytics.trackPurchase(orderId, orderValue, items);
```

**Search:**
```javascript
window.analytics.trackSearch(query, resultsCount);
```

**Wishlist:**
```javascript
window.analytics.trackWishlistAdd(productId);
window.analytics.trackWishlistRemove(productId);
```

---

## 📈 All Available Metrics

Once tracking is active, you can view:
- Conversion Rate
- Average Order Value
- Cart Abandonment Rate
- Customer Lifetime Value
- Return Rate
- Average Session Duration
- Pages per Session
- Bounce Rate
- Product Views
- Add to Cart Rate
- Checkout Completion Rate
- Revenue per Visitor
- Repeat Purchase Rate

---

## 🔍 Verify It's Working

1. Visit your website
2. Browse some pages
3. Check database:
   ```sql
   SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 10;
   ```

If you see events, it's working! 🎉

---

**Need More Details?** See `ANALYTICS_IMPLEMENTATION.md` for complete documentation.

