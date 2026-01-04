// Meal Plans - Load dynamically and Add to Cart Functionality
(function() {
  'use strict';

  // Wait for API to be ready
  function waitForAPI(callback, attempts = 0) {
    const MAX_ATTEMPTS = 100;
    const DELAY_MS = 50;

    if (attempts > MAX_ATTEMPTS) {
      console.error('❌ Meal Plans API failed to load');
      return;
    }

    if (typeof window.publicMealPlansAPI !== 'undefined' && 
        typeof window.publicMealPlansAPI.getMealPlans === 'function') {
      callback();
      return;
    }

    setTimeout(() => waitForAPI(callback, attempts + 1), DELAY_MS);
  }

  // Load meal plans from API
  async function loadMealPlans() {
    const container = document.getElementById('mealCardsContainer');
    const loading = document.getElementById('mealPlansLoading');
    
    if (!container) {
      console.warn('Meal cards container not found');
      return;
    }

    try {
      console.log('📦 Loading meal plans from API...');
      
      // Wait for API to be ready
      await new Promise((resolve) => {
        waitForAPI(resolve);
      });

      // Get meal plans from public API
      const response = await window.publicMealPlansAPI.getMealPlans();
      const mealPlans = Array.isArray(response?.meal_plans) ? response.meal_plans : [];
      
      console.log(`✅ Loaded ${mealPlans.length} meal plans`);

      // Hide loading indicator if it exists
      if (loading) {
        loading.style.display = 'none';
      }

      // If API has meal plans, replace hardcoded ones with dynamic ones
      if (mealPlans.length > 0) {
        console.log(`✅ Replacing hardcoded meal plans with ${mealPlans.length} dynamic meal plans from API`);
        
        // Remove hardcoded meal cards (articles with class 'meal-card' that don't have data-dynamic attribute)
        const existingCards = container.querySelectorAll('article.meal-card:not([data-dynamic])');
        existingCards.forEach(card => card.remove());
        
        // Clear loading message if it exists
        const loadingMsg = container.querySelector('#mealPlansLoading');
        if (loadingMsg) {
          loadingMsg.remove();
        }
      } else {
        console.log('⚠️ No meal plans from API, keeping hardcoded meal plans');
        // Just hide loading, keep hardcoded meal plans
        if (loading) {
          loading.remove();
        }
        return;
      }
      mealPlans.forEach(meal => {
        const mealCard = createMealCard(meal);
        container.appendChild(mealCard);
      });

      // Re-attach add to cart handlers
      attachAddToCartHandlers();
      
      // Re-attach filter handlers from app.js
      if (typeof window.setupMealPlanFilters === 'function') {
        window.setupMealPlanFilters();
      }
      
      // Apply filters if needed
      applyFilters();
      
    } catch (error) {
      console.error('❌ Error loading meal plans:', error);
      if (loading) {
        loading.innerHTML = '<p style="color: #C53030;">Error loading meal plans. Please refresh the page.</p>';
      }
    }
  }

  // Create a meal card element from meal plan data
  function createMealCard(meal) {
    const article = document.createElement('article');
    
    // Determine category for filtering
    let category = 'all';
    if (meal.category === 'dogs') category = 'dogs';
    else if (meal.category === 'cats') category = 'cats';
    else if (meal.category === 'both') category = 'both';
    
    // Determine meal type class for styling
    let mealTypeClass = 'meal--chicken';
    const nameLower = (meal.name || '').toLowerCase();
    if (nameLower.includes('beef')) mealTypeClass = 'meal--beef';
    else if (nameLower.includes('fish')) mealTypeClass = 'meal--fish';
    
    article.className = `meal-card ${mealTypeClass}`;
    article.setAttribute('data-category', category);
    article.setAttribute('data-dynamic', 'true'); // Mark as dynamically loaded

    // Parse nutrition values
    let nutritionValues = {};
    if (meal.nutrition_values) {
      try {
        nutritionValues = typeof meal.nutrition_values === 'string' 
          ? JSON.parse(meal.nutrition_values) 
          : meal.nutrition_values;
      } catch (e) {
        console.warn('Could not parse nutrition values:', e);
      }
    }

    // Parse guaranteed analysis
    let guaranteedAnalysis = meal.guaranteed_analysis || '';
    if (typeof guaranteedAnalysis === 'object') {
      guaranteedAnalysis = Array.isArray(guaranteedAnalysis) 
        ? guaranteedAnalysis.join('\n')
        : JSON.stringify(guaranteedAnalysis);
    }

    // Parse benefits
    let benefits = meal.benefits || '';
    if (typeof benefits === 'object') {
      benefits = Array.isArray(benefits) 
        ? benefits.join('\n')
        : JSON.stringify(benefits);
    }

    // Convert benefits and guaranteed analysis to arrays
    const benefitsList = benefits.split('\n').filter(b => b.trim());
    const guaranteedAnalysisList = guaranteedAnalysis.split('\n').filter(g => g.trim());

    article.innerHTML = `
      <div class="meal-image">
        <img 
          src="${escapeHtml(meal.image_path || 'assets/images/meals/Chicken dog.png')}" 
          alt="${escapeHtml(meal.name || 'Meal')}"
          width="400"
          height="400"
          loading="lazy"
          onerror="this.onerror=null; this.src='assets/images/meals/Chicken dog.png'; this.style.opacity='0.7';"
        />
      </div>
      <div class="meal-content">
        <header class="meal-header">
          <h2 class="meal-title">${escapeHtml(meal.name || 'Meal')}</h2>
          ${meal.subtitle ? `<p class="meal-subtitle">${escapeHtml(meal.subtitle)}</p>` : ''}
        </header>
        
        <div class="meal-details">
          ${meal.ingredients ? `
          <div class="meal-section">
            <h3>Ingredients</h3>
            <p>${escapeHtml(meal.ingredients)}</p>
          </div>
          ` : ''}
          
          ${guaranteedAnalysisList.length > 0 ? `
          <div class="meal-section">
            <h3>Guaranteed Analysis</h3>
            <ul>
              ${guaranteedAnalysisList.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${benefitsList.length > 0 ? `
          <div class="meal-section">
            <h3>Benefits</h3>
            <ul>
              ${benefitsList.map(benefit => `<li>${escapeHtml(benefit)}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
        
        <div class="nutrition">
          ${nutritionValues.protein ? `<div class="item"><div class="value">${escapeHtml(nutritionValues.protein)}</div><div class="label">PROTEIN</div></div>` : ''}
          ${nutritionValues.fiber ? `<div class="item"><div class="value">${escapeHtml(nutritionValues.fiber)}</div><div class="label">FIBER</div></div>` : ''}
          ${nutritionValues.moisture ? `<div class="item"><div class="value">${escapeHtml(nutritionValues.moisture)}</div><div class="label">MOISTURE</div></div>` : ''}
          ${nutritionValues.fats ? `<div class="item"><div class="value">${escapeHtml(nutritionValues.fats)}</div><div class="label">FATS</div></div>` : ''}
          ${nutritionValues.ash ? `<div class="item"><div class="value">${escapeHtml(nutritionValues.ash)}</div><div class="label">ASH</div></div>` : ''}
          ${nutritionValues.taurine ? `<div class="item"><div class="value">${escapeHtml(nutritionValues.taurine)}</div><div class="label">TAURINE</div></div>` : ''}
        </div>
        
        <div class="meal-actions">
          <button class="btn btn-primary add-to-cart-btn" data-sku="${escapeHtml(meal.sku || '')}" data-name="${escapeHtml(meal.name || 'Meal')}">
            Add to Cart
          </button>
        </div>
      </div>
    `;

    return article;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Attach add to cart handlers
  function attachAddToCartHandlers() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    addToCartButtons.forEach(btn => {
      // Remove existing listeners
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', async (e) => {
        const button = e.target;
        const sku = button.getAttribute('data-sku');
        const name = button.getAttribute('data-name');

        // Check if user is logged in
        if (!window.getToken()) {
          if (confirm('Please log in to add items to your cart. Would you like to go to the login page?')) {
            window.location.href = 'login.html';
          }
          return;
        }

        // Disable button and show loading
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Adding...';

        try {
          await window.cartAPI.addItem(sku, 1);
          button.textContent = 'Added! ✓';
          button.style.background = '#1B8A5A';
          
          // Reset after 2 seconds
          setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            button.style.background = '';
          }, 2000);

          // Show success message
          showNotification(`${name} added to cart!`);
        } catch (error) {
          console.error('Error adding to cart:', error);
          button.textContent = originalText;
          button.disabled = false;
          alert('Error adding to cart: ' + (error.message || 'Please try again.'));
        }
      });
    });
  }

  // Apply filters based on URL parameter or active filter button
  function applyFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    
    // Wait a bit for filter buttons to be available
    setTimeout(() => {
      if (filterParam) {
        const filterBtn = document.querySelector(`[data-filter="${filterParam}"]`);
        if (filterBtn) {
          filterBtn.click();
        } else {
          // If button not found, manually filter
          filterMealsByCategory(filterParam);
        }
      } else {
        // Apply default filter (all)
        const allBtn = document.querySelector('[data-filter="all"]');
        if (allBtn) {
          allBtn.click();
        } else {
          filterMealsByCategory('all');
        }
      }
    }, 100);
  }
  
  // Manual filter function
  function filterMealsByCategory(category) {
    const mealCards = document.querySelectorAll('.meal-card');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Update button states
    filterButtons.forEach(btn => {
      if (btn.getAttribute('data-filter') === category) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Filter meal cards
    mealCards.forEach(card => {
      const cardCategory = card.getAttribute('data-category');
      
      if (category === 'all') {
        card.style.display = '';
      } else if (category === 'dogs') {
        // Show dogs and both
        card.style.display = (cardCategory === 'dogs' || cardCategory === 'both') ? '' : 'none';
      } else if (category === 'cats') {
        // Show cats and both
        card.style.display = (cardCategory === 'cats' || cardCategory === 'both') ? '' : 'none';
      } else {
        card.style.display = '';
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadMealPlans();
    });
  } else {
    loadMealPlans();
  }

  // Also listen for API ready event
  document.addEventListener('apiReady', () => {
    loadMealPlans();
  });
})();

function showNotification(message) {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: var(--accent);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-weight: 600;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
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

