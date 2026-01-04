/**
 * Inventory Management Service
 * Handles stock reservation, deduction, and release
 */

const pool = require('../config/database');
const { error, info } = require('../utils/logger');

/**
 * Reserve stock for an order
 * @param {Number} productId - Product ID
 * @param {Number} quantity - Quantity to reserve
 * @param {Number} orderId - Order ID (for tracking)
 * @returns {Promise<Object>} Reservation result
 */
async function reserveStock(productId, quantity, orderId = null) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check current stock
    const [inventory] = await connection.execute(
      `SELECT quantity, reserved_quantity 
       FROM inventory 
       WHERE product_id = ? FOR UPDATE`,
      [productId]
    );
    
    if (inventory.length === 0) {
      throw new Error(`Product ${productId} not found in inventory`);
    }
    
    const currentStock = inventory[0];
    const availableStock = currentStock.quantity - currentStock.reserved_quantity;
    
    if (availableStock < quantity) {
      await connection.rollback();
      return {
        success: false,
        error: 'Insufficient stock',
        available: availableStock,
        requested: quantity
      };
    }
    
    // Reserve stock
    await connection.execute(
      `UPDATE inventory 
       SET reserved_quantity = reserved_quantity + ?
       WHERE product_id = ?`,
      [quantity, productId]
    );
    
    // Log inventory movement
    await connection.execute(
      `INSERT INTO inventory_movements (product_id, order_id, movement_type, quantity, created_at)
       VALUES (?, ?, 'reserve', ?, NOW())`,
      [productId, orderId, quantity]
    );
    
    await connection.commit();
    
    info('Stock reserved', { productId, quantity, orderId });
    
    return {
      success: true,
      reserved: quantity,
      available: availableStock - quantity
    };
  } catch (err) {
    await connection.rollback();
    error('Failed to reserve stock', { error: err.message, productId, quantity });
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Deduct stock (convert reservation to deduction)
 * @param {Number} productId - Product ID
 * @param {Number} quantity - Quantity to deduct
 * @param {Number} orderId - Order ID
 * @returns {Promise<Object>} Deduction result
 */
async function deductStock(productId, quantity, orderId) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check reserved quantity
    const [inventory] = await connection.execute(
      `SELECT quantity, reserved_quantity 
       FROM inventory 
       WHERE product_id = ? FOR UPDATE`,
      [productId]
    );
    
    if (inventory.length === 0) {
      throw new Error(`Product ${productId} not found in inventory`);
    }
    
    const currentStock = inventory[0];
    
    if (currentStock.reserved_quantity < quantity) {
      await connection.rollback();
      return {
        success: false,
        error: 'Insufficient reserved stock',
        reserved: currentStock.reserved_quantity,
        requested: quantity
      };
    }
    
    // Deduct from both quantity and reserved_quantity
    await connection.execute(
      `UPDATE inventory 
       SET quantity = quantity - ?,
           reserved_quantity = reserved_quantity - ?
       WHERE product_id = ?`,
      [quantity, quantity, productId]
    );
    
    // Log inventory movement
    await connection.execute(
      `INSERT INTO inventory_movements (product_id, order_id, movement_type, quantity, created_at)
       VALUES (?, ?, 'deduct', ?, NOW())`,
      [productId, orderId, quantity]
    );
    
    await connection.commit();
    
    info('Stock deducted', { productId, quantity, orderId });
    
    return {
      success: true,
      deducted: quantity,
      remaining: currentStock.quantity - quantity
    };
  } catch (err) {
    await connection.rollback();
    error('Failed to deduct stock', { error: err.message, productId, quantity });
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Release reserved stock (on cancellation/failure)
 * @param {Number} productId - Product ID
 * @param {Number} quantity - Quantity to release
 * @param {Number} orderId - Order ID
 * @returns {Promise<Object>} Release result
 */
async function releaseStock(productId, quantity, orderId = null) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check reserved quantity
    const [inventory] = await connection.execute(
      `SELECT reserved_quantity 
       FROM inventory 
       WHERE product_id = ? FOR UPDATE`,
      [productId]
    );
    
    if (inventory.length === 0) {
      await connection.rollback();
      return {
        success: false,
        error: `Product ${productId} not found in inventory`
      };
    }
    
    const currentReserved = inventory[0].reserved_quantity;
    const releaseAmount = Math.min(quantity, currentReserved);
    
    if (releaseAmount <= 0) {
      await connection.rollback();
      return {
        success: false,
        error: 'No reserved stock to release',
        reserved: currentReserved
      };
    }
    
    // Release stock
    await connection.execute(
      `UPDATE inventory 
       SET reserved_quantity = reserved_quantity - ?
       WHERE product_id = ?`,
      [releaseAmount, productId]
    );
    
    // Log inventory movement
    await connection.execute(
      `INSERT INTO inventory_movements (product_id, order_id, movement_type, quantity, created_at)
       VALUES (?, ?, 'release', ?, NOW())`,
      [productId, orderId, releaseAmount]
    );
    
    await connection.commit();
    
    info('Stock released', { productId, quantity: releaseAmount, orderId });
    
    return {
      success: true,
      released: releaseAmount
    };
  } catch (err) {
    await connection.rollback();
    error('Failed to release stock', { error: err.message, productId, quantity });
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Reserve stock for multiple products (for an order)
 * @param {Array} items - Array of {productId, quantity}
 * @param {Number} orderId - Order ID
 * @returns {Promise<Object>} Reservation results
 */
async function reserveStockForOrder(items, orderId) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    
    for (const item of items) {
      const result = await reserveStock(item.productId, item.quantity, orderId);
      if (!result.success) {
        // Rollback all reservations
        await connection.rollback();
        return {
          success: false,
          error: result.error,
          item: item,
          results: results
        };
      }
      results.push({ productId: item.productId, ...result });
    }
    
    await connection.commit();
    
    return {
      success: true,
      results: results
    };
  } catch (err) {
    await connection.rollback();
    error('Failed to reserve stock for order', { error: err.message, orderId });
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Deduct stock for multiple products (for a paid order)
 * @param {Array} items - Array of {productId, quantity}
 * @param {Number} orderId - Order ID
 * @returns {Promise<Object>} Deduction results
 */
async function deductStockForOrder(items, orderId) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    
    for (const item of items) {
      const result = await deductStock(item.productId, item.quantity, orderId);
      if (!result.success) {
        // Rollback all deductions
        await connection.rollback();
        return {
          success: false,
          error: result.error,
          item: item,
          results: results
        };
      }
      results.push({ productId: item.productId, ...result });
    }
    
    await connection.commit();
    
    return {
      success: true,
      results: results
    };
  } catch (err) {
    await connection.rollback();
    error('Failed to deduct stock for order', { error: err.message, orderId });
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Release stock for multiple products (for a cancelled order)
 * @param {Array} items - Array of {productId, quantity}
 * @param {Number} orderId - Order ID
 * @returns {Promise<Object>} Release results
 */
async function releaseStockForOrder(items, orderId) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    
    for (const item of items) {
      const result = await releaseStock(item.productId, item.quantity, orderId);
      // Continue even if some releases fail (log but don't fail entire operation)
      results.push({ productId: item.productId, ...result });
    }
    
    await connection.commit();
    
    return {
      success: true,
      results: results
    };
  } catch (err) {
    await connection.rollback();
    error('Failed to release stock for order', { error: err.message, orderId });
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Check if product has sufficient stock
 * @param {Number} productId - Product ID
 * @param {Number} quantity - Required quantity
 * @returns {Promise<Object>} Stock check result
 */
async function checkStock(productId, quantity) {
  try {
    const [inventory] = await pool.execute(
      `SELECT quantity, reserved_quantity, low_stock_threshold
       FROM inventory
       WHERE product_id = ?`,
      [productId]
    );
    
    if (inventory.length === 0) {
      return {
        available: false,
        error: 'Product not found in inventory'
      };
    }
    
    const stock = inventory[0];
    const available = stock.quantity - stock.reserved_quantity;
    const sufficient = available >= quantity;
    
    return {
      available: sufficient,
      quantity: stock.quantity,
      reserved: stock.reserved_quantity,
      availableStock: available,
      requested: quantity,
      lowStock: stock.quantity <= stock.low_stock_threshold
    };
  } catch (err) {
    error('Failed to check stock', { error: err.message, productId });
    throw err;
  }
}

/**
 * Get low stock products
 * @param {Number} threshold - Optional custom threshold
 * @returns {Promise<Array>} Low stock products
 */
async function getLowStockProducts(threshold = null) {
  try {
    let query = `
      SELECT i.*, p.name, p.sku
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE p.is_active = 1
        AND i.quantity <= COALESCE(?, i.low_stock_threshold)
      ORDER BY i.quantity ASC
    `;
    
    const [products] = await pool.execute(query, [threshold]);
    
    return products.map(p => ({
      id: p.product_id,
      name: p.name,
      sku: p.sku,
      quantity: p.quantity,
      reserved_quantity: p.reserved_quantity,
      available: p.quantity - p.reserved_quantity,
      low_stock_threshold: p.low_stock_threshold
    }));
  } catch (err) {
    error('Failed to get low stock products', { error: err.message });
    throw err;
  }
}

/**
 * Adjust stock (admin function)
 * @param {Number} productId - Product ID
 * @param {Number} adjustment - Positive to add, negative to subtract
 * @param {String} reason - Reason for adjustment
 * @param {Number} adminId - Admin user ID
 * @returns {Promise<Object>} Adjustment result
 */
async function adjustStock(productId, adjustment, reason, adminId) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get current stock
    const [inventory] = await connection.execute(
      `SELECT quantity FROM inventory WHERE product_id = ? FOR UPDATE`,
      [productId]
    );
    
    if (inventory.length === 0) {
      throw new Error(`Product ${productId} not found in inventory`);
    }
    
    const currentStock = inventory[0].quantity;
    const newStock = Math.max(0, currentStock + adjustment);
    
    // Update stock
    await connection.execute(
      `UPDATE inventory SET quantity = ? WHERE product_id = ?`,
      [newStock, productId]
    );
    
    // Log adjustment
    await connection.execute(
      `INSERT INTO inventory_movements (product_id, order_id, movement_type, quantity, reason, admin_id, created_at)
       VALUES (?, NULL, 'adjust', ?, ?, ?, NOW())`,
      [productId, adjustment, reason, adminId]
    );
    
    await connection.commit();
    
    info('Stock adjusted', { productId, adjustment, newStock, adminId });
    
    return {
      success: true,
      previousStock: currentStock,
      adjustment: adjustment,
      newStock: newStock
    };
  } catch (err) {
    await connection.rollback();
    error('Failed to adjust stock', { error: err.message, productId, adjustment });
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  reserveStock,
  deductStock,
  releaseStock,
  reserveStockForOrder,
  deductStockForOrder,
  releaseStockForOrder,
  checkStock,
  getLowStockProducts,
  adjustStock
};

