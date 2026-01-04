/**
 * Complete Email Templates
 * All email templates for the e-commerce platform
 * Uses the base email template system for consistency
 */

const {
  getBaseEmailTemplate,
  generateSection,
  generateDetailRow,
  generateRecommendation,
  generateMetricsGrid,
  generateHighlightTip
} = require('./emailBase');

/**
 * Payment Received / Invoice Email
 */
function getPaymentReceivedTemplate(order, user, items, pet = null) {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const orderDetails = [
    generateDetailRow('Invoice Number', `#${order.id}`),
    generateDetailRow('Order Date', orderDate),
    generateDetailRow('Payment Status', 'Payment Received'),
    generateDetailRow('Total Amount', `${parseFloat(order.total_amount || 0).toFixed(3)} KD`),
    ...(order.payment_reference ? [generateDetailRow('Payment Reference', order.payment_reference)] : []),
    ...(order.payment_invoice_id ? [generateDetailRow('Invoice ID', order.payment_invoice_id)] : [])
  ].join('');

  const itemsTable = `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #F8F9FA;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #C6A769; color: #333;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #C6A769; color: #333;">Quantity</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #C6A769; color: #333;">Unit Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #C6A769; color: #333;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #E5E5E5;">${item.product_name || 'Item'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: right;">${parseFloat(item.unit_price || 0).toFixed(3)} KD</td>
            <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: right; font-weight: 600;">${parseFloat((item.unit_price || 0) * item.quantity).toFixed(3)} KD</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 16px; text-align: right; font-weight: 700; font-size: 18px; color: #333; border-top: 2px solid #C6A769;">Total:</td>
          <td style="padding: 16px; text-align: right; font-weight: 700; font-size: 20px; color: #C6A769; border-top: 2px solid #C6A769;">${parseFloat(order.total_amount || 0).toFixed(3)} KD</td>
        </tr>
      </tfoot>
    </table>
  `;

  const content = `
    <p class="greeting">Dear ${user.name || user.email},</p>
    <p class="intro">We have successfully received your payment for order #${order.id}. Thank you for your purchase!</p>
    
    ${generateSection('💰 Payment Details', orderDetails)}
    
    ${generateSection('📦 Order Items', itemsTable)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Your order is now being processed and will be prepared for delivery.</p>
    
    <p style="font-size: 16px; color: #333; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '💰 Payment Received',
    tagline: 'The Pet Kitchen',
    preheader: `Payment received for order #${order.id}. Your order is being processed.`,
    content: content
  });
}

/**
 * Order Processing Update Email
 */
function getOrderProcessingTemplate(order, user, updateMessage = null) {
  const content = `
    <p class="greeting">Dear ${user.name || user.email},</p>
    <p class="intro">We have an update on your order #${order.id}.</p>
    
    ${generateSection('📦 Order Status', `
      ${generateDetailRow('Order Number', `#${order.id}`)}
      ${generateDetailRow('Current Status', order.status)}
      ${updateMessage ? generateDetailRow('Update', updateMessage) : ''}
    `)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">We'll keep you updated as your order progresses.</p>
    
    <p style="font-size: 16px; color: #333; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '📦 Order Update',
    tagline: 'The Pet Kitchen',
    preheader: `Update on your order #${order.id}`,
    content: content
  });
}

/**
 * Shipping Confirmation Email (with tracking)
 */
function getShippingConfirmationTemplate(order, user, trackingNumber, estimatedDelivery = null) {
  const shippingDetails = [
    generateDetailRow('Order Number', `#${order.id}`),
    generateDetailRow('Tracking Number', trackingNumber),
    ...(estimatedDelivery ? [generateDetailRow('Estimated Delivery', estimatedDelivery)] : [])
  ].join('');

  const trackingLink = `https://tracking.thepetkitchen.net/${trackingNumber}`;

  const content = `
    <p class="greeting">Dear ${user.name || user.email},</p>
    <p class="intro">Great news! Your order #${order.id} has been shipped and is on its way to you.</p>
    
    ${generateSection('🚚 Shipping Details', shippingDetails)}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${trackingLink}" class="button">Track Your Order →</a>
    </div>
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">You can track your order using the tracking number above.</p>
    
    <p style="font-size: 16px; color: #333; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '🚚 Order Shipped',
    tagline: 'The Pet Kitchen',
    preheader: `Your order #${order.id} has been shipped! Track it with ${trackingNumber}`,
    content: content
  });
}

