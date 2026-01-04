// The Pet Kitchen - Main Application Module
// Handles questionnaire modal, meal plan filters, and other app-wide functionality

(function() {
  'use strict';

  // ==================== INITIALIZATION ====================
  
  let isInitialized = false;

  function initApp() {
    if (isInitialized) return;
    isInitialized = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupApp);
    } else {
      setupApp();
    }
  }

  function setupApp() {
    initQuestionnaireModal();
    setupMealPlanFilters();
    setupEventNotifications();
    checkFirstVisit();
  }

  // ==================== QUESTIONNAIRE MODAL ====================

  function initQuestionnaireModal() {
    const modal = document.getElementById('questionnaireModal');
    if (!modal) return;

    // All questionnaire trigger buttons
    const triggerButtons = [
      'openQuestionnaire',
      'mobileQuestionnaire',
      'startQuestionnaireHero',
      'startQuestionnaireHeroSection',
      'ctaQuestionnaire'
    ].map(id => document.getElementById(id)).filter(Boolean);

    // Open modal handlers
    triggerButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        openQuestionnaireModal();
      });
    });

    // Close button
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        closeQuestionnaireModal();
      });
    }

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeQuestionnaireModal();
      }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeQuestionnaireModal();
      }
    });

    // Focus trap
    setupModalFocusTrap(modal);

    // Reset form when opening
    const form = document.getElementById('questionnaireForm');
    if (form) {
      // Store original form HTML to reset
      const originalFormHTML = form.innerHTML;
      
      // Override openQuestionnaireModal to reset form
      const originalOpen = openQuestionnaireModal;
      window.openQuestionnaireModal = function() {
        if (form && originalFormHTML) {
          form.innerHTML = originalFormHTML;
          form.style.display = 'block';
          const result = document.getElementById('questionnaireResult');
          if (result) result.style.display = 'none';
        }
        originalOpen();
      };
    }
  }

  function openQuestionnaireModal() {
    const modal = document.getElementById('questionnaireModal');
    if (!modal) return;

    modal.classList.add('show');
    document.body.classList.add('modal-open');
    
    // Prevent body scroll
    lockBodyScroll();

    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('input, select, textarea, button:not(:disabled)');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  function closeQuestionnaireModal() {
    const modal = document.getElementById('questionnaireModal');
    if (!modal) return;

    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    
    // Restore body scroll
    unlockBodyScroll();
  }

  // ==================== SCROLL LOCK ====================

  let scrollLocked = false;
  let scrollPosition = 0;

  function lockBodyScroll() {
    if (scrollLocked) return;
    
    scrollLocked = true;
    scrollPosition = window.scrollY;
    
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  }

  function unlockBodyScroll() {
    if (!scrollLocked) return;
    
    scrollLocked = false;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    
    window.scrollTo(0, scrollPosition);
  }

  // ==================== MODAL FOCUS TRAP ====================

  function setupModalFocusTrap(modal) {
    const focusableSelectors = [
      'button:not(:disabled)',
      '[href]',
      'input:not(:disabled)',
      'select:not(:disabled)',
      'textarea:not(:disabled)',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (!modal.classList.contains('show')) return;

      const focusableElements = Array.from(modal.querySelectorAll(focusableSelectors));
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }

  // ==================== MEAL PLAN FILTERS ====================

  function setupMealPlanFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const mealCards = document.querySelectorAll('.meal-card');
    
    if (filterButtons.length === 0) return;

    // Check URL for filter parameter
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    
    if (filterParam) {
      applyFilter(filterParam, filterButtons, mealCards);
    }

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        applyFilter(filter, filterButtons, mealCards);
        
        // Update URL without reload
        const newUrl = filter === 'all' 
          ? window.location.pathname 
          : `${window.location.pathname}?filter=${filter}`;
        window.history.pushState({}, '', newUrl);
      });
    });
  }

  function applyFilter(filter, buttons, cards) {
    // Update active button
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    // Filter cards based on category
    cards.forEach(card => {
      const category = card.dataset.category || '';
      
      let shouldShow = false;
      
      if (filter === 'all') {
        shouldShow = true;
      } else if (filter === 'dogs') {
        // Show dogs and both
        shouldShow = category === 'dogs' || category === 'both';
      } else if (filter === 'cats') {
        // Show cats and both
        shouldShow = category === 'cats' || category === 'both';
      } else {
        shouldShow = true; // Default to showing all
      }
      
      if (shouldShow) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // ==================== EVENT NOTIFICATIONS ====================

  function setupEventNotifications() {
    const notifyButton = document.getElementById('notifyEvents');
    if (notifyButton) {
      notifyButton.addEventListener('click', () => {
        openQuestionnaireModal();
      });
    }
  }

  // ==================== FIRST VISIT CHECK ====================

  function checkFirstVisit() {
    // Only on index page
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                        window.location.pathname === '/';
    if (!isIndexPage) return;

    // Check if questionnaire was already completed
    const hasCompletedQuestionnaire = localStorage.getItem('pkq_seen');
    
    // Show questionnaire for new visitors
    if (!hasCompletedQuestionnaire) {
      setTimeout(() => {
        openQuestionnaireModal();
      }, 2000);
    }
  }

  // ==================== EXPORTS ====================

  // Initialize on load
  initApp();

  // Make functions available globally
  window.openQuestionnaireModal = openQuestionnaireModal;
  window.closeQuestionnaireModal = closeQuestionnaireModal;
  window.setupMealPlanFilters = setupMealPlanFilters; // Export for meal-plans.js
})();
