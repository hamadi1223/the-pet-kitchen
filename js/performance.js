// The Pet Kitchen - Performance Monitoring Module
// Tracks Core Web Vitals and performance metrics

(function() {
  'use strict';

  // Only run in production or when explicitly enabled
  const ENABLE_MONITORING = true; // Set to false to disable
  const LOG_TO_CONSOLE = false; // Set to true for debugging

  if (!ENABLE_MONITORING) return;

  // ==================== PERFORMANCE METRICS ====================

  const metrics = {
    navigationTiming: null,
    paintTiming: null,
    resourceTiming: [],
    webVitals: {}
  };

  // ==================== NAVIGATION TIMING ====================

  function captureNavigationTiming() {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    metrics.navigationTiming = {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domContentLoadedEventEnd - timing.domLoading,
      load: timing.loadEventEnd - timing.navigationStart,
      type: navigation.type,
      redirects: navigation.redirectCount
    };

    if (LOG_TO_CONSOLE) {
      console.log('Navigation Timing:', metrics.navigationTiming);
    }
  }

  // ==================== PAINT TIMING ====================

  function capturePaintTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const paintEntries = window.performance.getEntriesByType('paint');
    
    metrics.paintTiming = {};
    paintEntries.forEach(entry => {
      metrics.paintTiming[entry.name] = Math.round(entry.startTime);
    });

    if (LOG_TO_CONSOLE && Object.keys(metrics.paintTiming).length > 0) {
      console.log('Paint Timing:', metrics.paintTiming);
    }
  }

  // ==================== RESOURCE TIMING ====================

  function captureResourceTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const resourceEntries = window.performance.getEntriesByType('resource');
    
    metrics.resourceTiming = resourceEntries
      .filter(entry => {
        // Filter out data URIs and very small resources
        return !entry.name.startsWith('data:') && entry.duration > 10;
      })
      .map(entry => ({
        name: entry.name.split('/').pop(),
        type: entry.initiatorType,
        duration: Math.round(entry.duration),
        size: entry.transferSize || 0,
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10); // Top 10 slowest resources

    if (LOG_TO_CONSOLE && metrics.resourceTiming.length > 0) {
      console.log('Slowest Resources:', metrics.resourceTiming);
    }
  }

  // ==================== CORE WEB VITALS ====================

  // Largest Contentful Paint (LCP)
  function measureLCP() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        metrics.webVitals.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);
        
        if (LOG_TO_CONSOLE) {
          console.log('LCP:', metrics.webVitals.lcp, 'ms');
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  // First Input Delay (FID)
  function measureFID() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.processingStart && entry.startTime) {
            metrics.webVitals.fid = Math.round(entry.processingStart - entry.startTime);
            
            if (LOG_TO_CONSOLE) {
              console.log('FID:', metrics.webVitals.fid, 'ms');
            }
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  // Cumulative Layout Shift (CLS)
  function measureCLS() {
    if (!window.PerformanceObserver) return;

    try {
      let clsValue = 0;
      let clsEntries = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        });

        metrics.webVitals.cls = Math.round(clsValue * 1000) / 1000;
        
        if (LOG_TO_CONSOLE && entries.length > 0) {
          console.log('CLS:', metrics.webVitals.cls);
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  // ==================== IMAGE LOADING PERFORMANCE ====================

  function monitorImageLoading() {
    const images = document.querySelectorAll('img');
    let loadedCount = 0;
    let totalImages = images.length;
    const loadTimes = [];

    if (totalImages === 0) return;

    images.forEach(img => {
      if (img.complete) {
        loadedCount++;
      } else {
        const startTime = performance.now();
        img.addEventListener('load', () => {
          const loadTime = Math.round(performance.now() - startTime);
          loadTimes.push(loadTime);
          loadedCount++;
          
          if (loadedCount === totalImages && LOG_TO_CONSOLE) {
            const avgLoadTime = Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length);
            console.log('Images loaded:', loadedCount, 'Average load time:', avgLoadTime, 'ms');
          }
        }, { once: true });

        img.addEventListener('error', () => {
          loadedCount++;
          if (LOG_TO_CONSOLE) {
            console.warn('Image failed to load:', img.src);
          }
        }, { once: true });
      }
    });
  }

  // ==================== MEMORY USAGE ====================

  function captureMemoryUsage() {
    if (!performance.memory) return;

    const memory = performance.memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    };
  }

  // ==================== REPORTING ====================

  function generateReport() {
    const report = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      navigation: metrics.navigationTiming,
      paint: metrics.paintTiming,
      resources: metrics.resourceTiming,
      webVitals: metrics.webVitals,
      memory: captureMemoryUsage()
    };

    // In production, you could send this to an analytics service
    // Example: sendToAnalytics(report);

    if (LOG_TO_CONSOLE) {
      console.log('Performance Report:', report);
    }

    return report;
  }

  // ==================== INITIALIZATION ====================

  function init() {
    // Capture navigation timing after page load
    if (document.readyState === 'complete') {
      captureNavigationTiming();
      capturePaintTiming();
      captureResourceTiming();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          captureNavigationTiming();
          capturePaintTiming();
          captureResourceTiming();
        }, 0);
      });
    }

    // Measure Core Web Vitals
    measureLCP();
    measureFID();
    measureCLS();

    // Monitor image loading
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', monitorImageLoading);
    } else {
      monitorImageLoading();
    }

    // Generate report before page unload
    window.addEventListener('beforeunload', () => {
      generateReport();
    });
  }

  // ==================== EXPORTS ====================

  // Initialize
  init();

  // Export for manual access
  window.performanceMonitor = {
    getMetrics: () => metrics,
    getReport: generateReport,
    captureMemory: captureMemoryUsage
  };
})();

