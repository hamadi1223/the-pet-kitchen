const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get current user's cart
router.get('/', authenticate, async (req, res) => {
  try {
    // Find or create active cart
    let [carts] = await pool.execute(
      'SELECT * FROM carts WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    let cart;
    if (carts.length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO carts (user_id, status) VALUES (?, "active")',
        [req.user.id]
      );
      cart = { id: result.insertId, user_id: req.user.id, status: 'active' };
    } else {
      cart = carts[0];
    }

    // Get cart items with product details (including subscription items without products)
    const [items] = await pool.execute(
      `SELECT ci.*, 
              COALESCE(p.name, JSON_EXTRACT(ci.meta, '$.pet_name')) as product_name,
              COALESCE(p.sku, JSON_EXTRACT(ci.meta, '$.plan_type')) as sku,
              p.description, p.species, p.pouch_grams,
              ci.meta
       FROM cart_items ci
       LEFT JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?
       ORDER BY ci.created_at ASC`,
      [cart.id]
    );
    
    // Process items to extract subscription metadata
    const processedItems = items.map(item => {
      // If it's a subscription (no product_id or has subscription meta), parse metadata
      if (!item.product_id || (item.meta && typeof item.meta === 'string' && item.meta.includes('"type":"subscription"'))) {
        try {
          const meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
          if (meta && meta.type === 'subscription') {
            // Format subscription name
            const planLabels = {
              weekly: 'Weekly Starter Plan',
              monthly: 'Monthly Subscription',
              quarterly: '3-Month Subscription'
            };
            item.product_name = `${planLabels[meta.plan_type] || meta.plan_type} - ${meta.pet_name || 'Pet'}`;
            item.sku = `SUBSCRIPTION-${meta.pet_type?.toUpperCase()}-${meta.plan_type?.toUpperCase()}`;
            item.is_subscription = true;
          }
        } catch (e) {
          // Meta parsing failed, keep original
        }
      }
      return item;
    });

    // Calculate total
    const total = processedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price || 0) * item.quantity);
    }, 0);

    res.json({
      cart: {
        id: cart.id,
        status: cart.status,
        created_at: cart.created_at
      },
      items: processedItems,
      total: total.toFixed(3)
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add item to cart
router.post('/items', authenticate, [
  body('quantity').isInt({ min: 1 }),
  body('meta').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, sku, quantity, meta } = req.body;

    // Support both product_id and sku
    let productQuery, productParam;
    let product = null;
    
    if (product_id) {
      productQuery = 'SELECT id, price_per_pouch FROM products WHERE id = ? AND is_active = 1';
      productParam = product_id;
    } else if (sku) {
      productQuery = 'SELECT id, price_per_pouch FROM products WHERE sku = ? AND is_active = 1';
      productParam = sku;
    } else {
      return res.status(400).json({ error: 'Either product_id or sku is required' });
    }

    // Verify product exists and is active
    const [products] = await pool.execute(productQuery, [productParam]);

    // Handle subscription items - map to existing subscription products
    if (products.length === 0) {
      // Check if this is a subscription item
      const isSubscription = sku && sku.startsWith('SUBSCRIPTION-');
      const subscriptionMeta = meta && (typeof meta === 'object' ? meta : JSON.parse(meta));
      
      if (isSubscription && subscriptionMeta && subscriptionMeta.type === 'subscription') {
        // Map subscription SKU to actual product SKU
        const petType = subscriptionMeta.pet_type || 'dog';
        const planType = subscriptionMeta.plan_type || 'monthly';
        const actualSku = `SUB-${planType.toUpperCase()}-${petType.toUpperCase()}`;
        
        // Look up the actual subscription product
        const [subscriptionProducts] = await pool.execute(
          'SELECT id, price_per_pouch FROM products WHERE sku = ? AND is_active = 1',
          [actualSku]
        );
        
        if (subscriptionProducts.length === 0) {
          return res.status(404).json({ error: `Subscription product not found for ${actualSku}. Please contact support.` });
        }
        
        product = subscriptionProducts[0];
        product.is_subscription = true;
        product.subscription_meta = subscriptionMeta;
      } else {
        return res.status(404).json({ error: 'Product not found or inactive' });
      }
    } else {
      product = products[0];
    }

    // Find or create active cart
    let [carts] = await pool.execute(
      'SELECT * FROM carts WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    let cartId;
    if (carts.length === 0) {
      const [result] = await pool.execute(
        'INSERT INTO carts (user_id, status) VALUES (?, "active")',
        [req.user.id]
      );
      cartId = result.insertId;
    } else {
      cartId = carts[0].id;
    }

    // For subscriptions, calculate total price based on pouches
    let unitPrice = product.price_per_pouch;
    if (product.is_subscription && product.subscription_meta) {
      // For subscriptions, unit_price should be the total price for the subscription period
      const totalPouches = product.subscription_meta.total_pouches || 30;
      unitPrice = totalPouches * product.price_per_pouch;
    }
    
    // Check if item already exists in cart
    const [existing] = await pool.execute(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, product.id]
    );

    if (existing.length > 0) {
      // Update quantity
      const newQuantity = existing[0].quantity + quantity;
      const metaStr = meta ? (typeof meta === 'object' ? JSON.stringify(meta) : meta) : (product.subscription_meta ? JSON.stringify(product.subscription_meta) : null);
      await pool.execute(
        'UPDATE cart_items SET quantity = ?, unit_price = ?, meta = ? WHERE id = ?',
        [newQuantity, unitPrice, metaStr, existing[0].id]
      );
    } else {
      // Insert new item
      const metaStr = meta ? (typeof meta === 'object' ? JSON.stringify(meta) : meta) : (product.subscription_meta ? JSON.stringify(product.subscription_meta) : null);
      await pool.execute(
        'INSERT INTO cart_items (cart_id, product_id, quantity, unit_price, meta) VALUES (?, ?, ?, ?, ?)',
        [cartId, product.id, quantity, unitPrice, metaStr]
      );
    }

    res.json({ message: 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update cart item
router.patch('/items/:id', authenticate, [
  body('quantity').optional().isInt({ min: 1 }),
  body('meta').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify item belongs to user's cart
    const [items] = await pool.execute(
      `SELECT ci.id FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = ? AND c.user_id = ? AND c.status = "active"`,
      [req.params.id, req.user.id]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const updates = [];
    const values = [];

    if (req.body.quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(req.body.quantity);
    }

    if (req.body.meta !== undefined) {
      updates.push('meta = ?');
      values.push(JSON.stringify(req.body.meta));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    await pool.execute(
      `UPDATE cart_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Cart item updated' });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete cart item
router.delete('/items/:id', authenticate, async (req, res) => {
  try {
    // Verify item belongs to user's cart
    const [items] = await pool.execute(
      `SELECT ci.id FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = ? AND c.user_id = ? AND c.status = "active"`,
      [req.params.id, req.user.id]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await pool.execute('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cart item deleted' });
  } catch (error) {
    console.error('Delete cart item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

