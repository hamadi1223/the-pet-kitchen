// The Pet Kitchen - Inline Handler Module
// Replaces inline onclick handlers with event delegation for better performance

(function() {
  'use strict';

  // ==================== EVENT DELEGATION ====================

  function setupEventDelegation() {
    // Use event delegation for dynamically created elements
    document.addEventListener('click', handleDelegatedClick, true);
  }

  function handleDelegatedClick(e) {
    // Check for data-action attribute
    let target = e.target.closest('[data-action]');
    
    // Also check for onclick handlers that should be replaced
    if (!target && e.target.hasAttribute('onclick')) {
      // This will be handled by replaceInlineHandlers on next render
      return;
    }
    
    if (!target) return;

    const action = target.dataset.action;
    let params = {};
    
    try {
      params = target.dataset.params ? JSON.parse(target.dataset.params) : {};
    } catch (e) {
      console.warn('Failed to parse data-params:', target.dataset.params);
    }

    switch (action) {
      case 'reload':
      case 'refresh-page':
        location.reload();
        break;
      
      case 'navigate':
        if (params.url) {
          window.location.href = params.url;
        }
        break;
      
      case 'click-element':
        if (params.selector) {
          const element = document.querySelector(params.selector);
          if (element) element.click();
        }
        break;
      
      case 'open-questionnaire':
        if (typeof window.openQuestionnaireModal === 'function') {
          window.openQuestionnaireModal();
        }
        break;
      
      case 'edit-pet':
        if (typeof window.editPet === 'function' && params.id) {
          window.editPet(params.id);
        }
        break;
      
      case 'delete-pet':
        if (typeof window.deletePet === 'function' && params.id) {
          if (params.userId) {
            window.deletePet(params.id, params.userId);
          } else {
            window.deletePet(params.id);
          }
        }
        break;
      
      case 'show-order-details':
        if (typeof window.showOrderDetails === 'function' && params.id) {
          window.showOrderDetails(params.id);
        }
        break;
      
      case 'show-user-details':
        if (typeof window.showUserDetails === 'function' && params.id) {
          window.showUserDetails(params.id);
        }
        break;
      
      case 'show-subscription-details':
        if (typeof window.showSubscriptionDetails === 'function' && params.id) {
          window.showSubscriptionDetails(params.id);
        }
        break;
      
      case 'renew-subscription':
        if (typeof window.handleRenewSubscription === 'function' && params.id) {
          window.handleRenewSubscription(params.id);
        }
        break;
      
      case 'cancel-order':
        if (typeof window.handleCancelOrder === 'function' && params.id) {
          window.handleCancelOrder(params.id);
        }
        break;
      
      case 'mark-order-fulfilled':
        if (typeof window.markOrderAsFulfilled === 'function' && params.id) {
          e.stopPropagation();
          window.markOrderAsFulfilled(params.id);
        }
        break;
      
      case 'update-order-status':
        if (typeof window.updateOrderStatus === 'function' && params.id && params.status) {
          window.updateOrderStatus(params.id, params.status);
        }
        break;
      
      case 'show-product-edit':
        if (typeof window.showProductEditModal === 'function' && params.id) {
          window.showProductEditModal(params.id);
        }
        break;
      
      case 'show-pet-edit':
        if (typeof window.showPetEditModal === 'function' && params.id) {
          window.showPetEditModal(params.id, params.userId);
        }
        break;
      
      case 'edit-subscription':
        if (typeof window.editSubscription === 'function' && params.id) {
          window.editSubscription(params.id);
        }
        break;
      
      case 'confirm-subscription':
        if (typeof window.confirmSubscription === 'function' && params.id) {
          window.confirmSubscription(params.id);
        }
        break;
      
      case 'cancel-subscription':
        if (typeof window.cancelSubscription === 'function' && params.id) {
          window.cancelSubscription(params.id);
        }
        break;
      
      case 'change-page':
        if (typeof window.changePage === 'function' && params.type && params.page) {
          window.changePage(params.type, params.page);
        }
        break;
      
      case 'load-function':
        if (typeof window[params.function] === 'function') {
          window[params.function]();
        }
        break;
      
      case 'update-quantity':
        if (typeof window.updateQuantity === 'function' && params.id && params.quantity !== undefined) {
          window.updateQuantity(params.id, params.quantity);
        }
        break;
      
      case 'remove-item':
        if (typeof window.removeItem === 'function' && params.id) {
          window.removeItem(params.id);
        }
        break;
      
      case 'open-meal-plan-editor':
        if (typeof window.openMealPlanEditor === 'function') {
          window.openMealPlanEditor(params.id || null);
        }
        break;
      
      case 'load-meal-plans':
        if (typeof window.loadMealPlans === 'function') {
          window.loadMealPlans();
        }
        break;
      
      case 'close-modal':
        if (params.modalId) {
          const modal = document.getElementById(params.modalId);
          if (modal) modal.style.display = 'none';
        }
        break;
      
      default:
        // Allow custom actions to be handled by other modules
        if (typeof window.handleCustomAction === 'function') {
          window.handleCustomAction(action, params, target);
        }
    }
  }

  // ==================== REPLACE INLINE HANDLERS ====================

  function replaceInlineHandlers() {
    // Replace onclick="location.reload()" with data attributes
    document.querySelectorAll('[onclick*="location.reload"]').forEach(el => {
      el.setAttribute('data-action', 'reload');
      el.removeAttribute('onclick');
    });

    // Replace onclick="location.href='...'" with data attributes
    document.querySelectorAll('[onclick*="location.href"]').forEach(el => {
      const onclick = el.getAttribute('onclick');
      const match = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
      if (match) {
        el.setAttribute('data-action', 'navigate');
        el.setAttribute('data-params', JSON.stringify({ url: match[1] }));
        el.removeAttribute('onclick');
      }
    });

    // Replace onclick="document.querySelector(...).click()" with data attributes
    document.querySelectorAll('[onclick*="document.querySelector"]').forEach(el => {
      const onclick = el.getAttribute('onclick');
      const match = onclick.match(/document\.querySelector\(['"]([^'"]+)['"]\)\.click\(\)/);
      if (match) {
        el.setAttribute('data-action', 'click-element');
        el.setAttribute('data-params', JSON.stringify({ selector: match[1] }));
        el.removeAttribute('onclick');
      }
    });

    // Replace onclick="editPet(id)" with data attributes
    document.querySelectorAll('[onclick*="editPet"]').forEach(el => {
      const onclick = el.getAttribute('onclick');
      const match = onclick.match(/editPet\((\d+)\)/);
      if (match) {
        el.setAttribute('data-action', 'edit-pet');
        el.setAttribute('data-params', JSON.stringify({ id: parseInt(match[1]) }));
        el.removeAttribute('onclick');
      }
    });

    // Replace onclick="deletePet(id)" with data attributes
    document.querySelectorAll('[onclick*="deletePet"]').forEach(el => {
      const onclick = el.getAttribute('onclick');
      const match = onclick.match(/deletePet\((\d+)(?:,\s*(\d+))?\)/);
      if (match) {
        const params = { id: parseInt(match[1]) };
        if (match[2]) params.userId = parseInt(match[2]);
        el.setAttribute('data-action', 'delete-pet');
        el.setAttribute('data-params', JSON.stringify(params));
        el.removeAttribute('onclick');
      }
    });

    // Replace onclick="showOrderDetails(id)" with data attributes
    document.querySelectorAll('[onclick*="showOrderDetails"]').forEach(el => {
      const onclick = el.getAttribute('onclick');
      const match = onclick.match(/showOrderDetails\((\d+)\)/);
      if (match) {
        el.setAttribute('data-action', 'show-order-details');
        el.setAttribute('data-params', JSON.stringify({ id: parseInt(match[1]) }));
        el.removeAttribute('onclick');
      }
    });

    // Replace onclick="showUserDetails(id)" with data attributes
    document.querySelectorAll('[onclick*="showUserDetails"]').forEach(el => {
      const onclick = el.getAttribute('onclick');
      const match = onclick.match(/showUserDetails\((\d+)\)/);
      if (match) {
        el.setAttribute('data-action', 'show-user-details');
        el.setAttribute('data-params', JSON.stringify({ id: parseInt(match[1]) }));
        el.removeAttribute('onclick');
      }
    });

    // Replace onclick="updateQuantity(id, quantity)" with data attributes
    document.querySelectorAll('[onclick*="updateQuantity"]').forEach(el => {
      const onclick = el.getAttribute('onclick');
      const match = onclick.match(/updateQuantity\((\d+),\s*(\d+)\)/);
      if (match) {
        el.setAttribute('data-action', 'update-quantity');
        el.setAttribute('data-params', JSON.stringify({ 
          id: parseInt(match[1]), 
          quantity: parseInt(match[2]) 
        }));
        el.removeAttribute('onclick');
      }
    });

    // Replace onclick="removeItem(id)" with data attributes
    document.querySelectorAll('[onclick*="removeItem"]').forEach(el => {
      const onclick = el.getAttribute('onclick');
      const match = onclick.match(/removeItem\((\d+)\)/);
      if (match) {
        el.setAttribute('data-action', 'remove-item');
        el.setAttribute('data-params', JSON.stringify({ id: parseInt(match[1]) }));
        el.removeAttribute('onclick');
      }
    });
  }

  // ==================== MUTATION OBSERVER ====================
  // Watch for dynamically added elements with onclick handlers

  function setupMutationObserver() {
    if (!window.MutationObserver) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check the node itself
            if (node.hasAttribute && node.hasAttribute('onclick')) {
              replaceInlineHandlersOnElement(node);
            }
            // Check children
            if (node.querySelectorAll) {
              const elementsWithOnclick = node.querySelectorAll('[onclick]');
              elementsWithOnclick.forEach(el => replaceInlineHandlersOnElement(el));
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function replaceInlineHandlersOnElement(el) {
    const onclick = el.getAttribute('onclick');
    if (!onclick) return;

    // Apply the same replacement logic as replaceInlineHandlers
    if (onclick.includes('location.reload')) {
      el.setAttribute('data-action', 'reload');
      el.removeAttribute('onclick');
    } else if (onclick.includes('location.href')) {
      const match = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
      if (match) {
        el.setAttribute('data-action', 'navigate');
        el.setAttribute('data-params', JSON.stringify({ url: match[1] }));
        el.removeAttribute('onclick');
      }
    }
    // Add more patterns as needed
  }

  // ==================== INITIALIZATION ====================

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        replaceInlineHandlers();
        setupEventDelegation();
        setupMutationObserver();
      });
    } else {
      replaceInlineHandlers();
      setupEventDelegation();
      setupMutationObserver();
    }
  }

  init();
})();

