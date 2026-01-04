// Subscription Calculator & Gate
class SubscriptionCalculator {
  constructor() {
    this.priceConfig = {
      dog: { weekly: 1.28, monthly: 1.13, quarterly: 1.08 },
      cat: { weekly: 1.28, monthly: 1.13, quarterly: 1.08 }
    };
    this.sampleBoxPrice = 12; // 6 pouches
    this.pouchSize = 150; // grams
    this.whatsappNumber = '96500000000'; // TODO: Replace with actual WhatsApp number
    this.dom = {};
  }

  init() {
    this.cacheDom();
    this.checkUrlParams();
    this.bindEvents();
  }

  cacheDom() {
    this.dom.builderCard = document.querySelector('.builder-card');
    this.dom.plansSection = document.getElementById('subscriptionPlans');
    this.dom.plansGrid = document.getElementById('plansGrid');
    this.dom.sampleBoxCard = document.getElementById('sampleBoxCard');
    this.dom.launchBtns = [
      document.getElementById('launchQuestionnaire'),
      document.getElementById('retakeQuestionnaire')
    ].filter(Boolean);
    this.dom.idealRange = document.getElementById('idealRangeValue');
    this.dom.weightStatus = document.getElementById('weightStatusValue');
    this.dom.weightHelper = document.getElementById('weightStatusHelper');
    this.dom.weightMessageEn = document.getElementById('weightMessageEn');
    this.dom.weightMessageAr = document.getElementById('weightMessageAr');
  }

  checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const weight = params.get('weight');
    const age = params.get('age');
    const activity = params.get('activity');
    const goal = params.get('goal');

