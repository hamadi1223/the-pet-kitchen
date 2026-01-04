/**
 * Test Factories
 * Generate test data for users, products, orders, etc.
 */

const bcrypt = require('bcryptjs');
const pool = require('../../config/database');

/**
 * Create a test user
 */
async function createUser(overrides = {}) {
  const defaultUser = {
    email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'user',
    email_verified: true,
    ...overrides
  };
  
  const passwordHash = await bcrypt.hash(defaultUser.password, 10);
  
  const [result] = await pool.execute(
    `INSERT INTO users (email, password_hash, name, role, email_verified)
     VALUES (?, ?, ?, ?, ?)`,
    [defaultUser.email, passwordHash, defaultUser.name, defaultUser.role, defaultUser.email_verified ? 1 : 0]
  );
  
  return {
    id: result.insertId,
    ...defaultUser,
    password_hash: passwordHash
  };
}

/**
 * Create a test admin user
 */
async function createAdmin(overrides = {}) {
  return createUser({ role: 'admin', ...overrides });
}

/**
 * Create a test product
 */
async function createProduct(overrides = {}) {
  const defaultProduct = {
    sku: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Product',
    description: 'Test product description',
    species: 'both',
    price_per_pouch: 1.500,
    pouch_grams: 150,
    is_subscription: 0,
    subscription_type: null,
    is_active: 1,
    ...overrides
  };
  
  const [result] = await pool.execute(
    `INSERT INTO products (sku, name, description, species, price_per_pouch, pouch_grams, is_subscription, subscription_type, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      defaultProduct.sku,
      defaultProduct.name,
      defaultProduct.description,
      defaultProduct.species,
      defaultProduct.price_per_pouch,
      defaultProduct.pouch_grams,
      defaultProduct.is_subscription,
      defaultProduct.subscription_type,
      defaultProduct.is_active
    ]
  );
  
  // Create inventory entry
  await pool.execute(
    `INSERT INTO inventory (product_id, quantity, low_stock_threshold)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
    [result.insertId, overrides.stock || 100, overrides.low_stock_threshold || 10]
  );
  
  return {
    id: result.insertId,
    ...defaultProduct
  };
}

/**
 * Create a test pet
 */
async function createPet(userId, overrides = {}) {
  const defaultPet = {
    user_id: userId,
    name: 'Test Pet',
    type: 'dog',
    breed: 'Golden Retriever',
    weight_kg: 25.0,
    age_group: 'adult',
    activity_level: 'normal',
    goal: 'maintain',
    ...overrides
  };
  
  const [result] = await pool.execute(
    `INSERT INTO pets (user_id, name, type, breed, weight_kg, age_group, activity_level, goal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      defaultPet.user_id,
      defaultPet.name,
      defaultPet.type,
      defaultPet.breed,
      defaultPet.weight_kg,
      defaultPet.age_group,
      defaultPet.activity_level,
      defaultPet.goal
    ]
  );
  
  return {
    id: result.insertId,
    ...defaultPet
  };
}

/**
 * Create a test cart
 */
async function createCart(userId, overrides = {}) {
  const defaultCart = {
    user_id: userId,
    status: 'active',
    ...overrides
  };
  
  const [result] = await pool.execute(
    `INSERT INTO carts (user_id, status)
     VALUES (?, ?)`,
    [defaultCart.user_id, defaultCart.status]
  );
  
  return {
    id: result.insertId,
    ...defaultCart
  };
}

/**
 * Create a test cart item
 */
async function createCartItem(cartId, productId, overrides = {}) {
  const defaultItem = {
    cart_id: cartId,
    product_id: productId,
    quantity: 1,
    unit_price: 1.500,
    meta: null,
    ...overrides
  };
  
  // Get product price if not provided
  if (!overrides.unit_price && productId) {
    const [products] = await pool.execute('SELECT price_per_pouch FROM products WHERE id = ?', [productId]);
    if (products.length > 0) {
      defaultItem.unit_price = products[0].price_per_pouch;
    }
  }
  
  const [result] = await pool.execute(
    `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price, meta)
     VALUES (?, ?, ?, ?, ?)`,
    [
      defaultItem.cart_id,
      defaultItem.product_id,
      defaultItem.quantity,
      defaultItem.unit_price,
      defaultItem.meta ? JSON.stringify(defaultItem.meta) : null
    ]
  );
  
  return {
    id: result.insertId,
    ...defaultItem
  };
}

/**
 * Create a test order
 */
async function createOrder(userId, overrides = {}) {
  const defaultOrder = {
    user_id: userId,
    pet_id: null,
    email: 'test@example.com',
    status: 'created',
    total_amount: 10.000,
    payment_provider: 'myfatoorah',
    payment_invoice_id: null,
    payment_reference: null,
    ...overrides
  };
  
  const [result] = await pool.execute(
    `INSERT INTO orders (user_id, pet_id, email, status, total_amount, payment_provider, payment_invoice_id, payment_reference)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      defaultOrder.user_id,
      defaultOrder.pet_id,
      defaultOrder.email,
      defaultOrder.status,
      defaultOrder.total_amount,
      defaultOrder.payment_provider,
      defaultOrder.payment_invoice_id,
      defaultOrder.payment_reference
    ]
  );
  
  return {
    id: result.insertId,
    ...defaultOrder
  };
}

/**
 * Create a test order item
 */
async function createOrderItem(orderId, productId, overrides = {}) {
  const defaultItem = {
    order_id: orderId,
    product_id: productId,
    quantity: 1,
    unit_price: 1.500,
    meta: null,
    ...overrides
  };
  
  // Get product price if not provided
  if (!overrides.unit_price && productId) {
    const [products] = await pool.execute('SELECT price_per_pouch FROM products WHERE id = ?', [productId]);
    if (products.length > 0) {
      defaultItem.unit_price = products[0].price_per_pouch;
    }
  }
  
  const [result] = await pool.execute(
    `INSERT INTO order_items (order_id, product_id, quantity, unit_price, meta)
     VALUES (?, ?, ?, ?, ?)`,
    [
      defaultItem.order_id,
      defaultItem.product_id,
      defaultItem.quantity,
      defaultItem.unit_price,
      defaultItem.meta ? JSON.stringify(defaultItem.meta) : null
    ]
  );
  
  return {
    id: result.insertId,
    ...defaultItem
  };
}

/**
 * Generate JWT token for test user
 */
function generateTestToken(userId, role = 'user') {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
  return jwt.sign({ id: userId, email: 'test@example.com', role }, secret, { expiresIn: '1h' });
}

module.exports = {
  createUser,
  createAdmin,
  createProduct,
  createPet,
  createCart,
  createCartItem,
  createOrder,
  createOrderItem,
  generateTestToken
};

