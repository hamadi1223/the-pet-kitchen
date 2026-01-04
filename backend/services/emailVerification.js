const axios = require('axios');

/**
 * Check if an email is from a disposable/temporary email service
 * Uses multiple free APIs for better coverage
 */
async function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return false;
  }

  // Common disposable email domains (most popular ones)
  const knownDisposableDomains = [
    '10minutemail.com', 'tempmail.com', 'guerrillamail.com', 'mailinator.com',
    'throwaway.email', 'temp-mail.org', 'getnada.com', 'mohmal.com',
    'yopmail.com', 'maildrop.cc', 'trashmail.com', 'sharklasers.com',
    'grr.la', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me',
    'fakeinbox.com', 'mintemail.com', 'meltmail.com', '33mail.com',
    'emailondeck.com', 'mailcatch.com', 'inboxkitten.com', 'getairmail.com',
    'dispostable.com', 'mytemp.email', 'tmpmail.org', 'fakemail.net',
    'mailnesia.com', 'melt.li', 'emailfake.com', 'throwawaymail.com'
  ];

  // Check against known list first (fastest)
  if (knownDisposableDomains.includes(domain)) {
    console.log(`⚠️ Disposable email detected: ${domain}`);
    return true;
  }

  // Check using free API (optional - can be rate limited)
  try {
    // Using AbstractAPI (free tier: 100 requests/month)
    // Alternative: use other free services or skip API check
    const apiKey = process.env.ABSTRACT_API_KEY;
    if (apiKey) {
      const response = await axios.get(`https://emailvalidation.abstractapi.com/v1/`, {
        params: {
          api_key: apiKey,
          email: email
        },
        timeout: 5000
      });

      if (response.data && response.data.is_disposable_email) {
        console.log(`⚠️ Disposable email detected via API: ${domain}`);
        return true;
      }
    }
  } catch (error) {
    // If API fails, fall back to domain list only
    console.log('ℹ️ Email validation API unavailable, using domain list only');
  }

  return false;
}

/**
 * Validate email format and check if it's deliverable
 * This is a basic check - full deliverability requires sending actual email
 */
function isValidEmailFormat(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Check email domain for common issues
 */
function checkEmailDomain(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Invalid email format' };
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, reason: 'Missing domain' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /^test/i,
    /^temp/i,
    /^fake/i,
    /^spam/i,
    /^noreply/i,
    /^no-reply/i,
    /^donotreply/i
  ];

  const localPart = email.split('@')[0]?.toLowerCase();
  if (localPart) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(localPart)) {
        return { valid: false, reason: 'Suspicious email pattern' };
      }
    }
  }

  return { valid: true };
}

module.exports = {
  isDisposableEmail,
  isValidEmailFormat,
  checkEmailDomain
};