    if (type && weight && age && activity && goal) {
      // Hide gate, show plans
      if (this.dom.builderCard) this.dom.builderCard.style.display = 'none';
      if (this.dom.plansSection) this.dom.plansSection.style.display = 'block';
      
      // Calculate and display plans
      this.calculateAndDisplay({
        petType: type,
        weight: parseFloat(weight),
        age,
        activity,
        goal
      });
    } else {
      // Show gate, hide plans
      if (this.dom.builderCard) this.dom.builderCard.style.display = 'block';
      if (this.dom.plansSection) this.dom.plansSection.style.display = 'none';
    }
  }

  calculateAndDisplay(data) {
    const { petType, weight, age, activity, goal, petId, petName } = data;
    
    // Calculate daily grams
    const dailyGrams = this.calculateDailyGrams(petType, weight, age, activity, goal);
    const pouchesPerDay = Math.round((dailyGrams / this.pouchSize) * 10) / 10;
    
    // Calculate plan totals
    const weeklyPouches = Math.round(pouchesPerDay * 7);
    const monthlyPouches = Math.round(pouchesPerDay * 30);
    const quarterlyPouches = Math.round(pouchesPerDay * 90);
    
    // Calculate prices
    const prices = this.priceConfig[petType];
    const weeklyPrice = (weeklyPouches * prices.weekly).toFixed(2);
    const monthlyPrice = (monthlyPouches * prices.monthly).toFixed(2);
    const quarterlyPrice = (quarterlyPouches * prices.quarterly).toFixed(2);
    
    // Calculate ideal weight and status
    const idealWeight = this.calculateIdealWeight(petType, weight);
    const weightStatus = this.getWeightStatus(weight, idealWeight);
    
    // Update insight card
    this.updateInsightCard(idealWeight, weightStatus, petType);
    
    // Display plans
    this.displayPlans({
      petType,
      weight,
      age,
      activity,
      goal,
      dailyGrams,
      pouchesPerDay,
      weeklyPouches,
      monthlyPouches,
      quarterlyPouches,
      weeklyPrice,
      monthlyPrice,
      quarterlyPrice,
      idealWeight,
      weightStatus,
      petId,
      petName
    });
  }

  calculateDailyGrams(petType, weight, age, activity, goal) {
    // Base calculation: weight × 0.0275 × 1000
    let baseGrams = weight * 0.0275 * 1000;
    
    // Age factors
    const ageFactors = {
      puppy: 1.4,
      kitten: 1.4,
      adult: 1.0,
      senior: 0.9
    };
    const ageFactor = ageFactors[age] || 1.0;
    
    // Activity factors
    const activityFactors = {
      dog: { low: 0.9, normal: 1.0, high: 1.2 },
      cat: { low: 0.9, normal: 1.0, high: 1.15 }
    };
    const activityFactor = activityFactors[petType]?.[activity] || 1.0;
    
    // Goal factors
    let goalFactor = 1.0;
    if (goal === 'lose_weight') {
      goalFactor = 0.85; // Average of 0.8-0.9
    } else if (goal === 'gain_weight') {
      goalFactor = petType === 'dog' ? 1.2 : 1.15;
    }
    
    // Apply all factors
    let dailyGrams = baseGrams * ageFactor * activityFactor * goalFactor;
    
    // For weight loss, use ideal weight instead
    if (goal === 'lose_weight') {
      const idealWeight = this.calculateIdealWeight(petType, weight);
      const idealMidpoint = (idealWeight.min + idealWeight.max) / 2;
      baseGrams = idealMidpoint * 0.0275 * 1000;
      dailyGrams = baseGrams * ageFactor * activityFactor * 0.9;
    }
    
    return Math.round(dailyGrams);
  }

  calculateIdealWeight(petType, currentWeight) {
    const ranges = petType === 'dog' 
      ? { xs: [1,3], s: [3,6], sm: [6,10], m: [10,20], l: [20,30], xl: [30,40], xxl: [40,55] }
      : { xs: [2,3], s: [3,4], m: [4,5], l: [5,6], xl: [6,7] };
    
    // Find the size bucket
    let size = 'm';
    for (const [key, [min, max]] of Object.entries(ranges)) {
      if (currentWeight >= min && currentWeight <= max) {
        size = key;
        break;
      }
    }
    
    // If weight is above all ranges, use the largest
    if (currentWeight > Math.max(...Object.values(ranges).flat())) {
      size = Object.keys(ranges).pop();
    }
    
    return { min: ranges[size][0], max: ranges[size][1], size };
  }

  getWeightStatus(currentWeight, idealWeight) {
    const { min, max } = idealWeight;
    const midpoint = (min + max) / 2;
    const range = max - min;
    
    if (currentWeight >= min && currentWeight <= max) {
      return { status: 'healthy', percentage: 0 };
    } else if (currentWeight < min) {
      const diff = min - currentWeight;
      return { status: 'underweight', percentage: (diff / min) * 100 };
    } else {
      const diff = currentWeight - max;
      const percentage = (diff / max) * 100;
      if (percentage <= 15) {
        return { status: 'slightly_above', percentage };
      } else {
        return { status: 'overweight', percentage };
      }
    }
  }

  updateInsightCard(idealWeight, weightStatus, petType) {
    if (this.dom.idealRange) {
      this.dom.idealRange.textContent = `${idealWeight.min}–${idealWeight.max} kg`;
    }
    
    if (this.dom.weightStatus) {
      const statusLabels = {
        healthy: 'Healthy Weight',
        slightly_above: 'Slightly Above Ideal',
        overweight: 'Above Ideal Weight',
        underweight: 'Below Ideal Weight'
      };
      this.dom.weightStatus.textContent = statusLabels[weightStatus.status] || '—';
    }
    
    // Update messages
    const messages = this.getWeightMessages(weightStatus.status, petType);
    if (this.dom.weightMessageEn) {
      this.dom.weightMessageEn.textContent = messages.en;
    }
    if (this.dom.weightMessageAr) {
      this.dom.weightMessageAr.textContent = messages.ar;
    }
    
    if (this.dom.weightHelper) {
      this.dom.weightHelper.textContent = messages.helper || '';
    }
  }

  getWeightMessages(status, petType) {
    const messages = {
      healthy: {
        en: 'Healthy Weight — Your pet is within a healthy range.',
        ar: 'وزن صحي — وزن حيوانك الأليف ضمن النطاق الصحي.',
        helper: 'Maintain current feeding plan.'
      },
      slightly_above: {
        en: 'Slightly Above Ideal Weight — You may choose maintenance or gentle weight loss.',
        ar: 'أعلى من الوزن المثالي بشوي — تقدر تختار خطة محافظة أو نزول بسيط.',
        helper: 'Consider a maintenance or light reduction plan.'
      },
      overweight: {
        en: 'Above Ideal Weight — We adjusted calories for a safe weight-loss plan.',
        ar: 'أعلى من الوزن المثالي — عدلنا كمية الأكل لخطة نزول وزن آمنة.',
        helper: 'Calories adjusted for safe weight loss.'
      },
      underweight: {
        en: 'Below Ideal Weight — Consider a healthy weight‑gain plan.',
        ar: 'أقل من الوزن المثالي — نقدر نجهز خطة زيادة وزن صحية.',
        helper: 'Consider increasing portions gradually.'
      }
    };
    return messages[status] || messages.healthy;
  }

  displayPlans(data) {
    if (!this.dom.plansGrid) return;
    
    const plans = [
      {
        id: 'weekly',
        title: 'Weekly Starter Plan',
        pouches: data.weeklyPouches,
        price: data.weeklyPrice,
        period: 'week',
        popular: false
      },
      {
        id: 'monthly',
        title: 'Monthly Subscription',
        subtitle: 'Most Popular',
        pouches: data.monthlyPouches,
        price: data.monthlyPrice,
        period: 'month',
        popular: true
      },
      {
        id: 'quarterly',
        title: '3-Month Subscription',
        subtitle: 'Best Value',
        pouches: data.quarterlyPouches,
        price: data.quarterlyPrice,
        period: '3 months',
        popular: false
      }
    ];
    
    this.dom.plansGrid.innerHTML = plans.map(plan => `
      <div class="plan-card ${plan.popular ? 'plan-popular' : ''}">
        ${plan.popular ? '<span class="plan-badge">Most Popular</span>' : ''}
        <div class="plan-header">
          <h3>${plan.title}</h3>
          ${plan.subtitle ? `<p class="plan-subtitle">${plan.subtitle}</p>` : ''}
        </div>
        <div class="plan-metrics">
          <div class="plan-metric">
            <span class="metric-label">Daily Grams</span>
            <span class="metric-value">${data.dailyGrams.toLocaleString()} g</span>
          </div>
          <div class="plan-metric">
            <span class="metric-label">Pouches/Day</span>
            <span class="metric-value">${data.pouchesPerDay.toFixed(1)}</span>
          </div>
          <div class="plan-metric">
            <span class="metric-label">Total Pouches</span>
            <span class="metric-value">${plan.pouches}</span>
          </div>
        </div>
        <div class="plan-price">
          <span class="price-amount">${plan.price} KD</span>
          <span class="price-period">per ${plan.period}</span>
        </div>
        <div class="plan-actions">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--ink-700); font-weight: 500;">
              Start Date (Optional)
            </label>
            <input 
              type="date" 
              class="subscription-start-date" 
              data-plan="${plan.id}"
              min="${new Date().toISOString().split('T')[0]}"
              style="width: 100%; padding: 0.75rem; border: 1px solid #E9DECE; border-radius: 8px; font-size: 0.9rem; font-family: inherit;"
            >
            <small style="display: block; margin-top: 0.25rem; color: var(--ink-600); font-size: 0.85rem;">
              Leave empty to start immediately
            </small>
          </div>
          <button type="button" class="btn btn-primary plan-subscribe" data-plan="${plan.id}" data-price="${plan.price}" data-pouches="${plan.pouches}">
            Subscribe Now
          </button>
          <button type="button" class="btn btn-outline plan-whatsapp" data-plan="${plan.id}">
            Chat with Pet Nutritionist
          </button>
        </div>
      </div>
    `).join('');
    
    // Show sample box
    if (this.dom.sampleBoxCard) {
      this.dom.sampleBoxCard.style.display = 'block';
    }
    
    // Bind plan button events
    this.bindPlanEvents(data);
  }

  bindPlanEvents(data) {
    // Subscribe buttons
    document.querySelectorAll('.plan-subscribe').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const planId = e.target.dataset.plan;
        const price = e.target.dataset.price;
        const pouches = e.target.dataset.pouches;
        await this.handleSubscribe(planId, price, pouches, data);
      });
    });
    
    // WhatsApp buttons
    document.querySelectorAll('.plan-whatsapp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const planId = e.target.dataset.plan;
        this.handleWhatsApp(planId, data);
      });
    });
    
    // Sample box button
    const sampleBtn = document.getElementById('sampleBoxBtn');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => {
        this.handleSampleBox(data);
      });
    }
  }

  async handleSubscribe(planId, price, pouches, data) {
    // Check if user is logged in
    if (!window.getToken || !window.getToken()) {
      if (confirm('Please log in to add subscriptions to your cart. Would you like to go to the login page?')) {
        window.location.href = 'login.html?redirect=subscriptions';
      }
      return;
    }
    
    // Check if cartAPI is available
    if (!window.cartAPI || !window.cartAPI.addItem) {
      alert('Cart functionality is not available. Please refresh the page.');
      return;
    }
    
    // Get selected start date from the date picker
    const dateInput = document.querySelector(`.subscription-start-date[data-plan="${planId}"]`);
    let startDate = null;
    if (dateInput && dateInput.value) {
      // Validate date is not in the past
      const selectedDate = new Date(dateInput.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        alert('Start date cannot be in the past. Please select a future date.');
        return;
      }
      
      startDate = dateInput.value; // Format: YYYY-MM-DD
      console.log('📅 [SUBSCRIPTION] Customer selected start date:', startDate);
    } else {
      console.log('📅 [SUBSCRIPTION] No start date selected, will start immediately');
    }
    
    // Create subscription metadata
    const subscriptionMeta = {
      type: 'subscription',
      pet_id: data.petId || null,
      pet_name: data.petName || null,
      pet_type: data.petType,
      weight: data.weight,
      age: data.age,
      activity: data.activity,
      goal: data.goal,
      daily_grams: data.dailyGrams,
      pouches_per_day: data.pouchesPerDay,
      total_pouches: parseInt(pouches),
      plan_type: planId,
      plan_period: planId === 'weekly' ? 'week' : planId === 'monthly' ? 'month' : '3 months',
      start_date: startDate // Customer-selected start date
    };
    
    // Map to actual subscription product SKU format from database
    // Database format: SUB-WEEKLY-DOG, SUB-MONTHLY-CAT, etc.
    const subscriptionSku = `SUB-${planId.toUpperCase()}-${data.petType.toUpperCase()}`;
    
    try {
      // Find the button that was clicked
      const button = document.querySelector(`[data-plan="${planId}"].plan-subscribe`);
      if (!button) {
        alert('Error: Could not find subscription button. Please refresh the page.');
        return;
      }
      
      // Disable button and show loading
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Adding...';
      
      // Add to cart
      await window.cartAPI.addItem(subscriptionSku, 1, subscriptionMeta);
      
      // Show success
      button.textContent = 'Added! ✓';
      button.style.background = '#1B8A5A';
      
      // Show notification
      this.showNotification(`Subscription added to cart! View your cart to complete checkout.`);
      
      // Reset button after delay
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.background = '';
      }, 2000);
    } catch (error) {
      console.error('Error adding subscription to cart:', error);
      alert('Error adding subscription to cart: ' + (error.message || 'Please try again.'));
      
      // Re-enable button
      const button = document.querySelector(`[data-plan="${planId}"].plan-subscribe`);
      if (button) {
        button.disabled = false;
      }
    }
  }
  
  showNotification(message) {
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
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
      <div>${message}</div>
      <a href="cart.html" style="display: block; margin-top: 0.5rem; color: white; text-decoration: underline; font-size: 0.9rem;">View Cart →</a>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  handleWhatsApp(planId, data) {
    const planNames = {
      weekly: 'Weekly Starter Plan',
      monthly: 'Monthly Subscription',
      quarterly: '3-Month Subscription'
    };
    
    const planPrices = {
      weekly: data.weeklyPrice,
      monthly: data.monthlyPrice,
      quarterly: data.quarterlyPrice
    };
    
    const planPouches = {
      weekly: data.weeklyPouches,
      monthly: data.monthlyPouches,
      quarterly: data.quarterlyPouches
    };
    
    const message = `Hello! I'm interested in the ${planNames[planId]} for my ${data.petType}.

Pet Details:
• Weight: ${data.weight} kg
• Age: ${data.age}
• Activity: ${data.activity}
• Goal: ${data.goal}

Ideal Weight Range: ${data.idealWeight.min}–${data.idealWeight.max} kg
Weight Status: ${this.dom.weightStatus?.textContent || 'N/A'}

Feeding Plan:
• Daily Grams: ${data.dailyGrams} g
• Pouches per Day: ${data.pouchesPerDay.toFixed(1)}
• Total Pouches: ${planPouches[planId]}
• Price: ${planPrices[planId]} KD

I'd like to discuss this plan with a pet nutritionist.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  handleSampleBox(data) {
    const message = `Hello! I'd like to order a Sample Box (6 pouches for 12 KD) for my ${data.petType}.

Pet Details:
• Weight: ${data.weight} kg
• Age: ${data.age}
• Activity: ${data.activity}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  bindEvents() {
    // Handle "Start questionnaire" button
    const launchBtn = document.getElementById('launchQuestionnaire');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => this.openQuestionnaire());
    }
    
    // Handle "I already completed it" button
    const retakeBtn = document.getElementById('retakeQuestionnaire');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => this.handleAlreadyCompleted());
    }
  }
  
  async handleAlreadyCompleted() {
    // Check if user is logged in
    if (!window.getToken || !window.getToken()) {
      if (confirm('Please log in to view your saved pets and subscriptions. Would you like to go to the login page?')) {
        window.location.href = 'login.html?redirect=subscriptions';
      }
      return;
    }
    
    // Fetch user's pets
    try {
      const pets = await window.petsAPI.getAll();
      
      if (!pets || pets.length === 0) {
        // No pets - show message to add pet
        this.showNoPetsMessage();
        return;
      }
      
      // Show pet selection UI
      this.showPetSelection(pets);
    } catch (error) {
      console.error('Error fetching pets:', error);
      alert('Error loading your pets. Please try again.');
    }
  }
  
  showNoPetsMessage() {
    const builderCard = this.dom.builderCard;
    if (!builderCard) return;
    
    builderCard.innerHTML = `
      <div class="builder-header" style="text-align: center; padding: 2rem;">
        <h2>We don't have your pet on file yet</h2>
        <p style="margin: 1rem 0; color: var(--ink-700);">
          Please add your pet first in your profile to create a personalized subscription plan.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
          <a href="account.html" class="btn btn-primary">Add Your Pet</a>
          <button type="button" class="btn btn-outline" onclick="location.reload()">Start Questionnaire Instead</button>
        </div>
      </div>
    `;
  }
  
  showPetSelection(pets) {
    const builderCard = this.dom.builderCard;
    if (!builderCard) return;
    
    builderCard.innerHTML = `
      <div class="builder-header">
        <h2>Select Your Pet</h2>
        <p>Choose a pet to view their personalized subscription options</p>
      </div>
      <div class="pets-selection-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
        ${pets.map(pet => `
          <div class="pet-selection-card" data-pet-id="${pet.id}" style="border: 2px solid var(--accent); border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.3s; background: white;">
            <div style="font-size: 3rem; text-align: center; margin-bottom: 1rem;">
              ${pet.type === 'dog' ? '🐕' : '🐈'}
            </div>
            <h3 style="text-align: center; margin: 0 0 0.5rem 0; color: var(--ink-900);">${escapeHtml(pet.name)}</h3>
            <div style="text-align: center; color: var(--ink-700); font-size: 0.9rem; margin-bottom: 1rem;">
              ${pet.type === 'dog' ? 'Dog' : 'Cat'}
              ${pet.breed ? ` • ${escapeHtml(pet.breed)}` : ''}
            </div>
            ${pet.weight_kg ? `
              <div style="text-align: center; color: var(--ink-600); font-size: 0.85rem;">
                ${pet.weight_kg} kg
                ${pet.age_group ? ` • ${formatAgeGroup(pet.age_group)}` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      <div style="text-align: center; margin-top: 2rem;">
        <button type="button" class="btn btn-outline" onclick="location.reload()">Start New Questionnaire</button>
      </div>
    `;
    
    // Add click handlers to pet cards
    document.querySelectorAll('.pet-selection-card').forEach(card => {
      card.addEventListener('click', () => {
        const petId = parseInt(card.dataset.petId);
        const pet = pets.find(p => p.id === petId);
        if (pet) {
          this.handlePetSelected(pet);
        }
      });
    });
  }
  
  async handlePetSelected(pet) {
    // Map pet data to subscription calculator format
    const petType = pet.type; // 'dog' or 'cat'
    const weight = pet.weight_kg || 10; // Default weight if missing
    const age = pet.age_group || 'adult'; // Default to adult
    const activity = pet.activity_level || 'normal'; // Default to normal
    const goal = pet.goal || 'maintain'; // Default to maintain
    
    // Hide gate, show plans
    if (this.dom.builderCard) this.dom.builderCard.style.display = 'none';
    if (this.dom.plansSection) this.dom.plansSection.style.display = 'block';
    
    // Calculate and display plans using pet data
    this.calculateAndDisplay({
      petType,
      weight,
      age,
      activity,
      goal,
      petId: pet.id,
      petName: pet.name
    });
  }

  openQuestionnaire() {
    const trigger = document.getElementById('openQuestionnaire');
    if (trigger) {
      trigger.click();
    } else {
      window.location.href = 'index.html#questionnaire';
    }
  }
}

// Helper functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatAgeGroup(age) {
  const ages = {
    'puppy': 'Puppy',
    'kitten': 'Kitten',
    'adult': 'Adult',
    'senior': 'Senior'
  };
  return ages[age] || age;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const calculator = new SubscriptionCalculator();
  calculator.init();
});
