// Admin Dashboard Functionality
// Prevent multiple initializations - declare at global scope
var adminInitialized = false;
var adminInitializing = false;

let currentPage = {
  orders: 1,
  users: 1,
  subscriptions: 1
};

let currentFilters = {
  status: '',
  email: '',
  subscriptionStatus: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  // Show loading state immediately
  const loadingState = document.getElementById('loadingState');
  const loadingMessage = document.getElementById('loadingMessage');
  const loadingProgressBar = document.getElementById('loadingProgressBar');
  
  if (loadingState) {
    loadingState.style.display = 'block';
  }
  if (loadingMessage) {
    loadingMessage.textContent = 'Waiting for API to initialize...';
  }
  if (loadingProgressBar) {
    loadingProgressBar.style.width = '10%';
  }
  
  // Wait for API to load with longer timeout and better checks
  const waitForAPI = async (attempts = 0) => {
    const MAX_ATTEMPTS = 50; // Increased from 20 to 50 (5 seconds total)
    const DELAY_MS = 100;
    
    if (attempts > MAX_ATTEMPTS) {
      console.error('❌ API failed to load after', MAX_ATTEMPTS * DELAY_MS, 'ms');
      const loadingState = document.getElementById('loadingState');
      if (loadingState) {
        loadingState.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <p style="color: #DC2626; margin-bottom: 1rem;">Failed to Initialize</p>
            <p style="color: var(--ink-700);">Please refresh the page.</p>
            <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Refresh Page</button>
          </div>
        `;
      }
      return;
    }
    
    // Check if all required APIs are available
    // Note: adminAPI is loaded later, so we don't require it for initial auth check
    const apiReady = typeof window.getToken === 'function' && 
                     typeof window.authAPI !== 'undefined' &&
                     typeof window.authAPI.getMe === 'function';
    
    if (!apiReady) {
      if (attempts % 10 === 0) { // Log every 10 attempts
        console.log(`⏳ Waiting for API to load... (attempt ${attempts}/${MAX_ATTEMPTS})`);
        if (loadingMessage) {
          loadingMessage.textContent = `Waiting for API to load... (${attempts}/${MAX_ATTEMPTS})`;
        }
        if (loadingProgressBar) {
          loadingProgressBar.style.width = `${Math.min(20 + (attempts * 2), 40)}%`;
        }
      }
      setTimeout(() => waitForAPI(attempts + 1), DELAY_MS);
      return;
    }
    
    if (loadingMessage) {
      loadingMessage.textContent = 'API ready, verifying authentication...';
    }
    if (loadingProgressBar) {
      loadingProgressBar.style.width = '50%';
    }
    
    console.log('✅ API is ready, waiting additional 200ms for full initialization...');
    
    // Additional wait to ensure everything is fully initialized
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Double-check API is still ready
    if (typeof window.getToken === 'function' && typeof window.authAPI !== 'undefined') {
      if (loadingMessage) {
        loadingMessage.textContent = 'Initializing admin dashboard...';
      }
      if (loadingProgressBar) {
        loadingProgressBar.style.width = '60%';
      }
      console.log('✅ API confirmed ready, initializing admin...');
      initializeAdmin();
    } else {
      console.warn('⚠️ API became unavailable, retrying...');
      setTimeout(() => waitForAPI(attempts + 1), DELAY_MS);
    }
  };
  
  // Also listen for apiReady event (only if not already initialized)
  document.addEventListener('apiReady', () => {
    if (adminInitialized || adminInitializing) {
      return;
    }
    console.log('📢 Received apiReady event');
    setTimeout(() => {
      if (typeof window.getToken === 'function' && typeof window.authAPI !== 'undefined') {
        console.log('✅ API ready via event, initializing admin...');
        initializeAdmin();
      }
    }, 300); // Additional delay after event
  });
  
  waitForAPI();
});

async function initializeAdmin() {
  // Prevent multiple initializations
  if (adminInitialized) {
    console.log('⚠️ Admin already initialized, skipping...');
    return;
  }
  
  adminInitialized = true;
  adminInitializing = false;
  
  const loadingMessage = document.getElementById('loadingMessage');
  const loadingProgressBar = document.getElementById('loadingProgressBar');
  
  // Add a small delay to ensure everything is settled
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (loadingMessage) {
    loadingMessage.textContent = 'Checking authentication...';
  }
  if (loadingProgressBar) {
    loadingProgressBar.style.width = '65%';
  }
  
  // Check authentication
  const token = window.getToken();
  if (!token) {
    console.warn('⚠️ No token found, redirecting to login...');
    console.warn('⚠️ localStorage contents:', {
      auth_token: localStorage.getItem('auth_token'),
      token: localStorage.getItem('token'),
      current_user: localStorage.getItem('current_user')
    });
    if (loadingMessage) {
      loadingMessage.textContent = 'No authentication found. Redirecting to login...';
    }
    setTimeout(() => {
      window.location.href = 'login.html?redirect=admin';
    }, 1000);
    return;
  }
  
  console.log('✅ Token found:', token.substring(0, 30) + '...');

  // Verify admin role - fetch fresh user data from API with retry logic
  try {
    if (!window.authAPI || !window.authAPI.getMe) {
      throw new Error('Auth API not available');
    }
    
    // Check if token exists
    const token = window.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    if (loadingMessage) {
      loadingMessage.textContent = 'Verifying admin access...';
    }
    if (loadingProgressBar) {
      loadingProgressBar.style.width = '70%';
    }
    
    console.log('🔐 Verifying admin access with token:', token.substring(0, 20) + '...');
    
    // Retry logic for getMe call
    let currentUser;
    let retries = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500; // 500ms between retries
    
    // Add timeout to prevent infinite waiting
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Authentication timeout - request took too long')), 10000); // 10 second timeout
    });
    
    while (retries < MAX_RETRIES) {
      try {
        console.log(`🔄 Attempting to get user info (attempt ${retries + 1}/${MAX_RETRIES})...`);
        if (loadingMessage && retries > 0) {
          loadingMessage.textContent = `Verifying admin access... (retry ${retries + 1}/${MAX_RETRIES})`;
        }
        
        // Race between the API call and timeout
        currentUser = await Promise.race([
          window.authAPI.getMe(),
          timeoutPromise
        ]);
        
        console.log('✅ Successfully retrieved user info');
        break; // Success, exit retry loop
      } catch (error) {
        retries++;
        
        // If it's a rate limit error, wait longer before retrying
        const isRateLimit = error.message && error.message.includes('Too many requests');
        const isTimeout = error.message && error.message.includes('timeout');
        const waitTime = isRateLimit ? 2000 : RETRY_DELAY; // Wait 2 seconds for rate limit
        
        if (retries >= MAX_RETRIES) {
          // If it's a rate limit error on the last retry, show a helpful message
          if (isRateLimit) {
            throw new Error('Rate limit exceeded. Please wait a moment and refresh the page.');
          }
          if (isTimeout) {
            throw new Error('Connection timeout. Please check your internet connection and try again.');
          }
          throw error; // Re-throw if all retries failed
        }
        
        console.warn(`⚠️ Attempt ${retries} failed, retrying in ${waitTime}ms...`, error.message);
        if (loadingMessage) {
          if (isRateLimit) {
            loadingMessage.textContent = `Rate limit reached. Waiting before retry... (${retries + 1}/${MAX_RETRIES})`;
          } else if (isTimeout) {
            loadingMessage.textContent = `Connection timeout. Retrying... (${retries + 1}/${MAX_RETRIES})`;
          } else {
            loadingMessage.textContent = `Verifying admin access... (retry ${retries + 1}/${MAX_RETRIES})`;
          }
        }
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    console.log('👤 Current user from API:', currentUser);
    
    if (!currentUser) {
      throw new Error('Failed to retrieve user information');
    }
    
    if (loadingMessage) {
      loadingMessage.textContent = 'Loading dashboard data...';
    }
    if (loadingProgressBar) {
      loadingProgressBar.style.width = '80%';
    }
    
    if (currentUser.role !== 'admin') {
      console.warn('⚠️ User is not an admin. Role:', currentUser?.role);
      const loadingState = document.getElementById('loadingState');
      if (loadingState) {
        loadingState.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <p style="color: #DC2626; margin-bottom: 1rem;">Access Denied</p>
            <p style="color: var(--ink-700);">Admin privileges required.</p>
            <p style="color: var(--ink-600); font-size: 0.875rem; margin-top: 0.5rem;">Your role: ${currentUser?.role || 'unknown'}</p>
          </div>
        `;
      }
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      return;
    }
    
    console.log('✅ Admin authenticated:', currentUser);
    
    if (loadingMessage) {
      loadingMessage.textContent = 'Setting up dashboard...';
    }
    if (loadingProgressBar) {
      loadingProgressBar.style.width = '85%';
    }
  } catch (error) {
    console.error('❌ Error verifying admin access:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      token: window.getToken() ? 'Token exists' : 'No token',
      authAPI: window.authAPI ? 'AuthAPI exists' : 'No AuthAPI'
    });
    
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
      loadingState.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: #DC2626; margin-bottom: 1rem;">Authentication Error</p>
          <p style="color: var(--ink-700);">${error.message || 'Please log in again.'}</p>
          <p style="color: var(--ink-600); font-size: 0.875rem; margin-top: 0.5rem;">If this persists, please clear your browser cache and try again.</p>
        </div>
      `;
    }
    setTimeout(() => {
      window.location.href = 'login.html?redirect=admin';
    }, 3000);
    return;
  }

  // Setup logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (window.authAPI && window.authAPI.logout) {
      window.authAPI.logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    }
  });
  document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => {
    if (window.authAPI && window.authAPI.logout) {
      window.authAPI.logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    }
  });

  // Setup tabs
  setupTabs();

  // Setup filters
  setupFilters();

  // Setup modals
  setupModals();

  // Setup meal plan event listeners
  setupMealPlanEventListeners();

  // Load dashboard
  if (loadingMessage) {
    loadingMessage.textContent = 'Loading dashboard...';
  }
  if (loadingProgressBar) {
    loadingProgressBar.style.width = '90%';
  }
  
  await loadDashboard();
  
  // Final progress update
  if (loadingProgressBar) {
    loadingProgressBar.style.width = '100%';
  }
  if (loadingMessage) {
    loadingMessage.textContent = 'Dashboard ready!';
  }
  
  // Hide loading state after a brief delay to show completion
  setTimeout(() => {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
      loadingState.style.display = 'none';
    }
  }, 300);
}

// Setup meal plan event listeners for edit/delete buttons
function setupMealPlanEventListeners() {
  // Use event delegation for dynamically created buttons
  document.addEventListener('click', (e) => {
    // Edit button
    if (e.target.matches('.meal-plan-edit-btn') || e.target.closest('.meal-plan-edit-btn')) {
      const btn = e.target.matches('.meal-plan-edit-btn') ? e.target : e.target.closest('.meal-plan-edit-btn');
      const id = btn?.dataset.mealPlanId;
      if (id) {
        e.preventDefault();
        e.stopPropagation();
        openMealPlanEditor(parseInt(id));
      }
    }
    
    // Delete button
    if (e.target.matches('.meal-plan-delete-btn') || e.target.closest('.meal-plan-delete-btn')) {
      const btn = e.target.matches('.meal-plan-delete-btn') ? e.target : e.target.closest('.meal-plan-delete-btn');
      const id = btn?.dataset.mealPlanId;
      if (id) {
        e.preventDefault();
        e.stopPropagation();
        handleMealPlanDelete(parseInt(id));
      }
    }
  });
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      console.log('📑 Switching to tab:', tab);
      
      // Update active tab button
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active tab content
      document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      const tabContent = document.getElementById(`${tab}Tab`);
      if (tabContent) {
        tabContent.classList.add('active');
        console.log('✅ Tab content activated:', `${tab}Tab`);
      } else {
        console.error('❌ Tab content not found:', `${tab}Tab`);
        return; // Don't proceed if tab content doesn't exist
      }

      // Show loading state for the tab
      const tabContainer = tabContent.querySelector('[id$="Container"]') || tabContent;
      if (tabContainer && !tabContainer.querySelector('.tab-loading')) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'tab-loading';
        loadingOverlay.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; min-height: 200px;">
            <div class="loading-spinner" style="width: 48px; height: 48px; border: 3px solid var(--beige-200); border-top-color: var(--gold-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 1.5rem; color: var(--charcoal-600); font-size: 0.95rem;">Loading ${tab}...</p>
          </div>
        `;
        tabContainer.appendChild(loadingOverlay);
      }
      
      // Load data for the tab
      if (tab === 'orders') {
        console.log('📦 Loading orders...');
        loadOrders().then(() => {
          const loadingOverlay = tabContent.querySelector('.tab-loading');
          if (loadingOverlay) loadingOverlay.remove();
        });
      } else if (tab === 'users') {
        console.log('👥 Loading users...');
        loadUsers().then(() => {
          const loadingOverlay = tabContent.querySelector('.tab-loading');
          if (loadingOverlay) loadingOverlay.remove();
        });
      } else if (tab === 'products') {
        console.log('🍽️ Loading products...');
        loadProducts().then(() => {
          loadLowStockAlerts();
          const loadingOverlay = tabContent.querySelector('.tab-loading');
          if (loadingOverlay) loadingOverlay.remove();
        });
      } else if (tab === 'subscriptions') {
        console.log('📅 Loading subscriptions...');
        loadSubscriptions().then(() => {
          const loadingOverlay = tabContent.querySelector('.tab-loading');
          if (loadingOverlay) loadingOverlay.remove();
        });
      } else if (tab === 'mealPlans') {
        console.log('🍽️ Loading meal plans...');
        loadMealPlans().then(() => {
          const loadingOverlay = tabContent.querySelector('.tab-loading');
          if (loadingOverlay) loadingOverlay.remove();
        });
      } else if (tab === 'reminders') {
        console.log('⏰ Loading reminders...');
        loadReminders().then(() => {
          const loadingOverlay = tabContent.querySelector('.tab-loading');
          if (loadingOverlay) loadingOverlay.remove();
        });
      } else if (tab === 'overview') {
        console.log('📊 Loading overview...');
        loadOrderStatusBreakdown().then(() => {
          const loadingOverlay = tabContent.querySelector('.tab-loading');
          if (loadingOverlay) loadingOverlay.remove();
        });
      }
    });
  });
}

function setupFilters() {
  document.getElementById('applyFilters')?.addEventListener('click', () => {
    currentFilters.status = document.getElementById('statusFilter').value;
    currentFilters.email = document.getElementById('emailFilter').value;
    currentPage.orders = 1;
    loadOrders();
  });

  document.getElementById('clearFilters')?.addEventListener('click', () => {
    document.getElementById('statusFilter').value = '';
    document.getElementById('emailFilter').value = '';
    currentFilters = { status: '', email: '' };
    currentPage.orders = 1;
    loadOrders();
  });

  // Subscription filters
  document.getElementById('applySubscriptionFilters')?.addEventListener('click', () => {
    currentFilters.subscriptionStatus = document.getElementById('subscriptionStatusFilter').value;
    currentPage.subscriptions = 1;
    loadSubscriptions();
  });

  document.getElementById('clearSubscriptionFilters')?.addEventListener('click', () => {
    document.getElementById('subscriptionStatusFilter').value = '';
    currentFilters.subscriptionStatus = '';
    currentPage.subscriptions = 1;
    loadSubscriptions();
  });

  // User search
  const userSearch = document.getElementById('userSearch');
  if (userSearch) {
    let searchTimeout;
    userSearch.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchTerm = e.target.value.trim();
        if (searchTerm) {
          filterUsers(searchTerm);
        } else {
          loadUsers();
        }
      }, 500);
    });
  }
}

function filterUsers(searchTerm) {
  const container = document.getElementById('usersContainer');
  if (!container) return;

  container.innerHTML = '<p>Searching users...</p>';

  // Filter users by name or email
  window.adminAPI.getUsers({ limit: 1000 })
    .then(response => {
      const users = response.users || [];
      const filtered = users.filter(user => {
        const name = (user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || email.includes(term);
      });

      if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No users found matching your search.</p>';
        return;
      }

      renderUsersList(filtered);
    })
    .catch(error => {
      console.error('Error filtering users:', error);
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #DC2626;">Error searching users.</p>';
    });
}

