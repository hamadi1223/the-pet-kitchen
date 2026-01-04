// The Pet Kitchen - Animations Module
// Handles all scroll-triggered animations and IntersectionObserver instances

(function() {
  'use strict';

  // ==================== INTERSECTION OBSERVER POOL ====================
  
  // Unified observer factory for better reuse
  const observerFactory = {
    observers: new Map(),
    
    getObserver(key, options, callback) {
      // Create a unique key based on options
      const configKey = `${key}_${JSON.stringify(options)}`;
      
      if (!this.observers.has(configKey)) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              callback(entry);
              // Unobserve after callback to prevent memory leaks
              observer.unobserve(entry.target);
            }
          });
        }, options);
        
        this.observers.set(configKey, observer);
      }
      
      return this.observers.get(configKey);
    },
    
    disconnectAll() {
      this.observers.forEach(observer => observer.disconnect());
      this.observers.clear();
    }
  };
  
  // Reusable IntersectionObserver instances (backward compatibility)
  const observerPool = {
    fadeIn: null,
    slideUp: null
  };

  // ==================== FADE-IN ANIMATION ====================

  function initFadeInAnimation() {
    const cards = document.querySelectorAll('.review-card');
    if (cards.length === 0) return;

    // Create or reuse observer
    if (!observerPool.fadeIn) {
      observerPool.fadeIn = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            // Unobserve after animation to improve performance
            observerPool.fadeIn.unobserve(entry.target);
          }
        });
      }, { 
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px' // Start animation slightly before element enters viewport
      });
    }

    // Initialize cards
    cards.forEach(card => {
      // Set initial state
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.willChange = 'opacity, transform';
      
      // Observe
      observerPool.fadeIn.observe(card);
    });
  }

  // ==================== SLIDE-UP ANIMATION ====================

  function initSlideUpAnimation() {
    const elements = document.querySelectorAll('[data-animate="slide-up"]');
    if (elements.length === 0) return;

    // Create or reuse observer
    if (!observerPool.slideUp) {
      observerPool.slideUp = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            observerPool.slideUp.unobserve(entry.target);
          }
        });
      }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
      });
    }

    elements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observerPool.slideUp.observe(el);
    });
  }

  // ==================== CLEANUP ====================

  function cleanup() {
    // Disconnect observers when page unloads
    if (observerPool.fadeIn) {
      observerPool.fadeIn.disconnect();
      observerPool.fadeIn = null;
    }
    if (observerPool.slideUp) {
      observerPool.slideUp.disconnect();
      observerPool.slideUp = null;
    }
    
    // Cleanup factory observers
    observerFactory.disconnectAll();
  }

  // ==================== INITIALIZATION ====================

  function init() {
    // Only run on pages that need animations
    if (document.querySelector('.review-card')) {
      initFadeInAnimation();
    }
    
    if (document.querySelector('[data-animate="slide-up"]')) {
      initSlideUpAnimation();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);

  // Export for manual initialization if needed
  window.initAnimations = init;
})();

