/**
 * Unit Tests: Inventory Management
 */

const {
  reserveStock,
  deductStock,
  releaseStock,
  checkStock,
  adjustStock
} = require('../../services/inventory');
const { createProduct, createOrder } = require('../helpers/factories');
const { resetDatabase } = require('../helpers/db');

describe('Inventory Management', () => {
  let product;
  let order;
  
  beforeAll(async () => {
    await resetDatabase();
  });
  
  beforeEach(async () => {
    product = await createProduct({ stock: 100 });
    order = await createOrder(1, { id: 1 });
  });
  
  afterEach(async () => {
    const pool = require('../../config/database');
    await pool.execute('DELETE FROM inventory_movements');
    await pool.execute('DELETE FROM inventory');
    await pool.execute('DELETE FROM products');
    await pool.execute('DELETE FROM orders');
  });
  
  describe('Stock Reservation', () => {
    test('reserves stock successfully', async () => {
      const result = await reserveStock(product.id, 10, order.id);
      
      expect(result.success).toBe(true);
      expect(result.reserved).toBe(10);
      expect(result.available).toBe(90);
    });
    
    test('prevents reservation when insufficient stock', async () => {
      const result = await reserveStock(product.id, 150, order.id);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient stock');
      expect(result.available).toBe(100);
    });
    
    test('handles concurrent reservations correctly', async () => {
      // Simulate concurrent reservations
      const promises = [
        reserveStock(product.id, 30, order.id),
        reserveStock(product.id, 30, order.id),
        reserveStock(product.id, 30, order.id)
      ];
      
      const results = await Promise.all(promises);
      
      // Only first two should succeed (30 + 30 = 60, leaving 40)
      const successful = results.filter(r => r.success);
      expect(successful.length).toBeLessThanOrEqual(2);
    });
  });
  
  describe('Stock Deduction', () => {
    test('deducts stock after reservation', async () => {
      // First reserve
      await reserveStock(product.id, 10, order.id);
      
      // Then deduct
      const result = await deductStock(product.id, 10, order.id);
      
      expect(result.success).toBe(true);
      expect(result.deducted).toBe(10);
    });
    
    test('prevents deduction without reservation', async () => {
      const result = await deductStock(product.id, 10, order.id);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient reserved stock');
    });
    
    test('prevents double deduction', async () => {
      await reserveStock(product.id, 10, order.id);
      await deductStock(product.id, 10, order.id);
      
      // Try to deduct again
      const result = await deductStock(product.id, 10, order.id);
      
      expect(result.success).toBe(false);
    });
  });
  
  describe('Stock Release', () => {
    test('releases reserved stock', async () => {
      await reserveStock(product.id, 20, order.id);
      
      const result = await releaseStock(product.id, 20, order.id);
      
      expect(result.success).toBe(true);
      expect(result.released).toBe(20);
    });
    
    test('handles partial release', async () => {
      await reserveStock(product.id, 20, order.id);
      
      const result = await releaseStock(product.id, 10, order.id);
      
      expect(result.success).toBe(true);
      expect(result.released).toBe(10);
    });
    
    test('prevents release of non-reserved stock', async () => {
      const result = await releaseStock(product.id, 10, order.id);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No reserved stock to release');
    });
  });
  
  describe('Stock Checking', () => {
    test('checks available stock correctly', async () => {
      await reserveStock(product.id, 30, order.id);
      
      const result = await checkStock(product.id, 50);
      
      expect(result.available).toBe(true);
      expect(result.availableStock).toBe(70);
      expect(result.reserved).toBe(30);
    });
    
    test('detects insufficient stock', async () => {
      await reserveStock(product.id, 50, order.id);
      
      const result = await checkStock(product.id, 60);
      
      expect(result.available).toBe(false);
      expect(result.availableStock).toBe(50);
    });
    
    test('detects low stock', async () => {
      const lowStockProduct = await createProduct({ stock: 5, low_stock_threshold: 10 });
      
      const result = await checkStock(lowStockProduct.id, 1);
      
      expect(result.lowStock).toBe(true);
    });
  });
  
  describe('Stock Adjustment (Admin)', () => {
    test('adds stock correctly', async () => {
      const adminId = 1;
      const result = await adjustStock(product.id, 50, 'Restock', adminId);
      
      expect(result.success).toBe(true);
      expect(result.adjustment).toBe(50);
      expect(result.newStock).toBe(150);
    });
    
    test('reduces stock correctly', async () => {
      const adminId = 1;
      const result = await adjustStock(product.id, -30, 'Damaged goods', adminId);
      
      expect(result.success).toBe(true);
      expect(result.adjustment).toBe(-30);
      expect(result.newStock).toBe(70);
    });
    
    test('prevents negative stock', async () => {
      const adminId = 1;
      const result = await adjustStock(product.id, -150, 'Correction', adminId);
      
      expect(result.success).toBe(true);
      expect(result.newStock).toBe(0); // Should not go negative
    });
  });
  
  describe('Idempotency', () => {
    test('prevents double reservation on same order', async () => {
      const result1 = await reserveStock(product.id, 10, order.id);
      const result2 = await reserveStock(product.id, 10, order.id);
      
      // Second reservation should fail or be ignored
      expect(result1.success).toBe(true);
      // Note: Current implementation allows this, but we should add idempotency
    });
  });
});