function renderUsersList(users) {
  const container = document.getElementById('usersContainer');
  if (!container) {
    console.warn('Users container not found');
    return;
  }

  if (!Array.isArray(users) || users.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No users found.</p>';
    return;
  }

  container.innerHTML = users
    .filter(user => user && user.id) // Filter invalid users
    .map(user => {
      let dateStr = 'Date unknown';
      try {
        if (user.created_at) {
          const date = new Date(user.created_at);
          if (!isNaN(date.getTime())) {
            dateStr = date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          }
        }
      } catch (e) {
        console.warn('Error formatting date:', e);
      }

      const userId = user.id || 'N/A';
      const userName = escapeHtml(user.name || 'No name');
      const userEmail = escapeHtml(user.email || 'No email');
      const role = user.role || 'user';
      const petCount = parseInt(user.pet_count || 0) || 0;
      const orderCount = parseInt(user.order_count || 0) || 0;
      const totalSpent = parseFloat(user.total_spent || 0);
      const spentStr = isNaN(totalSpent) ? '0.000' : totalSpent.toFixed(3);

      const lastOrderDate = user.last_order_date ? new Date(user.last_order_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'Never';

      return `
        <div class="data-card" onclick="showUserDetails(${userId})">
          <div class="data-card-header">
            <div>
              <div class="data-card-title">
                ${userName}
                ${role === 'admin' ? '<span style="background: #C9A36A; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;">ADMIN</span>' : ''}
              </div>
              <div class="data-card-meta">
                <a href="mailto:${userEmail}" style="color: inherit; text-decoration: none;">${userEmail}</a> • Member since ${dateStr}
              </div>
            </div>
            <span class="status-badge ${role === 'admin' ? 'paid' : 'created'}">${role === 'admin' ? 'Admin' : 'Customer'}</span>
          </div>
          <div class="data-card-body">
            <div class="data-item">
              <span class="data-label">Customer ID</span>
              <span class="data-value">#${userId}</span>
            </div>
            <div class="data-item">
              <span class="data-label">Pets</span>
              <span class="data-value">${petCount}</span>
            </div>
            <div class="data-item">
              <span class="data-label">Orders</span>
              <span class="data-value">${orderCount}</span>
            </div>
            <div class="data-item">
              <span class="data-label">Total Spent</span>
              <span class="data-value" style="font-weight: 700; color: #C9A36A;">${spentStr} KD</span>
            </div>
            ${user.last_order_date ? `
              <div class="data-item">
                <span class="data-label">Last Order</span>
                <span class="data-value">${lastOrderDate}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  if (container.innerHTML.trim() === '') {
    container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No valid users found.</p>';
  }
}

function setupModals() {
  const orderModal = document.getElementById('orderModal');
  const userModal = document.getElementById('userModal');
  const productEditModal = document.getElementById('productEditModal');
  const petEditModal = document.getElementById('petEditModal');

  document.getElementById('closeOrderModal')?.addEventListener('click', () => {
    orderModal.style.display = 'none';
    orderModal.classList.remove('active');
  });

  document.getElementById('closeUserModal')?.addEventListener('click', () => {
    userModal.style.display = 'none';
    userModal.classList.remove('active');
  });

  document.getElementById('closeProductEditModal')?.addEventListener('click', () => {
    productEditModal.style.display = 'none';
    productEditModal.classList.remove('active');
  });

  document.getElementById('closePetEditModal')?.addEventListener('click', () => {
    petEditModal.style.display = 'none';
    petEditModal.classList.remove('active');
  });

  const mealPlanEditModal = document.getElementById('mealPlanEditModal');
  document.getElementById('closeMealPlanEditModal')?.addEventListener('click', () => {
    mealPlanEditModal.style.display = 'none';
    mealPlanEditModal.classList.remove('active');
  });

  const subscriptionModal = document.getElementById('subscriptionModal');
  document.getElementById('closeSubscriptionModal')?.addEventListener('click', () => {
    subscriptionModal.style.display = 'none';
    subscriptionModal.classList.remove('active');
  });

  // Close on outside click
  orderModal?.addEventListener('click', (e) => {
    if (e.target === orderModal) {
      orderModal.style.display = 'none';
      orderModal.classList.remove('active');
    }
  });
  
  userModal?.addEventListener('click', (e) => {
    if (e.target === userModal) {
      userModal.style.display = 'none';
      userModal.classList.remove('active');
    }
  });
  
  productEditModal?.addEventListener('click', (e) => {
    if (e.target === productEditModal) {
      productEditModal.style.display = 'none';
      productEditModal.classList.remove('active');
    }
  });
  
  petEditModal?.addEventListener('click', (e) => {
    if (e.target === petEditModal) {
      petEditModal.style.display = 'none';
      petEditModal.classList.remove('active');
    }
  });
  
  mealPlanEditModal?.addEventListener('click', (e) => {
    if (e.target === mealPlanEditModal) {
      mealPlanEditModal.style.display = 'none';
      mealPlanEditModal.classList.remove('active');
    }
  });
  
  subscriptionModal?.addEventListener('click', (e) => {
    if (e.target === subscriptionModal) {
      subscriptionModal.style.display = 'none';
      subscriptionModal.classList.remove('active');
    }
  });

  userModal?.addEventListener('click', (e) => {
    if (e.target === userModal) {
      userModal.style.display = 'none';
    }
  });

  productEditModal?.addEventListener('click', (e) => {
    if (e.target === productEditModal) {
      productEditModal.style.display = 'none';
    }
  });

  petEditModal?.addEventListener('click', (e) => {
    if (e.target === petEditModal) {
      petEditModal.style.display = 'none';
    }
  });

  const subscriptionEditModal = document.getElementById('subscriptionEditModal');
  document.getElementById('closeSubscriptionEditModal')?.addEventListener('click', () => {
    if (subscriptionEditModal) {
      subscriptionEditModal.style.display = 'none';
    }
  });

  subscriptionEditModal?.addEventListener('click', (e) => {
    if (e.target === subscriptionEditModal) {
      subscriptionEditModal.style.display = 'none';
    }
  });

  subscriptionModal?.addEventListener('click', (e) => {
    if (e.target === subscriptionModal) {
      subscriptionModal.style.display = 'none';
    }
  });
}

async function loadDashboard() {
  const loadingState = document.getElementById('loadingState');
  const dashboardContent = document.getElementById('dashboardContent');
  const errorState = document.getElementById('errorState');

  if (!loadingState || !dashboardContent || !errorState) {
    console.error('Required dashboard elements not found');
    return;
  }

  // Ensure loading state is visible
  loadingState.style.display = 'block';
  dashboardContent.style.display = 'none';
  errorState.style.display = 'none';
  
  // Check if adminAPI is available
  if (typeof window.adminAPI === 'undefined') {
    console.warn('⚠️ adminAPI not available, waiting for it...');
    // Wait up to 2 seconds for adminAPI
    let waitAttempts = 0;
    while (typeof window.adminAPI === 'undefined' && waitAttempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitAttempts++;
    }
    
    if (typeof window.adminAPI === 'undefined') {
      console.error('❌ adminAPI still not available after waiting');
      loadingState.style.display = 'none';
      errorState.style.display = 'block';
      errorState.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: #DC2626; margin-bottom: 1rem;">API Not Available</p>
          <p style="color: var(--ink-700);">Admin API is not loaded. Please refresh the page.</p>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Refresh Page</button>
        </div>
      `;
      return;
    }
  }

  try {
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingProgressBar = document.getElementById('loadingProgressBar');
    
    // Add initial delay to ensure API is fully ready
    if (loadingMessage) {
      loadingMessage.textContent = 'Preparing dashboard...';
    }
    if (loadingProgressBar) {
      loadingProgressBar.style.width = '85%';
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Load initial data sequentially with delays to prevent overwhelming the API
    console.log('📊 Loading dashboard data with delays...');
    
    const results = [];
    
    // Load stats first
    if (loadingMessage) {
      loadingMessage.textContent = 'Loading statistics...';
    }
    if (loadingProgressBar) {
      loadingProgressBar.style.width = '88%';
    }
    console.log('📈 Loading stats...');
    results.push(await Promise.allSettled([loadStats()]));
    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
    
    // Load recent orders
    if (loadingMessage) {
      loadingMessage.textContent = 'Loading recent orders...';
    }
    if (loadingProgressBar) {
      loadingProgressBar.style.width = '92%';
    }
    console.log('📦 Loading recent orders...');
    results.push(await Promise.allSettled([loadRecentOrders()]));
    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
    
    // Load recent users
    if (loadingMessage) {
      loadingMessage.textContent = 'Loading recent users...';
    }
    if (loadingProgressBar) {
      loadingProgressBar.style.width = '95%';
    }
    console.log('👥 Loading recent users...');
    results.push(await Promise.allSettled([loadRecentUsers()]));
    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
    
    // Load order status breakdown
    if (loadingMessage) {
      loadingMessage.textContent = 'Loading analytics...';
    }
    if (loadingProgressBar) {
      loadingProgressBar.style.width = '98%';
    }
    console.log('📊 Loading order status breakdown...');
    results.push(await Promise.allSettled([loadOrderStatusBreakdown()]));

    // Check for failures
    const failures = results.flat().filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn('Some dashboard components failed to load:', failures);
      // Still show dashboard if at least some data loaded
    }

    // Final loading message
    if (loadingMessage) {
      loadingMessage.textContent = 'Finalizing dashboard...';
    }
    if (loadingProgressBar) {
      loadingProgressBar.style.width = '100%';
    }
    
    // Small delay to show 100% progress
    await new Promise(resolve => setTimeout(resolve, 300));

    // Hide loading state and show dashboard
    loadingState.style.display = 'none';
    dashboardContent.style.display = 'block';
    errorState.style.display = 'none';
  } catch (error) {
    console.error('❌ Critical error loading dashboard:', error);
    if (loadingState) loadingState.style.display = 'none';
    if (dashboardContent) dashboardContent.style.display = 'none';
    if (errorState) {
      errorState.style.display = 'block';
      errorState.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: #DC2626; margin-bottom: 1rem;"><strong>Unable to load dashboard</strong></p>
          <p style="color: var(--ink-700); margin-bottom: 1.5rem;">${escapeHtml(error.message || 'Please check your admin permissions and try again.')}</p>
          <button class="btn btn-primary" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }
}

async function loadStats() {
  try {
    console.log('📊 Loading admin stats...');
    
    // Get orders for stats
    const ordersResponse = await window.adminAPI.getOrders({ limit: 1000 });
    const usersResponse = await window.adminAPI.getUsers({ limit: 1000 });

    const orders = Array.isArray(ordersResponse?.orders) ? ordersResponse.orders : [];
    const users = Array.isArray(usersResponse?.users) ? usersResponse.users : [];

    // Calculate stats with safe defaults
    const totalOrders = orders.length || 0;
    const totalUsers = users.length || 0;
    const paidOrders = orders.filter(o => o && (o.status === 'paid' || o.status === 'fulfilled'));
    const totalRevenue = paidOrders.reduce((sum, o) => {
      const amount = parseFloat(o?.total_amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const pendingOrders = orders.filter(o => o && (o.status === 'created' || o.status === 'paid')).length;
    const avgOrderValue = totalOrders > 0 && totalRevenue > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate total pets from users
    const totalPets = users.reduce((sum, u) => {
      const count = parseInt(u?.pet_count || 0);
      return sum + (isNaN(count) ? 0 : count);
    }, 0);

    // Calculate today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o?.created_at && String(o.created_at).startsWith(today));
    const todayRevenue = todayOrders
      .filter(o => o && (o.status === 'paid' || o.status === 'fulfilled'))
      .reduce((sum, o) => {
        const amount = parseFloat(o?.total_amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    // Update UI with safe checks
    const updateElement = (id, value, suffix = '') => {
      const el = document.getElementById(id);
      if (el) el.textContent = value + suffix;
    };
    
    updateElement('totalOrders', totalOrders);
    updateElement('totalUsers', totalUsers);
    updateElement('totalRevenue', totalRevenue.toFixed(3), ' KD');
    updateElement('pendingOrders', pendingOrders);
    updateElement('avgOrderValue', avgOrderValue.toFixed(3), ' KD');
    updateElement('totalPets', totalPets);
    updateElement('revenueChange', todayRevenue > 0 ? `+${todayRevenue.toFixed(3)} KD today` : 'All time');
    updateElement('ordersChange', todayOrders.length > 0 ? `+${todayOrders.length} today` : 'All time');
    
    console.log('✅ Stats loaded:', { totalOrders, totalUsers, totalRevenue, pendingOrders, avgOrderValue, totalPets });
  } catch (error) {
    console.error('❌ Error loading stats:', error);
    console.error('Error details:', error.message);
    
    // Set error state in UI
    const updateElement = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    updateElement('totalOrders', 'Error');
    updateElement('totalUsers', 'Error');
    updateElement('totalRevenue', 'Error');
    updateElement('pendingOrders', 'Error');
  }
}

async function loadRecentOrders() {
  const container = document.getElementById('recentOrdersContainer');
  if (!container) {
    console.warn('Recent orders container not found');
    return;
  }

  try {
    container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">Loading...</p>';
    
    const response = await window.adminAPI.getOrders({ limit: 5 });
    const orders = Array.isArray(response?.orders) ? response.orders : [];

    if (orders.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">No orders yet</p>';
      return;
    }

    container.innerHTML = orders
      .filter(order => order && order.id) // Filter out invalid orders
      .map(order => {
        let dateStr = 'Date unknown';
        try {
          if (order.created_at) {
            const date = new Date(order.created_at);
            if (!isNaN(date.getTime())) {
              dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }
          }
        } catch (e) {
          console.warn('Error formatting date:', e);
        }

        const orderId = order.id || 'N/A';
        const userName = escapeHtml(order.user_name || order.user_email || 'Guest');
        const status = order.status || 'unknown';
        const amount = parseFloat(order.total_amount || 0);
        const amountStr = isNaN(amount) ? '0.000' : amount.toFixed(3);

        return `
          <div class="recent-item" onclick="showOrderDetails(${orderId})">
            <div class="recent-item-main">
              <div class="recent-item-title">Order #${orderId}</div>
              <div class="recent-item-meta">${userName} • ${dateStr}</div>
            </div>
            <div class="recent-item-side">
              <span class="status-badge ${status}">${status}</span>
              <div class="recent-item-amount">${amountStr} KD</div>
            </div>
          </div>
        `;
      })
      .join('');

    if (container.innerHTML.trim() === '') {
      container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">No valid orders found</p>';
    }
  } catch (error) {
    console.error('❌ Error loading recent orders:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 1rem;">
        <p style="color: #DC2626; margin-bottom: 0.5rem;">Error loading orders</p>
        <button class="btn btn-primary" onclick="loadRecentOrders()" style="font-size: 0.85rem; padding: 0.5rem 1rem;">Retry</button>
      </div>
    `;
  }
}

async function loadRecentUsers() {
  const container = document.getElementById('recentUsersContainer');
  if (!container) {
    console.warn('Recent users container not found');
    return;
  }

  try {
    container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">Loading...</p>';
    
    const response = await window.adminAPI.getUsers({ limit: 5 });
    const users = Array.isArray(response?.users) ? response.users : [];

    if (users.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">No users yet</p>';
      return;
    }

    container.innerHTML = users
      .filter(user => user && user.id) // Filter out invalid users
      .map(user => {
        let dateStr = 'Date unknown';
        try {
          if (user.created_at) {
            const date = new Date(user.created_at);
            if (!isNaN(date.getTime())) {
              dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
            }
          }
        } catch (e) {
          console.warn('Error formatting date:', e);
        }

        const userId = user.id || 'N/A';
        const userName = escapeHtml(user.name || 'No name');
        const userEmail = escapeHtml(user.email || 'No email');
        const petCount = parseInt(user.pet_count || 0) || 0;
        const orderCount = parseInt(user.order_count || 0) || 0;
        const totalSpent = parseFloat(user.total_spent || 0);
        const spentStr = isNaN(totalSpent) ? '0.000' : totalSpent.toFixed(3);

        const roleBadge = user.role === 'admin' ? '<span style="background: #C9A36A; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;">ADMIN</span>' : '';
        
        return `
          <div class="recent-item" onclick="showUserDetails(${userId})">
            <div class="recent-item-main">
              <div class="recent-item-title">
                ${userName} ${roleBadge}
              </div>
              <div class="recent-item-meta">
                <a href="mailto:${userEmail}" style="color: inherit; text-decoration: none;">${userEmail}</a> • ${dateStr}
              </div>
            </div>
            <div class="recent-item-side">
              <div class="recent-item-stats">
                <span>${petCount} pets</span>
                <span>•</span>
                <span>${orderCount} orders</span>
              </div>
              <div class="recent-item-amount">${spentStr} KD</div>
            </div>
          </div>
        `;
      })
      .join('');

    if (container.innerHTML.trim() === '') {
      container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">No valid users found</p>';
    }
  } catch (error) {
    console.error('❌ Error loading recent users:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 1rem;">
        <p style="color: #DC2626; margin-bottom: 0.5rem;">Error loading users</p>
        <button class="btn btn-primary" onclick="loadRecentUsers()" style="font-size: 0.85rem; padding: 0.5rem 1rem;">Retry</button>
      </div>
    `;
  }
}

async function loadOrderStatusBreakdown() {
  const container = document.getElementById('orderStatusBreakdown');
  if (!container) {
    console.warn('Order status breakdown container not found');
    return;
  }

  try {
    container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">Loading...</p>';
    
    const response = await window.adminAPI.getOrders({ limit: 1000 });
    const orders = Array.isArray(response?.orders) ? response.orders : [];

    const breakdown = {
      created: 0,
      paid: 0,
      fulfilled: 0,
      cancelled: 0,
      failed: 0
    };

    orders.forEach(order => {
      if (order && order.status && breakdown.hasOwnProperty(order.status)) {
        breakdown[order.status]++;
      }
    });

    const total = orders.length;

    if (total === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">No orders to analyze</p>';
      return;
    }

    // Get status colors
    const statusColors = {
      created: 'rgba(201, 163, 106, 0.3)',
      paid: 'rgba(27, 138, 90, 0.3)',
      fulfilled: 'rgba(201, 163, 106, 0.5)',
      cancelled: 'rgba(220, 38, 38, 0.3)',
      failed: 'rgba(220, 38, 38, 0.3)'
    };

    container.innerHTML = Object.entries(breakdown)
      .map(([status, count]) => {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
        const color = statusColors[status] || 'var(--accent)';
        return `
          <div class="status-item">
            <div class="status-item-header">
              <span class="status-badge ${status}">${status}</span>
              <span class="status-count">${count}</span>
            </div>
            <div class="status-bar">
              <div class="status-bar-fill" style="width: ${percentage}%; background: ${color};"></div>
            </div>
            <div class="status-percentage">${percentage}%</div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.error('❌ Error loading status breakdown:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 1rem;">
        <p style="color: #DC2626; margin-bottom: 0.5rem;">Error loading breakdown</p>
        <button class="btn btn-primary" onclick="loadOrderStatusBreakdown()" style="font-size: 0.85rem; padding: 0.5rem 1rem;">Retry</button>
      </div>
    `;
  }
}

// Legacy loadProducts - now handled by admin-products.js
async function loadProducts() {
  // Delegate to admin-products.js if available
  if (window.loadProducts && window.loadProducts !== loadProducts) {
    return window.loadProducts();
  }
  
  // Fallback implementation
  const container = document.getElementById('productsContainer');
  if (!container) {
    console.warn('Products container not found');
    return;
  }
  
  container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">Loading products...</p>';

  try {
    console.log('🍽️ Loading products...');
    
    // Check if adminAPI is available
    if (!window.adminAPI || !window.adminAPI.getProducts) {
      throw new Error('Admin API not available. Please refresh the page.');
    }
    
    // Log the API call details
    const apiUrl = `${window.API_BASE_URL || 'http://localhost:8000/api'}/admin/products`;
    console.log('🌐 Calling products API:', apiUrl);
    console.log('🔑 Has token:', !!window.getToken());
    
    const response = await window.adminAPI.getProducts();
    console.log('📦 Products API response:', response);
    
    const products = Array.isArray(response?.products) ? response.products : [];
    console.log(`✅ Found ${products.length} products`);

    if (products.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No products found.</p>';
      return;
    }

    container.innerHTML = products
      .filter(product => product && product.id) // Filter invalid products
      .map(product => {
        const productName = escapeHtml(product.name || 'Unnamed Product');
        const sku = escapeHtml(product.sku || 'N/A');
        const species = product.species || 'both';
        const isActive = product.is_active !== undefined ? product.is_active : true;
        const price = parseFloat(product.price_per_pouch || 0);
        const priceStr = isNaN(price) ? '0.000' : price.toFixed(3);
        const pouchGrams = product.pouch_grams || 0;
        const timesOrdered = parseInt(product.times_ordered || 0) || 0;
        const totalSold = parseInt(product.total_quantity_sold || 0) || 0;
        const isSubscription = product.is_subscription || false;
        const subscriptionType = product.subscription_type || 'N/A';

        return `
          <div class="data-card">
            <div class="data-card-header">
              <div>
                <div class="data-card-title">${productName}</div>
                <div class="data-card-meta">SKU: ${sku} • ${species}</div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="status-badge ${isActive ? 'paid' : 'cancelled'}">${isActive ? 'Active' : 'Inactive'}</span>
                <button class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="showProductEditModal(${product.id})">Edit</button>
              </div>
            </div>
            <div class="data-card-body">
              <div class="data-item">
                <span class="data-label">Price</span>
                <span class="data-value">${priceStr} KD</span>
              </div>
              <div class="data-item">
                <span class="data-label">Pouch Size</span>
                <span class="data-value">${pouchGrams}g</span>
              </div>
              <div class="data-item">
                <span class="data-label">Times Ordered</span>
                <span class="data-value">${timesOrdered}</span>
              </div>
              <div class="data-item">
                <span class="data-label">Total Sold</span>
                <span class="data-value">${totalSold} pouches</span>
              </div>
              ${isSubscription ? `
                <div class="data-item">
                  <span class="data-label">Subscription Type</span>
                  <span class="data-value">${subscriptionType}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    if (container.innerHTML.trim() === '') {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No valid products found.</p>';
    }
  } catch (error) {
    console.error('❌ Error loading products:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      apiBaseUrl: window.API_BASE_URL || 'Not set',
      endpoint: '/admin/products'
    });
    
    let errorMessage = error.message || 'Unknown error';
    
    // Provide more helpful error messages
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      errorMessage = 'Cannot connect to backend server. Make sure the backend is running on http://localhost:8000';
    } else if (errorMessage.includes('Route not found') || errorMessage.includes('404')) {
      errorMessage = 'API endpoint not found. Check that the backend server is running and the route exists.';
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      errorMessage = 'Admin access required. You do not have permission to view products.';
    }
    
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #DC2626;">
        <p><strong>Error loading products</strong></p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--ink-700);">${escapeHtml(errorMessage)}</p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--ink-600);">
          API URL: ${window.API_BASE_URL || 'http://localhost:8000/api'}/admin/products
        </p>
        <button class="btn btn-primary" onclick="loadProducts()" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

async function loadOrders() {
  const container = document.getElementById('ordersContainer');
  if (!container) {
    console.error('Orders container not found');
    return;
  }
  
    container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">Loading orders...</p>';

  try {
    console.log('📦 Loading orders...');
    const params = {
      page: currentPage.orders,
      limit: 20
    };
    if (currentFilters.status) params.status = currentFilters.status;
    if (currentFilters.email) params.email = currentFilters.email;

    console.log('Request params:', params);
    const response = await window.adminAPI.getOrders(params);
    console.log('Orders response:', response);
    
    const { orders, pagination } = response;

    if (!orders || orders.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No orders found.</p>';
      document.getElementById('ordersPagination').innerHTML = '';
      return;
    }

    container.innerHTML = orders
      .filter(order => order && order.id) // Filter invalid orders
      .map(order => {
        let dateStr = 'Date unknown';
        try {
          if (order.created_at) {
            const date = new Date(order.created_at);
            if (!isNaN(date.getTime())) {
              dateStr = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }
          }
        } catch (e) {
          console.warn('Error formatting date:', e);
        }

        const orderId = order.id || 'N/A';
        const userName = escapeHtml(order.user_name || order.user_email || 'Guest');
        const status = order.status || 'unknown';
        const amount = parseFloat(order.total_amount || 0);
        const amountStr = isNaN(amount) ? '0.000' : amount.toFixed(3);
        const petInfo = order.pet_name && order.pet_type 
          ? `${escapeHtml(order.pet_name)} (${order.pet_type})` 
          : 'N/A';
        const email = escapeHtml(order.user_email || order.email || 'N/A');
        const phone = order.user_phone || order.phone || null;
        const userId = order.user_id || 'N/A';
        const paymentProvider = order.payment_provider || null;
        const paymentReference = order.payment_reference || null;
        const invoiceId = order.payment_invoice_id || null;
        const hasSubscription = order.has_subscription || (order.items && order.items.some(item => {
          try {
            const meta = item.meta && (typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta);
            return meta && meta.type === 'subscription';
          } catch (e) {
            return false;
          }
        }));
        const itemsCount = order.items_count || (order.items ? order.items.length : 0);
        let itemsPreview = 'No items';
        
        if (order.items && order.items.length > 0) {
          const previewItems = order.items.slice(0, 2).map(item => {
            // Try to get product name from various sources
            let itemName = item.product_name;
            
            // If no product_name, try to get from meta
            if (!itemName && item.meta) {
              try {
                const meta = typeof item.meta === 'object' ? item.meta : JSON.parse(item.meta);
                if (meta.product_name) {
                  itemName = meta.product_name;
                } else if (meta.type === 'subscription') {
                  const planLabels = {
                    weekly: 'Weekly Subscription',
                    monthly: 'Monthly Subscription',
                    quarterly: '3-Month Subscription'
                  };
                  itemName = `${planLabels[meta.plan_type] || meta.plan_type} - ${meta.pet_name || 'Pet'}`;
                }
              } catch (e) {
                // Meta parsing failed
              }
            }
            
            // Fallback names
            if (!itemName) {
              if (item.sku) {
                itemName = `Product (${item.sku})`;
              } else if (item.product_id) {
                itemName = `Product #${item.product_id}`;
              } else {
                itemName = 'Subscription Item';
              }
            }
            
            const itemQty = item.quantity || 1;
            return `${escapeHtml(itemName)} × ${itemQty}`;
          });
          
          itemsPreview = previewItems.join(', ');
          if (itemsCount > 2) {
            itemsPreview += ` +${itemsCount - 2} more`;
          }
        } else if (itemsCount > 0) {
          // Items exist but weren't loaded in preview
          itemsPreview = `${itemsCount} item${itemsCount !== 1 ? 's' : ''}`;
        }

        return `
          <div class="data-card">
            <div class="data-card-header" onclick="showOrderDetails(${orderId})" style="cursor: pointer;">
              <div style="flex: 1;">
                <div class="data-card-title">
                  Order #${orderId}
                  ${hasSubscription ? '<span style="background: #C9A36A; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;">SUBSCRIPTION</span>' : ''}
                </div>
                <div class="data-card-meta">
                  <a href="mailto:${email}" style="color: inherit; text-decoration: none;">${userName}</a> • ${dateStr}
                  ${userId !== 'N/A' ? ` • Customer ID: #${userId}` : ''}
                </div>
              </div>
              <span class="status-badge ${status}">${status}</span>
            </div>
            <div class="data-card-body">
              <div class="data-item">
                <span class="data-label">Total Amount</span>
                <span class="data-value" style="font-weight: 700; color: #C9A36A; font-size: 1.1rem;">${amountStr} KD</span>
              </div>
              <div class="data-item">
                <span class="data-label">Customer</span>
                <span class="data-value">
                  ${userName}
                  ${userId !== 'N/A' ? ` <span style="color: var(--ink-600); font-size: 0.85rem;">(#${userId})</span>` : ''}
                </span>
              </div>
              <div class="data-item">
                <span class="data-label">Email</span>
                <span class="data-value">
                  <a href="mailto:${email}" style="color: #C9A36A; text-decoration: none;">${email}</a>
                </span>
              </div>
              <div class="data-item">
                <span class="data-label">Phone</span>
                <span class="data-value">
                  ${phone ? `
                    <a href="tel:${escapeHtml(phone)}" style="color: #C9A36A; text-decoration: none;">${escapeHtml(phone)}</a>
                  ` : `
                    <span style="color: var(--ink-500); font-style: italic;">Not provided</span>
                  `}
                </span>
              </div>
              <div class="data-item">
                <span class="data-label">Pet</span>
                <span class="data-value">${petInfo}</span>
              </div>
              ${order.breed ? `
                <div class="data-item">
                  <span class="data-label">Breed</span>
                  <span class="data-value">${escapeHtml(order.breed)}</span>
                </div>
              ` : ''}
              ${order.weight_kg ? `
                <div class="data-item">
                  <span class="data-label">Pet Weight</span>
                  <span class="data-value">${order.weight_kg} kg</span>
                </div>
              ` : ''}
              <div class="data-item">
                <span class="data-label">Items</span>
                <span class="data-value" style="font-size: 0.9rem;">${itemsPreview}</span>
              </div>
              ${paymentProvider ? `
                <div class="data-item">
                  <span class="data-label">Payment Provider</span>
                  <span class="data-value">${escapeHtml(paymentProvider)}</span>
                </div>
              ` : ''}
              ${paymentReference ? `
                <div class="data-item">
                  <span class="data-label">Payment Reference</span>
                  <span class="data-value" style="font-family: monospace; font-size: 0.85rem;">${escapeHtml(paymentReference)}</span>
                </div>
              ` : ''}
              ${invoiceId ? `
                <div class="data-item">
                  <span class="data-label">Invoice ID</span>
                  <span class="data-value" style="font-family: monospace; font-size: 0.85rem;">${escapeHtml(invoiceId)}</span>
                </div>
              ` : ''}
              ${status === 'paid' ? `
                <div class="data-item" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E9DECE;">
                  <button class="btn btn-primary" onclick="event.stopPropagation(); markOrderAsFulfilled(${orderId})" style="width: 100%; background: #C9A36A; border: none; padding: 0.75rem; font-weight: 600;">
                    📦 Mark as Fulfilled
                  </button>
                </div>
              ` : ''}
              <div class="data-item" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #E9DECE;">
                <button class="btn btn-outline" onclick="event.stopPropagation(); showOrderDetails(${orderId})" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">
                  📋 View Full Details
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    if (container.innerHTML.trim() === '') {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No valid orders found.</p>';
    }

    // Render pagination
    renderPagination('orders', pagination);
  } catch (error) {
    console.error('❌ Error loading orders:', error);
    console.error('Error message:', error.message);
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #DC2626;">
        <p><strong>Error loading orders</strong></p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message || 'Please check the console for details'}</p>
        <button class="btn btn-primary" onclick="loadOrders()" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

async function loadUsers() {
  const container = document.getElementById('usersContainer');
  if (!container) {
    console.error('Users container not found');
    return;
  }
  
  container.innerHTML = '<p>Loading users...</p>';

  try {
    // Add small delay to prevent overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 150));
    
    console.log('👥 Loading users...');
    const response = await window.adminAPI.getUsers({
      page: currentPage.users,
      limit: 20
    });
    console.log('Users response:', response);
    
    const { users, pagination } = response;

    if (!users || users.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No users found.</p>';
      document.getElementById('usersPagination').innerHTML = '';
      return;
    }

    renderUsersList(users);

    // Render pagination
    renderPagination('users', pagination);
  } catch (error) {
    console.error('❌ Error loading users:', error);
    console.error('Error message:', error.message);
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #DC2626;">
        <p><strong>Error loading users</strong></p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message || 'Please check the console for details'}</p>
        <button class="btn btn-primary" onclick="loadUsers()" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

function renderPagination(type, pagination) {
  const container = document.getElementById(`${type}Pagination`);
  if (!container) {
    console.warn(`Pagination container for ${type} not found`);
    return;
  }

  if (!pagination || !pagination.pages || pagination.pages <= 1) {
    container.innerHTML = '';
    return;
  }

  const page = parseInt(pagination.page) || 1;
  const pages = parseInt(pagination.pages) || 1;

  container.innerHTML = `
    <button class="pagination-btn" ${page === 1 ? 'disabled' : ''} onclick="changePage('${type}', ${page - 1})">
      Previous
    </button>
    <span class="pagination-info">Page ${page} of ${pages}</span>
    <button class="pagination-btn" ${page === pages ? 'disabled' : ''} onclick="changePage('${type}', ${page + 1})">
      Next
    </button>
  `;
}

async function showOrderDetails(orderId) {
  const modal = document.getElementById('orderModal');
  const body = document.getElementById('orderModalBody');
  
  if (!modal || !body) {
    console.error('Order modal elements not found');
    return;
  }

  body.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading order details...</p>';
  modal.style.display = 'flex';
  modal.classList.add('active');

  try {
    const order = await window.adminAPI.getOrder(orderId);
    
    if (!order || !order.id) {
      body.innerHTML = '<p style="color: #DC2626; text-align: center; padding: 2rem;">Order not found</p>';
      return;
    }

    let dateStr = 'Date unknown';
    try {
      if (order.created_at) {
        const date = new Date(order.created_at);
        if (!isNaN(date.getTime())) {
          dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
    } catch (e) {
      console.warn('Error formatting date:', e);
    }

    body.innerHTML = `
      <div class="modal-section">
        <h3>Order Information</h3>
        <div class="modal-detail-grid">
          <div class="modal-detail-item">
            <span class="modal-detail-label">Order ID</span>
            <span class="modal-detail-value">#${order.id}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Status</span>
            <span class="modal-detail-value">
              <select class="status-select" id="orderStatusSelect" onchange="updateOrderStatus(${order.id}, this.value)">
                <option value="created" ${order.status === 'created' ? 'selected' : ''}>Created</option>
                <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                <option value="fulfilled" ${order.status === 'fulfilled' ? 'selected' : ''}>Fulfilled</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                <option value="failed" ${order.status === 'failed' ? 'selected' : ''}>Failed</option>
              </select>
            </span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Total Amount</span>
            <span class="modal-detail-value">${parseFloat(order.total_amount || 0).toFixed(3)} KD</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Date</span>
            <span class="modal-detail-value">${dateStr}</span>
          </div>
        </div>
      </div>

      <div class="modal-section">
        <h3>Customer Information</h3>
        <div class="modal-detail-grid">
          <div class="modal-detail-item">
            <span class="modal-detail-label">Customer ID</span>
            <span class="modal-detail-value">#${order.user_id || 'N/A'}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Name</span>
            <span class="modal-detail-value">${escapeHtml(order.user_name || 'N/A')}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Email</span>
            <span class="modal-detail-value">
              ${order.user_email || order.email ? `<a href="mailto:${escapeHtml(order.user_email || order.email)}">${escapeHtml(order.user_email || order.email)}</a>` : 'N/A'}
            </span>
          </div>
          ${order.phone ? `
            <div class="modal-detail-item">
              <span class="modal-detail-label">Phone</span>
              <span class="modal-detail-value">
                <a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a>
              </span>
            </div>
          ` : ''}
          ${order.user_role ? `
            <div class="modal-detail-item">
              <span class="modal-detail-label">Account Type</span>
              <span class="modal-detail-value">${order.user_role === 'admin' ? 'Admin' : 'Customer'}</span>
            </div>
          ` : ''}
          ${order.payment_provider ? `
            <div class="modal-detail-item">
              <span class="modal-detail-label">Payment Provider</span>
              <span class="modal-detail-value">${escapeHtml(order.payment_provider)}</span>
            </div>
          ` : ''}
          ${order.payment_reference ? `
            <div class="modal-detail-item">
              <span class="modal-detail-label">Payment Reference</span>
              <span class="modal-detail-value">${escapeHtml(order.payment_reference)}</span>
            </div>
          ` : ''}
          ${order.payment_invoice_id ? `
            <div class="modal-detail-item">
              <span class="modal-detail-label">Invoice ID</span>
              <span class="modal-detail-value">${escapeHtml(order.payment_invoice_id)}</span>
            </div>
          ` : ''}
        </div>
      </div>

      ${order.pet_name ? `
        <div class="modal-section">
          <h3>Pet Information</h3>
          <div class="modal-detail-grid">
            <div class="modal-detail-item">
              <span class="modal-detail-label">Name</span>
              <span class="modal-detail-value">${escapeHtml(order.pet_name)}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Type</span>
              <span class="modal-detail-value">${order.pet_type}</span>
            </div>
            ${order.breed ? `
              <div class="modal-detail-item">
                <span class="modal-detail-label">Breed</span>
                <span class="modal-detail-value">${escapeHtml(order.breed)}</span>
              </div>
            ` : ''}
            ${order.weight_kg ? `
              <div class="modal-detail-item">
                <span class="modal-detail-label">Weight</span>
                <span class="modal-detail-value">${order.weight_kg} kg</span>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <div class="modal-section">
        <h3>Order Items (${order.items ? order.items.length : 0})</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${order.items && order.items.length > 0 ? order.items.map(item => {
            const meta = item.meta && (typeof item.meta === 'object' ? item.meta : typeof item.meta === 'string' ? JSON.parse(item.meta) : null);
            const isSubscription = meta && meta.type === 'subscription';
            const itemTotal = (parseFloat(item.unit_price || 0) * item.quantity).toFixed(3);
            
            return `
            <div style="padding: 1.25rem; background: #FAF8F5; border-radius: 12px; border: 1px solid #E9DECE;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <strong style="font-size: 1.1rem;">${escapeHtml(item.product_name || 'Subscription')}</strong>
                    ${isSubscription ? '<span style="background: #C9A36A; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">SUBSCRIPTION</span>' : ''}
                  </div>
                  <div style="font-size: 0.9rem; color: var(--ink-700); line-height: 1.6;">
                    <div><strong>SKU:</strong> ${escapeHtml(item.sku || 'N/A')}</div>
                    <div><strong>Quantity:</strong> ${item.quantity}</div>
                    <div><strong>Unit Price:</strong> ${parseFloat(item.unit_price || 0).toFixed(3)} KD</div>
                    <div><strong>Total:</strong> <span style="font-weight: 700; color: #C9A36A;">${itemTotal} KD</span></div>
                    ${item.description ? `<div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #E9DECE;"><strong>Description:</strong> ${escapeHtml(item.description)}</div>` : ''}
                  </div>
                </div>
                <div style="font-size: 1.25rem; font-weight: 700; color: #C9A36A;">
                  ${itemTotal} KD
                </div>
              </div>
              ${isSubscription && meta ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E9DECE; background: #F5F0E8; padding: 1rem; border-radius: 8px;">
                  <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #C9A36A;">📋 Subscription Details</h4>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.9rem;">
                    ${meta.plan_type ? `<div><strong>Plan Type:</strong> ${escapeHtml(meta.plan_type.charAt(0).toUpperCase() + meta.plan_type.slice(1))}</div>` : ''}
                    ${meta.daily_grams ? `<div><strong>Daily Grams:</strong> ${meta.daily_grams}g</div>` : ''}
                    ${meta.pouches_per_day ? `<div><strong>Pouches/Day:</strong> ${meta.pouches_per_day}</div>` : ''}
                    ${meta.total_pouches ? `<div><strong>Total Pouches:</strong> ${meta.total_pouches}</div>` : ''}
                    ${meta.plan_period ? `<div><strong>Plan Period:</strong> ${escapeHtml(meta.plan_period)}</div>` : ''}
                    ${meta.start_date ? `<div><strong>Start Date:</strong> ${new Date(meta.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>` : ''}
                    ${meta.pet_name ? `<div><strong>Pet:</strong> ${escapeHtml(meta.pet_name)}</div>` : ''}
                    ${meta.pet_type ? `<div><strong>Pet Type:</strong> ${escapeHtml(meta.pet_type)}</div>` : ''}
                    ${meta.weight ? `<div><strong>Pet Weight:</strong> ${meta.weight} kg</div>` : ''}
                    ${meta.age ? `<div><strong>Pet Age:</strong> ${escapeHtml(meta.age)}</div>` : ''}
                    ${meta.activity ? `<div><strong>Activity Level:</strong> ${escapeHtml(meta.activity)}</div>` : ''}
                    ${meta.goal ? `<div><strong>Goal:</strong> ${escapeHtml(meta.goal)}</div>` : ''}
                  </div>
                </div>
              ` : ''}
            </div>
          `;
          }).join('') : '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">No items found.</p>'}
        </div>
      </div>

      ${order.status === 'paid' ? `
        <div class="modal-section">
          <h3>Actions</h3>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="markOrderAsFulfilled(${order.id})" style="background: #C9A36A; border: none; padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: 600;">
              📦 Mark as Fulfilled
            </button>
            <button class="btn btn-outline" onclick="updateOrderStatus(${order.id}, 'cancelled')" style="background: #DC2626; color: white; border: none;">
              Cancel Order
            </button>
          </div>
          <p style="margin-top: 0.75rem; font-size: 0.9rem; color: var(--ink-700);">
            Mark this order as fulfilled when it has been processed and delivered.
          </p>
        </div>
      ` : order.status === 'fulfilled' ? `
        <div class="modal-section">
          <div style="padding: 1rem; background: #F0FDF4; border-radius: 8px; border: 1px solid #86EFAC;">
            <p style="color: #166534; font-weight: 600; margin: 0;">✅ Order Fulfilled</p>
            <p style="color: #166534; font-size: 0.9rem; margin: 0.5rem 0 0 0;">This order has been processed and delivered.</p>
          </div>
        </div>
      ` : ''}
    `;
  } catch (error) {
    console.error('❌ Error loading order details:', error);
    body.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: #DC2626; margin-bottom: 1rem;">Error loading order details</p>
        <p style="color: var(--ink-700); margin-bottom: 1.5rem;">${escapeHtml(error.message || 'Please try again')}</p>
        <button class="btn btn-primary" onclick="showOrderDetails(${orderId})">Retry</button>
      </div>
    `;
  }
}

async function showUserDetails(userId) {
  const modal = document.getElementById('userModal');
  const body = document.getElementById('userModalBody');
  
  if (!modal || !body) {
    console.error('User modal elements not found');
    return;
  }

  body.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading user details...</p>';
  modal.style.display = 'flex';
  modal.classList.add('active');

  try {
    const user = await window.adminAPI.getUser(userId);
    
    if (!user || !user.id) {
      body.innerHTML = '<p style="color: #DC2626; text-align: center; padding: 2rem;">User not found</p>';
      return;
    }

    let dateStr = 'Date unknown';
    try {
      if (user.created_at) {
        const date = new Date(user.created_at);
        if (!isNaN(date.getTime())) {
          dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      }
    } catch (e) {
      console.warn('Error formatting date:', e);
    }

    const pets = Array.isArray(user.pets) ? user.pets : [];
    const orders = Array.isArray(user.orders) ? user.orders : [];
    const totalSpent = orders
      .filter(o => o && (o.status === 'paid' || o.status === 'fulfilled'))
      .reduce((sum, o) => {
        const amount = parseFloat(o.total_amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    body.innerHTML = `
      <div class="modal-section">
        <h3>Customer Information</h3>
        <div class="modal-detail-grid">
          <div class="modal-detail-item">
            <span class="modal-detail-label">Customer ID</span>
            <span class="modal-detail-value">#${user.id || 'N/A'}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Name</span>
            <span class="modal-detail-value">${escapeHtml(user.name || 'No name')}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Email</span>
            <span class="modal-detail-value">
              ${user.email ? `<a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a>` : 'N/A'}
            </span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Role</span>
            <span class="modal-detail-value">
              <span class="status-badge ${user.role === 'admin' ? 'paid' : 'created'}">${user.role === 'admin' ? 'Admin' : 'Customer'}</span>
            </span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Member Since</span>
            <span class="modal-detail-value">${dateStr}</span>
          </div>
          ${user.updated_at ? `
            <div class="modal-detail-item">
              <span class="modal-detail-label">Last Updated</span>
              <span class="modal-detail-value">${new Date(user.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="modal-section">
        <h3>Account Statistics</h3>
        <div class="modal-detail-grid">
          <div class="modal-detail-item">
            <span class="modal-detail-label">Total Pets</span>
            <span class="modal-detail-value">${pets.length}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Total Orders</span>
            <span class="modal-detail-value">${orders.length}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Total Spent</span>
            <span class="modal-detail-value" style="font-weight: 700; color: #C9A36A;">${totalSpent.toFixed(3)} KD</span>
          </div>
          ${user.last_order_date ? `
            <div class="modal-detail-item">
              <span class="modal-detail-label">Last Order</span>
              <span class="modal-detail-value">${new Date(user.last_order_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="modal-section">
        <h3>Pets (${pets.length})</h3>
        ${pets.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${pets
              .filter(pet => pet && pet.name)
              .map(pet => {
                const petCreatedAt = pet.created_at ? new Date(pet.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'Unknown';
                return `
                <div style="padding: 1rem; background: #FAF8F5; border-radius: 12px; border: 1px solid #E9DECE;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <div style="flex: 1;">
                      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <strong style="font-size: 1.1rem;">${escapeHtml(pet.name || 'Unnamed')}</strong>
                        <span style="background: #C9A36A; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">Pet ID: #${pet.id}</span>
                      </div>
                      <div style="font-size: 0.9rem; color: var(--ink-700); line-height: 1.6;">
                        <div><strong>Type:</strong> ${pet.type ? pet.type.charAt(0).toUpperCase() + pet.type.slice(1) : 'N/A'}</div>
                        ${pet.breed ? `<div><strong>Breed:</strong> ${escapeHtml(pet.breed)}</div>` : ''}
                        ${pet.weight_kg ? `<div><strong>Weight:</strong> ${pet.weight_kg} kg</div>` : ''}
                        ${pet.age_group ? `<div><strong>Age Group:</strong> ${escapeHtml(pet.age_group)}</div>` : ''}
                        ${pet.activity_level ? `<div><strong>Activity Level:</strong> ${escapeHtml(pet.activity_level)}</div>` : ''}
                        ${pet.goal ? `<div><strong>Goal:</strong> ${escapeHtml(pet.goal)}</div>` : ''}
                        ${pet.notes ? `<div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #E9DECE;"><strong>Notes:</strong> ${escapeHtml(pet.notes)}</div>` : ''}
                        <div style="margin-top: 0.5rem; color: var(--ink-600); font-size: 0.85rem;">Added: ${petCreatedAt}</div>
                      </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                      <button class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="showPetEditModal(${pet.id}, ${userId})">Edit</button>
                      <button class="btn" style="padding: 0.5rem 1rem; font-size: 0.85rem; background: #DC2626; color: white;" onclick="deletePet(${pet.id}, ${userId})">Delete</button>
                    </div>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        ` : '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">No pets registered.</p>'}
      </div>

      <div class="modal-section">
        <h3>Orders (${orders.length})</h3>
        ${orders.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${orders
              .filter(order => order && order.id)
              .map(order => {
                const orderAmount = parseFloat(order.total_amount || 0);
                const amountStr = isNaN(orderAmount) ? '0.000' : orderAmount.toFixed(3);
                const orderStatus = order.status || 'unknown';
                const petName = order.pet_name ? `For ${escapeHtml(order.pet_name)}` : 'No pet';
                const petType = order.pet_type ? ` (${order.pet_type})` : '';
                const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'Unknown';
                return `
                  <div style="padding: 1rem; background: #FAF8F5; border-radius: 12px; border: 1px solid #E9DECE; cursor: pointer;" onclick="showOrderDetails(${order.id})">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                      <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                          <strong style="font-size: 1.1rem;">Order #${order.id}</strong>
                          <span class="status-badge ${orderStatus}">${orderStatus}</span>
                        </div>
                        <div style="font-size: 0.9rem; color: var(--ink-700); line-height: 1.6;">
                          <div><strong>Pet:</strong> ${petName}${petType}</div>
                          ${order.breed ? `<div><strong>Breed:</strong> ${escapeHtml(order.breed)}</div>` : ''}
                          <div><strong>Amount:</strong> <span style="font-weight: 700; color: #C9A36A;">${amountStr} KD</span></div>
                          <div><strong>Date:</strong> ${orderDate}</div>
                          ${order.payment_provider ? `<div><strong>Payment:</strong> ${escapeHtml(order.payment_provider)}</div>` : ''}
                          ${order.payment_reference ? `<div><strong>Reference:</strong> ${escapeHtml(order.payment_reference)}</div>` : ''}
                        </div>
                      </div>
                      <button class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="event.stopPropagation(); showOrderDetails(${order.id})">View Details</button>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        ` : '<p style="text-align: center; padding: 1rem; color: var(--ink-700);">No orders yet.</p>'}
      </div>
    `;
  } catch (error) {
    console.error('❌ Error loading user details:', error);
    body.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: #DC2626; margin-bottom: 1rem;">Error loading user details</p>
        <p style="color: var(--ink-700); margin-bottom: 1.5rem;">${escapeHtml(error.message || 'Please try again')}</p>
        <button class="btn btn-primary" onclick="showUserDetails(${userId})">Retry</button>
      </div>
    `;
  }
}

async function markOrderAsFulfilled(orderId) {
  if (!confirm('Mark this order as fulfilled? This indicates the order has been processed and delivered.')) {
    return;
  }

  try {
    console.log(`Marking order ${orderId} as fulfilled`);
    
    await window.adminAPI.updateOrderStatus(orderId, 'fulfilled');
    
    // Show success notification
    showNotification(`✅ Order #${orderId} marked as fulfilled`);
    
    // Reload orders list if on orders tab
    const ordersTab = document.getElementById('ordersTab');
    if (ordersTab && ordersTab.classList.contains('active')) {
      await loadOrders();
    }
    
    // Reload recent orders in overview
    await loadRecentOrders();
    
    // Reload stats
    await loadStats();
    
    // Reload the order details to show updated status
    await showOrderDetails(orderId);
    
  } catch (error) {
    console.error('❌ Error marking order as fulfilled:', error);
    alert('Error marking order as fulfilled: ' + (error.message || 'Unknown error'));
  }
}

async function updateOrderStatus(orderId, newStatus) {
  // If newStatus is not provided, try to get it from the select element
  if (!newStatus) {
    const select = document.getElementById('orderStatusSelect');
    if (select) {
      newStatus = select.value;
    }
  }
  
  if (!newStatus) {
    console.warn('No status provided');
    alert('Please select a valid status');
    return;
  }

  if (!orderId) {
    console.error('Order ID is required');
    alert('Order ID is missing');
    return;
  }

  // Confirm the change
  if (!confirm(`Are you sure you want to change the order status to "${newStatus}"?`)) {
    // Reset the select to the original value
    const select = document.getElementById('orderStatusSelect');
    if (select) {
      // We need to reload the order to get the original status
      showOrderDetails(orderId);
    }
    return;
  }

  try {
    console.log(`Updating order ${orderId} status to ${newStatus}`);
    
    // Show loading state
    const select = document.getElementById('orderStatusSelect');
    if (select) {
      select.disabled = true;
    }
    
    await window.adminAPI.updateOrderStatus(orderId, newStatus);
    
    // Show success notification
    showNotification(`Order #${orderId} status updated to ${newStatus}`);
    
    // Reload orders list if on orders tab
    const ordersTab = document.getElementById('ordersTab');
    if (ordersTab && ordersTab.classList.contains('active')) {
      await loadOrders();
    }
    
    // Reload recent orders in overview
    await loadRecentOrders();
    
    // Reload stats
    await loadStats();
    
    // Reload the order details to show updated status
    await showOrderDetails(orderId);
    
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    alert('Error updating order status: ' + (error.message || 'Unknown error'));
    
    // Reload order details to reset select to original value
    await showOrderDetails(orderId);
  }
}

function changePage(type, page) {
  if (!type || !page || page < 1) {
    console.warn('Invalid page change parameters:', { type, page });
    return;
  }
  
  currentPage[type] = page;
  if (type === 'orders') {
    loadOrders();
  } else if (type === 'users') {
    loadUsers();
  } else if (type === 'subscriptions') {
    loadSubscriptions();
  } else if (type === 'mealPlans') {
    loadMealPlans();
  } else {
    console.warn('Unknown page type:', type);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'success') {
  // Remove existing notifications
  document.querySelectorAll('.notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  
  // Determine icon based on type
  let icon = '✓';
  if (type === 'error') icon = '✕';
  else if (type === 'warning') icon = '⚠';
  else if (type === 'info') icon = 'ℹ';
  
  notification.innerHTML = `
    <span style="font-size: 1.25rem; line-height: 1;">${icon}</span>
    <span>${escapeHtml(message)}</span>
  `;
  
  document.body.appendChild(notification);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Add slideOutRight animation
if (!document.getElementById('admin-animations')) {
  const style = document.createElement('style');
  style.id = 'admin-animations';
  style.textContent = `
    @keyframes slideOutRight {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
  `;
  document.head.appendChild(style);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Product editing functions
async function showProductEditModal(productId) {
  const modal = document.getElementById('productEditModal');
  const body = document.getElementById('productEditModalBody');
  
  if (!modal || !body) {
    console.error('Product edit modal elements not found');
    return;
  }

  body.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading product...</p>';
  modal.style.display = 'flex';
  modal.classList.add('active');

  try {
    const products = await window.adminAPI.getProducts();
    const product = products.products?.find(p => p.id === productId);
    
    if (!product) {
      body.innerHTML = '<p style="color: #DC2626; text-align: center; padding: 2rem;">Product not found</p>';
      return;
    }

    body.innerHTML = `
      <form id="productEditForm" onsubmit="event.preventDefault(); window.saveProduct(${product.id}); return false;">
        <div class="modal-section">
          <div style="display: grid; gap: 1rem;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Product Name</label>
              <input type="text" id="productName" value="${escapeHtml(product.name || '')}" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">SKU</label>
              <input type="text" value="${escapeHtml(product.sku || '')}" disabled style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem; background: #f5f5f5;">
              <small style="color: var(--ink-600);">SKU cannot be changed</small>
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Description</label>
              <textarea id="productDescription" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem; font-family: inherit;">${escapeHtml(product.description || '')}</textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Price per Pouch (KD)</label>
                <input type="number" id="productPrice" step="0.001" min="0" value="${product.price_per_pouch || 0}" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Pouch Size (grams)</label>
                <input type="number" id="productPouchGrams" min="1" value="${product.pouch_grams || 150}" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Species</label>
                <select id="productSpecies" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                  <option value="both" ${product.species === 'both' ? 'selected' : ''}>Both</option>
                  <option value="dog" ${product.species === 'dog' ? 'selected' : ''}>Dog</option>
                  <option value="cat" ${product.species === 'cat' ? 'selected' : ''}>Cat</option>
                </select>
              </div>
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Status</label>
                <select id="productIsActive" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                  <option value="1" ${product.is_active !== undefined && product.is_active !== 0 ? 'selected' : ''}>Active</option>
                  <option value="0" ${product.is_active === 0 || product.is_active === false ? 'selected' : ''}>Inactive</option>
                </select>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Is Subscription</label>
                <select id="productIsSubscription" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                  <option value="0" ${!product.is_subscription ? 'selected' : ''}>No (Regular Product)</option>
                  <option value="1" ${product.is_subscription ? 'selected' : ''}>Yes (Subscription Product)</option>
                </select>
              </div>
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Subscription Type</label>
                <select id="productSubscriptionType" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;" ${!product.is_subscription ? 'disabled' : ''}>
                  <option value="">N/A (Not a subscription)</option>
                  <option value="weekly" ${product.subscription_type === 'weekly' ? 'selected' : ''}>Weekly</option>
                  <option value="monthly" ${product.subscription_type === 'monthly' ? 'selected' : ''}>Monthly</option>
                  <option value="quarterly" ${product.subscription_type === 'quarterly' ? 'selected' : ''}>Quarterly</option>
                </select>
              </div>
            </div>
            <script>
              // Enable/disable subscription type based on is_subscription
              document.getElementById('productIsSubscription')?.addEventListener('change', function() {
                const subscriptionTypeEl = document.getElementById('productSubscriptionType');
                if (subscriptionTypeEl) {
                  subscriptionTypeEl.disabled = this.value === '0';
                  if (this.value === '0') {
                    subscriptionTypeEl.value = '';
                  }
                }
              });
            </script>
          </div>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #E9DECE;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('productEditModal').style.display='none'">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;
  } catch (error) {
    console.error('❌ Error loading product:', error);
    body.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: #DC2626; margin-bottom: 1rem;">Error loading product</p>
        <p style="color: var(--ink-700); margin-bottom: 1.5rem;">${escapeHtml(error.message || 'Please try again')}</p>
        <button class="btn btn-primary" onclick="showProductEditModal(${productId})">Retry</button>
      </div>
    `;
  }
}

async function saveProduct(productId) {
  console.log('💾 Saving product:', productId);
  const form = document.getElementById('productEditForm');
  if (!form) {
    console.error('❌ Product edit form not found');
    alert('Form not found. Please refresh the page.');
    return;
  }

  // Get form values
  const nameEl = document.getElementById('productName');
  const descriptionEl = document.getElementById('productDescription');
  const priceEl = document.getElementById('productPrice');
  const pouchGramsEl = document.getElementById('productPouchGrams');
  const speciesEl = document.getElementById('productSpecies');
  const isActiveEl = document.getElementById('productIsActive');
  const isSubscriptionEl = document.getElementById('productIsSubscription');
  const subscriptionTypeEl = document.getElementById('productSubscriptionType');

  if (!nameEl || !priceEl || !pouchGramsEl || !speciesEl || !isActiveEl) {
    console.error('❌ Form fields not found:', { nameEl, priceEl, pouchGramsEl, speciesEl, isActiveEl });
    alert('Form fields not found. Please refresh the page.');
    return;
  }

  const productData = {
    name: nameEl.value.trim(),
    description: descriptionEl ? descriptionEl.value.trim() : '',
    price_per_pouch: parseFloat(priceEl.value),
    pouch_grams: parseInt(pouchGramsEl.value),
    species: speciesEl.value,
    is_active: isActiveEl.value === '1'
  };

  // Add subscription fields if available
  if (isSubscriptionEl) {
    productData.is_subscription = isSubscriptionEl.value === '1';
  }
  if (subscriptionTypeEl && !subscriptionTypeEl.disabled && subscriptionTypeEl.value) {
    productData.subscription_type = subscriptionTypeEl.value;
  }

  console.log('📦 Product data to save:', productData);

  // Validate
  if (!productData.name || productData.name.length === 0) {
    alert('Product name is required');
    return;
  }
  if (isNaN(productData.price_per_pouch) || productData.price_per_pouch < 0) {
    alert('Valid price is required');
    return;
  }
  if (isNaN(productData.pouch_grams) || productData.pouch_grams < 1) {
    alert('Valid pouch size (grams) is required');
    return;
  }

  try {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    console.log('📡 Calling updateProduct API...');
    const result = await window.adminAPI.updateProduct(productId, productData);
    console.log('✅ Product update response:', result);
    
    showNotification('Product updated successfully');
    document.getElementById('productEditModal').style.display = 'none';
    await loadProducts();
  } catch (error) {
    console.error('❌ Error updating product:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      stack: error.stack
    });
    
    const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
    alert('Error updating product: ' + errorMsg);
    
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
    }
  }
}

// Pet editing functions
async function showPetEditModal(petId, userId) {
  const modal = document.getElementById('petEditModal');
  const body = document.getElementById('petEditModalBody');
  
  if (!modal || !body) {
    console.error('Pet edit modal elements not found');
    return;
  }

  body.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading pet...</p>';
  modal.style.display = 'flex';
  modal.classList.add('active');

  try {
    const user = await window.adminAPI.getUser(userId);
    const pet = user.pets?.find(p => p.id === petId);
    
    if (!pet) {
      body.innerHTML = '<p style="color: #DC2626; text-align: center; padding: 2rem;">Pet not found</p>';
      return;
    }

    body.innerHTML = `
      <form id="petEditForm" onsubmit="savePet(${pet.id}, ${userId}); return false;">
        <div class="modal-section">
          <div style="display: grid; gap: 1rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Pet Name</label>
                <input type="text" id="petName" value="${escapeHtml(pet.name || '')}" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Type</label>
                <select id="petType" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                  <option value="dog" ${pet.type === 'dog' ? 'selected' : ''}>Dog</option>
                  <option value="cat" ${pet.type === 'cat' ? 'selected' : ''}>Cat</option>
                </select>
              </div>
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Breed</label>
              <input type="text" id="petBreed" value="${escapeHtml(pet.breed || '')}" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Weight (kg)</label>
                <input type="number" id="petWeight" step="0.1" min="0" value="${pet.weight_kg || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Age Group</label>
                <select id="petAgeGroup" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                  <option value="">Not specified</option>
                  <option value="puppy" ${pet.age_group === 'puppy' ? 'selected' : ''}>Puppy</option>
                  <option value="kitten" ${pet.age_group === 'kitten' ? 'selected' : ''}>Kitten</option>
                  <option value="adult" ${pet.age_group === 'adult' ? 'selected' : ''}>Adult</option>
                  <option value="senior" ${pet.age_group === 'senior' ? 'selected' : ''}>Senior</option>
                </select>
              </div>
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Activity Level</label>
                <select id="petActivityLevel" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                  <option value="">Not specified</option>
                  <option value="low" ${pet.activity_level === 'low' ? 'selected' : ''}>Low</option>
                  <option value="normal" ${pet.activity_level === 'normal' ? 'selected' : ''}>Normal</option>
                  <option value="high" ${pet.activity_level === 'high' ? 'selected' : ''}>High</option>
                </select>
              </div>
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Goal</label>
              <select id="petGoal" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                <option value="">Not specified</option>
                <option value="maintain" ${pet.goal === 'maintain' ? 'selected' : ''}>Maintain Weight</option>
                <option value="lose_weight" ${pet.goal === 'lose_weight' ? 'selected' : ''}>Lose Weight</option>
                <option value="gain_weight" ${pet.goal === 'gain_weight' ? 'selected' : ''}>Gain Weight</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Notes</label>
              <textarea id="petNotes" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem; font-family: inherit;">${escapeHtml(pet.notes || '')}</textarea>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #E9DECE;">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('petEditModal').style.display='none'">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;
  } catch (error) {
    console.error('❌ Error loading pet:', error);
    body.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: #DC2626; margin-bottom: 1rem;">Error loading pet</p>
        <p style="color: var(--ink-700); margin-bottom: 1.5rem;">${escapeHtml(error.message || 'Please try again')}</p>
        <button class="btn btn-primary" onclick="showPetEditModal(${petId}, ${userId})">Retry</button>
      </div>
    `;
  }
}

async function savePet(petId, userId) {
  const form = document.getElementById('petEditForm');
  if (!form) return;

  const petData = {
    name: document.getElementById('petName').value.trim(),
    type: document.getElementById('petType').value,
    breed: document.getElementById('petBreed').value.trim() || null,
    weight_kg: document.getElementById('petWeight').value ? parseFloat(document.getElementById('petWeight').value) : null,
    age_group: document.getElementById('petAgeGroup').value || null,
    activity_level: document.getElementById('petActivityLevel').value || null,
    goal: document.getElementById('petGoal').value || null,
    notes: document.getElementById('petNotes').value.trim() || null
  };

  try {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    await window.adminAPI.updatePet(petId, petData);
    
    showNotification('Pet updated successfully');
    document.getElementById('petEditModal').style.display = 'none';
    await showUserDetails(userId);
  } catch (error) {
    console.error('❌ Error updating pet:', error);
    alert('Error updating pet: ' + (error.message || 'Unknown error'));
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Changes';
  }
}

async function deletePet(petId, userId) {
  if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
    return;
  }

  try {
    await window.adminAPI.deletePet(petId);
    showNotification('Pet deleted successfully');
    await showUserDetails(userId);
  } catch (error) {
    console.error('❌ Error deleting pet:', error);
    alert('Error deleting pet: ' + (error.message || 'Unknown error'));
  }
}

// Subscriptions management
async function loadSubscriptions() {
  const container = document.getElementById('subscriptionsContainer');
  if (!container) {
    console.error('Subscriptions container not found');
    return;
  }
  
  container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">Loading subscriptions...</p>';

  try {
    // Add small delay to prevent overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 150));
    
    console.log('📋 Loading subscriptions...');
    const params = {
      page: currentPage.subscriptions,
      limit: 20
    };
    if (currentFilters.subscriptionStatus) {
      params.status = currentFilters.subscriptionStatus;
    }

    const response = await window.adminAPI.getSubscriptions(params);
    console.log('📋 Subscriptions response:', response);
    
    const { subscriptions, pagination } = response;

    if (!subscriptions || subscriptions.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No subscriptions found.</p>';
      document.getElementById('subscriptionsPagination').innerHTML = '';
      return;
    }

    container.innerHTML = subscriptions
      .filter(sub => sub && sub.id)
      .map(sub => {
        const daysRemaining = sub.days_remaining || 0;
        const isExpired = sub.is_expired === 1;
        const isExpiringSoon = sub.is_expiring_soon === 1;
        
        let statusBadge = 'active';
        let statusText = 'Active';
        if (sub.status === 'pending') {
          statusBadge = 'created';
          statusText = 'Pending';
        } else if (sub.status === 'confirmed') {
          statusBadge = 'active';
          statusText = 'Confirmed';
        } else if (isExpired) {
          statusBadge = 'cancelled';
          statusText = 'Expired';
        } else if (isExpiringSoon) {
          statusBadge = 'created';
          statusText = 'Expiring Soon';
        } else if (sub.status === 'cancelled') {
          statusBadge = 'cancelled';
          statusText = 'Cancelled';
        } else if (sub.status === 'paused') {
          statusBadge = 'created';
          statusText = 'Paused';
        }

        const startDate = new Date(sub.start_date);
        const endDate = new Date(sub.end_date);
        const startDateStr = startDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        const endDateStr = endDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        const planLabels = {
          weekly: 'Weekly',
          monthly: 'Monthly',
          quarterly: '3-Month'
        };

        return `
          <div class="data-card" onclick="showSubscriptionDetails(${sub.id})">
            <div class="data-card-header">
              <div>
                <div class="data-card-title">${escapeHtml(sub.pet_name || 'No Pet')} - ${planLabels[sub.plan_type] || sub.plan_type}</div>
                <div class="data-card-meta">${escapeHtml(sub.user_name || sub.user_email || 'Unknown User')} • ${startDateStr} - ${endDateStr}</div>
              </div>
              <span class="status-badge ${statusBadge}">${statusText}</span>
            </div>
            <div class="data-card-body">
              <div class="data-item">
                <span class="data-label">Days Remaining</span>
                <span class="data-value" style="color: ${isExpired ? '#DC2626' : isExpiringSoon ? '#F59E0B' : '#1B8A5A'}; font-weight: 700;">
                  ${isExpired ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days`}
                </span>
              </div>
              <div class="data-item">
                <span class="data-label">Price</span>
                <span class="data-value">${parseFloat(sub.price_per_period || 0).toFixed(3)} KD</span>
              </div>
              <div class="data-item">
                <span class="data-label">Daily Amount</span>
                <span class="data-value">${sub.daily_grams || 'N/A'}g (${sub.pouches_per_day || 'N/A'} pouches/day)</span>
              </div>
              ${sub.auto_renew ? `
                <div class="data-item">
                  <span class="data-label">Auto Renew</span>
                  <span class="data-value">✅ Enabled</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    if (container.innerHTML.trim() === '') {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No valid subscriptions found.</p>';
    }

    // Render pagination
    renderPagination('subscriptions', pagination);
  } catch (error) {
    console.error('❌ Error loading subscriptions:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #DC2626;">
        <p><strong>Error loading subscriptions</strong></p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message || 'Please check the console for details'}</p>
        <button class="btn btn-primary" onclick="loadSubscriptions()" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

async function showSubscriptionDetails(subscriptionId) {
  const modal = document.getElementById('subscriptionModal');
  const body = document.getElementById('subscriptionModalBody');
  
  if (!modal || !body) {
    console.error('Subscription modal elements not found');
    return;
  }

  body.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading subscription details...</p>';
  modal.style.display = 'flex';
  modal.classList.add('active');

  try {
    const subscription = await window.adminAPI.getSubscription(subscriptionId);
    
    if (!subscription || !subscription.id) {
      body.innerHTML = '<p style="color: #DC2626; text-align: center; padding: 2rem;">Subscription not found</p>';
      return;
    }

    const daysRemaining = subscription.days_remaining || 0;
    const isExpired = subscription.is_expired === 1;
    const isExpiringSoon = subscription.is_expiring_soon === 1;
    
    const startDate = new Date(subscription.start_date);
    const endDate = new Date(subscription.end_date);
    const startDateStr = startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const endDateStr = endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const planLabels = {
      weekly: 'Weekly Subscription',
      monthly: 'Monthly Subscription',
      quarterly: '3-Month Subscription'
    };

    body.innerHTML = `
      <div class="modal-section">
        <h3>Subscription Information</h3>
        <div class="modal-detail-grid">
          <div class="modal-detail-item">
            <span class="modal-detail-label">Subscription ID</span>
            <span class="modal-detail-value">#${subscription.id}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Status</span>
            <span class="modal-detail-value">
              <select class="status-select" id="subscriptionStatusSelect" onchange="updateSubscriptionStatus(${subscription.id})">
                <option value="active" ${subscription.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="expiring_soon" ${subscription.status === 'expiring_soon' ? 'selected' : ''}>Expiring Soon</option>
                <option value="expired" ${subscription.status === 'expired' ? 'selected' : ''}>Expired</option>
                <option value="paused" ${subscription.status === 'paused' ? 'selected' : ''}>Paused</option>
                <option value="cancelled" ${subscription.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Plan Type</span>
            <span class="modal-detail-value">${planLabels[subscription.plan_type] || subscription.plan_type}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Days Remaining</span>
            <span class="modal-detail-value" style="color: ${isExpired ? '#DC2626' : isExpiringSoon ? '#F59E0B' : '#1B8A5A'}; font-weight: 700;">
              ${isExpired ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days`}
            </span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Start Date</span>
            <span class="modal-detail-value">${startDateStr}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">End Date</span>
            <span class="modal-detail-value">${endDateStr}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Price per Period</span>
            <span class="modal-detail-value">${parseFloat(subscription.price_per_period || 0).toFixed(3)} KD</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Auto Renew</span>
            <span class="modal-detail-value">
              <select id="subscriptionAutoRenewSelect" onchange="updateSubscriptionAutoRenew(${subscription.id})">
                <option value="0" ${!subscription.auto_renew ? 'selected' : ''}>Disabled</option>
                <option value="1" ${subscription.auto_renew ? 'selected' : ''}>Enabled</option>
              </select>
            </span>
          </div>
        </div>
      </div>

      <div class="modal-section">
        <h3>Customer Information</h3>
        <div class="modal-detail-grid">
          <div class="modal-detail-item">
            <span class="modal-detail-label">Name</span>
            <span class="modal-detail-value">${escapeHtml(subscription.user_name || 'N/A')}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">Email</span>
            <span class="modal-detail-value">${escapeHtml(subscription.user_email || 'N/A')}</span>
          </div>
        </div>
      </div>

      ${subscription.pet_name ? `
        <div class="modal-section">
          <h3>Pet Information</h3>
          <div class="modal-detail-grid">
            <div class="modal-detail-item">
              <span class="modal-detail-label">Pet Name</span>
              <span class="modal-detail-value">${escapeHtml(subscription.pet_name)}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Type</span>
              <span class="modal-detail-value">${subscription.pet_type ? subscription.pet_type.charAt(0).toUpperCase() + subscription.pet_type.slice(1) : 'N/A'}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Daily Amount</span>
              <span class="modal-detail-value">${subscription.daily_grams || 'N/A'}g (${subscription.pouches_per_day || 'N/A'} pouches/day)</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Total Pouches</span>
              <span class="modal-detail-value">${subscription.total_pouches || 'N/A'}</span>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="modal-section">
        <h3>Actions</h3>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="editSubscription(${subscription.id})">Edit Subscription</button>
          ${subscription.status === 'pending' || subscription.status === 'created' ? `
            <button class="btn btn-primary" onclick="confirmSubscription(${subscription.id})" style="background: #1B8A5A;">Confirm & Activate</button>
          ` : ''}
          ${!isExpired && subscription.status !== 'cancelled' ? `
            <button class="btn btn-outline" onclick="cancelSubscription(${subscription.id})" style="background: #DC2626; color: white; border: none;">Cancel Subscription</button>
          ` : ''}
          ${isExpired || isExpiringSoon ? `
            <button class="btn btn-primary" onclick="renewSubscription(${subscription.id})">Renew Subscription</button>
          ` : ''}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('❌ Error loading subscription details:', error);
    body.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: #DC2626; margin-bottom: 1rem;">Error loading subscription details</p>
        <p style="color: var(--ink-700); margin-bottom: 1.5rem;">${escapeHtml(error.message || 'Please try again')}</p>
        <button class="btn btn-primary" onclick="showSubscriptionDetails(${subscriptionId})">Retry</button>
      </div>
    `;
  }
}

async function updateSubscriptionStatus(subscriptionId) {
  const select = document.getElementById('subscriptionStatusSelect');
  if (!select) return;
  
  const newStatus = select.value;
  if (!newStatus) return;

  if (!confirm(`Are you sure you want to change the subscription status to "${newStatus}"?`)) {
    showSubscriptionDetails(subscriptionId);
    return;
  }

  try {
    await window.adminAPI.updateSubscription(subscriptionId, { status: newStatus });
    showNotification('Subscription status updated successfully');
    await showSubscriptionDetails(subscriptionId);
    await loadSubscriptions();
  } catch (error) {
    console.error('❌ Error updating subscription status:', error);
    alert('Error updating subscription status: ' + (error.message || 'Unknown error'));
    showSubscriptionDetails(subscriptionId);
  }
}

async function updateSubscriptionAutoRenew(subscriptionId) {
  const select = document.getElementById('subscriptionAutoRenewSelect');
  if (!select) return;
  
  const autoRenew = select.value === '1';

  try {
    await window.adminAPI.updateSubscription(subscriptionId, { auto_renew: autoRenew });
    showNotification(`Auto-renew ${autoRenew ? 'enabled' : 'disabled'}`);
    await showSubscriptionDetails(subscriptionId);
  } catch (error) {
    console.error('❌ Error updating auto-renew:', error);
    alert('Error updating auto-renew: ' + (error.message || 'Unknown error'));
    showSubscriptionDetails(subscriptionId);
  }
}

async function cancelSubscription(subscriptionId) {
  const reason = prompt('Please provide a reason for cancellation (optional):');
  
  if (!confirm('Are you sure you want to cancel this subscription?')) {
    return;
  }

  try {
    await window.adminAPI.cancelSubscription(subscriptionId, reason);
    showNotification('Subscription cancelled successfully');
    document.getElementById('subscriptionModal').style.display = 'none';
    await loadSubscriptions();
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    alert('Error cancelling subscription: ' + (error.message || 'Unknown error'));
  }
}

async function renewSubscription(subscriptionId) {
  if (!confirm('Create a renewal order for this subscription?')) {
    return;
  }

  try {
    const result = await window.adminAPI.renewSubscription(subscriptionId);
    showNotification('Subscription renewal initiated. New subscription created.');
    document.getElementById('subscriptionModal').style.display = 'none';
    await loadSubscriptions();
  } catch (error) {
    console.error('❌ Error renewing subscription:', error);
    alert('Error renewing subscription: ' + (error.message || 'Unknown error'));
  }
}

async function editSubscription(subscriptionId) {
  const modal = document.getElementById('subscriptionEditModal');
  const body = document.getElementById('subscriptionEditModalBody');
  
  if (!modal || !body) {
    console.error('Subscription edit modal elements not found');
    return;
  }

  // Close details modal
  document.getElementById('subscriptionModal').style.display = 'none';

  body.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading subscription details...</p>';
  modal.style.display = 'flex';
  modal.classList.add('active');

  try {
    const subscription = await window.adminAPI.getSubscription(subscriptionId);
    
    if (!subscription || !subscription.id) {
      body.innerHTML = '<p style="color: #DC2626; text-align: center; padding: 2rem;">Subscription not found</p>';
      return;
    }

    const planLabels = {
      weekly: 'Weekly Subscription',
      monthly: 'Monthly Subscription',
      quarterly: '3-Month Subscription'
    };

    body.innerHTML = `
      <form id="subscriptionEditForm" onsubmit="saveSubscription(${subscription.id}, event)">
        <div class="modal-section">
          <h3>Subscription Information</h3>
          <div class="form-group">
            <label for="editSubscriptionStatus">Status</label>
            <select id="editSubscriptionStatus" class="form-control" required>
              <option value="pending" ${subscription.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${subscription.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="active" ${subscription.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="paused" ${subscription.status === 'paused' ? 'selected' : ''}>Paused</option>
              <option value="expiring_soon" ${subscription.status === 'expiring_soon' ? 'selected' : ''}>Expiring Soon</option>
              <option value="expired" ${subscription.status === 'expired' ? 'selected' : ''}>Expired</option>
              <option value="cancelled" ${subscription.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
          <div class="form-group">
            <label for="editSubscriptionPlan">Plan Type</label>
            <input type="text" id="editSubscriptionPlan" class="form-control" value="${planLabels[subscription.plan_type] || subscription.plan_type}" readonly>
          </div>
        </div>

        <div class="modal-section">
          <h3>Feeding Details</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="editPouchesPerDay">Pouches Per Day</label>
              <input type="number" id="editPouchesPerDay" class="form-control" 
                     value="${subscription.pouches_per_day || ''}" 
                     step="0.01" min="0" required>
              <small class="form-text">Number of pouches to feed per day</small>
            </div>
            <div class="form-group">
              <label for="editDailyGrams">Daily Grams</label>
              <input type="number" id="editDailyGrams" class="form-control" 
                     value="${subscription.daily_grams || ''}" 
                     step="0.01" min="0" required>
              <small class="form-text">Daily amount in grams</small>
            </div>
          </div>
          <div class="form-group">
            <label for="editTotalPouches">Total Pouches</label>
            <input type="number" id="editTotalPouches" class="form-control" 
                   value="${subscription.total_pouches || ''}" 
                   step="1" min="0">
            <small class="form-text">Total pouches for the subscription period</small>
          </div>
        </div>

        <div class="modal-section">
          <h3>Settings</h3>
          <div class="form-group">
            <label for="editAutoRenew">
              <input type="checkbox" id="editAutoRenew" ${subscription.auto_renew ? 'checked' : ''}>
              Auto Renew Subscription
            </label>
          </div>
          ${subscription.next_delivery_date ? `
            <div class="form-group">
              <label for="editNextDeliveryDate">Next Delivery Date</label>
              <input type="datetime-local" id="editNextDeliveryDate" class="form-control" 
                     value="${new Date(subscription.next_delivery_date).toISOString().slice(0, 16)}">
            </div>
          ` : ''}
        </div>

        <div class="modal-section">
          <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('subscriptionEditModal').style.display='none'">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </form>
    `;
  } catch (error) {
    console.error('❌ Error loading subscription for edit:', error);
    body.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: #DC2626; margin-bottom: 1rem;">Error loading subscription</p>
        <p style="color: var(--ink-700); margin-bottom: 1.5rem;">${escapeHtml(error.message || 'Please try again')}</p>
        <button class="btn btn-primary" onclick="editSubscription(${subscriptionId})">Retry</button>
      </div>
    `;
  }
}

async function saveSubscription(subscriptionId, event) {
  if (event) {
    event.preventDefault();
  }

  const status = document.getElementById('editSubscriptionStatus')?.value;
  const pouchesPerDay = parseFloat(document.getElementById('editPouchesPerDay')?.value);
  const dailyGrams = parseFloat(document.getElementById('editDailyGrams')?.value);
  const totalPouches = parseInt(document.getElementById('editTotalPouches')?.value) || null;
  const autoRenew = document.getElementById('editAutoRenew')?.checked || false;
  const nextDeliveryDate = document.getElementById('editNextDeliveryDate')?.value || null;

  if (!pouchesPerDay || !dailyGrams) {
    alert('Please fill in pouches per day and daily grams');
    return;
  }

  try {
    const updateData = {
      status: status === 'confirmed' ? 'active' : status,
      pouches_per_day: pouchesPerDay,
      daily_grams: dailyGrams,
      auto_renew: autoRenew
    };

    if (totalPouches !== null) {
      updateData.total_pouches = totalPouches;
    }

    if (nextDeliveryDate) {
      updateData.next_delivery_date = new Date(nextDeliveryDate).toISOString().slice(0, 19).replace('T', ' ');
    }

    await window.adminAPI.updateSubscription(subscriptionId, updateData);
    showNotification('Subscription updated successfully');
    document.getElementById('subscriptionEditModal').style.display = 'none';
    await loadSubscriptions();
    
    // Refresh details if modal was open
    if (document.getElementById('subscriptionModal').style.display === 'block') {
      await showSubscriptionDetails(subscriptionId);
    }
  } catch (error) {
    console.error('❌ Error saving subscription:', error);
    alert('Error saving subscription: ' + (error.message || 'Unknown error'));
  }
}

async function confirmSubscription(subscriptionId) {
  if (!confirm('Confirm and activate this subscription?')) {
    return;
  }

  try {
    await window.adminAPI.confirmSubscription(subscriptionId);
    showNotification('Subscription confirmed and activated successfully');
    document.getElementById('subscriptionModal').style.display = 'none';
    await loadSubscriptions();
  } catch (error) {
    console.error('❌ Error confirming subscription:', error);
    alert('Error confirming subscription: ' + (error.message || 'Unknown error'));
  }
}

// Make functions global for onclick handlers
window.showOrderDetails = showOrderDetails;
window.showUserDetails = showUserDetails;
window.updateOrderStatus = updateOrderStatus;
window.markOrderAsFulfilled = markOrderAsFulfilled;
window.changePage = changePage;
window.loadOrders = loadOrders;
window.loadUsers = loadUsers;
window.loadProducts = loadProducts;
window.loadSubscriptions = loadSubscriptions;
window.showProductEditModal = showProductEditModal;
window.saveProduct = saveProduct;
window.showPetEditModal = showPetEditModal;
window.savePet = savePet;
window.deletePet = deletePet;
window.showSubscriptionDetails = showSubscriptionDetails;
window.updateSubscriptionStatus = updateSubscriptionStatus;
window.updateSubscriptionAutoRenew = updateSubscriptionAutoRenew;
window.cancelSubscription = cancelSubscription;
window.renewSubscription = renewSubscription;
window.editSubscription = editSubscription;
window.saveSubscription = saveSubscription;
window.confirmSubscription = confirmSubscription;
window.loadMealPlans = loadMealPlans;
window.showMealPlanEditModal = showMealPlanEditModal; // Backward compatibility
window.openMealPlanEditor = openMealPlanEditor;
window.saveMealPlan = saveMealPlan;
window.createMealPlan = createMealPlan;
window.updateMealPlan = updateMealPlan;
window.deleteMealPlan = deleteMealPlan; // Backward compatibility
window.handleMealPlanDelete = handleMealPlanDelete;
window.closeMealPlanModal = closeMealPlanModal;

// Add event listener for Add New Meal Plan button (backup to onclick)
// This ensures the button works even if the onclick handler fails
if (typeof document !== 'undefined') {
  // Use DOMContentLoaded to ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupAddMealPlanButton();
    });
  } else {
    // DOM already loaded
    setupAddMealPlanButton();
  }
}

function setupAddMealPlanButton() {
  // Use event delegation on the document to catch clicks even if button is in hidden tab
  // This works regardless of when the button is added to the DOM
  const handleAddMealPlanClick = (e) => {
    const target = e.target;
    const button = target.id === 'addNewMealPlanBtn' ? target : target.closest('#addNewMealPlanBtn');
    
    if (button) {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔵 Add New Meal Plan button clicked');
      console.log('🔵 Checking if openMealPlanEditor is available...');
      console.log('🔵 typeof openMealPlanEditor:', typeof openMealPlanEditor);
      console.log('🔵 typeof window.openMealPlanEditor:', typeof window.openMealPlanEditor);
      
      // Try multiple ways to call the function
      if (typeof window.openMealPlanEditor === 'function') {
        console.log('✅ Calling window.openMealPlanEditor(null)');
        window.openMealPlanEditor(null);
      } else if (typeof openMealPlanEditor === 'function') {
        console.log('✅ Calling openMealPlanEditor(null)');
        openMealPlanEditor(null);
      } else {
        console.error('❌ openMealPlanEditor function not available');
        console.error('Available window functions:', Object.keys(window).filter(k => k.toLowerCase().includes('meal')));
        alert('Error: Meal plan editor not loaded. Please refresh the page and wait for it to fully load.');
      }
    }
  };
  
  // Remove any existing listener first
  document.removeEventListener('click', handleAddMealPlanClick);
  document.addEventListener('click', handleAddMealPlanClick, true); // Use capture phase
  
  // Also try to attach directly if button exists
  const addBtn = document.getElementById('addNewMealPlanBtn');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddMealPlanClick);
    console.log('✅ Add New Meal Plan button direct event listener attached');
  }
  
  console.log('✅ Add New Meal Plan button setup complete (using event delegation)');
}

// ==================== MEAL PLANS MANAGEMENT ====================

async function loadMealPlans() {
  const container = document.getElementById('mealPlansContainer');
  if (!container) {
    console.warn('Meal plans container not found');
    return;
  }
  
  container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">Loading meal plans...</p>';

  try {
    // Add small delay to prevent overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 150));
    
    console.log('🍽️ Loading meal plans...');
    const response = await window.adminAPI.getMealPlans();
    const mealPlans = Array.isArray(response?.meal_plans) ? response.meal_plans : [];
    console.log(`✅ Found ${mealPlans.length} meal plans`);

    if (mealPlans.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No meal plans found. <button class="btn btn-primary" onclick="openMealPlanEditor(null)" style="margin-top: 1rem;">Add First Meal Plan</button></p>';
      return;
    }

    renderMealPlansList(mealPlans);
  } catch (error) {
    console.error('❌ Error loading meal plans:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: #DC2626; margin-bottom: 1rem;">Error loading meal plans</p>
        <p style="color: var(--ink-700); margin-bottom: 1.5rem;">${escapeHtml(error.message || 'Please try again')}</p>
        <button class="btn btn-primary" onclick="loadMealPlans()">Retry</button>
      </div>
    `;
  }
}

function renderMealPlansList(mealPlans) {
  const container = document.getElementById('mealPlansContainer');
  if (!container) return;

  container.innerHTML = mealPlans
    .filter(meal => meal && meal.id)
    .map(meal => {
      const mealName = escapeHtml(meal.name || 'Unnamed Meal');
      const subtitle = escapeHtml(meal.subtitle || '');
      const category = meal.category || 'both';
      const isActive = meal.is_active !== undefined ? meal.is_active : true;
      const sku = escapeHtml(meal.sku || 'N/A');
      const imagePath = escapeHtml(meal.image_path || '');

      return `
        <div class="data-card meal-plan-card" data-meal-plan-id="${meal.id}">
          <div class="data-card-header">
            <div style="display: flex; align-items: center; gap: 1rem;">
              ${imagePath ? `<img src="${imagePath}" alt="${mealName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">` : ''}
              <div>
                <div class="data-card-title">${mealName}</div>
                <div class="data-card-meta">SKU: ${sku} • ${category}</div>
                ${subtitle ? `<div style="font-style: italic; color: #6B5C48; margin-top: 0.25rem;">${subtitle}</div>` : ''}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="status-badge ${isActive ? 'paid' : 'cancelled'}">${isActive ? 'Active' : 'Inactive'}</span>
              <button class="btn btn-outline meal-plan-edit-btn" data-meal-plan-id="${meal.id}" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Edit</button>
              <button class="btn meal-plan-delete-btn" data-meal-plan-id="${meal.id}" style="padding: 0.5rem 1rem; font-size: 0.85rem; background: #DC2626; color: white;">Delete</button>
            </div>
          </div>
          <div class="data-card-body">
            ${meal.ingredients ? `
              <div class="data-item">
                <span class="data-label">Ingredients</span>
                <span class="data-value" style="max-width: 600px; white-space: pre-wrap;">${escapeHtml(meal.ingredients.substring(0, 200))}${meal.ingredients.length > 200 ? '...' : ''}</span>
              </div>
            ` : ''}
            ${meal.benefits ? `
              <div class="data-item">
                <span class="data-label">Benefits</span>
                <span class="data-value" style="max-width: 600px; white-space: pre-wrap;">${escapeHtml(meal.benefits.substring(0, 200))}${meal.benefits.length > 200 ? '...' : ''}</span>
              </div>
            ` : ''}
            <div class="data-item">
              <span class="data-label">Display Order</span>
              <span class="data-value">${meal.display_order || 0}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Open meal plan editor (called by event listener or directly)
async function openMealPlanEditor(mealPlanId) {
  console.log('🔵 openMealPlanEditor called with:', mealPlanId);
  
  const modal = document.getElementById('mealPlanEditModal');
  const body = document.getElementById('mealPlanEditModalBody');
  const title = document.getElementById('mealPlanModalTitle');
  
  if (!modal) {
    console.error('❌ Meal plan edit modal not found!');
    alert('Error: Meal plan modal not found. Please refresh the page.');
    return;
  }
  
  if (!body) {
    console.error('❌ Meal plan edit modal body not found!');
    alert('Error: Meal plan modal body not found. Please refresh the page.');
    return;
  }
  
  if (!title) {
    console.error('❌ Meal plan edit modal title not found!');
    alert('Error: Meal plan modal title not found. Please refresh the page.');
    return;
  }

  console.log('✅ Modal elements found, opening modal...');
  const isNew = mealPlanId === null || mealPlanId === undefined;
  title.textContent = isNew ? 'Add New Meal Plan' : 'Edit Meal Plan';
  
  // Show modal FIRST - admin.css uses .active class
  modal.style.display = 'flex';
  modal.classList.add('active');
  modal.style.opacity = '1';
  modal.style.visibility = 'visible';
  modal.style.zIndex = '10000';
  
  // Set loading message
  body.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading meal plan form...</p>';
  
  // Force a reflow to ensure modal is visible
  void modal.offsetHeight;
  
  console.log('✅ Modal opened successfully');
  console.log('✅ Modal classes:', modal.className);
  console.log('✅ Modal computed display:', window.getComputedStyle(modal).display);
  console.log('✅ Modal computed opacity:', window.getComputedStyle(modal).opacity);
  console.log('✅ Modal computed z-index:', window.getComputedStyle(modal).zIndex);
  console.log('✅ Modal body exists:', !!body);
  console.log('✅ Modal body innerHTML length:', body.innerHTML.length);

  try {
    let mealPlan = null;
    if (!isNew) {
      console.log('📖 Loading meal plan:', mealPlanId);
      try {
        const response = await window.adminAPI.getMealPlan(mealPlanId);
        mealPlan = response.meal_plan;
        console.log('✅ Meal plan loaded:', mealPlan);
      } catch (error) {
        console.error('❌ Error loading meal plan:', error);
        body.innerHTML = `<div style="padding: 2rem; text-align: center;"><p style="color: red; margin-bottom: 1rem;">Error loading meal plan: ${error.message}</p><button class="btn btn-primary" onclick="closeMealPlanModal()">Close</button></div>`;
        return;
      }
    } else {
      console.log('📝 Creating new meal plan');
    }

    // Parse nutrition values
    let nutritionValues = {};
    if (mealPlan?.nutrition_values) {
      try {
        nutritionValues = typeof mealPlan.nutrition_values === 'string' 
          ? JSON.parse(mealPlan.nutrition_values) 
          : mealPlan.nutrition_values;
      } catch (e) {
        console.warn('Could not parse nutrition values:', e);
      }
    }

    console.log('📝 Generating form HTML...');
    body.innerHTML = `
      <form id="mealPlanEditForm">
        <div class="modal-section">
          <div style="display: grid; gap: 1.5rem;">
            <!-- Basic Information Section -->
            <div style="border-bottom: 2px solid #E9DECE; padding-bottom: 1rem;">
              <h3 style="margin-bottom: 1rem; color: var(--ink-900); font-size: 1.25rem; font-weight: 700;">Basic Information</h3>
              <div style="display: grid; gap: 1rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Pet Type (Category) *</label>
                    <select id="mealPlanCategory" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem; background: white;">
                      <option value="dogs" ${mealPlan?.category === 'dogs' ? 'selected' : ''}>🐕 Dogs</option>
                      <option value="cats" ${mealPlan?.category === 'cats' ? 'selected' : ''}>🐱 Cats</option>
                      <option value="both" ${mealPlan?.category === 'both' || !mealPlan ? 'selected' : ''}>🐕🐱 Both (Dogs & Cats)</option>
                    </select>
                    <small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">Select whether this meal is for Dogs, Cats, or Both</small>
                  </div>
                  <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">SKU (Product Code) *</label>
                    <input type="text" id="mealPlanSku" value="${escapeHtml(mealPlan?.sku || '')}" ${isNew ? '' : 'disabled'} required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem; ${isNew ? '' : 'background: #f5f5f5;'}" placeholder="DOG-CHICKEN or CAT-FISH">
                    ${isNew ? '<small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">Unique product identifier (e.g., DOG-CHICKEN, CAT-FISH)</small>' : '<small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">SKU cannot be changed after creation</small>'}
                  </div>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Meal Name (Title) *</label>
                  <input type="text" id="mealPlanName" value="${escapeHtml(mealPlan?.name || '')}" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;" placeholder="e.g., Chicken & Brown Rice">
                  <small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">This appears as the main title on the meal card</small>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Subtitle (Health Benefit Tagline)</label>
                  <input type="text" id="mealPlanSubtitle" value="${escapeHtml(mealPlan?.subtitle || '')}" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;" placeholder="e.g., Immunity Boost, Skin & Coat Health">
                  <small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">Short tagline describing the main health benefit (appears below the title)</small>
                </div>
              </div>
            </div>

            <!-- Image Section -->
            <div style="border-bottom: 2px solid #E9DECE; padding-bottom: 1rem;">
              <h3 style="margin-bottom: 1rem; color: var(--ink-900); font-size: 1.25rem; font-weight: 700;">Meal Image</h3>
              <div>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Upload Image *</label>
                <div style="display: grid; gap: 1rem;">
                  <div>
                    <input type="file" id="mealPlanImageUpload" accept="image/*" style="display: none;">
                    <button type="button" id="mealPlanImageUploadBtn" class="btn btn-outline" style="width: 100%; padding: 0.75rem; border: 2px dashed #E9DECE; background: #fafafa;">
                      <span id="uploadButtonText">📷 Choose Image File</span>
                    </button>
                    <small style="color: var(--ink-600); display: block; margin-top: 0.5rem;">Click to upload an image (400x400px recommended, PNG or JPG)</small>
                  </div>
                  <div id="imagePreviewContainer" style="display: ${mealPlan?.image_path ? 'block' : 'none'}; margin-top: 1rem;">
                    <div style="padding: 1rem; background: #f9f9f9; border-radius: 8px; text-align: center;">
                      <img id="imagePreview" src="${mealPlan?.image_path ? escapeHtml(mealPlan.image_path) : ''}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 4px; margin-bottom: 0.5rem;" onerror="this.style.display='none'">
                      <div id="imageFileName" style="font-size: 0.875rem; color: var(--ink-600); margin-top: 0.5rem;">${mealPlan?.image_path ? escapeHtml(mealPlan.image_path) : ''}</div>
                      <button type="button" id="removeImageBtn" class="btn btn-outline" style="margin-top: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem;">Remove Image</button>
                    </div>
                  </div>
                  <!-- Hidden input to store the final image path -->
                  <input type="text" id="mealPlanImagePath" value="${escapeHtml(mealPlan?.image_path || '')}" style="display: none;">
                </div>
              </div>
            </div>
            <!-- Content Section -->
            <div style="border-bottom: 2px solid #E9DECE; padding-bottom: 1rem;">
              <h3 style="margin-bottom: 1rem; color: var(--ink-900); font-size: 1.25rem; font-weight: 700;">Meal Details</h3>
              <div style="display: grid; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Ingredients *</label>
                  <textarea id="mealPlanIngredients" rows="5" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem; font-family: inherit; resize: vertical;" placeholder="Chicken meat (breast & thigh), brown rice, chicken liver, pumpkin, carrot, spinach, salmon oil...">${escapeHtml(mealPlan?.ingredients || '')}</textarea>
                  <small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">List all ingredients separated by commas. This appears in the "Ingredients" section of the meal card.</small>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Guaranteed Analysis *</label>
                  <textarea id="mealPlanGuaranteedAnalysis" rows="7" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem; font-family: inherit; resize: vertical;" placeholder="Crude Protein (min): 15.0%&#10;Crude Fat (min): 8.0%&#10;Crude Fiber (max): 1.0%&#10;Moisture (max): 70.0%&#10;Ash (max): 2.5%">${escapeHtml(mealPlan?.guaranteed_analysis || '')}</textarea>
                  <small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">One item per line (e.g., "Crude Protein (min): 15.0%"). This appears as a bulleted list in the "Guaranteed Analysis" section.</small>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Health Benefits *</label>
                  <textarea id="mealPlanBenefits" rows="5" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem; font-family: inherit; resize: vertical;" placeholder="Supports immune system&#10;High-quality protein for muscle development&#10;Rich in antioxidants&#10;Promotes healthy digestion">${escapeHtml(mealPlan?.benefits || '')}</textarea>
                  <small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">One benefit per line. Each line becomes a bullet point in the "Benefits" section of the meal card.</small>
                </div>
              </div>
            </div>
            <!-- Nutrition Values Section -->
            <div style="border-bottom: 2px solid #E9DECE; padding-bottom: 1rem;">
              <h3 style="margin-bottom: 1rem; color: var(--ink-900); font-size: 1.25rem; font-weight: 700;">Nutrition Values (for Nutrition Grid)</h3>
              <p style="margin-bottom: 1rem; color: var(--ink-600); font-size: 0.9rem;">These values appear in the nutrition grid at the bottom of the meal card. Enter percentages (e.g., "15%" or "15"). Taurine is optional and typically only for cat meals.</p>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Protein % *</label>
                  <input type="text" id="nutritionProtein" value="${nutritionValues.protein || ''}" placeholder="15%" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Fiber % *</label>
                  <input type="text" id="nutritionFiber" value="${nutritionValues.fiber || ''}" placeholder="1%" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Moisture % *</label>
                  <input type="text" id="nutritionMoisture" value="${nutritionValues.moisture || ''}" placeholder="70%" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Fats % *</label>
                  <input type="text" id="nutritionFats" value="${nutritionValues.fats || ''}" placeholder="8%" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Ash % *</label>
                  <input type="text" id="nutritionAsh" value="${nutritionValues.ash || ''}" placeholder="2.5%" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Taurine % (Optional)</label>
                  <input type="text" id="nutritionTaurine" value="${nutritionValues.taurine || ''}" placeholder="0.12%" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                  <small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">Usually only for cat meals</small>
                </div>
              </div>
            </div>
            <!-- Settings Section -->
            <div>
              <h3 style="margin-bottom: 1rem; color: var(--ink-900); font-size: 1.25rem; font-weight: 700;">Settings</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Status *</label>
                  <select id="mealPlanIsActive" required style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;">
                    <option value="1" ${mealPlan?.is_active !== undefined && mealPlan.is_active !== 0 ? 'selected' : ''}>✅ Active (Visible on website)</option>
                    <option value="0" ${mealPlan?.is_active === 0 || mealPlan?.is_active === false ? 'selected' : ''}>❌ Inactive (Hidden from website)</option>
                  </select>
                  <small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">Active meals appear on the meal plans page</small>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--ink-900);">Display Order</label>
                  <input type="number" id="mealPlanDisplayOrder" value="${mealPlan?.display_order || 0}" min="0" style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 1rem;" placeholder="0">
                  <small style="color: var(--ink-600); display: block; margin-top: 0.25rem;">Lower numbers appear first (0 = first)</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #E9DECE;">
          <button type="button" class="btn btn-outline" id="mealPlanCancelBtn">Cancel</button>
          <button type="submit" class="btn btn-primary" id="mealPlanSaveBtn">${isNew ? 'Create' : 'Save Changes'}</button>
        </div>
      </form>
    `;
    console.log('✅ Form HTML set successfully');
    console.log('✅ Body innerHTML length:', body.innerHTML.length);
    
    // Add event listeners for form submission and cancel button
    const form = document.getElementById('mealPlanEditForm');
    const cancelBtn = document.getElementById('mealPlanCancelBtn');
    const saveBtn = document.getElementById('mealPlanSaveBtn');
    
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentMealPlanId = mealPlanId !== null && mealPlanId !== undefined ? mealPlanId : null;
        saveMealPlan(currentMealPlanId);
        return false;
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMealPlanModal();
      });
    }
    
    // Also add click handler to save button as backup
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const currentMealPlanId = mealPlanId !== null && mealPlanId !== undefined ? mealPlanId : null;
        saveMealPlan(currentMealPlanId);
      });
    }
    
    // Image upload functionality
    const imageUploadInput = document.getElementById('mealPlanImageUpload');
    const imageUploadBtn = document.getElementById('mealPlanImageUploadBtn');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imageFileName = document.getElementById('imageFileName');
    const imagePathInput = document.getElementById('mealPlanImagePath');
    const removeImageBtn = document.getElementById('removeImageBtn');
    
    if (imageUploadBtn && imageUploadInput) {
      imageUploadBtn.addEventListener('click', () => {
        imageUploadInput.click();
      });
      
      imageUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG, JPG, etc.)');
            return;
          }
          
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            alert('Image file is too large. Please select an image smaller than 5MB.');
            return;
          }
          
          // Show loading state
          const uploadButtonText = imageUploadBtn.querySelector('#uploadButtonText');
          if (uploadButtonText) {
            uploadButtonText.textContent = '⏳ Uploading...';
          }
          imageUploadBtn.disabled = true;
          
          // Create preview immediately
          const reader = new FileReader();
          reader.onload = (event) => {
            if (imagePreview) {
              imagePreview.src = event.target.result;
              imagePreview.style.display = 'block';
            }
            if (imageFileName) {
              imageFileName.textContent = file.name;
            }
            if (imagePreviewContainer) {
              imagePreviewContainer.style.display = 'block';
            }
          };
          reader.readAsDataURL(file);
          
          // Upload file to server
          try {
            const formData = new FormData();
            formData.append('image', file);
            
            const token = window.getToken();
            if (!token) {
              throw new Error('Not authenticated. Please log in again.');
            }
            
            // Get API base URL from api.js
            const apiBase = typeof window.API_BASE_URL !== 'undefined' ? window.API_BASE_URL : '/api/v1';
            const response = await fetch(`${apiBase}/upload/meal-plan-image`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
              throw new Error(errorData.error || 'Failed to upload image');
            }
            
            const result = await response.json();
            
            // Store the returned image path
            if (imagePathInput) {
              imagePathInput.value = result.image_path;
            }
            
            if (uploadButtonText) {
              uploadButtonText.textContent = '✓ Image Uploaded';
            }
            
            console.log('✅ Image uploaded successfully:', result.image_path);
          } catch (error) {
            console.error('❌ Image upload error:', error);
            alert('Failed to upload image: ' + (error.message || 'Please try again.'));
            
            // Reset UI
            if (imageUploadInput) imageUploadInput.value = '';
            if (imagePreview) imagePreview.src = '';
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
            if (imagePathInput) imagePathInput.value = '';
            if (uploadButtonText) {
              uploadButtonText.textContent = '📷 Choose Image File';
            }
          } finally {
            imageUploadBtn.disabled = false;
          }
        }
      });
    }
    
    if (removeImageBtn) {
      removeImageBtn.addEventListener('click', () => {
        if (imageUploadInput) imageUploadInput.value = '';
        if (imagePreview) imagePreview.src = '';
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
        if (imagePathInput) imagePathInput.value = '';
        const uploadButtonText = imageUploadBtn?.querySelector('#uploadButtonText');
        if (uploadButtonText) {
          uploadButtonText.textContent = '📷 Choose Image File';
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error loading meal plan:', error);
    body.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: #DC2626; margin-bottom: 1rem;">Error loading meal plan</p>
        <p style="color: var(--ink-700); margin-bottom: 1.5rem;">${escapeHtml(error.message || 'Please try again')}</p>
        <button class="btn btn-primary" onclick="openMealPlanEditor(${mealPlanId || 'null'})">Retry</button>
      </div>
    `;
  }
}

// Alias for backward compatibility
async function showMealPlanEditModal(mealPlanId) {
  return openMealPlanEditor(mealPlanId);
}

// Close meal plan modal
function closeMealPlanModal() {
  const modal = document.getElementById('mealPlanEditModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

async function saveMealPlan(mealPlanId) {
  console.log('💾 Saving meal plan:', mealPlanId);
  const form = document.getElementById('mealPlanEditForm');
  if (!form) {
    console.error('❌ Meal plan edit form not found');
    alert('Form not found. Please refresh the page.');
    return;
  }

  const isNew = mealPlanId === null || mealPlanId === undefined;

  // Get form values
  const sku = document.getElementById('mealPlanSku')?.value.trim();
  const name = document.getElementById('mealPlanName')?.value.trim();
  const subtitle = document.getElementById('mealPlanSubtitle')?.value.trim();
  const category = document.getElementById('mealPlanCategory')?.value;
  const imagePath = document.getElementById('mealPlanImagePath')?.value.trim();
  const ingredients = document.getElementById('mealPlanIngredients')?.value.trim();
  const guaranteedAnalysis = document.getElementById('mealPlanGuaranteedAnalysis')?.value.trim();
  const benefits = document.getElementById('mealPlanBenefits')?.value.trim();
  const isActive = document.getElementById('mealPlanIsActive')?.value === '1';
  const displayOrder = parseInt(document.getElementById('mealPlanDisplayOrder')?.value || '0');

  // Get nutrition values
  const nutritionValues = {
    protein: document.getElementById('nutritionProtein')?.value.trim() || null,
    fiber: document.getElementById('nutritionFiber')?.value.trim() || null,
    moisture: document.getElementById('nutritionMoisture')?.value.trim() || null,
    fats: document.getElementById('nutritionFats')?.value.trim() || null,
    ash: document.getElementById('nutritionAsh')?.value.trim() || null,
    taurine: document.getElementById('nutritionTaurine')?.value.trim() || null
  };

  // Remove null values
  Object.keys(nutritionValues).forEach(key => {
    if (nutritionValues[key] === null || nutritionValues[key] === '') {
      delete nutritionValues[key];
    }
  });

  // Validate
  if (!name || name.length === 0) {
    alert('Meal name is required');
    return;
  }
  if (isNew && (!sku || sku.length === 0)) {
    alert('SKU is required');
    return;
  }

  // Parse guaranteed_analysis and benefits if they're JSON strings
  let parsedGuaranteedAnalysis = guaranteedAnalysis;
  let parsedBenefits = benefits;
  
  // Try to parse as JSON if they look like JSON
  if (guaranteedAnalysis) {
    try {
      const parsed = JSON.parse(guaranteedAnalysis);
      if (typeof parsed === 'object') {
        parsedGuaranteedAnalysis = parsed;
      }
    } catch (e) {
      // Not JSON, keep as string
    }
  }
  
  if (benefits) {
    try {
      const parsed = JSON.parse(benefits);
      if (Array.isArray(parsed)) {
        parsedBenefits = parsed;
      }
    } catch (e) {
      // Not JSON, keep as string
    }
  }

  const mealPlanData = {
    name,
    subtitle: subtitle || null,
    category,
    image_path: imagePath || null,
    ingredients: ingredients || null,
    guaranteed_analysis: parsedGuaranteedAnalysis || null,
    benefits: parsedBenefits || null,
    nutrition_values: Object.keys(nutritionValues).length > 0 ? nutritionValues : null,
    is_active: isActive,
    display_order: displayOrder
  };

  if (isNew) {
    mealPlanData.sku = sku;
  }

  console.log('📦 Meal plan data to save:', mealPlanData);

  const submitBtn = document.getElementById('mealPlanSaveBtn');
  const originalText = submitBtn?.textContent;

  try {
    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    let result;
    if (isNew) {
      console.log('📡 Calling createMealPlan API...');
      result = await window.adminAPI.createMealPlan(mealPlanData);
      console.log('✅ Create response:', result);
    } else {
      console.log('📡 Calling updateMealPlan API...');
      result = await window.adminAPI.updateMealPlan(mealPlanId, mealPlanData);
      console.log('✅ Update response:', result);
    }
    
    console.log('✅ Meal plan save response:', result);
    
    // Close modal
    closeMealPlanModal();
    
    // Show success notification
    showNotification(isNew ? 'Meal plan created successfully' : 'Meal plan updated successfully', 'success');
    
    // Refresh meal plans list
    await loadMealPlans();
  } catch (error) {
    console.error('❌ Error saving meal plan:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response,
      data: error.response?.data
    });
    
    const errorMsg = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || error.message || 'Unknown error';
    showNotification('Error saving meal plan: ' + errorMsg, 'error');
    
    // Reset button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

// Create meal plan (wrapper for saveMealPlan)
async function createMealPlan() {
  return saveMealPlan(null);
}

// Update meal plan (wrapper for saveMealPlan)
async function updateMealPlan(id) {
  return saveMealPlan(id);
}

// Handle meal plan delete with confirmation and smooth animation
async function handleMealPlanDelete(mealPlanId) {
  if (!mealPlanId) {
    console.error('❌ Meal plan ID is required');
    return;
  }

  // Confirmation dialog
  if (!confirm('Are you sure you want to delete this meal plan? This action cannot be undone.')) {
    return;
  }

  // Find the card element
  const card = document.querySelector(`.meal-plan-card[data-meal-plan-id="${mealPlanId}"]`);
  
  try {
    // Show loading state on delete button
    const deleteBtn = card?.querySelector('.meal-plan-delete-btn');
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';
    }

    // Call API
    await window.adminAPI.deleteMealPlan(mealPlanId);
    
    // Smooth fade-out animation
    if (card) {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateX(-20px)';
      
      // Remove from DOM after animation
      setTimeout(() => {
        card.remove();
        
        // Check if container is empty
        const container = document.getElementById('mealPlansContainer');
        if (container && container.children.length === 0) {
          container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--ink-700);">No meal plans found. <button class="btn btn-primary" onclick="openMealPlanEditor(null)" style="margin-top: 1rem;">Add First Meal Plan</button></p>';
        }
      }, 300);
    } else {
      // If card not found, refresh the list
      await loadMealPlans();
    }
    
    // Show success notification
    showNotification('Meal plan deleted successfully', 'success');
  } catch (error) {
    console.error('❌ Error deleting meal plan:', error);
    showNotification('Error deleting meal plan: ' + (error.message || 'Unknown error'), 'error');
    
    // Reset button
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete';
    }
  }
}

// Alias for backward compatibility
async function deleteMealPlan(mealPlanId) {
  return handleMealPlanDelete(mealPlanId);
}


