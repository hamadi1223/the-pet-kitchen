/**
 * Analytics API Routes
 * Tracks e-commerce metrics and user engagement
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { parsePagination, formatPaginatedResponse } = require('../middleware/pagination');

const router = express.Router();

// Track analytics event (public endpoint - no auth required)
router.post('/track', [
  body('event_type').notEmpty().withMessage('event_type is required'),
  body('event_data').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      event_type,
      event_data,
      session_id,
      page_path,
      referrer
    } = req.body;

    const user_id = req.user?.id || null;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('user-agent');

    // Insert event
    await pool.execute(
      `INSERT INTO analytics_events 
       (event_type, user_id, session_id, page_path, referrer, user_agent, ip_address, event_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_type,
        user_id,
        session_id || null,
        page_path || null,
        referrer || null,
        user_agent || null,
        ip_address || null,
        event_data ? JSON.stringify(event_data) : null
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Track product view
router.post('/track/product-view', [
  body('product_id').isInt().withMessage('product_id must be an integer'),
  body('view_duration').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, view_duration, session_id } = req.body;
    const user_id = req.user?.id || null;

    await pool.execute(
      `INSERT INTO product_views (product_id, user_id, session_id, view_duration)
       VALUES (?, ?, ?, ?)`,
      [product_id, user_id, session_id || null, view_duration || null]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Product view track error:', error);
    res.status(500).json({ error: 'Failed to track product view' });
  }
});

// Track cart event
router.post('/track/cart-event', [
  body('event_type').isIn(['add', 'remove', 'update', 'abandon', 'checkout']).withMessage('Invalid event_type'),
  body('product_id').optional().isInt(),
  body('quantity').optional().isInt(),
  body('cart_value').optional().isFloat()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event_type, product_id, quantity, cart_value, session_id } = req.body;
    const user_id = req.user?.id || null;

    await pool.execute(
      `INSERT INTO cart_events (user_id, session_id, event_type, product_id, quantity, cart_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, session_id || null, event_type, product_id || null, quantity || null, cart_value || null]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Cart event track error:', error);
    res.status(500).json({ error: 'Failed to track cart event' });
  }
});

// Get analytics metrics (admin only)
router.get('/metrics', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { start_date, end_date, metric_type } = req.query;
    
    // Default to last 30 days
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    const metrics = {};

    // Conversion Rate
    const [conversionData] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN o.user_id END) as converted_users,
        COUNT(DISTINCT s.user_id) as total_visitors
       FROM user_sessions s
       LEFT JOIN orders o ON s.user_id = o.user_id AND o.created_at BETWEEN ? AND ?
       WHERE s.started_at BETWEEN ? AND ?`,
      [startDate, endDate, startDate, endDate]
    );
    metrics.conversion_rate = conversionData[0].total_visitors > 0 
      ? (conversionData[0].converted_users / conversionData[0].total_visitors * 100).toFixed(2)
      : 0;

    // Average Order Value (AOV)
    const [aovData] = await pool.execute(
      `SELECT AVG(total_amount) as aov, COUNT(*) as order_count
       FROM orders
       WHERE status = 'paid' AND created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    metrics.average_order_value = parseFloat(aovData[0].aov || 0).toFixed(3);
    metrics.total_orders = aovData[0].order_count;

    // Cart Abandonment Rate
    const [cartData] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT CASE WHEN event_type = 'checkout' THEN session_id END) as checkouts,
        COUNT(DISTINCT CASE WHEN event_type = 'add' THEN session_id END) as carts_started
       FROM cart_events
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    metrics.cart_abandonment_rate = cartData[0].carts_started > 0
      ? ((1 - cartData[0].checkouts / cartData[0].carts_started) * 100).toFixed(2)
      : 0;

    // Customer Lifetime Value (CLV)
    const [clvData] = await pool.execute(
      `SELECT 
        AVG(total_spent) as clv,
        COUNT(DISTINCT user_id) as customers
       FROM (
         SELECT user_id, SUM(total_amount) as total_spent
         FROM orders
         WHERE status = 'paid' AND created_at BETWEEN ? AND ?
         GROUP BY user_id
       ) as customer_totals`,
      [startDate, endDate]
    );
    metrics.customer_lifetime_value = parseFloat(clvData[0].clv || 0).toFixed(3);
    metrics.total_customers = clvData[0].customers;

    // Return Rate
    const [returnData] = await pool.execute(
      `SELECT COUNT(*) as return_count
       FROM returns
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    metrics.return_rate = aovData[0].order_count > 0
      ? ((returnData[0].return_count / aovData[0].order_count) * 100).toFixed(2)
      : 0;

    // User Engagement Metrics
    const [engagementData] = await pool.execute(
      `SELECT 
        AVG(duration_seconds) as avg_session_duration,
        AVG(page_views) as avg_pages_per_session,
        COUNT(*) as total_sessions
       FROM user_sessions
       WHERE started_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    metrics.avg_session_duration = Math.round(engagementData[0].avg_session_duration || 0);
    metrics.avg_pages_per_session = parseFloat(engagementData[0].avg_pages_per_session || 0).toFixed(2);
    metrics.total_sessions = engagementData[0].total_sessions;

    // Bounce Rate (sessions with only 1 page view)
    const [bounceData] = await pool.execute(
      `SELECT 
        COUNT(CASE WHEN page_views = 1 THEN 1 END) as bounced_sessions,
        COUNT(*) as total_sessions
       FROM user_sessions
       WHERE started_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    metrics.bounce_rate = bounceData[0].total_sessions > 0
      ? ((bounceData[0].bounced_sessions / bounceData[0].total_sessions) * 100).toFixed(2)
      : 0;

    // Product Views
    const [productViewData] = await pool.execute(
      `SELECT COUNT(*) as total_views
       FROM product_views
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    metrics.total_product_views = productViewData[0].total_views;

    // Add to Cart Rate
    const [addToCartData] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT CASE WHEN event_type = 'add' THEN session_id END) as add_to_carts,
        COUNT(DISTINCT session_id) as total_sessions
       FROM cart_events
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    metrics.add_to_cart_rate = addToCartData[0].total_sessions > 0
      ? ((addToCartData[0].add_to_carts / addToCartData[0].total_sessions) * 100).toFixed(2)
      : 0;

    // Checkout Completion Rate
    const [checkoutData] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT CASE WHEN event_type = 'checkout' THEN session_id END) as checkouts,
        COUNT(DISTINCT CASE WHEN event_type = 'add' THEN session_id END) as carts_started
       FROM cart_events
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    metrics.checkout_completion_rate = checkoutData[0].carts_started > 0
      ? ((checkoutData[0].checkouts / checkoutData[0].carts_started) * 100).toFixed(2)
      : 0;

    // Revenue per Visitor
    const [revenueData] = await pool.execute(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(DISTINCT user_id) as unique_visitors
       FROM orders o
       JOIN user_sessions s ON o.user_id = s.user_id
       WHERE o.status = 'paid' AND o.created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );
    metrics.revenue_per_visitor = revenueData[0].unique_visitors > 0
      ? (parseFloat(revenueData[0].total_revenue) / revenueData[0].unique_visitors).toFixed(3)
      : 0;
    metrics.total_revenue = parseFloat(revenueData[0].total_revenue || 0).toFixed(3);

    // Repeat Purchase Rate
    const [repeatData] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END) as repeat_customers,
        COUNT(DISTINCT user_id) as total_customers
       FROM (
         SELECT user_id, COUNT(*) as order_count
         FROM orders
         WHERE status = 'paid' AND created_at BETWEEN ? AND ?
         GROUP BY user_id
       ) as customer_orders`,
      [startDate, endDate]
    );
    metrics.repeat_purchase_rate = repeatData[0].total_customers > 0
      ? ((repeatData[0].repeat_customers / repeatData[0].total_customers) * 100).toFixed(2)
      : 0;

    res.json({
      period: { start_date: startDate, end_date: endDate },
      metrics
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get event logs (admin only, with pagination)
router.get('/events', authenticate, parsePagination, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page, limit, offset } = req.pagination;
    const { event_type, start_date, end_date } = req.query;

    let query = 'SELECT * FROM analytics_events WHERE 1=1';
    const params = [];

    if (event_type) {
      query += ' AND event_type = ?';
      params.push(event_type);
    }

    if (start_date) {
      query += ' AND created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    // Get total count
    const [countResult] = await pool.execute(
      query.replace('SELECT *', 'SELECT COUNT(*) as total')
    );
    const total = countResult[0].total;

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [events] = await pool.execute(query, params);

    // Parse JSON fields
    events.forEach(event => {
      if (event.event_data) {
        try {
          event.event_data = JSON.parse(event.event_data);
        } catch (e) {
          event.event_data = null;
        }
      }
    });

    res.json(formatPaginatedResponse(events, total, req.pagination));
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;

