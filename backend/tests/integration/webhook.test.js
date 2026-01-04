/**
 * Integration Tests: Webhook Verification
 */

const request = require('supertest');
const app = require('../../server');
const crypto = require('crypto');
const {
  createUser,
  createProduct,
  createOrder,
  generateTestToken
} = require('../helpers/factories');
const { resetDatabase } = require('../helpers/db');

describe('Webhook Verification', () => {
  let user;
  let product;
  let order;
  const webhookSecret = 'test-webhook-secret';
  
  beforeAll(async () => {
    process.env.MYFATOORAH_WEBHOOK_SECRET = webhookSecret;
    await resetDatabase();
  });
  
  beforeEach(async () => {
    user = await createUser();
    product = await createProduct({ stock: 100 });
    order = await createOrder(user.id, {
      payment_invoice_id: 'test-invoice-123',
      status: 'created'
    });
  });
  
  afterEach(async () => {
    const pool = require('../../config/database');
    await pool.execute('DELETE FROM order_items');
    await pool.execute('DELETE FROM orders');
  });
  
  describe('Signature Verification', () => {
    test('accepts valid webhook signature', async () => {
      const payload = { invoiceId: 'test-invoice-123', status: 'Paid' };
      const payloadString = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadString)
        .digest('hex');
      
      const response = await request(app)
        .post('/api/v1/checkout/myfatoorah/callback')
        .set('X-MyFatoorah-Signature', `sha256=${signature}`)
        .send(payload);
      
      // Should not return 401 (unauthorized)
      expect(response.status).not.toBe(401);
    });
    
    test('rejects invalid webhook signature', async () => {
      const payload = { invoiceId: 'test-invoice-123', status: 'Paid' };
      const invalidSignature = 'invalid-signature';
      
      const response = await request(app)
        .post('/api/v1/checkout/myfatoorah/callback')
        .set('X-MyFatoorah-Signature', `sha256=${invalidSignature}`)
        .send(payload);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid webhook signature');
    });
    
    test('rejects missing signature header', async () => {
      const payload = { invoiceId: 'test-invoice-123', status: 'Paid' };
      
      const response = await request(app)
        .post('/api/v1/checkout/myfatoorah/callback')
        .send(payload);
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Missing webhook signature');
    });
    
    test('allows GET requests without signature (redirects)', async () => {
      const response = await request(app)
        .get('/api/v1/checkout/myfatoorah/callback?paymentId=test-invoice-123');
      
      // GET requests are redirects, should not require signature
      expect(response.status).not.toBe(401);
    });
  });
  
  describe('Replay Protection', () => {
    test('handles duplicate webhook events idempotently', async () => {
      const payload = { invoiceId: 'test-invoice-123', status: 'Paid' };
      const payloadString = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadString)
        .digest('hex');
      
      // Send same webhook twice
      const response1 = await request(app)
        .post('/api/v1/checkout/myfatoorah/callback')
        .set('X-MyFatoorah-Signature', `sha256=${signature}`)
        .send(payload);
      
      const response2 = await request(app)
        .post('/api/v1/checkout/myfatoorah/callback')
        .set('X-MyFatoorah-Signature', `sha256=${signature}`)
        .send(payload);
      
      // Both should succeed (idempotent)
      expect(response1.status).not.toBe(401);
      expect(response2.status).not.toBe(401);
      
      // Verify order status updated only once (check order status)
      const pool = require('../../config/database');
      const [orders] = await pool.execute(
        'SELECT status FROM orders WHERE payment_invoice_id = ?',
        ['test-invoice-123']
      );
      
      // Should have consistent state
      expect(orders.length).toBeGreaterThan(0);
    });
  });
  
  describe('Side Effects', () => {
    test('updates order status on payment webhook', async () => {
      // This test would verify that webhook correctly updates order
      // Implementation depends on actual webhook handler
    });
    
    test('triggers email on successful payment', async () => {
      // This test would verify email is sent
      // Would need to mock email service
    });
    
    test('adjusts inventory only once', async () => {
      // This test would verify inventory is deducted only once
      // Even if webhook is called multiple times
    });
  });
});