/**
 * Delivered Confirmation Email
 */
function getDeliveredConfirmationTemplate(order, user) {
  const content = `
    <p class="greeting">Dear ${user.name || user.email},</p>
    <p class="intro">Your order #${order.id} has been delivered!</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">✅ Delivery Confirmed</p>
      <p style="margin: 8px 0 0 0; color: #666;">Your order has been successfully delivered. We hope your pet enjoys their fresh meals!</p>
    `)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">If you have any questions or concerns, please don't hesitate to contact us.</p>
    
    <p style="font-size: 16px; color: #333; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '✅ Order Delivered',
    tagline: 'The Pet Kitchen',
    preheader: `Your order #${order.id} has been delivered!`,
    content: content
  });
}

/**
 * Refund Initiated Email
 */
function getRefundInitiatedTemplate(refund, order, user) {
  const refundDetails = [
    generateDetailRow('Refund Number', `#${refund.id}`),
    generateDetailRow('Order Number', `#${order.id}`),
    generateDetailRow('Refund Amount', `${parseFloat(refund.amount || 0).toFixed(3)} KD`),
    generateDetailRow('Status', refund.status),
    ...(refund.reason ? [generateDetailRow('Reason', refund.reason)] : [])
  ].join('');

  const content = `
    <p class="greeting">Dear ${user.name || user.email},</p>
    <p class="intro">We have initiated a refund for your order #${order.id}.</p>
    
    ${generateSection('💳 Refund Details', refundDetails)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">The refund will be processed to your original payment method. It may take 5-10 business days to appear in your account.</p>
    
    <p style="font-size: 16px; color: #333; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '💳 Refund Initiated',
    tagline: 'The Pet Kitchen',
    preheader: `Refund initiated for order #${order.id}`,
    content: content
  });
}

/**
 * Refund Completed Email
 */
function getRefundCompletedTemplate(refund, order, user) {
  const content = `
    <p class="greeting">Dear ${user.name || user.email},</p>
    <p class="intro">Your refund for order #${order.id} has been completed.</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">✅ Refund Completed</p>
      <p style="margin: 8px 0 0 0; color: #666;">Amount: ${parseFloat(refund.amount || 0).toFixed(3)} KD</p>
      ${refund.payment_reference ? `<p style="margin: 8px 0 0 0; color: #666;">Reference: ${refund.payment_reference}</p>` : ''}
    `)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">The refund has been processed to your original payment method. Please allow 5-10 business days for it to appear in your account.</p>
    
    <p style="font-size: 16px; color: #333; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '✅ Refund Completed',
    tagline: 'The Pet Kitchen',
    preheader: `Refund completed for order #${order.id}`,
    content: content
  });
}

/**
 * Abandoned Cart Reminder Email
 */
