const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { parsePagination, formatPaginatedResponse } = require('../middleware/pagination');
const { sendOrderCancelledEmail } = require('../services/email');
const { releaseStockForOrder } = require('../services/inventory');

const router = express.Router();

// Get user's orders with pagination
router.get('/', authenticate, parsePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM orders o
       WHERE o.user_id = ?`,
      [req.user.id]
    );
    const total = countResult[0].total;

    // Get paginated orders
    const [orders] = await pool.execute(
      `SELECT o.*, p.name as pet_name, p.type as pet_type
       FROM orders o
       LEFT JOIN pets p ON o.pet_id = p.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    // Get items for each order (including subscriptions)
    for (let order of orders) {
      const [items] = await pool.execute(
        `SELECT oi.*, 
                COALESCE(p.name, JSON_EXTRACT(oi.meta, '$.pet_name')) as product_name,
                COALESCE(p.sku, JSON_EXTRACT(oi.meta, '$.plan_type')) as sku,
                p.description,
                oi.meta
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      
      // Process subscription items
      const processedItems = items.map(item => {
        if (!item.product_id || (item.meta && typeof item.meta === 'string' && item.meta.includes('"type":"subscription"'))) {
          try {
            const meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
            if (meta && meta.type === 'subscription') {
              const planLabels = {
                weekly: 'Weekly Starter Plan',
                monthly: 'Monthly Subscription',
                quarterly: '3-Month Subscription'
              };
              item.product_name = `${planLabels[meta.plan_type] || meta.plan_type} - ${meta.pet_name || 'Pet'}`;
              item.sku = `SUBSCRIPTION-${meta.pet_type?.toUpperCase()}-${meta.plan_type?.toUpperCase()}`;
            }
          } catch (e) {
            // Meta parsing failed
          }
        }
        return item;
      });
      
      order.items = processedItems;
    }

    // Return paginated response
    res.json(formatPaginatedResponse(orders, total, req.pagination));
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    console.log('📦 [ORDERS] Get single order request:', {
      orderId: req.params.id,
      userId: req.user.id
    });
    
    const [orders] = await pool.execute(
      `SELECT o.*, p.name as pet_name, p.type as pet_type, p.breed, p.weight_kg
       FROM orders o
       LEFT JOIN pets p ON o.pet_id = p.id
       WHERE o.id = ? AND o.user_id = ?`,
      [req.params.id, req.user.id]
    );

    console.log('📦 [ORDERS] Query result:', {
      orderId: req.params.id,
      ordersFound: orders.length
    });

    if (orders.length === 0) {
      console.warn('⚠️  [ORDERS] Order not found:', req.params.id);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get order items (including subscriptions)
    const [items] = await pool.execute(
      `SELECT oi.*, 
              COALESCE(p.name, JSON_EXTRACT(oi.meta, '$.pet_name')) as product_name,
              COALESCE(p.sku, JSON_EXTRACT(oi.meta, '$.plan_type')) as sku,
              p.description,
              oi.meta
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    
    // Process subscription items
    const processedItems = items.map(item => {
      if (!item.product_id || (item.meta && typeof item.meta === 'string' && item.meta.includes('"type":"subscription"'))) {
        try {
          const meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
          if (meta && meta.type === 'subscription') {
            const planLabels = {
              weekly: 'Weekly Starter Plan',
              monthly: 'Monthly Subscription',
              quarterly: '3-Month Subscription'
            };
            item.product_name = `${planLabels[meta.plan_type] || meta.plan_type} - ${meta.pet_name || 'Pet'}`;
            item.sku = `SUBSCRIPTION-${meta.pet_type?.toUpperCase()}-${meta.plan_type?.toUpperCase()}`;
          }
        } catch (e) {
          // Meta parsing failed
        }
      }
      return item;
    });

    order.items = processedItems;
    
    console.log('✅ [ORDERS] Order retrieved successfully:', {
      orderId: order.id,
      itemsCount: processedItems.length,
      totalAmount: order.total_amount
    });
    
    res.json(order);
  } catch (error) {
    console.error('❌ [ORDERS] Get order error:', error);
    console.error('❌ [ORDERS] Error stack:', error.stack);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Cancel order (customer can only cancel their own orders)
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Verify order belongs to user
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Only allow cancellation of orders that are not already fulfilled or cancelled
    if (order.status === 'fulfilled') {
      return res.status(400).json({ error: 'Cannot cancel a fulfilled order' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    // If order is paid, note that refund may be needed
    if (order.status === 'paid') {
      console.warn(`⚠️ [ORDERS] Customer cancelling paid order #${orderId}. Refund may be needed.`);
    }

    // Get order items and user info for email
    const [items] = await pool.execute(
      `SELECT oi.*, 
              COALESCE(p.name, JSON_EXTRACT(oi.meta, '$.product_name')) as product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Get user info
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = users[0];

    // Get pet info if available
    let pet = null;
    if (order.pet_id) {
      const [pets] = await pool.execute('SELECT * FROM pets WHERE id = ?', [order.pet_id]);
      if (pets.length > 0) pet = pets[0];
    }

    // Update order status
    await pool.execute(
      'UPDATE orders SET status = "cancelled" WHERE id = ?',
      [orderId]
    );

    // If order has subscriptions, cancel them too
    const [subscriptions] = await pool.execute(
      'SELECT id FROM subscriptions WHERE order_id = ?',
      [orderId]
    );

    if (subscriptions.length > 0) {
      await pool.execute(
        'UPDATE subscriptions SET status = "cancelled", cancelled_at = NOW(), cancellation_reason = "Order cancelled by customer" WHERE order_id = ?',
        [orderId]
      );
      console.log(`✅ [ORDERS] Cancelled ${subscriptions.length} subscription(s) for order #${orderId}`);
    }

    // Send cancellation email (non-blocking)
    try {
      await sendOrderCancelledEmail(order, user, items, pet, 'Cancelled by customer');
    } catch (emailError) {
      console.error('⚠️ Failed to send cancellation email:', emailError);
      // Don't fail the cancellation if email fails
    }

    console.log(`✅ [ORDERS] Order #${orderId} cancelled by user #${req.user.id}`);

    res.json({ 
      message: 'Order cancelled successfully',
      orderId: orderId,
      status: 'cancelled'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

