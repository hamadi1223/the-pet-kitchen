/**
 * Lazy Loading for Images
 * Improves page load performance by loading images only when needed
 */

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
  // Check if Intersection Observer is supported
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Load the image
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // Handle srcset for responsive images
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          // Remove loading class and add loaded class
          img.classList.remove('lazy');
          img.classList.add('lazy-loaded');
          
          // Stop observing this image
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before image enters viewport
    });

    // Observe all lazy images
    const lazyImages = document.querySelectorAll('img[data-src], img.lazy');
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers without Intersection Observer
    const lazyImages = document.querySelectorAll('img[data-src], img.lazy');
    lazyImages.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
      img.classList.remove('lazy');
      img.classList.add('lazy-loaded');
    });
  }
}

/**
 * Lazy load background images
 */
function initLazyBackgroundImages() {
  if ('IntersectionObserver' in window) {
    const bgObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const bgImage = element.dataset.bgImage;
          
          if (bgImage) {
            element.style.backgroundImage = `url(${bgImage})`;
            element.removeAttribute('data-bg-image');
            element.classList.add('bg-loaded');
          }
          
          observer.unobserve(element);
        }
      });
    }, {
      rootMargin: '50px'
    });

    const lazyBgElements = document.querySelectorAll('[data-bg-image]');
    lazyBgElements.forEach(el => {
      bgObserver.observe(el);
    });
  }
}

/**
 * Add loading placeholder for images
 * @param {HTMLImageElement} img - Image element
 */
function addLoadingPlaceholder(img) {
  if (!img.classList.contains('lazy-placeholder-added')) {
    // Add a subtle loading animation
    img.style.backgroundColor = '#f0f0f0';
    img.style.minHeight = '200px';
    img.classList.add('lazy-placeholder-added');
    
    // Add loading spinner (optional)
    const spinner = document.createElement('div');
    spinner.className = 'lazy-spinner';
    spinner.innerHTML = '⏳';
    spinner.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      opacity: 0.5;
    `;
    
    const container = img.parentElement;
    if (container && container.style.position !== 'relative') {
      container.style.position = 'relative';
    }
    container?.appendChild(spinner);
    
    // Remove spinner when image loads
    img.addEventListener('load', () => {
      spinner.remove();
      img.style.backgroundColor = 'transparent';
    }, { once: true });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initLazyLoading();
    initLazyBackgroundImages();
  });
} else {
  initLazyLoading();
  initLazyBackgroundImages();
}

// Re-initialize for dynamically added content
const originalAppendChild = Node.prototype.appendChild;
Node.prototype.appendChild = function(child) {
  const result = originalAppendChild.call(this, child);
  if (child.tagName === 'IMG' && (child.dataset.src || child.classList.contains('lazy'))) {
    initLazyLoading();
  }
  return result;
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.initLazyLoading = initLazyLoading;
  window.initLazyBackgroundImages = initLazyBackgroundImages;
}

