/**
 * Pricing Calculation Utilities
 * Handles all pricing calculations for products, carts, and orders
 */

/**
 * Calculate product total (price * quantity)
 */
function calculateProductTotal(product, quantity) {
  if (!product || !product.price_per_pouch || quantity <= 0) {
    return 0;
  }
  const total = parseFloat(product.price_per_pouch) * quantity;
  return parseFloat(total.toFixed(3));
}

/**
 * Calculate cart subtotal
 */
function calculateSubtotal(items) {
  if (!items || items.length === 0) {
    return 0;
  }
  
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0);
    return sum + itemTotal;
  }, 0);
  
  return parseFloat(subtotal.toFixed(3));
}

/**
 * Apply discount to amount
 */
function applyDiscount(amount, discount) {
  if (!discount || amount <= 0) {
    return amount;
  }
  
  let discounted = amount;
  
  if (discount.type === 'percentage') {
    const discountAmount = amount * (parseFloat(discount.value) / 100);
    discounted = amount - discountAmount;
  } else if (discount.type === 'fixed') {
    discounted = amount - parseFloat(discount.value);
  }
  
  // Discount cannot exceed amount
  return parseFloat(Math.max(0, discounted).toFixed(3));
}

/**
 * Calculate tax
 */
function calculateTax(amount, taxRate = 0) {
  if (!taxRate || amount <= 0) {
    return 0;
  }
  const tax = amount * parseFloat(taxRate);
  return parseFloat(tax.toFixed(3));
}

/**
 * Calculate shipping
 */
function calculateShipping(amount, shippingRate = 0, freeShippingThreshold = null) {
  if (freeShippingThreshold && amount >= freeShippingThreshold) {
    return 0;
  }
  return parseFloat((shippingRate || 0).toFixed(3));
}

/**
 * Calculate complete order total
 */
function calculateOrderTotal({ subtotal = 0, tax = 0, shipping = 0, discount = 0 }) {
  const total = subtotal + tax + shipping - discount;
  return parseFloat(Math.max(0, total).toFixed(3));
}

/**
 * Recalculate cart totals server-side
 */
function recalculateCartTotals(items, coupon = null, taxRate = 0, shippingRate = 0) {
  const subtotal = calculateSubtotal(items);
  const discount = coupon ? applyDiscount(subtotal, coupon) : subtotal;
  const discountAmount = subtotal - discount;
  const tax = calculateTax(discount, taxRate);
  const shipping = calculateShipping(discount, shippingRate);
  const total = calculateOrderTotal({ subtotal: discount, tax, shipping, discount: 0 });
  
  return {
    subtotal,
    discount: discountAmount,
    tax,
    shipping,
    total
  };
}

module.exports = {
  calculateProductTotal,
  calculateSubtotal,
  applyDiscount,
  calculateTax,
  calculateShipping,
  calculateOrderTotal,
  recalculateCartTotals
};

