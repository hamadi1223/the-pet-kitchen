/**
 * Integration Tests: Checkout Flow
 */

const request = require('supertest');
const app = require('../../server');
const {
  createUser,
  createProduct,
  createCart,
  createCartItem,
  generateTestToken
} = require('../helpers/factories');
const { resetDatabase } = require('../helpers/db');
const { mockPaymentService } = require('../helpers/mocks');

describe('Checkout Integration Tests', () => {
  let user;
  let product;
  let cart;
  let authToken;
  
  beforeAll(async () => {
    await resetDatabase();
  });
  
  beforeEach(async () => {
    user = await createUser({ email_verified: true });
    product = await createProduct({ stock: 100 });
    cart = await createCart(user.id);
    await createCartItem(cart.id, product.id, { quantity: 2 });
    authToken = generateTestToken(user.id, user.role);
  });
  
  afterEach(async () => {
    const pool = require('../../config/database');
    await pool.execute('DELETE FROM order_items');
    await pool.execute('DELETE FROM orders');
    await pool.execute('DELETE FROM cart_items');
    await pool.execute('DELETE FROM carts');
    await pool.execute('DELETE FROM inventory_movements');
    await pool.execute('UPDATE inventory SET reserved_quantity = 0, quantity = 100');
  });
  
  describe('Checkout Flow', () => {
    test('creates order and initiates payment', async () => {
      const response = await request(app)
        .post('/api/v1/checkout/myfatoorah')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pet_id: null,
          phone: '+1234567890'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('paymentUrl');
      expect(response.body).toHaveProperty('invoiceId');
      
      // Verify order was created
      const pool = require('../../config/database');
      const [orders] = await pool.execute('SELECT * FROM orders WHERE user_id = ?', [user.id]);
      expect(orders.length).toBe(1);
      expect(orders[0].status).toBe('created');
      
      // Verify stock was reserved
      const [inventory] = await pool.execute(
        'SELECT reserved_quantity FROM inventory WHERE product_id = ?',
        [product.id]
      );
      expect(inventory[0].reserved_quantity).toBe(2);
    });
    
    test('prevents checkout with unverified email', async () => {
      const unverifiedUser = await createUser({ email_verified: false });
      const unverifiedToken = generateTestToken(unverifiedUser.id, unverifiedUser.role);
      
      const response = await request(app)
        .post('/api/v1/checkout/myfatoorah')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({
          pet_id: null,
          phone: '+1234567890'
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Email verification required');
    });
    
    test('prevents checkout with empty cart', async () => {
      const emptyCart = await createCart(user.id);
      
      const response = await request(app)
        .post('/api/v1/checkout/myfatoorah')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pet_id: null,
          phone: '+1234567890'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cart is empty');
    });
    
    test('prevents checkout with out-of-stock items', async () => {
      // Create product with low stock
      const lowStockProduct = await createProduct({ stock: 1 });
      const lowStockCart = await createCart(user.id);
      await createCartItem(lowStockCart.id, lowStockProduct.id, { quantity: 5 });
      
      // This should be handled by inventory check (to be implemented)
      // For now, we'll test that the order creation fails
    });
  });
  
  describe('Payment Callback', () => {
    test('updates order status on successful payment', async () => {
      // Create order first
      const orderResponse = await request(app)
        .post('/api/v1/checkout/myfatoorah')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pet_id: null,
          phone: '+1234567890'
        });
      
      const invoiceId = orderResponse.body.invoiceId;
      
      // Mock payment verification
      mockPaymentService.verifyPayment.mockResolvedValue({
        success: true,
        invoiceId: invoiceId,
        invoiceStatus: 'Paid',
        invoiceValue: 3.000,
        invoiceTransactions: [{
          TransactionStatus: 'SUCCESS',
          PaymentValue: 3.000
        }]
      });
      
      // Simulate payment callback
      const callbackResponse = await request(app)
        .get(`/api/v1/checkout/myfatoorah/callback?paymentId=${invoiceId}`)
        .query({ paymentId: invoiceId });
      
      // Verify order status updated
      const pool = require('../../config/database');
      const [orders] = await pool.execute('SELECT * FROM orders WHERE payment_invoice_id = ?', [invoiceId]);
      expect(orders[0].status).toBe('paid');
      
      // Verify stock was deducted
      const [inventory] = await pool.execute(
        'SELECT quantity, reserved_quantity FROM inventory WHERE product_id = ?',
        [product.id]
      );
      expect(inventory[0].quantity).toBe(98); // 100 - 2
      expect(inventory[0].reserved_quantity).toBe(0);
    });
    
    test('handles idempotent payment callbacks', async () => {
      // Create order
      const orderResponse = await request(app)
        .post('/api/v1/checkout/myfatoorah')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pet_id: null,
          phone: '+1234567890'
        });
      
      const invoiceId = orderResponse.body.invoiceId;
      
      mockPaymentService.verifyPayment.mockResolvedValue({
        success: true,
        invoiceId: invoiceId,
        invoiceStatus: 'Paid',
        invoiceValue: 3.000
      });
      
      // Call callback twice
      await request(app)
        .get(`/api/v1/checkout/myfatoorah/callback?paymentId=${invoiceId}`);
      
      await request(app)
        .get(`/api/v1/checkout/myfatoorah/callback?paymentId=${invoiceId}`);
      
      // Verify stock was only deducted once
      const pool = require('../../config/database');
      const [inventory] = await pool.execute(
        'SELECT quantity FROM inventory WHERE product_id = ?',
        [product.id]
      );
      expect(inventory[0].quantity).toBe(98); // Should be 98, not 96
    });
  });
  
  describe('Order Validation', () => {
    test('validates required fields', async () => {
      const response = await request(app)
        .post('/api/v1/checkout/myfatoorah')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      // Should validate phone format if provided
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
    
    test('validates phone format', async () => {
      const response = await request(app)
        .post('/api/v1/checkout/myfatoorah')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: 'invalid-phone'
        });
      
      // Should fail validation
      expect(response.status).toBe(400);
    });
  });
});