function getAbandonedCartTemplate(cart, user, items) {
  const itemsList = items.slice(0, 3).map(item => 
    `<li style="margin: 8px 0;">${item.product_name || 'Item'} - ${item.quantity}x</li>`
  ).join('');

  const totalAmount = items.reduce((sum, item) => 
    sum + (parseFloat(item.unit_price || 0) * item.quantity), 0
  ).toFixed(3);

  const frontendUrl = process.env.FRONTEND_URL || 'https://thepetkitchen.net';
  const cartLink = `${frontendUrl}/cart.html`;

  const content = `
    <p class="greeting">Dear ${user.name || user.email},</p>
    <p class="intro">We noticed you left some items in your cart. Don't miss out on these fresh meals for your pet!</p>
    
    ${generateSection('🛒 Your Cart', `
      <ul style="margin: 0; padding-left: 20px;">${itemsList}</ul>
      ${items.length > 3 ? `<p style="margin-top: 12px; color: #666;">...and ${items.length - 3} more item(s)</p>` : ''}
      <p style="margin-top: 16px; font-size: 18px; font-weight: 600; color: #C6A769;">Total: ${totalAmount} KD</p>
    `)}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${cartLink}" class="button">Complete Your Order →</a>
    </div>
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">This offer is valid for a limited time. Complete your order now to ensure your pet gets the freshest meals!</p>
    
    <p style="font-size: 16px; color: #333; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '🛒 Don\'t Forget Your Cart!',
    tagline: 'The Pet Kitchen',
    preheader: `You have items waiting in your cart. Complete your order now!`,
    content: content
  });
}

/**
 * Back-in-Stock Alert Email
 */
function getBackInStockTemplate(product, user) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://thepetkitchen.net';
  const productLink = `${frontendUrl}/meal-plans.html`;

  const content = `
    <p class="greeting">Dear ${user.name || user.email},</p>
    <p class="intro">Great news! ${product.name} is back in stock!</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">✅ Back in Stock</p>
      <p style="margin: 8px 0 0 0; color: #666;">${product.name} is now available for order.</p>
    `)}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${productLink}" class="button">Order Now →</a>
    </div>
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Don't miss out - stock is limited!</p>
    
    <p style="font-size: 16px; color: #333; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '✅ Back in Stock!',
    tagline: 'The Pet Kitchen',
    preheader: `${product.name} is back in stock!`,
    content: content
  });
}

/**
 * Contact Form Receipt Email
 */
function getContactFormReceiptTemplate(formData) {
  const details = [
    generateDetailRow('Name', formData.name),
    generateDetailRow('Email', formData.email),
    ...(formData.phone ? [generateDetailRow('Phone', formData.phone)] : []),
    ...(formData.subject ? [generateDetailRow('Subject', formData.subject)] : []),
    generateDetailRow('Message', formData.message)
  ].join('');

  const content = `
    <p class="greeting">Dear ${formData.name},</p>
    <p class="intro">Thank you for contacting The Pet Kitchen. We have received your message and will get back to you soon.</p>
    
    ${generateSection('📧 Your Message', details)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Our team typically responds within 24-48 hours. We appreciate your patience!</p>
    
    <p style="font-size: 16px; color: #333; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '📧 Message Received',
    tagline: 'The Pet Kitchen',
    preheader: 'We have received your message and will respond soon.',
    content: content
  });
}

/**
 * Payment Failed Alert (Admin)
 */
