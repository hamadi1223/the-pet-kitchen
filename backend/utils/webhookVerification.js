/**
 * Webhook Signature Verification
 * Verifies webhook signatures for payment gateways and other services
 */

const crypto = require('crypto');

/**
 * Verify MyFatoorah webhook signature
 * MyFatoorah uses HMAC-SHA256 with the webhook secret
 * 
 * @param {Object} payload - Webhook payload
 * @param {String} signature - Signature from headers
 * @param {String} secret - Webhook secret from environment
 * @returns {Boolean} - True if signature is valid
 */
function verifyMyFatoorahSignature(payload, signature, secret) {
  if (!secret) {
    console.warn('⚠️  MyFatoorah webhook secret not configured');
    return false;
  }

  if (!signature) {
    return false;
  }

  try {
    // MyFatoorah sends signature in format: "sha256=signature"
    const sigParts = signature.split('=');
    if (sigParts.length !== 2 || sigParts[0] !== 'sha256') {
      return false;
    }

    const receivedSignature = sigParts[1];
    
    // Create expected signature
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Verify generic HMAC signature
 * 
 * @param {String|Object} payload - Webhook payload
 * @param {String} signature - Signature from headers
 * @param {String} secret - Secret key
 * @param {String} algorithm - Hash algorithm (default: sha256)
 * @returns {Boolean} - True if signature is valid
 */
function verifyHMACSignature(payload, signature, secret, algorithm = 'sha256') {
  if (!secret || !signature) {
    return false;
  }

  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payloadString)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('HMAC signature verification error:', error);
    return false;
  }
}

/**
 * Middleware to verify MyFatoorah webhook signature
 */
function verifyMyFatoorahWebhook(req, res, next) {
  const secret = process.env.MYFATOORAH_WEBHOOK_SECRET;
  const signature = req.headers['x-myfatoorah-signature'] || req.headers['x-signature'];

  // In test mode, skip verification
  if (process.env.TEST_DISABLE_MYFATOORAH === 'true' || process.env.NODE_ENV === 'test') {
    req.log?.warn('Webhook verification skipped (test mode)');
    return next();
  }

  if (!secret) {
    req.log?.warn('MyFatoorah webhook secret not configured - allowing request');
    return next(); // Allow but log warning
  }

  if (!signature) {
    return res.status(401).json({
      error: 'Missing webhook signature',
      requestId: req.id
    });
  }

  // Verify signature
  const isValid = verifyMyFatoorahSignature(req.body, signature, secret);

  if (!isValid) {
    req.log?.error('Invalid webhook signature', {
      signature: signature.substring(0, 20) + '...',
      path: req.path
    });
    return res.status(401).json({
      error: 'Invalid webhook signature',
      requestId: req.id
    });
  }

  req.log?.info('Webhook signature verified');
  next();
}

module.exports = {
  verifyMyFatoorahSignature,
  verifyHMACSignature,
  verifyMyFatoorahWebhook
};

