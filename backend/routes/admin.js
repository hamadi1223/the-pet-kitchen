const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { sendOrderCancelledEmail } = require('../services/email');
const { getExpiringSubscriptions, getUpcomingDeliveries, generateWhatsAppReminderMessage, sendExpiringSubscriptionReminders } = require('../services/reminders');
const { sendDailyReport, generateDailyReport } = require('../services/reports');
const { asyncHandler } = require('../utils/errors');
const { adjustStock, getLowStockProducts } = require('../services/inventory');
const { createAuditLog } = require('../middleware/auditLog');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all orders with filters
router.get('/orders', async (req, res) => {
  try {
    const { status, email, start_date, end_date, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, 
              u.name as user_name, u.email as user_email, u.id as user_id, u.phone as user_phone,
              p.name as pet_name, p.type as pet_type, p.breed, p.weight_kg
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN pets p ON o.pet_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (email) {
      query += ' AND (o.email LIKE ? OR u.email LIKE ?)';
      params.push(`%${email}%`, `%${email}%`);
    }

    if (start_date) {
      query += ' AND o.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND o.created_at <= ?';
      params.push(end_date);
    }

    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    query += ` ORDER BY o.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [orders] = await pool.query(query, params);

    // Get order items count and subscription info for each order
    for (let order of orders) {
      // Get item count
      const [itemCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items_count = itemCount[0]?.count || 0;

      // Check if order has subscriptions
      const [subscriptions] = await pool.execute(
        'SELECT COUNT(*) as count FROM subscriptions WHERE order_id = ?',
        [order.id]
      );
      order.has_subscription = (subscriptions[0]?.count || 0) > 0;

      // Get a sample of items for preview (get all items, not just 3)
      const [sampleItems] = await pool.execute(
        `SELECT oi.*, 
                p.name as product_name,
                p.sku as product_sku,
                p.description as product_description,
                JSON_UNQUOTE(JSON_EXTRACT(oi.meta, '$.product_name')) as meta_product_name,
                JSON_UNQUOTE(JSON_EXTRACT(oi.meta, '$.sku')) as meta_sku,
                JSON_UNQUOTE(JSON_EXTRACT(oi.meta, '$.type')) as meta_type,
                JSON_UNQUOTE(JSON_EXTRACT(oi.meta, '$.plan_type')) as meta_plan_type,
                JSON_UNQUOTE(JSON_EXTRACT(oi.meta, '$.pet_name')) as meta_pet_name
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?
         ORDER BY oi.id ASC`,
        [order.id]
      );
      order.items = sampleItems.map(item => {
        let meta = null;
        if (item.meta) {
          try {
            meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
          } catch (e) {
            // Meta parsing failed
          }
        }
        
        // Determine product name with fallbacks
        let productName = item.product_name;
        if (!productName && item.meta_product_name) {
          productName = item.meta_product_name;
        }
        if (!productName && meta && meta.product_name) {
          productName = meta.product_name;
        }
        if (!productName && meta && meta.type === 'subscription') {
          const planLabels = {
            weekly: 'Weekly Subscription',
            monthly: 'Monthly Subscription',
            quarterly: '3-Month Subscription'
          };
          productName = `${planLabels[meta.plan_type] || meta.plan_type} - ${meta.pet_name || 'Pet'}`;
        }
        if (!productName && item.product_sku) {
          productName = `Product (${item.product_sku})`;
        }
        if (!productName && item.product_id) {
          productName = `Product #${item.product_id}`;
        }
        
        return {
          ...item,
          product_name: productName || 'Unknown Item',
          sku: item.product_sku || item.meta_sku || item.sku || 'N/A',
          meta: meta
        };
      });
    }

    // Get count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const countParams = [];
    if (status) {
      countQuery += ' AND o.status = ?';
      countParams.push(status);
    }
    if (email) {
      countQuery += ' AND (o.email LIKE ? OR u.email LIKE ?)';
      countParams.push(`%${email}%`, `%${email}%`);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single order details
router.get('/orders/:id', async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.*, 
              u.name as user_name, u.email as user_email, u.id as user_id, u.role as user_role, u.created_at as user_created_at,
              p.name as pet_name, p.type as pet_type, p.breed, p.weight_kg, p.age_group, p.activity_level, p.goal, p.notes
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN pets p ON o.pet_id = p.id
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Get order items (including subscription items that may not have product_id)
    const [items] = await pool.execute(
      `SELECT oi.*, 
              p.name as product_name, 
              p.sku as product_sku, 
              p.description,
              COALESCE(p.name, JSON_UNQUOTE(JSON_EXTRACT(oi.meta, '$.product_name'))) as product_name,
              COALESCE(p.sku, JSON_UNQUOTE(JSON_EXTRACT(oi.meta, '$.sku'))) as sku,
              COALESCE(p.description, JSON_UNQUOTE(JSON_EXTRACT(oi.meta, '$.description'))) as description
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    // Process items to include meta for subscriptions and extract phone
    let customerPhone = null;
    order.items = items.map(item => {
      let meta = null;
      if (item.meta) {
        try {
          meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
          // Extract phone from meta if available
          if (meta.phone && !customerPhone) customerPhone = meta.phone;
          if (meta.pet_phone && !customerPhone) customerPhone = meta.pet_phone;
          if (meta.customer_phone && !customerPhone) customerPhone = meta.customer_phone;
        } catch (e) {
          console.warn('Error parsing order item meta:', e);
        }
      }
      return {
        ...item,
        meta: meta
      };
    });
    
    // Add phone to order if found in meta
    if (customerPhone) {
      order.phone = customerPhone;
    }
    res.json(order);
  } catch (error) {
    console.error('Get admin order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status
router.patch('/orders/:id', [
  body('status').isIn(['created', 'paid', 'cancelled', 'failed', 'fulfilled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const orderId = req.params.id;

    // Get order details before updating (for email if cancelled)
    const [orders] = await pool.execute(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Update order status
    const [result] = await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Send cancellation email if order is being cancelled
    if (status === 'cancelled' && order.status !== 'cancelled') {
      try {
        // Get order items
        const [items] = await pool.execute(
          `SELECT oi.*, 
                  COALESCE(p.name, JSON_EXTRACT(oi.meta, '$.product_name')) as product_name
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [orderId]
        );

        // Get pet info
        let pet = null;
        if (order.pet_id) {
          const [pets] = await pool.execute('SELECT * FROM pets WHERE id = ?', [order.pet_id]);
          if (pets.length > 0) pet = pets[0];
        }

        // Send cancellation email
        await sendOrderCancelledEmail(
          order,
          { name: order.user_name, email: order.user_email },
          items,
          pet,
          'Cancelled by admin'
        );
      } catch (emailError) {
        console.error('⚠️ Failed to send cancellation email:', emailError);
        // Don't fail the status update if email fails
      }
    }

    // If order is marked as fulfilled, update subscription next_delivery_date
    if (status === 'fulfilled') {
      try {
        // Find all subscriptions for this order
        const [subscriptions] = await pool.execute(
          'SELECT id, plan_type, next_delivery_date FROM subscriptions WHERE order_id = ?',
          [orderId]
        );

        console.log(`📦 [ADMIN] Order ${orderId} marked as fulfilled. Found ${subscriptions.length} subscription(s)`);

        // Update next_delivery_date for each subscription based on plan type
        for (const sub of subscriptions) {
          const planType = sub.plan_type;
          
          // Calculate days to add based on plan type
          let daysToAdd = 30; // default to monthly
          if (planType === 'weekly') {
            daysToAdd = 7;
          } else if (planType === 'monthly') {
            daysToAdd = 30;
          } else if (planType === 'quarterly') {
            daysToAdd = 90;
          }

          // Calculate new next_delivery_date
          // When order is fulfilled, next delivery should be: today + plan period
          // This represents the next scheduled delivery after the current fulfillment
          const newNextDeliveryDate = new Date();
          newNextDeliveryDate.setDate(newNextDeliveryDate.getDate() + daysToAdd);
          
          // Also update subscription status to active if it's pending/confirmed
          await pool.execute(
            'UPDATE subscriptions SET status = "active" WHERE id = ? AND status IN ("pending", "confirmed")',
            [sub.id]
          );

          const newNextDeliveryDateStr = newNextDeliveryDate.toISOString().slice(0, 19).replace('T', ' ');

          // Update subscription
          await pool.execute(
            'UPDATE subscriptions SET next_delivery_date = ? WHERE id = ?',
            [newNextDeliveryDateStr, sub.id]
          );

          console.log(`✅ [ADMIN] Updated subscription ${sub.id} next_delivery_date to ${newNextDeliveryDateStr} (plan: ${planType}, +${daysToAdd} days)`);
        }
      } catch (subscriptionError) {
        console.error('⚠️  [ADMIN] Error updating subscription delivery dates (non-critical):', subscriptionError);
        // Don't fail the order status update if subscription update fails
      }
    }

    res.json({ message: 'Order status updated', status });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users with summary
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    // Use query instead of execute to avoid parameter binding issues with LIMIT/OFFSET
    const [users] = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.created_at, u.updated_at,
              COALESCE((SELECT COUNT(*) FROM pets WHERE user_id = u.id), 0) as pet_count,
              COALESCE((SELECT COUNT(*) FROM orders WHERE user_id = u.id), 0) as order_count,
              COALESCE((SELECT SUM(total_amount) FROM orders WHERE user_id = u.id AND status IN ('paid', 'fulfilled')), 0) as total_spent,
              COALESCE((SELECT MAX(o.created_at) FROM orders o WHERE o.user_id = u.id), NULL) as last_order_date
       FROM users u
       ORDER BY u.created_at DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`
    );

    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const total = countResult[0].total;

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const [products] = await pool.execute(
      `SELECT p.*, 
              COALESCE((SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id), 0) as times_ordered,
              COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.product_id = p.id), 0) as total_quantity_sold
       FROM products p
       ORDER BY p.created_at DESC`
    );

    res.json({ products });
  } catch (error) {
    console.error('Get admin products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new product
router.post('/products', [
  body('sku').trim().isLength({ min: 1, max: 191 }).withMessage('SKU is required and must be 1-191 characters'),
  body('name').trim().isLength({ min: 1, max: 191 }).withMessage('Product name is required and must be 1-191 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('species').isIn(['dog', 'cat', 'both']).withMessage('Species must be dog, cat, or both'),
  body('price_per_pouch').isFloat({ min: 0 }).withMessage('Price per pouch must be a positive number'),
  body('pouch_grams').isInt({ min: 1 }).withMessage('Pouch size must be a positive integer'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer'),
  body('is_active').optional().isBoolean(),
  body('is_subscription').optional().isBoolean(),
  body('subscription_type').optional().isIn(['weekly', 'monthly', 'quarterly'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      sku,
      name,
      description,
      species,
      price_per_pouch,
      pouch_grams,
      stock_quantity = 0,
      is_active = true,
      is_subscription = false,
      subscription_type = null
    } = req.body;

    // Check if SKU already exists
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE sku = ?',
      [sku]
    );

    if (existingProducts.length > 0) {
      return res.status(400).json({ error: 'SKU already exists. Please use a unique SKU.' });
    }

    // Insert new product
    const [result] = await pool.execute(
      `INSERT INTO products (
        sku, name, description, species, price_per_pouch, pouch_grams,
        stock_quantity, is_active, is_subscription, subscription_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sku,
        name,
        description || null,
        species,
        price_per_pouch,
        pouch_grams,
        stock_quantity,
        is_active ? 1 : 0,
        is_subscription ? 1 : 0,
        subscription_type || null
      ]
    );

    // Get the created product
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: 'Product created successfully',
      product: products[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single user details
router.get('/users/:id', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get user's pets
    const [pets] = await pool.execute(
      'SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    // Get user's orders with full details
    const [orders] = await pool.execute(
      `SELECT o.*, p.name as pet_name, p.type as pet_type, p.breed
       FROM orders o
       LEFT JOIN pets p ON o.pet_id = p.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [user.id]
    );

    user.pets = pets;
    user.orders = orders;

    res.json(user);
  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product
router.patch('/products/:id', [
  body('name').optional().isLength({ min: 1, max: 191 }),
  body('price_per_pouch').optional().isFloat({ min: 0 }),
  body('pouch_grams').optional().isInt({ min: 1 }),
  body('is_active').optional().isBoolean(),
  body('species').optional().isIn(['dog', 'cat', 'both']),
  body('description').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productId = req.params.id;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = ['name', 'description', 'species', 'price_per_pouch', 'pouch_grams', 'is_active', 'is_subscription', 'subscription_type'];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(productId);

    const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get updated product
    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [productId]);
    res.json({ message: 'Product updated', product: products[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update pet
router.patch('/pets/:id', [
  body('name').optional().isLength({ min: 1, max: 191 }),
  body('type').optional().isIn(['dog', 'cat']),
  body('breed').optional().isLength({ max: 191 }),
  body('weight_kg').optional().isFloat({ min: 0 }),
  body('age_group').optional().isIn(['puppy', 'kitten', 'adult', 'senior']),
  body('activity_level').optional().isIn(['low', 'normal', 'high']),
  body('goal').optional().isIn(['maintain', 'lose_weight', 'gain_weight']),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const petId = req.params.id;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = ['name', 'type', 'breed', 'weight_kg', 'age_group', 'activity_level', 'goal', 'notes'];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(petId);

    const query = `UPDATE pets SET ${updateFields.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // Get updated pet
    const [pets] = await pool.execute('SELECT * FROM pets WHERE id = ?', [petId]);
    res.json({ message: 'Pet updated', pet: pets[0] });
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete pet
router.delete('/pets/:id', async (req, res) => {
  try {
    const petId = req.params.id;

    // Check if pet exists
    const [pets] = await pool.execute('SELECT * FROM pets WHERE id = ?', [petId]);
    if (pets.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // Delete pet (cascade will handle related data if foreign keys are set up)
    const [result] = await pool.execute('DELETE FROM pets WHERE id = ?', [petId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    res.json({ message: 'Pet deleted successfully' });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== MEAL PLANS MANAGEMENT ====================

// Note: Public GET /meal-plans is defined in server.js (no auth required)
// The following routes require authentication and admin role:

// Get all meal plans (admin - requires auth, returns all including inactive)
router.get('/meal-plans', async (req, res) => {
  try {
    const [mealPlans] = await pool.execute(
      'SELECT * FROM meal_plans ORDER BY display_order ASC, id ASC'
    );
    res.json({ meal_plans: mealPlans });
  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single meal plan by ID (admin - requires auth)
router.get('/meal-plans/:id', async (req, res) => {
  try {
    const [mealPlans] = await pool.execute(
      'SELECT * FROM meal_plans WHERE id = ?',
      [req.params.id]
    );
    if (mealPlans.length === 0) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }
    res.json({ meal_plan: mealPlans[0] });
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create meal plan
router.post('/meal-plans', [
  body('sku').trim().isLength({ min: 1, max: 191 }),
  body('name').trim().isLength({ min: 1, max: 191 }),
  body('category').isIn(['dogs', 'cats', 'both']),
  body('subtitle').optional().trim().isLength({ max: 255 }),
  body('image_path').optional().trim().isLength({ max: 500 }),
  body('ingredients').optional(),
  body('guaranteed_analysis').optional(),
  body('benefits').optional(),
  body('nutrition_values').optional(),
  body('is_active').optional().isBoolean(),
  body('display_order').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      sku, name, subtitle, category, image_path, ingredients,
      guaranteed_analysis, benefits, nutrition_values, is_active, display_order
    } = req.body;

    // Parse nutrition_values if it's a string
    let nutritionValues = nutrition_values;
    if (typeof nutrition_values === 'string') {
      try {
        nutritionValues = JSON.parse(nutrition_values);
      } catch (e) {
        nutritionValues = null;
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO meal_plans 
       (sku, name, subtitle, category, image_path, ingredients, guaranteed_analysis, benefits, nutrition_values, is_active, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sku, name, subtitle || null, category, image_path || null,
        ingredients || null, guaranteed_analysis || null, benefits || null,
        nutritionValues ? JSON.stringify(nutritionValues) : null,
        is_active !== undefined ? is_active : 1,
        display_order || 0
      ]
    );

    const [newMealPlan] = await pool.execute(
      'SELECT * FROM meal_plans WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Meal plan created', meal_plan: newMealPlan[0] });
  } catch (error) {
    console.error('Create meal plan error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update meal plan
router.patch('/meal-plans/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 191 }),
  body('subtitle').optional().trim().isLength({ max: 255 }),
  body('category').optional().isIn(['dogs', 'cats', 'both']),
  body('image_path').optional().trim().isLength({ max: 500 }),
  body('ingredients').optional(),
  body('guaranteed_analysis').optional(),
  body('benefits').optional(),
  body('nutrition_values').optional(),
  body('is_active').optional().isBoolean(),
  body('display_order').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const mealPlanId = req.params.id;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
      'name', 'subtitle', 'category', 'image_path', 'ingredients',
      'guaranteed_analysis', 'benefits', 'nutrition_values', 'is_active', 'display_order'
    ];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        if (field === 'nutrition_values') {
          let nutritionValues = updates[field];
          if (typeof nutritionValues === 'string') {
            try {
              nutritionValues = JSON.parse(nutritionValues);
            } catch (e) {
              nutritionValues = null;
            }
          }
          updateFields.push(`${field} = ?`);
          updateValues.push(nutritionValues ? JSON.stringify(nutritionValues) : null);
        } else {
          updateFields.push(`${field} = ?`);
          updateValues.push(updates[field]);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(mealPlanId);

    const query = `UPDATE meal_plans SET ${updateFields.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    // Get updated meal plan
    const [mealPlans] = await pool.execute('SELECT * FROM meal_plans WHERE id = ?', [mealPlanId]);
    res.json({ message: 'Meal plan updated', meal_plan: mealPlans[0] });
  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete meal plan
router.delete('/meal-plans/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM meal_plans WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }
    res.json({ message: 'Meal plan deleted' });
  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get reminders data (expiring subscriptions, upcoming deliveries)
router.get('/reminders', async (req, res) => {
  try {
    const { type = 'all', days = 7 } = req.query;
    const daysAhead = parseInt(days) || 7;

    const result = {
      expiringSubscriptions: [],
      upcomingDeliveries: []
    };

    if (type === 'all' || type === 'expiring') {
      result.expiringSubscriptions = await getExpiringSubscriptions(daysAhead);
    }

    if (type === 'all' || type === 'deliveries') {
      result.upcomingDeliveries = await getUpcomingDeliveries(daysAhead);
    }

    res.json(result);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send reminder emails for expiring subscriptions (manual trigger)
router.post('/reminders/send-expiring', async (req, res) => {
  try {
    const { days = 7 } = req.body;
    const daysAhead = parseInt(days) || 7;

    const results = await sendExpiringSubscriptionReminders(daysAhead);

    res.json({
      message: 'Reminder emails sent',
      results
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate WhatsApp reminder message
router.get('/reminders/whatsapp/:subscriptionId', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.subscriptionId);

    const [subscriptions] = await pool.execute(
      `SELECT s.*,
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              p.name as pet_name, p.type as pet_type,
              DATEDIFF(s.end_date, NOW()) as days_remaining
       FROM subscriptions s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN pets p ON s.pet_id = p.id
       WHERE s.id = ?`,
      [subscriptionId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const subscription = subscriptions[0];
    const user = {
      name: subscription.user_name,
      email: subscription.user_email,
      phone: subscription.user_phone
    };
    const pet = {
      name: subscription.pet_name,
      type: subscription.pet_type
    };

    const message = generateWhatsAppReminderMessage(subscription, user, pet);
    const whatsappLink = subscription.user_phone 
      ? `https://wa.me/${subscription.user_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
      : null;

    res.json({
      subscription: {
        id: subscription.id,
        plan_type: subscription.plan_type,
        end_date: subscription.end_date,
        days_remaining: subscription.days_remaining
      },
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      pet: pet,
      message: message,
      whatsappLink: whatsappLink
    });
  } catch (error) {
    console.error('Get WhatsApp reminder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

