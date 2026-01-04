const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { initiatePayment, verifyPayment, getPaymentUrl } = require('../services/myfatoorah');
const { 
  sendOrderConfirmationToUser, 
  sendNewOrderNotificationToOwner,
  sendOrderPaidNotification,
  sendHighValueOrderAlert,
  sendSubscriptionCreatedNotification
} = require('../services/email');
const { verifyMyFatoorahWebhook } = require('../utils/webhookVerification');
const { asyncHandler } = require('../utils/errors');
const { checkStock, reserveStockForOrder } = require('../services/inventory');

const router = express.Router();

// Initiate checkout with MyFatoorah
router.post('/myfatoorah', authenticate, [
  body('pet_id').optional({ nullable: true, checkFalsy: true }).isInt().withMessage('pet_id must be an integer'),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 20 }).withMessage('phone must be max 20 characters')
], async (req, res) => {
  let orderId = null; // Initialize orderId at the start for error handling
  try {
    console.log('📦 [CHECKOUT] Request received:', {
      userId: req.user?.id,
      body: req.body,
      hasAuth: !!req.user
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ [CHECKOUT] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user's email is verified
    if (!req.user.email_verified) {
      console.warn('⚠️ [CHECKOUT] User attempted checkout with unverified email:', {
        userId: req.user.id,
        email: req.user.email
      });
      return res.status(403).json({ 
        error: 'Email verification required',
        message: 'Please verify your email address before placing an order. Check your inbox for the verification link.',
        requiresVerification: true
      });
    }

    const { pet_id, phone } = req.body;

    // Get user's active cart
    const [carts] = await pool.execute(
      'SELECT * FROM carts WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    console.log('📦 [CHECKOUT] Cart lookup:', {
      userId: req.user.id,
      cartsFound: carts.length
    });

    if (carts.length === 0) {
      console.error('❌ [CHECKOUT] No active cart found for user:', req.user.id);
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cart = carts[0];
    console.log('📦 [CHECKOUT] Cart found:', { cartId: cart.id, status: cart.status });

    // Get cart items with product details (including subscription items without products)
    const [items] = await pool.execute(
      `SELECT ci.*, 
              COALESCE(p.name, JSON_EXTRACT(ci.meta, '$.product_name')) as product_name,
              COALESCE(p.sku, JSON_EXTRACT(ci.meta, '$.sku')) as sku,
              p.price_per_pouch,
              ci.meta
       FROM cart_items ci
       LEFT JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cart.id]
    );
    
    console.log('📦 [CHECKOUT] Raw cart items:', items.map(i => ({
      id: i.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      hasMeta: !!i.meta,
      metaPreview: i.meta ? (typeof i.meta === 'string' ? i.meta.substring(0, 100) : JSON.stringify(i.meta).substring(0, 100)) : null
    })));
    
    // Process items to handle subscription metadata
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
            item.product_name = meta.product_name || `${planLabels[meta.plan_type] || meta.plan_type} - ${meta.pet_name || 'Pet'}`;
            item.sku = meta.sku || `SUB-${meta.pet_type?.toUpperCase() || 'PET'}-${meta.plan_type?.toUpperCase() || 'MONTHLY'}`;
            
            console.log('📋 [CHECKOUT] Processed subscription item:', {
              productName: item.product_name,
              sku: item.sku,
              planType: meta.plan_type,
              petId: meta.pet_id,
              petName: meta.pet_name
            });
          }
        } catch (e) {
          console.warn('⚠️  [CHECKOUT] Failed to parse meta for item:', item.id, e.message);
          // Meta parsing failed, keep original
        }
      }
      return item;
    });

    console.log('📦 [CHECKOUT] Cart items:', {
      rawItemsCount: items.length,
      processedItemsCount: processedItems.length,
      items: processedItems.map(i => ({
        id: i.id,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price
      }))
    });

    if (processedItems.length === 0) {
      console.error('❌ [CHECKOUT] No items in cart after processing');
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Check inventory availability for all products (non-subscription items)
    const inventoryChecks = [];
    for (const item of processedItems) {
      // Only check inventory for products with product_id (not subscriptions)
      if (item.product_id) {
        const stockCheck = await checkStock(item.product_id, item.quantity);
        if (!stockCheck.available) {
          console.error('❌ [CHECKOUT] Insufficient stock', {
            productId: item.product_id,
            requested: item.quantity,
            available: stockCheck.availableStock
          });
          return res.status(400).json({
            error: 'Insufficient stock',
            message: `Product "${item.product_name || 'Unknown'}" is out of stock or has insufficient quantity. Available: ${stockCheck.availableStock}, Requested: ${item.quantity}`,
            productId: item.product_id,
            available: stockCheck.availableStock,
            requested: item.quantity
          });
        }
        inventoryChecks.push({ productId: item.product_id, quantity: item.quantity });
      }
    }

    // Validate subscription items have required data
    const subscriptionItems = processedItems.filter(item => {
      if (!item.meta) return false;
      try {
        const meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
        return meta && meta.type === 'subscription';
      } catch (e) {
        return false;
      }
    });

    if (subscriptionItems.length > 0) {
      console.log('📋 [CHECKOUT] Found subscription items:', subscriptionItems.length);
      for (const subItem of subscriptionItems) {
        const meta = typeof subItem.meta === 'string' ? JSON.parse(subItem.meta) : subItem.meta;
        if (!meta.plan_type || !['weekly', 'monthly', 'quarterly'].includes(meta.plan_type)) {
          return res.status(400).json({ 
            error: 'Invalid subscription plan type. Must be weekly, monthly, or quarterly.' 
          });
        }
        if (!meta.pet_id && !pet_id) {
          console.warn('⚠️  [CHECKOUT] Subscription item missing pet_id:', subItem.id);
        }
      }
    }

    // Calculate total from database prices (never trust client)
    const totalAmount = processedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price || 0) * item.quantity);
    }, 0);

    // Get user details - include phone from users table
    const [users] = await pool.execute(
      'SELECT email, name, phone FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = users[0];
    
    // Get customer phone number - prioritize from request, then user table, then metadata
    let customerPhone = phone || user.phone || '';
    
    // If no phone in request or user table, try to get from cart items metadata (questionnaire data)
    if (!customerPhone) {
      try {
        for (const item of processedItems) {
          if (item.meta) {
            const meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
            if (meta.phone || meta.customer_phone || meta.pet_phone) {
              customerPhone = meta.phone || meta.customer_phone || meta.pet_phone;
              break;
            }
          }
        }
      } catch (e) {
        console.warn('⚠️  [CHECKOUT] Could not extract phone from metadata:', e.message);
      }
    }
    
    // Format phone number - clean and normalize
    if (customerPhone) {
      // Remove any existing +965 prefix to avoid duplication
      customerPhone = customerPhone.replace(/^\+?965/, '').trim();
      
      // Remove any non-digit characters except +
      customerPhone = customerPhone.replace(/[^\d]/g, '');
      
      // If we have digits, add +965 prefix
      if (customerPhone.length > 0) {
        customerPhone = '+965' + customerPhone;
      } else {
        customerPhone = ''; // Empty if no valid digits
      }
    }
    
    // Ensure phone has full number (not just country code)
    if (customerPhone === '+965' || customerPhone.length < 9) {
      customerPhone = ''; // Don't send incomplete phone (needs at least +965 + 8 digits)
    }
    
    console.log('📞 [CHECKOUT] Customer phone:', customerPhone || 'Not provided');
    console.log('👤 [CHECKOUT] Customer name:', user.name || user.email);
    console.log('📧 [CHECKOUT] Customer email:', user.email);

    // Get pet if specified
    let pet = null;
    if (pet_id) {
      const [pets] = await pool.execute(
        'SELECT * FROM pets WHERE id = ? AND user_id = ?',
        [pet_id, req.user.id]
      );
      if (pets.length > 0) {
        pet = pets[0];
      }
    }

    // Note: Subscription data is stored in the subscriptions table, not orders table

    // Create order (without subscription columns - subscriptions are tracked in subscriptions table)
    let orderId = null; // Track orderId for cleanup on error
    const [orderResult] = await pool.execute(
      `INSERT INTO orders (user_id, pet_id, email, status, total_amount, payment_provider)
       VALUES (?, ?, ?, 'created', ?, 'myfatoorah')`,
      [
        req.user.id || null, 
        (pet_id !== undefined && pet_id !== null) ? pet_id : null, 
        user.email || null, 
        (totalAmount !== undefined && totalAmount !== null) ? totalAmount : 0
      ]
    );

    orderId = orderResult.insertId;
    console.log('✅ [CHECKOUT] Order created:', orderId);

    // Reserve stock for all products in order (before creating order items)
    if (inventoryChecks.length > 0) {
      try {
        const reserveResult = await reserveStockForOrder(inventoryChecks, orderId);
        if (!reserveResult.success) {
          // Rollback order creation
          await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
          console.error('❌ [CHECKOUT] Failed to reserve stock, order cancelled');
          return res.status(400).json({
            error: 'Stock reservation failed',
            message: reserveResult.error || 'Unable to reserve stock for your order. Please try again.',
            item: reserveResult.item
          });
        }
        console.log('✅ [CHECKOUT] Stock reserved for order:', orderId);
      } catch (reserveError) {
        // Rollback order creation
        await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
        console.error('❌ [CHECKOUT] Stock reservation error:', reserveError);
        return res.status(500).json({
          error: 'Stock reservation failed',
          message: 'Unable to process your order. Please try again later.'
        });
      }
    }

    // Create order items and subscriptions
    const subscriptionIds = []; // Track created subscriptions for rollback if needed
    
    for (const item of processedItems) {
      console.log('📦 [CHECKOUT] Processing item:', {
        itemId: item.id,
        productId: item.product_id,
        hasMeta: !!item.meta,
        quantity: item.quantity,
        unitPrice: item.unit_price
      });

      // Create order item
      let orderItemId;
      try {
        const [itemResult] = await pool.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, meta)
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderId || null, 
            (item.product_id !== undefined && item.product_id !== null) ? item.product_id : null, 
            (item.quantity !== undefined && item.quantity !== null) ? item.quantity : 1, 
            (item.unit_price !== undefined && item.unit_price !== null) ? parseFloat(item.unit_price) : 0, 
            item.meta ? (typeof item.meta === 'string' ? item.meta : JSON.stringify(item.meta)) : null
          ]
        );
        
        orderItemId = itemResult.insertId;
        console.log('✅ [CHECKOUT] Order item created:', orderItemId);
      } catch (itemError) {
        console.error('❌ [CHECKOUT] Failed to create order item:', itemError);
        throw new Error(`Failed to create order item: ${itemError.message}`);
      }
      
      // If this is a subscription item, create subscription record
      if (item.meta) {
        try {
          const meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
          
          if (meta && meta.type === 'subscription') {
            console.log('📋 [CHECKOUT] Processing subscription item:', {
              planType: meta.plan_type,
              petId: meta.pet_id,
              petName: meta.pet_name,
              petType: meta.pet_type,
              dailyGrams: meta.daily_grams,
              pouchesPerDay: meta.pouches_per_day,
              totalPouches: meta.total_pouches
            });

            // Validate subscription data
            const planType = meta.plan_type || 'monthly';
            if (!['weekly', 'monthly', 'quarterly'].includes(planType)) {
              throw new Error(`Invalid plan type: ${planType}. Must be weekly, monthly, or quarterly.`);
            }

            const daysToAdd = planType === 'weekly' ? 7 : planType === 'monthly' ? 30 : 90;
            
            // Extract pet_id from meta or use order pet_id
            const subscriptionPetId = meta.pet_id || pet_id || null;
            
            // Validate required fields
            if (!subscriptionPetId) {
              console.warn('⚠️  [CHECKOUT] No pet_id found for subscription, but continuing...');
            }

            const unitPrice = (item.unit_price !== undefined && item.unit_price !== null) ? parseFloat(item.unit_price) : 0;
            const quantity = (item.quantity !== undefined && item.quantity !== null) ? item.quantity : 1;
            const pricePerPeriod = unitPrice * quantity;
            if (isNaN(pricePerPeriod) || pricePerPeriod <= 0) {
              throw new Error(`Invalid price for subscription: ${pricePerPeriod}`);
            }

            // Determine start date: use customer-selected date or current date
            let subscriptionStartDate = new Date();
            if (meta.start_date) {
              const customerStartDate = new Date(meta.start_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              // Validate customer-selected date is not in the past
              if (customerStartDate < today) {
                console.warn('⚠️  [CHECKOUT] Customer start date is in the past, using today instead');
                subscriptionStartDate = new Date();
              } else {
                subscriptionStartDate = customerStartDate;
                console.log('📅 [CHECKOUT] Using customer-selected start date:', meta.start_date);
              }
            } else {
              console.log('📅 [CHECKOUT] No start date specified, using current date');
            }
            
            // Calculate end date based on start date
            const subscriptionEndDate = new Date(subscriptionStartDate);
            subscriptionEndDate.setDate(subscriptionEndDate.getDate() + daysToAdd);
            
            // Calculate next_delivery_date
            // Initially, next_delivery_date = start_date (first delivery happens at subscription start)
            // After fulfillment, it will be updated to current date + plan period
            const nextDeliveryDate = new Date(subscriptionStartDate);
            
            // Format dates for MySQL (YYYY-MM-DD HH:MM:SS)
            const startDateStr = subscriptionStartDate.toISOString().slice(0, 19).replace('T', ' ');
            const endDateStr = subscriptionEndDate.toISOString().slice(0, 19).replace('T', ' ');
            const nextDeliveryDateStr = nextDeliveryDate.toISOString().slice(0, 19).replace('T', ' ');

            // Create subscription record with 'pending' status - will be activated after payment confirmation
            const [subscriptionResult] = await pool.execute(
              `INSERT INTO subscriptions (
                user_id, pet_id, order_id, order_item_id, plan_type, status,
                start_date, end_date, next_delivery_date, daily_grams, pouches_per_day, total_pouches,
                price_per_period, auto_renew
              ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 0)`,
              [
                req.user.id || null,
                (subscriptionPetId !== undefined && subscriptionPetId !== null) ? subscriptionPetId : null,
                orderId || null,
                (orderItemId !== undefined && orderItemId !== null) ? orderItemId : null,
                planType || null,
                startDateStr || null,
                endDateStr || null,
                nextDeliveryDateStr || null,
                (meta.daily_grams !== undefined && meta.daily_grams !== null) ? parseFloat(meta.daily_grams) : null,
                (meta.pouches_per_day !== undefined && meta.pouches_per_day !== null) ? parseFloat(meta.pouches_per_day) : null,
                (meta.total_pouches !== undefined && meta.total_pouches !== null) ? parseInt(meta.total_pouches) : null,
                (pricePerPeriod !== undefined && pricePerPeriod !== null && !isNaN(pricePerPeriod)) ? pricePerPeriod : 0
              ]
            );
            
            const subscriptionId = subscriptionResult.insertId;
            subscriptionIds.push(subscriptionId);
            
            console.log('✅ [CHECKOUT] Subscription created successfully:', {
              subscriptionId: subscriptionId,
              orderItemId: orderItemId,
              planType: planType,
              petId: subscriptionPetId,
              startDate: startDateStr,
              endDate: endDateStr,
              daysToAdd: daysToAdd,
              pricePerPeriod: pricePerPeriod
            });
          } else {
            console.log('ℹ️  [CHECKOUT] Item has meta but is not a subscription:', {
              metaType: meta?.type,
              hasType: !!meta?.type
            });
          }
        } catch (subscriptionError) {
          console.error('❌ [CHECKOUT] Failed to create subscription record:', {
            error: subscriptionError.message,
            stack: subscriptionError.stack,
            orderItemId: orderItemId,
            meta: item.meta
          });
          
          // Rollback: Delete the order item if subscription creation failed
          try {
            await pool.execute('DELETE FROM order_items WHERE id = ?', [orderItemId]);
            console.log('🔄 [CHECKOUT] Rolled back order item:', orderItemId);
          } catch (rollbackError) {
            console.error('❌ [CHECKOUT] Failed to rollback order item:', rollbackError);
          }
          
          // Rollback: Delete any subscriptions created so far
          if (subscriptionIds.length > 0) {
            try {
              await pool.execute('DELETE FROM subscriptions WHERE id IN (?)', [subscriptionIds]);
              console.log('🔄 [CHECKOUT] Rolled back subscriptions:', subscriptionIds);
            } catch (rollbackError) {
              console.error('❌ [CHECKOUT] Failed to rollback subscriptions:', rollbackError);
            }
          }
          
          throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
        }
      }
    }

    console.log('✅ [CHECKOUT] All items and subscriptions processed:', {
      itemsCount: processedItems.length,
      subscriptionsCreated: subscriptionIds.length,
      subscriptionIds: subscriptionIds
    });

    // Prepare MyFatoorah payment data
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    console.log('📦 [CHECKOUT] Using base URL:', baseUrl);
    
    // Get full customer name - use name from user table, fallback to email
    const customerName = (user.name && user.name.trim() && user.name !== 'Admin') 
      ? user.name.trim() 
      : (user.email || 'Customer');
    
    // Generate customer reference (order ID for tracking)
    const customerReference = `ORDER-${orderId}`;
    
    const paymentData = {
      amount: totalAmount,
      customerName: customerName,
      customerEmail: user.email,
      customerPhone: customerPhone || '',
      customerReference: customerReference,
      callbackUrl: `${baseUrl}/api/checkout/myfatoorah/callback`,
      errorUrl: `${baseUrl}/payment-failed.html?order_id=${orderId}`,
      items: processedItems.map(item => ({
        name: item.product_name || 'Product',
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price || 0)
      })),
      orderId: orderId // Pass orderId for test mode
    };
    
    console.log('💳 [CHECKOUT] Payment data prepared:', {
      customerName: paymentData.customerName,
      customerEmail: paymentData.customerEmail,
      customerPhone: paymentData.customerPhone || 'Not provided',
      customerReference: paymentData.customerReference,
      amount: paymentData.amount
    });

    console.log('📦 [CHECKOUT] Creating order:', {
      orderId: orderId,
      userId: req.user.id,
      totalAmount: totalAmount,
      itemsCount: processedItems.length
    });

    // Initiate payment
    const paymentResult = await initiatePayment(paymentData);
    
    console.log('📦 [CHECKOUT] Payment initiated:', {
      orderId: orderId,
      invoiceId: paymentResult.invoiceId,
      testMode: paymentResult._testMode || false
    });

    // Update order with payment invoice ID
    await pool.execute(
      'UPDATE orders SET payment_invoice_id = ?, payment_reference = ? WHERE id = ?',
      [
        paymentResult.invoiceId || null, 
        paymentResult.invoiceReference || null, 
        orderId || null
      ]
    );

    res.json({
      paymentUrl: paymentResult.paymentUrl,
      orderId: orderId,
      invoiceId: paymentResult.invoiceId
    });
  } catch (error) {
    console.error('❌ [CHECKOUT] Error:', error);
    console.error('❌ [CHECKOUT] Error stack:', error.stack);
    console.error('❌ [CHECKOUT] Error details:', {
      message: error.message,
      name: error.name,
      userId: req.user?.id,
      orderId: orderId
    });
    
    // If order was created but checkout failed, try to clean up
    if (orderId) {
      try {
        console.log('🔄 [CHECKOUT] Attempting to clean up failed order:', orderId);
        await pool.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
        await pool.execute('DELETE FROM subscriptions WHERE order_id = ?', [orderId]);
        await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
        console.log('✅ [CHECKOUT] Cleaned up failed order:', orderId);
      } catch (cleanupError) {
        console.error('❌ [CHECKOUT] Failed to clean up order:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Checkout failed: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// MyFatoorah callback handler (accepts both GET and POST)
// Apply webhook verification for POST requests (MyFatoorah sends POST for webhooks)
router.all('/myfatoorah/callback', (req, res, next) => {
  // Only verify signature for POST requests (webhooks)
  // GET requests are redirects from payment page, no signature needed
  if (req.method === 'POST') {
    return verifyMyFatoorahWebhook(req, res, next);
  }
  next();
}, async (req, res) => {
  try {
    console.log('📞 [CALLBACK] Payment callback received');
    console.log('📞 [CALLBACK] Request body:', req.body);
    console.log('📞 [CALLBACK] Query params:', req.query);
    
    // Support both body and query params (MyFatoorah redirects with GET query params)
    const { paymentId, Id, invoiceId: bodyInvoiceId } = req.body || {};
    const { paymentId: queryPaymentId, Id: queryId, invoiceId: queryInvoiceId, orderId: queryOrderId } = req.query || {};

    // Determine which ID we have - paymentId or invoiceId
    const paymentIdParam = queryPaymentId || queryId || paymentId || Id;
    const invoiceIdParam = queryInvoiceId || bodyInvoiceId;
    
    if (!paymentIdParam && !invoiceIdParam) {
      console.error('📞 [CALLBACK] Missing payment ID');
      return res.status(400).json({ error: 'Missing payment ID' });
    }

    // Use PaymentId if available (from redirect), otherwise InvoiceId
    const keyType = paymentIdParam ? 'PaymentId' : 'InvoiceId';
    const lookupId = paymentIdParam || invoiceIdParam;
    
    console.log('📞 [CALLBACK] Verifying payment:', {
      id: lookupId,
      keyType: keyType
    });
    
    let verification;
    try {
      verification = await verifyPayment(lookupId, keyType);
    } catch (error) {
      // If PaymentId fails and we have invoiceId, try that
      if (keyType === 'PaymentId' && invoiceIdParam) {
        console.log('📞 [CALLBACK] PaymentId lookup failed, trying InvoiceId...');
        verification = await verifyPayment(invoiceIdParam, 'InvoiceId');
      } else {
        throw error;
      }
    }
    
    console.log('📞 [CALLBACK] Verification result:', {
      success: verification.success,
      status: verification.invoiceStatus,
      invoiceId: verification.invoiceId,
      testMode: verification._testMode || false
    });

    // Find order by invoice ID (use the InvoiceId from verification response)
    const actualInvoiceId = verification.invoiceId || invoiceIdParam;
    
    console.log('📞 [CALLBACK] Looking for order with invoice ID:', actualInvoiceId);
    console.log('📞 [CALLBACK] Also checking lookup ID:', lookupId);
    
    // Try to find order by invoice ID first
    let [orders] = await pool.execute(
      'SELECT * FROM orders WHERE payment_invoice_id = ?',
      [actualInvoiceId]
    );
    
    // If not found, try with the lookup ID (PaymentId) - sometimes stored differently
    if (orders.length === 0 && lookupId && lookupId !== actualInvoiceId) {
      console.log('📞 [CALLBACK] Order not found by invoice ID, trying lookup ID...');
      [orders] = await pool.execute(
        'SELECT * FROM orders WHERE payment_invoice_id = ? OR payment_reference = ?',
        [lookupId, lookupId]
      );
    }
    
    // If still not found, try finding by order ID if passed in query
    if (orders.length === 0 && queryOrderId) {
      console.log('📞 [CALLBACK] Order not found by invoice ID, trying order ID...');
      [orders] = await pool.execute(
        'SELECT * FROM orders WHERE id = ?',
        [queryOrderId]
      );
    }
    
    // Last resort: find most recent order for this user (if we can identify user)
    // This is a fallback - should not normally be needed
    if (orders.length === 0) {
      console.log('📞 [CALLBACK] Order not found by any method, checking recent orders...');
      // We don't have user info here, so skip this for now
    }

    if (orders.length === 0) {
      console.error('📞 [CALLBACK] Order not found for invoice:', actualInvoiceId);
      console.error('📞 [CALLBACK] Lookup ID:', lookupId);
      console.error('📞 [CALLBACK] Verification invoice ID:', verification.invoiceId);
      return res.status(404).json({ 
        error: 'Order not found',
        invoiceId: actualInvoiceId,
        lookupId: lookupId
      });
    }

    const order = orders[0];

    // Update order status based on payment status
    let newStatus = order.status;
    const isTestMode = verification._testMode || false;
    
    console.log('📞 [CALLBACK] Checking payment status:', {
      invoiceStatus: verification.invoiceStatus,
      transactions: verification.invoiceTransactions?.length || 0,
      currentOrderStatus: order.status
    });
    
    // Check payment status - MyFatoorah returns "Paid" for successful payments
    // Also check transaction status for additional confirmation
    const invoiceStatus = verification.invoiceStatus || '';
    const isPaid = invoiceStatus.toLowerCase() === 'paid' || 
                   (verification.invoiceTransactions && 
                    verification.invoiceTransactions.some(t => {
                      const txStatus = (t.TransactionStatus || '').toLowerCase();
                      return txStatus === 'succss' || 
                             txStatus === 'success' ||
                             txStatus === 'succeeded';
                    }));
    
    console.log('📞 [CALLBACK] Payment status check:', {
      invoiceStatus: invoiceStatus,
      invoiceStatusLower: invoiceStatus.toLowerCase(),
      isPaid: isPaid,
      transactions: verification.invoiceTransactions?.map(t => ({
        status: t.TransactionStatus,
        statusLower: (t.TransactionStatus || '').toLowerCase()
      })) || [],
      willUpdate: isPaid
    });
    
    if (isPaid) {
      newStatus = 'paid';
      console.log('✅ [CALLBACK] Payment is PAID - setting status to "paid"');
      
      // Update subscription status if order has subscriptions (check subscriptions table)
      const [subscriptions] = await pool.execute(
        `SELECT s.*, p.name as pet_name, p.type as pet_type, p.breed as pet_breed
         FROM subscriptions s
         LEFT JOIN pets p ON s.pet_id = p.id
         WHERE s.order_id = ?`,
        [order.id]
      );
      if (subscriptions.length > 0) {
        // Update subscription status to 'active' when payment is confirmed
        await pool.execute(
          'UPDATE subscriptions SET status = "active" WHERE order_id = ? AND status = "pending"',
          [order.id]
        );
        console.log('✅ [CALLBACK] Subscriptions activated for order:', order.id);
        console.log('✅ [CALLBACK] Updated', subscriptions.length, 'subscription(s) to active status');
        
        // Send admin notification for each activated subscription (non-blocking)
        try {
          for (const subscription of subscriptions) {
            const subscriptionPet = subscription.pet_name ? {
              name: subscription.pet_name,
              type: subscription.pet_type,
              breed: subscription.pet_breed
            } : null;
            await sendSubscriptionCreatedNotification(subscription, user, subscriptionPet);
          }
        } catch (subscriptionEmailError) {
          console.error('⚠️ Failed to send subscription created notifications:', subscriptionEmailError);
          // Don't fail payment confirmation if subscription emails fail
        }
      }
      
      console.log('✅ [CALLBACK] Payment successful. Updating order:', {
        orderId: order.id,
        status: newStatus,
        testMode: isTestMode
      });
      
      // Mark cart as converted
      await pool.execute(
        'UPDATE carts SET status = "converted" WHERE user_id = ? AND status = "active"',
        [order.user_id]
      );
      console.log('✅ [CALLBACK] Cart marked as converted for user:', order.user_id);

      // Get order details for email
      const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [order.user_id]);
      const user = users[0];

      let pet = null;
      if (order.pet_id) {
        const [pets] = await pool.execute('SELECT * FROM pets WHERE id = ?', [order.pet_id]);
        if (pets.length > 0) pet = pets[0];
      }

      // Prepare order data for email notifications
      const [items] = await pool.execute(
        `SELECT oi.*, p.name as product_name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      // Send admin notifications (non-blocking)
      try {
        // Send order paid notification to admin
        await sendOrderPaidNotification(order, user, items, pet);
        
        // Send high-value order alert if order exceeds threshold (default 50 KD)
        const highValueThreshold = parseFloat(process.env.HIGH_VALUE_ORDER_THRESHOLD || 50);
        if (parseFloat(order.total_amount || 0) >= highValueThreshold) {
          await sendHighValueOrderAlert(order, user, items, highValueThreshold);
        }
      } catch (adminEmailError) {
        console.error('⚠️ Failed to send admin notifications:', adminEmailError);
        // Don't fail payment confirmation if admin emails fail
      }

      // Note: Customer emails are sent from frontend (order-confirmation.html) using EmailJS
      // This ensures emails are sent when user sees confirmation page
      console.log('📧 [CALLBACK] Order confirmed - emails will be sent from frontend confirmation page');
    } else {
      // If not paid, check if it's explicitly failed/canceled
      const statusLower = invoiceStatus.toLowerCase();
      if (statusLower === 'failed' || statusLower === 'canceled' || statusLower === 'cancelled') {
        newStatus = 'failed';
        console.log('❌ [CALLBACK] Payment failed. Order status:', newStatus);
        
        // Release reserved stock on payment failure
        const [orderItems] = await pool.execute(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL',
          [order.id]
        );
        
        if (orderItems.length > 0) {
          const itemsToRelease = orderItems.map(item => ({
            productId: item.product_id,
            quantity: item.quantity
          }));
          
          try {
            await releaseStockForOrder(itemsToRelease, order.id);
            console.log('✅ [CALLBACK] Stock released for failed order:', order.id);
          } catch (releaseError) {
            console.error('❌ [CALLBACK] Stock release error:', releaseError);
          }
        }
      } else {
        // If status is unknown or pending, keep current status but log it
        console.log('⚠️  [CALLBACK] Payment status is not Paid:', invoiceStatus);
        console.log('⚠️  [CALLBACK] Keeping order status as:', order.status);
      }
    }

    // Only update status if it changed
    if (newStatus !== order.status) {
      await pool.execute(
        'UPDATE orders SET status = ?, payment_reference = ? WHERE id = ?',
        [
          newStatus, 
          (verification.invoiceId !== undefined && verification.invoiceId !== null) ? verification.invoiceId : null, 
          order.id
        ]
      );
      
      console.log('📞 [CALLBACK] Order status updated:', {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: newStatus,
        invoiceId: verification.invoiceId
      });
    } else {
      console.log('📞 [CALLBACK] Order status unchanged:', {
        orderId: order.id,
        status: order.status,
        invoiceStatus: invoiceStatus
      });
    }

    console.log('✅ [CALLBACK] Order updated successfully:', {
      orderId: order.id,
      status: newStatus,
      invoiceId: verification.invoiceId
    });

    // Redirect to confirmation page for browser requests (check if it's a browser by User-Agent or Accept header)
    const isBrowserRequest = req.get('User-Agent') && !req.get('User-Agent').includes('curl') && 
                            (req.get('Accept') && req.get('Accept').includes('text/html'));
    
    if (isBrowserRequest || req.query.redirect !== 'false') {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
      const redirectUrl = `${baseUrl}/order-confirmation.html?orderId=${order.id}${isTestMode ? '&test=true' : ''}`;
      console.log('✅ [CALLBACK] Redirecting to confirmation page:', redirectUrl);
      return res.redirect(redirectUrl);
    }

    res.json({ 
      success: true, 
      status: newStatus,
      orderId: order.id,
      testMode: isTestMode
    });
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// Get payment URL for an existing order (for retry payment)
router.get('/myfatoorah/retry/:orderId', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const userId = req.user.id;

    // Get order and verify it belongs to the user
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Check if order has invoice ID
    if (!order.payment_invoice_id) {
      return res.status(400).json({ error: 'Order does not have a payment invoice. Please contact support.' });
    }

    // Check if order is already paid
    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Order is already paid' });
    }

    // Get payment URL from MyFatoorah
    const paymentResult = await getPaymentUrl(order.payment_invoice_id);

    res.json({
      paymentUrl: paymentResult.paymentUrl,
      orderId: order.id,
      invoiceId: order.payment_invoice_id
    });
  } catch (error) {
    console.error('❌ [RETRY PAYMENT] Error:', error);
    res.status(500).json({ 
      error: 'Failed to get payment URL: ' + error.message 
    });
  }
});

module.exports = router;

