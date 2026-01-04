// Error Handler - Routes invalid URLs to 404 page
// This should be loaded on all pages to catch navigation errors

(function() {
  'use strict';
  
  // List of valid pages/routes
  const VALID_PAGES = [
    'index.html',
    'meal-plans.html',
    'instructions.html',
    'subscriptions.html',
    'events.html',
    'cart.html',
    'login.html',
    'signup.html',
    'reset-password.html', // Added reset password page
    'account.html',
    'admin.html',
    'order-confirmation.html',
    'payment-success.html',
    'payment-failed.html',
    'checkout-success-test.html',
    'privacy-policy.html', // Privacy policy page
    '404.html'
  ];
  
  /**
   * Check if current page is valid
   */
  function isValidPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    // Remove query params and hash
    const pageName = page.split('?')[0].split('#')[0];
    
    // Check if it's a valid page
    if (VALID_PAGES.includes(pageName)) {
      return true;
    }
    
    // Check if it's root or empty (should be index.html)
    if (pageName === '' || pageName === '/' || path === '/' || path.endsWith('/')) {
      return true; // Will be handled by server/index
    }
    
    return false;
  }
  
  /**
   * Redirect to 404 page
   */
  function redirectTo404() {
    // Don't redirect if we're already on 404 page
    if (window.location.pathname.includes('404.html')) {
      return;
    }
    
    console.warn('⚠️ Invalid page detected, redirecting to 404:', window.location.pathname);
    window.location.href = '404.html';
  }
  
  /**
   * Validate navigation before redirecting
   */
  function validateNavigation(url) {
    try {
      // Parse URL
      const urlObj = new URL(url, window.location.origin);
      const path = urlObj.pathname;
      const page = path.split('/').pop() || 'index.html';
      const pageName = page.split('?')[0].split('#')[0];
      
      // Allow anchor links
      if (url.startsWith('#')) {
        return true;
      }
      
      // Allow same-origin relative URLs
      if (url.startsWith('/') || !url.includes('://')) {
        // Check if it's a valid page
        if (VALID_PAGES.includes(pageName) || pageName === '' || pageName === '/') {
          return true;
        }
        
        // Check if it's a file extension we should allow (images, CSS, JS, etc.)
        const allowedExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
        if (allowedExtensions.some(ext => pageName.endsWith(ext))) {
          return true;
        }
        
        // Invalid page
        console.warn('⚠️ Invalid navigation detected:', url);
        return false;
      }
      
      // Allow external URLs (http/https)
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('Error validating navigation:', e);
      return false;
    }
  }
  
  /**
   * Intercept window.location.href assignments
   */
  function interceptLocationAssignments() {
    // Override window.location.href setter (if possible)
    // Note: This is limited by browser security, so we'll use event delegation instead
    
    // Intercept link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Skip external links, anchor links, and javascript: links
      if (href.startsWith('http://') || 
          href.startsWith('https://') || 
          href.startsWith('#') || 
          href.startsWith('javascript:') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:')) {
        return;
      }
      
      // Validate the link
      if (!validateNavigation(href)) {
        e.preventDefault();
        e.stopPropagation();
        redirectTo404();
        return false;
      }
    }, true); // Use capture phase
    
    // Intercept programmatic navigation
    const originalLocationSetter = Object.getOwnPropertyDescriptor(window, 'location')?.set;
    if (originalLocationSetter) {
      // Try to intercept (may not work in all browsers due to security)
      try {
        Object.defineProperty(window, 'location', {
          set: function(value) {
            if (validateNavigation(value)) {
              originalLocationSetter.call(window, value);
            } else {
              redirectTo404();
            }
          },
          get: function() {
            return window.location;
          },
          configurable: true
        });
      } catch (e) {
        // Fallback: monitor location changes
        console.log('⚠️ Could not intercept location assignments, using fallback');
      }
    }
  }
  
  /**
   * Initialize error handler
   */
  function initErrorHandler() {
    // Check current page on load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (!isValidPage()) {
          redirectTo404();
        } else {
          interceptLocationAssignments();
        }
      });
    } else {
      if (!isValidPage()) {
        redirectTo404();
      } else {
        interceptLocationAssignments();
      }
    }
  }
  
  // Export validation function for use in other scripts
  window.validateNavigation = validateNavigation;
  window.redirectTo404 = redirectTo404;
  
  // Initialize
  initErrorHandler();
})();

