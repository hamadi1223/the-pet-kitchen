const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user's subscriptions
router.get('/my-subscriptions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get active and recent subscriptions (including pending and confirmed)
    // Use COALESCE to ensure we get the latest order status, and include all subscriptions with paid orders
    const [subscriptions] = await pool.execute(
      `SELECT s.*, 
              p.name as pet_name, p.type as pet_type,
              o.created_at as order_date, 
              COALESCE(o.status, 'created') as order_status,
              o.payment_invoice_id,
              o.payment_reference,
              s.next_delivery_date,
              DATEDIFF(s.end_date, NOW()) as days_remaining,
              CASE 
                WHEN s.next_delivery_date IS NOT NULL AND s.next_delivery_date >= NOW() 
                THEN DATEDIFF(s.next_delivery_date, NOW())
                ELSE NULL
              END as days_until_delivery,
              CASE 
                WHEN s.end_date < NOW() AND s.status = 'active' THEN 1
                ELSE 0
              END as is_expired,
              CASE
                WHEN s.end_date >= NOW() AND DATEDIFF(s.end_date, NOW()) <= 7 AND s.status IN ('active', 'confirmed') THEN 1
                ELSE 0
              END as is_expiring_soon,
              CASE
                WHEN s.end_date >= NOW() AND DATEDIFF(s.end_date, NOW()) <= 3 AND s.status IN ('active', 'confirmed') THEN 1
                ELSE 0
              END as needs_renewal
       FROM subscriptions s
       LEFT JOIN pets p ON s.pet_id = p.id
       LEFT JOIN orders o ON s.order_id = o.id
       WHERE s.user_id = ? 
       AND (
         s.status IN ('active', 'confirmed', 'expiring_soon') 
         OR (s.status = 'pending' AND o.status = 'paid')
         OR (s.status = 'pending' AND o.status IS NULL)
       )
       ORDER BY 
         CASE s.status
           WHEN 'active' THEN 1
           WHEN 'confirmed' THEN 2
           WHEN 'pending' THEN 3
           WHEN 'expiring_soon' THEN 4
           ELSE 5
         END,
         s.next_delivery_date ASC NULLS LAST,
         s.end_date DESC, 
         s.created_at DESC`,
      [userId]
    );

    // Process subscriptions to add calculated fields
    const processedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      daysRemaining: sub.days_remaining || 0,
      daysUntilDelivery: sub.days_until_delivery !== null ? sub.days_until_delivery : null,
      nextDeliveryDate: sub.next_delivery_date,
      isExpired: sub.is_expired === 1,
      isExpiringSoon: sub.is_expiring_soon === 1,
      needsRenewal: sub.needs_renewal === 1
    }));

    res.json({ subscriptions: processedSubscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all subscriptions (admin)
router.get('/', authenticate, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, pet_id, user_id, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT s.*,
             u.name as user_name, u.email as user_email,
             p.name as pet_name, p.type as pet_type,
             DATEDIFF(s.end_date, NOW()) as days_remaining,
             CASE 
               WHEN s.end_date < NOW() THEN 1
               ELSE 0
             END as is_expired,
             CASE
               WHEN s.end_date >= NOW() AND DATEDIFF(s.end_date, NOW()) <= 7 THEN 1
               ELSE 0
             END as is_expiring_soon
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN pets p ON s.pet_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }
    if (pet_id) {
      query += ' AND s.pet_id = ?';
      params.push(parseInt(pet_id));
    }
    if (user_id) {
      query += ' AND s.user_id = ?';
      params.push(parseInt(user_id));
    }

    // Use string interpolation for LIMIT/OFFSET as they're safe integers from our code
    query += ` ORDER BY s.end_date ASC, s.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const [subscriptions] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM subscriptions WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (pet_id) {
      countQuery += ' AND pet_id = ?';
      countParams.push(pet_id);
    }
    if (user_id) {
      countQuery += ' AND user_id = ?';
      countParams.push(user_id);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      subscriptions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single subscription
router.get('/:id', authenticate, async (req, res) => {
  try {
    const subscriptionId = req.params.id;

    const [subscriptions] = await pool.execute(
      `SELECT s.*,
              u.name as user_name, u.email as user_email,
              p.name as pet_name, p.type as pet_type, p.breed, p.weight_kg,
              DATEDIFF(s.end_date, NOW()) as days_remaining,
              CASE 
                WHEN s.end_date < NOW() THEN 1
                ELSE 0
              END as is_expired,
              CASE
                WHEN s.end_date >= NOW() AND DATEDIFF(s.end_date, NOW()) <= 7 THEN 1
                ELSE 0
              END as is_expiring_soon
       FROM subscriptions s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN pets p ON s.pet_id = p.id
       WHERE s.id = ? AND (s.user_id = ? OR ? = (SELECT role FROM users WHERE id = ? AND role = 'admin'))`,
      [subscriptionId, req.user.id, req.user.role, req.user.id]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const subscription = subscriptions[0];
    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update subscription status
router.patch('/:id', authenticate, [
  require('express-validator').body('status').optional().isIn(['active', 'expiring_soon', 'expired', 'cancelled', 'paused', 'pending', 'confirmed']),
  require('express-validator').body('auto_renew').optional().isBoolean(),
  require('express-validator').body('pouches_per_day').optional().isFloat({ min: 0 }),
  require('express-validator').body('daily_grams').optional().isFloat({ min: 0 }),
  require('express-validator').body('total_pouches').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const { status, auto_renew, next_delivery_date, pouches_per_day, daily_grams, total_pouches } = req.body;

    // Check if user owns subscription or is admin
    const [subscriptions] = await pool.execute(
      'SELECT user_id FROM subscriptions WHERE id = ?',
      [subscriptionId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscriptions[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
      if (status === 'cancelled') {
        updates.push('cancelled_at = NOW()');
      }
      if (status === 'confirmed') {
        updates.push('status = "active"');
      }
    }
    if (auto_renew !== undefined) {
      updates.push('auto_renew = ?');
      values.push(auto_renew ? 1 : 0);
    }
    if (next_delivery_date) {
      updates.push('next_delivery_date = ?');
      values.push(next_delivery_date);
    }
    if (pouches_per_day !== undefined) {
      updates.push('pouches_per_day = ?');
      values.push(pouches_per_day);
    }
    if (daily_grams !== undefined) {
      updates.push('daily_grams = ?');
      values.push(daily_grams);
    }
    if (total_pouches !== undefined) {
      updates.push('total_pouches = ?');
      values.push(total_pouches);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(subscriptionId);

    await pool.execute(
      `UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated subscription
    const [updated] = await pool.execute(
      'SELECT * FROM subscriptions WHERE id = ?',
      [subscriptionId]
    );

    res.json({ message: 'Subscription updated', subscription: updated[0] });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Confirm/Accept subscription (admin only)
router.post('/:id/confirm', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const subscriptionId = req.params.id;

    // Check if subscription exists
    const [subscriptions] = await pool.execute(
      'SELECT * FROM subscriptions WHERE id = ?',
      [subscriptionId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Update status to active (confirmed)
    await pool.execute(
      'UPDATE subscriptions SET status = "active" WHERE id = ?',
      [subscriptionId]
    );

    // Get updated subscription
    const [updated] = await pool.execute(
      'SELECT * FROM subscriptions WHERE id = ?',
      [subscriptionId]
    );

    res.json({ 
      message: 'Subscription confirmed and activated',
      subscription: updated[0] 
    });
  } catch (error) {
    console.error('Confirm subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel subscription
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const { reason } = req.body;

    // Check ownership
    const [subscriptions] = await pool.execute(
      'SELECT user_id FROM subscriptions WHERE id = ?',
      [subscriptionId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscriptions[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.execute(
      'UPDATE subscriptions SET status = "cancelled", cancelled_at = NOW(), cancellation_reason = ? WHERE id = ?',
      [reason || null, subscriptionId]
    );

    res.json({ message: 'Subscription cancelled' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Renew subscription (create new subscription from existing)
router.post('/:id/renew', authenticate, async (req, res) => {
  try {
    const subscriptionId = req.params.id;

    // Get existing subscription
    const [subscriptions] = await pool.execute(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, req.user.id]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const oldSubscription = subscriptions[0];

    // Create new subscription with same details
    const [result] = await pool.execute(
      `INSERT INTO subscriptions (
        user_id, pet_id, order_id, order_item_id, plan_type, status,
        start_date, end_date, daily_grams, pouches_per_day, total_pouches,
        price_per_period, auto_renew
      ) VALUES (?, ?, ?, ?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 
        CASE ?
          WHEN 'weekly' THEN 7
          WHEN 'monthly' THEN 30
          WHEN 'quarterly' THEN 90
        END DAY), ?, ?, ?, ?, ?)`,
      [
        oldSubscription.user_id,
        oldSubscription.pet_id,
        oldSubscription.order_id,
        oldSubscription.order_item_id,
        oldSubscription.plan_type,
        oldSubscription.plan_type,
        oldSubscription.daily_grams,
        oldSubscription.pouches_per_day,
        oldSubscription.total_pouches,
        oldSubscription.price_per_period,
        oldSubscription.auto_renew
      ]
    );

    // Mark old subscription as expired
    await pool.execute(
      'UPDATE subscriptions SET status = "expired" WHERE id = ?',
      [subscriptionId]
    );

    res.json({ 
      message: 'Subscription renewed',
      subscription_id: result.insertId
    });
  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get expiring subscriptions (for reminders)
router.get('/admin/expiring', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { days = 7 } = req.query;

    const [subscriptions] = await pool.execute(
      `SELECT s.*,
              u.name as user_name, u.email as user_email,
              p.name as pet_name,
              DATEDIFF(s.end_date, NOW()) as days_remaining
       FROM subscriptions s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN pets p ON s.pet_id = p.id
       WHERE s.status = 'active'
         AND s.end_date >= NOW()
         AND DATEDIFF(s.end_date, NOW()) <= ?
         AND s.reminder_sent = 0
       ORDER BY s.end_date ASC`,
      [parseInt(days)]
    );

    res.json({ subscriptions });
  } catch (error) {
    console.error('Get expiring subscriptions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark reminder as sent
router.post('/:id/mark-reminder-sent', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await pool.execute(
      'UPDATE subscriptions SET reminder_sent = 1 WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'Reminder marked as sent' });
  } catch (error) {
    console.error('Mark reminder sent error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