function getPaymentFailedAlertTemplate(order, user, errorMessage) {
  const orderDetails = [
    generateDetailRow('Order Number', `#${order.id}`),
    generateDetailRow('Customer', user.name || user.email),
    generateDetailRow('Amount', `${parseFloat(order.total_amount || 0).toFixed(3)} KD`),
    generateDetailRow('Error', errorMessage || 'Payment failed')
  ].join('');

  const content = `
    <p class="greeting">Admin Alert</p>
    <p class="intro">A payment has failed for order #${order.id}.</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">⚠️ Payment Failed</p>
      <p style="margin: 8px 0 0 0; color: #666;">Immediate attention required.</p>
    `)}
    
    ${generateSection('📦 Order Details', orderDetails)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Please review this order and contact the customer if necessary.</p>
  `;

  return getBaseEmailTemplate({
    title: '⚠️ Payment Failed Alert',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `Payment failed for order #${order.id}`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * High-Risk Order Flag (Admin)
 */
function getHighRiskOrderTemplate(order, user, riskFactors) {
  const riskDetails = [
    generateDetailRow('Order Number', `#${order.id}`),
    generateDetailRow('Customer', user.name || user.email),
    generateDetailRow('Amount', `${parseFloat(order.total_amount || 0).toFixed(3)} KD`),
    generateDetailRow('Risk Factors', riskFactors.join(', '))
  ].join('');

  const content = `
    <p class="greeting">Admin Alert</p>
    <p class="intro">Order #${order.id} has been flagged as high-risk.</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">🚨 High-Risk Order</p>
      <p style="margin: 8px 0 0 0; color: #666;">Manual review recommended.</p>
    `)}
    
    ${generateSection('⚠️ Risk Assessment', riskDetails)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Please review this order before processing.</p>
  `;

  return getBaseEmailTemplate({
    title: '🚨 High-Risk Order',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `High-risk order #${order.id} requires review`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * Low Stock Alert (Admin)
 */
function getLowStockAlertTemplate(products) {
  const productsList = products.map(p => 
    `<li style="margin: 8px 0;"><strong>${p.name}</strong> (SKU: ${p.sku}) - ${p.quantity} remaining (threshold: ${p.low_stock_threshold})</li>`
  ).join('');

  const content = `
    <p class="greeting">Admin Alert</p>
    <p class="intro">The following products are running low on stock:</p>
    
    ${generateSection('📦 Low Stock Items', `<ul style="margin: 0; padding-left: 20px;">${productsList}</ul>`)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Please restock these items to avoid out-of-stock situations.</p>
  `;

  return getBaseEmailTemplate({
    title: '📦 Low Stock Alert',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `${products.length} product(s) running low on stock`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * New User Registered (Admin)
 */
function getNewUserRegisteredTemplate(user) {
  const userDetails = [
    generateDetailRow('Name', user.name || 'N/A'),
    generateDetailRow('Email', user.email),
    generateDetailRow('Phone', user.phone || 'N/A'),
    generateDetailRow('Registration Date', new Date(user.created_at || new Date()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })),
    generateDetailRow('Email Verified', user.email_verified ? 'Yes' : 'No')
  ].join('');

  const content = `
    <p class="greeting">Admin Notification</p>
    <p class="intro">A new user has registered on The Pet Kitchen platform.</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">👤 New User Registration</p>
      <p style="margin: 8px 0 0 0; color: #666;">Welcome ${user.name || user.email} to The Pet Kitchen!</p>
    `)}
    
    ${generateSection('👤 User Details', userDetails)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">This user can now place orders and create subscriptions.</p>
  `;

  return getBaseEmailTemplate({
    title: '👤 New User Registered',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `New user registration: ${user.email}`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * Order Paid Notification (Admin)
 */
function getOrderPaidNotificationTemplate(order, user, items, pet = null) {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const paymentDetails = [
    generateDetailRow('Order ID', `#${order.id}`),
    generateDetailRow('Customer', `${user.name || 'N/A'} (${user.email})`),
    generateDetailRow('Order Date', orderDate),
    generateDetailRow('Total Amount', `${parseFloat(order.total_amount || 0).toFixed(3)} KD`),
    generateDetailRow('Payment Status', 'Paid'),
    ...(order.payment_reference ? [generateDetailRow('Payment Reference', order.payment_reference)] : []),
    ...(order.payment_invoice_id ? [generateDetailRow('Invoice ID', order.payment_invoice_id)] : [])
  ].join('');

  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E5E5E5;">${item.product_name || 'Item'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: right;">${parseFloat(item.unit_price || 0).toFixed(3)} KD</td>
    </tr>
  `).join('');

  const itemsTable = `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #F8F9FA;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #C6A769; color: #333;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #C6A769; color: #333;">Quantity</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #C6A769; color: #333;">Unit Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
    </table>
  `;

  const content = `
    <p class="greeting">Admin Notification</p>
    <p class="intro">Payment has been received for order #${order.id}.</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">💰 Payment Received</p>
      <p style="margin: 8px 0 0 0; color: #666;">Order #${order.id} - ${parseFloat(order.total_amount || 0).toFixed(3)} KD</p>
    `)}
    
    ${generateSection('💳 Payment Details', paymentDetails)}
    
    ${generateSection('📦 Order Items', itemsTable)}
    
    ${pet ? generateSection('🐕 Pet Information', `
      ${generateDetailRow('Pet Name', pet.name || 'N/A')}
      ${generateDetailRow('Type', pet.type || 'N/A')}
      ${generateDetailRow('Breed', pet.breed || 'N/A')}
    `) : ''}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Please process and fulfill this order.</p>
  `;

  return getBaseEmailTemplate({
    title: '💰 Payment Received',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `Payment received for order #${order.id} - ${parseFloat(order.total_amount || 0).toFixed(3)} KD`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * Order Shipped Notification (Admin)
 */
function getOrderShippedNotificationTemplate(order, user, trackingNumber) {
  const shippingDetails = [
    generateDetailRow('Order ID', `#${order.id}`),
    generateDetailRow('Customer', `${user.name || 'N/A'} (${user.email})`),
    generateDetailRow('Tracking Number', trackingNumber),
    generateDetailRow('Shipping Date', new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  ].join('');

  const content = `
    <p class="greeting">Admin Notification</p>
    <p class="intro">Order #${order.id} has been marked as shipped.</p>
    
    ${generateSection('🚚 Shipping Details', shippingDetails)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">The customer has been notified of the shipment.</p>
  `;

  return getBaseEmailTemplate({
    title: '🚚 Order Shipped',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `Order #${order.id} has been shipped`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * Order Delivered Notification (Admin)
 */
function getOrderDeliveredNotificationTemplate(order, user) {
  const deliveryDetails = [
    generateDetailRow('Order ID', `#${order.id}`),
    generateDetailRow('Customer', `${user.name || 'N/A'} (${user.email})`),
    generateDetailRow('Delivery Date', new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })),
    generateDetailRow('Total Amount', `${parseFloat(order.total_amount || 0).toFixed(3)} KD`)
  ].join('');

  const content = `
    <p class="greeting">Admin Notification</p>
    <p class="intro">Order #${order.id} has been delivered successfully.</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">✅ Delivery Confirmed</p>
      <p style="margin: 8px 0 0 0; color: #666;">Order #${order.id} delivered to customer.</p>
    `)}
    
    ${generateSection('📦 Delivery Details', deliveryDetails)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">The customer has been notified of the delivery.</p>
  `;

  return getBaseEmailTemplate({
    title: '✅ Order Delivered',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `Order #${order.id} has been delivered`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * Subscription Created Notification (Admin)
 */
function getSubscriptionCreatedNotificationTemplate(subscription, user, pet) {
  const subscriptionDetails = [
    generateDetailRow('Subscription ID', `#${subscription.id}`),
    generateDetailRow('Customer', `${user.name || 'N/A'} (${user.email})`),
    generateDetailRow('Plan Type', subscription.plan_type || 'N/A'),
    generateDetailRow('Status', subscription.status || 'N/A'),
    generateDetailRow('Start Date', subscription.start_date ? new Date(subscription.start_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A'),
    generateDetailRow('End Date', subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A'),
    generateDetailRow('Price per Period', `${parseFloat(subscription.price_per_period || 0).toFixed(3)} KD`),
    generateDetailRow('Total Pouches', subscription.total_pouches || 'N/A'),
    generateDetailRow('Pouches per Day', subscription.pouches_per_day || 'N/A')
  ].join('');

  const content = `
    <p class="greeting">Admin Notification</p>
    <p class="intro">A new subscription has been created.</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">📋 New Subscription</p>
      <p style="margin: 8px 0 0 0; color: #666;">Subscription #${subscription.id} - ${subscription.plan_type || 'N/A'} plan</p>
    `)}
    
    ${generateSection('📋 Subscription Details', subscriptionDetails)}
    
    ${pet ? generateSection('🐕 Pet Information', `
      ${generateDetailRow('Pet Name', pet.name || 'N/A')}
      ${generateDetailRow('Type', pet.type || 'N/A')}
      ${generateDetailRow('Breed', pet.breed || 'N/A')}
    `) : ''}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Please activate this subscription after payment confirmation.</p>
  `;

  return getBaseEmailTemplate({
    title: '📋 New Subscription Created',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `New subscription #${subscription.id} created - ${subscription.plan_type || 'N/A'} plan`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * Subscription Expiring Notification (Admin)
 */
function getSubscriptionExpiringAdminNotificationTemplate(subscription, user, pet, daysRemaining) {
  const endDate = subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A';

  const subscriptionDetails = [
    generateDetailRow('Subscription ID', `#${subscription.id}`),
    generateDetailRow('Customer', `${user.name || 'N/A'} (${user.email})`),
    generateDetailRow('Plan Type', subscription.plan_type || 'N/A'),
    generateDetailRow('Expires On', endDate),
    generateDetailRow('Days Remaining', `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`),
    generateDetailRow('Price per Period', `${parseFloat(subscription.price_per_period || 0).toFixed(3)} KD`)
  ].join('');

  const content = `
    <p class="greeting">Admin Notification</p>
    <p class="intro">A subscription is expiring soon and may need follow-up.</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">⏰ Subscription Expiring</p>
      <p style="margin: 8px 0 0 0; color: #666;">Subscription #${subscription.id} expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</p>
    `)}
    
    ${generateSection('📋 Subscription Details', subscriptionDetails)}
    
    ${pet ? generateSection('🐕 Pet Information', `
      ${generateDetailRow('Pet Name', pet.name || 'N/A')}
      ${generateDetailRow('Type', pet.type || 'N/A')}
    `) : ''}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Consider reaching out to the customer to encourage renewal.</p>
  `;

  return getBaseEmailTemplate({
    title: '⏰ Subscription Expiring',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `Subscription #${subscription.id} expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * Out of Stock Alert (Admin)
 */
function getOutOfStockAlertTemplate(products) {
  const productsList = products.map(p => 
    `<li style="margin: 8px 0;"><strong>${p.name}</strong> (SKU: ${p.sku}) - <span style="color: #DC2626; font-weight: 600;">OUT OF STOCK</span></li>`
  ).join('');

  const content = `
    <p class="greeting">Admin Alert</p>
    <p class="intro">The following products are out of stock:</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">🚨 Out of Stock</p>
      <p style="margin: 8px 0 0 0; color: #666;">Immediate action required to restock these items.</p>
    `)}
    
    ${generateSection('📦 Out of Stock Items', `<ul style="margin: 0; padding-left: 20px;">${productsList}</ul>`)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Please restock these items immediately to avoid order cancellations.</p>
  `;

  return getBaseEmailTemplate({
    title: '🚨 Out of Stock Alert',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `${products.length} product(s) are out of stock`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * High-Value Order Alert (Admin)
 */
function getHighValueOrderAlertTemplate(order, user, items, threshold = 50) {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const orderDetails = [
    generateDetailRow('Order ID', `#${order.id}`),
    generateDetailRow('Customer', `${user.name || 'N/A'} (${user.email})`),
    generateDetailRow('Order Date', orderDate),
    generateDetailRow('Total Amount', `${parseFloat(order.total_amount || 0).toFixed(3)} KD`),
    generateDetailRow('Threshold', `${threshold} KD`)
  ].join('');

  const content = `
    <p class="greeting">Admin Notification</p>
    <p class="intro">A high-value order has been placed.</p>
    
    ${generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">💎 High-Value Order</p>
      <p style="margin: 8px 0 0 0; color: #666;">Order #${order.id} - ${parseFloat(order.total_amount || 0).toFixed(3)} KD (exceeds ${threshold} KD threshold)</p>
    `)}
    
    ${generateSection('📦 Order Details', orderDetails)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">This order may require special attention or expedited processing.</p>
  `;

  return getBaseEmailTemplate({
    title: '💎 High-Value Order',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `High-value order #${order.id} - ${parseFloat(order.total_amount || 0).toFixed(3)} KD`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * Customer Support Inquiry (Admin)
 */
function getCustomerSupportInquiryTemplate(inquiry) {
  const inquiryDetails = [
    generateDetailRow('Name', inquiry.name || 'N/A'),
    generateDetailRow('Email', inquiry.email),
    generateDetailRow('Phone', inquiry.phone || 'N/A'),
    generateDetailRow('Subject', inquiry.subject || 'General Inquiry'),
    generateDetailRow('Submitted', new Date(inquiry.created_at || new Date()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }))
  ].join('');

  const content = `
    <p class="greeting">Admin Notification</p>
    <p class="intro">A new customer support inquiry has been received.</p>
    
    ${generateSection('📧 Inquiry Details', inquiryDetails)}
    
    ${generateSection('💬 Message', `
      <p style="font-size: 16px; color: #555; margin: 0; padding: 16px; background: #FAFAF8; border-radius: 8px; border-left: 4px solid #C6A769;">${inquiry.message || 'N/A'}</p>
    `)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Please respond to this inquiry within 24 hours for best customer satisfaction.</p>
  `;

  return getBaseEmailTemplate({
    title: '📧 Customer Support Inquiry',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `New support inquiry from ${inquiry.name || inquiry.email}`,
    content: content,
    showFooterBranding: false
  });
}

module.exports = {
  getPaymentReceivedTemplate,
  getOrderProcessingTemplate,
  getShippingConfirmationTemplate,
  getDeliveredConfirmationTemplate,
  getRefundInitiatedTemplate,
  getRefundCompletedTemplate,
  getAbandonedCartTemplate,
  getBackInStockTemplate,
  getContactFormReceiptTemplate,
  getPaymentFailedAlertTemplate,
  getHighRiskOrderTemplate,
  getLowStockAlertTemplate,
  getNewUserRegisteredTemplate,
  getOrderPaidNotificationTemplate,
  getOrderShippedNotificationTemplate,
  getOrderDeliveredNotificationTemplate,
  getSubscriptionCreatedNotificationTemplate,
  getSubscriptionExpiringAdminNotificationTemplate,
  getOutOfStockAlertTemplate,
  getHighValueOrderAlertTemplate,
  getCustomerSupportInquiryTemplate
};

