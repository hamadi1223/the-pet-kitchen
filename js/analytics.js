/**
 * Analytics Tracking System
 * Tracks e-commerce metrics and user engagement
 */

(function() {
  'use strict';

  // Generate or retrieve session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Track page view
  function trackPageView() {
    const sessionId = getSessionId();
    const pagePath = window.location.pathname + window.location.search;
    const referrer = document.referrer;

    trackEvent('page_view', {
      page_path: pagePath,
      referrer: referrer,
      session_id: sessionId
    });
  }

  // Track custom event
  async function trackEvent(eventType, eventData = {}) {
    try {
      const sessionId = getSessionId();
      const pagePath = window.location.pathname + window.location.search;
      const referrer = document.referrer;

      const payload = {
        event_type: eventType,
        event_data: eventData,
        session_id: sessionId,
        page_path: pagePath,
        referrer: referrer
      };

      // Send to backend
      const response = await fetch(`${window.API_BASE_URL || '/api'}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': window.getToken ? `Bearer ${window.getToken()}` : ''
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn('Analytics tracking failed:', response.status);
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.warn('Analytics error:', error);
    }
  }

  // Track product view
  async function trackProductView(productId, viewDuration = null) {
    try {
      const sessionId = getSessionId();
      
      await fetch(`${window.API_BASE_URL || '/api'}/analytics/track/product-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': window.getToken ? `Bearer ${window.getToken()}` : ''
        },
        body: JSON.stringify({
          product_id: productId,
          session_id: sessionId,
          view_duration: viewDuration
        })
      });
    } catch (error) {
      console.warn('Product view tracking error:', error);
    }
  }

  // Track cart event
  async function trackCartEvent(eventType, productId = null, quantity = null, cartValue = null) {
    try {
      const sessionId = getSessionId();
      
      await fetch(`${window.API_BASE_URL || '/api'}/analytics/track/cart-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': window.getToken ? `Bearer ${window.getToken()}` : ''
        },
        body: JSON.stringify({
          event_type: eventType,
          product_id: productId,
          quantity: quantity,
          cart_value: cartValue,
          session_id: sessionId
        })
      });
    } catch (error) {
      console.warn('Cart event tracking error:', error);
    }
  }

  // Track add to cart
  function trackAddToCart(productId, quantity, cartValue) {
    trackCartEvent('add', productId, quantity, cartValue);
    trackEvent('add_to_cart', { product_id: productId, quantity, cart_value: cartValue });
  }

  // Track remove from cart
  function trackRemoveFromCart(productId, quantity, cartValue) {
    trackCartEvent('remove', productId, quantity, cartValue);
    trackEvent('remove_from_cart', { product_id: productId, quantity, cart_value: cartValue });
  }

  // Track checkout start
  function trackCheckoutStart(cartValue) {
    trackCartEvent('checkout', null, null, cartValue);
    trackEvent('checkout_start', { cart_value: cartValue });
  }

  // Track purchase
  function trackPurchase(orderId, orderValue, items) {
    trackEvent('purchase', {
      order_id: orderId,
      order_value: orderValue,
      items: items
    });
  }

  // Track search
  function trackSearch(query, resultsCount) {
    trackEvent('search', {
      query: query,
      results_count: resultsCount
    });
  }

  // Track wishlist add
  function trackWishlistAdd(productId) {
    trackEvent('wishlist_add', { product_id: productId });
  }

  // Track wishlist remove
  function trackWishlistRemove(productId) {
    trackEvent('wishlist_remove', { product_id: productId });
  }

  // Track form submission
  function trackFormSubmit(formName, success = true) {
    trackEvent('form_submit', {
      form_name: formName,
      success: success
    });
  }

  // Track button click
  function trackButtonClick(buttonName, location) {
    trackEvent('button_click', {
      button_name: buttonName,
      location: location
    });
  }

  // Initialize session tracking
  function initSession() {
    const sessionId = getSessionId();
    const startTime = Date.now();

    // Track session start
    trackEvent('session_start', {
      session_id: sessionId
    });

    // Track page view
    trackPageView();

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      trackEvent('session_end', {
        session_id: sessionId,
        duration: duration
      });
    });
  }

  // Auto-track product views on product pages
  function initProductViewTracking() {
    const productId = new URLSearchParams(window.location.search).get('productId') ||
                     document.querySelector('[data-product-id]')?.dataset.productId;
    
    if (productId) {
      const startTime = Date.now();
      
      // Track when user leaves product page
      window.addEventListener('beforeunload', () => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        trackProductView(parseInt(productId), duration);
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSession();
      initProductViewTracking();
    });
  } else {
    initSession();
    initProductViewTracking();
  }

  // Export functions globally
  if (typeof window !== 'undefined') {
    window.analytics = {
      trackEvent,
      trackProductView,
      trackCartEvent,
      trackAddToCart,
      trackRemoveFromCart,
      trackCheckoutStart,
      trackPurchase,
      trackSearch,
      trackWishlistAdd,
      trackWishlistRemove,
      trackFormSubmit,
      trackButtonClick,
      trackPageView
    };
  }

})();

