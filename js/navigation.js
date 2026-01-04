// The Pet Kitchen - Navigation Module
// Handles all navigation functionality: desktop dropdowns, mobile menu, scrollspy, and active states

(function() {
  'use strict';

  // ==================== INITIALIZATION ====================
  
  let isInitialized = false;

  function initNavigation() {
    if (isInitialized) return;
    isInitialized = true;

    // Wait for DOM and API
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setupNavigation();
        setupScrollspy();
      });
    } else {
      setupNavigation();
      setupScrollspy();
    }

    // Update auth state after API loads
    setTimeout(() => {
      if (typeof window.updateNavigationAuth === 'function') {
        window.updateNavigationAuth();
      }
    }, 100);
  }

  // ==================== NAVIGATION SETUP ====================

  function setupNavigation() {
    setupDesktopDropdown();
    setupMobileMenu();
    setupSmoothScrolling();
    setupActiveStates();
  }

  // ==================== DESKTOP DROPDOWN ====================

  function setupDesktopDropdown() {
    const trigger = document.getElementById('menuMealPlans');
    const menu = document.getElementById('submenuMealPlans');
    
    if (!trigger || !menu) return;

    let isOpen = false;
    let closeTimeout = null;

    // Click handler (primary interaction)
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown();
    });

    // Keyboard support
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDropdown();
      } else if (e.key === 'Escape' && isOpen) {
        closeDropdown();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (isOpen && !trigger.contains(e.target) && !menu.contains(e.target)) {
        closeDropdown();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeDropdown();
        trigger.focus();
      }
    });

    function toggleDropdown() {
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    }

    function openDropdown() {
      clearTimeout(closeTimeout);
      isOpen = true;
      trigger.setAttribute('aria-expanded', 'true');
      menu.classList.add('show');
    }

    function closeDropdown() {
      clearTimeout(closeTimeout);
      isOpen = false;
      trigger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('show');
    }
  }

  // ==================== MOBILE MENU ====================

  function setupMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const panel = document.getElementById('mobileMenu');
    const overlay = document.getElementById('navOverlay');
    
    if (!toggle || !panel) return;

    // Ensure overlay exists
    let overlayEl = overlay;
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.id = 'navOverlay';
      overlayEl.className = 'nav-overlay';
      document.body.appendChild(overlayEl);
    }

    let isOpen = false;

    // Toggle menu
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Close on overlay click
    overlayEl.addEventListener('click', () => {
      if (isOpen) closeMobileMenu();
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeMobileMenu();
      }
    });

    // Close on link click (except dropdown triggers)
    panel.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && !link.closest('.mobile-dropdown-menu')) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#')) {
          // External link - close menu
          closeMobileMenu();
        } else if (href && href.startsWith('#')) {
          // Anchor link - close menu and scroll
          e.preventDefault();
          closeMobileMenu();
          setTimeout(() => {
            const target = document.querySelector(href);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 300);
        }
      }
    });

    // Mobile dropdown toggle
    setupMobileDropdowns(panel);

    function openMobileMenu() {
      isOpen = true;
      panel.classList.add('open');
      overlayEl.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-locked');
    }

    function closeMobileMenu() {
      isOpen = false;
      panel.classList.remove('open');
      overlayEl.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-locked');
      
      // Close all mobile dropdowns
      panel.querySelectorAll('.mobile-dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
        const trigger = menu.previousElementSibling;
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }
  }

  // ==================== MOBILE DROPDOWNS ====================

  function setupMobileDropdowns(container) {
    const triggers = container.querySelectorAll('.mobile-dropdown-trigger');
    
    triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const menu = trigger.nextElementSibling;
        if (!menu || !menu.classList.contains('mobile-dropdown-menu')) return;

        const isOpen = menu.classList.contains('show');
        
        // Close all other dropdowns
        container.querySelectorAll('.mobile-dropdown-menu.show').forEach(m => {
          if (m !== menu) {
            m.classList.remove('show');
            const t = m.previousElementSibling;
            if (t) t.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current dropdown
        if (isOpen) {
          menu.classList.remove('show');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          menu.classList.add('show');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ==================== SMOOTH SCROLLING ====================

  function setupSmoothScrolling() {
    // Handle all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#' || !href) return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerOffset = 80; // Account for sticky header
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Update URL without jumping
          history.pushState(null, null, href);
        }
      });
    });
  }

  // ==================== ACTIVE STATES ====================

  function setupActiveStates() {
    // Set active state based on current page
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    // Remove all active states first
    navLinks.forEach(link => link.classList.remove('active'));
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      // Extract page name from href
      let linkPage = href.split('/').pop() || href;
      // Remove query params and hash
      linkPage = linkPage.split('?')[0].split('#')[0];

      // Check if link matches current page
      if (linkPage === currentPage || 
          (currentPage === '' && linkPage === 'index.html') ||
          (currentPage === 'index.html' && (linkPage === 'index.html' || linkPage === '')) ||
          (currentPath === '/' && (linkPage === 'index.html' || linkPage === ''))) {
        link.classList.add('active');
      }
    });

    // Special case: Meal Plans dropdown should be active on meal-plans.html
    if (currentPage === 'meal-plans.html' || currentPage === '') {
      const mealPlansTrigger = document.getElementById('menuMealPlans');
      if (mealPlansTrigger) {
        mealPlansTrigger.classList.add('active');
      }
    }
  }

  // ==================== SCROLLSPY ====================

  function setupScrollspy() {
    const sections = [
      { id: 'hero', selector: '.hero' },
      { id: 'how-it-works', selector: '.how-it-works' },
      { id: 'claims', selector: '.claims' },
      { id: 'reviews', selector: '#reviews' }
    ];

    const navLinks = {
      'index.html': document.querySelector('a[href="index.html"]'),
      '#reviews': document.querySelector('a[href="#reviews"]')
    };

    let currentSection = null;

    function updateActiveNav() {
      const scrollPos = window.scrollY + 100; // Offset for header

      // Find current section
      let newSection = null;
      for (const section of sections) {
        const element = document.querySelector(section.selector);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const bottom = top + rect.height;

        if (scrollPos >= top && scrollPos < bottom) {
          newSection = section.id;
          break;
        }
      }

      // If scrolled to top, show ABOUT US
      if (window.scrollY < 100) {
        newSection = 'hero';
      }

      // Update active state
      if (newSection !== currentSection) {
        currentSection = newSection;

        // Remove all active states
        document.querySelectorAll('.nav-link.active, .mobile-nav-link.active').forEach(link => {
          link.classList.remove('active');
        });

        // Add active state based on section
        if (currentSection === 'hero' || currentSection === 'how-it-works' || currentSection === 'claims') {
          if (navLinks['index.html']) {
            navLinks['index.html'].classList.add('active');
          }
        } else if (currentSection === 'reviews') {
          if (navLinks['#reviews']) {
            navLinks['#reviews'].classList.add('active');
          }
        }
      }
    }

    // Throttle scroll events with cleanup
    let ticking = false;
    let scrollHandler = null;
    
    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveNav();
          ticking = false;
        });
        ticking = true;
      }
    }
    
    scrollHandler = handleScroll;
    window.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Store handler for cleanup
    window._scrollHandler = scrollHandler;

    // Initial check
    updateActiveNav();
  }

  // ==================== EXPORTS ====================

  // Initialize on load
  initNavigation();

  // Make functions available globally if needed
  window.initNavigation = initNavigation;
})();
