// Instructions Page - Accordion & Feeding Calculator
// Uses feeding constants from questionnaire-wizard.js

(function() {
  'use strict';

  // ========== Accordion Functionality ==========
  function initAccordion() {
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
      const trigger = item.querySelector('.accordion-trigger');
      const content = item.querySelector('.accordion-content');
      
      if (!trigger || !content) return;
      
      trigger.addEventListener('click', () => {
        const isOpen = item.getAttribute('data-open') === 'true';
        
        // Close all other accordions
        accordionItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.setAttribute('data-open', 'false');
            const otherTrigger = otherItem.querySelector('.accordion-trigger');
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          }
        });
        
        // Toggle current accordion
        if (isOpen) {
          item.setAttribute('data-open', 'false');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          item.setAttribute('data-open', 'true');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ========== Load Personalized Feeding Guide ==========
  function loadPersonalizedGuide() {
    const personalizedGuide = document.getElementById('personalizedGuide');
    const feedingCalculator = document.getElementById('feedingCalculator');
    
    if (!personalizedGuide || !feedingCalculator) return;
    
    // Check if questionnaire data exists
    if (window.petRec && window.petRec.name && window.petRec.daily) {
      // Show personalized guide
      personalizedGuide.style.display = 'block';
      feedingCalculator.style.display = 'none';
      
      // Populate data
      const petNameEl = personalizedGuide.querySelector('.guide-pet-name');
      const mealRecEl = personalizedGuide.querySelector('.guide-meal-rec');
      const dailyGramsEl = document.getElementById('guideDailyGrams');
      const pouchesEl = document.getElementById('guidePouches');
      const mealsEl = document.getElementById('guideMeals');
      const perMealEl = document.getElementById('guidePerMeal');
      
      if (petNameEl) petNameEl.textContent = `${window.petRec.name}'s Feeding Guide`;
      if (mealRecEl) mealRecEl.innerHTML = `Recommended meal: <strong>${window.petRec.meal}</strong>`;
      if (dailyGramsEl) dailyGramsEl.textContent = `${window.petRec.daily.grams.toLocaleString()} g`;
      if (pouchesEl) pouchesEl.textContent = `${window.petRec.daily.pouches.toFixed(1).replace('.0','')} × ${window.petRec.daily.pouchSize}g`;
      if (mealsEl) mealsEl.textContent = window.petRec.daily.mealsPerDay;
      if (perMealEl) perMealEl.textContent = `${window.petRec.daily.gramsPerMeal.toLocaleString()} g`;
    } else {
      // Show calculator
      personalizedGuide.style.display = 'none';
      feedingCalculator.style.display = 'block';
    }
  }

  // ========== Feeding Calculator ==========
  function initCalculator() {
    const calcForm = {
      petType: '',
      ageGroup: '',
      weight: '',
      weightUnit: 'kg',
      activity: '',
      neutered: ''
    };
    
    // Button selection handlers (toggle-btn and pill-btn)
    const choiceButtons = document.querySelectorAll('.toggle-btn, .pill-btn');
    choiceButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.field;
        const value = btn.dataset.value;
        
        // Deselect siblings
        const siblings = document.querySelectorAll(`[data-field="${field}"]`);
        siblings.forEach(s => s.classList.remove('active'));
        
        // Select this button
        btn.classList.add('active');
        calcForm[field] = value;
        
        validateCalculatorForm();
      });
    });
    
    // Weight input
    const weightInput = document.getElementById('calcWeight');
    if (weightInput) {
      weightInput.addEventListener('input', (e) => {
        calcForm.weight = e.target.value.trim();
        validateCalculatorForm();
      });
    }
    
    // Weight unit
    const weightUnit = document.getElementById('calcWeightUnit');
    if (weightUnit) {
      weightUnit.addEventListener('change', (e) => {
        calcForm.weightUnit = e.target.value;
        validateCalculatorForm();
      });
    }
    
    // Activity level
    const activitySelect = document.getElementById('calcActivity');
    if (activitySelect) {
      activitySelect.addEventListener('change', (e) => {
        calcForm.activity = e.target.value;
        validateCalculatorForm();
      });
    }
    
    // Calculate button
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => {
        calculateFeeding(calcForm);
      });
    }
  }

  function validateCalculatorForm() {
    const calculateBtn = document.getElementById('calculateBtn');
    if (!calculateBtn) return;
    
    const weightInput = document.getElementById('calcWeight');
    const activitySelect = document.getElementById('calcActivity');
    
    // Get current form state
    const petType = document.querySelector('[data-field="petType"].active');
    const ageGroup = document.querySelector('[data-field="ageGroup"].active');
    const neutered = document.querySelector('[data-field="neutered"].active');
    const weight = weightInput?.value.trim();
    const activity = activitySelect?.value;
    
    // Validation
    const isValid = petType && ageGroup && neutered && weight && parseFloat(weight) > 0 && activity;
    
    calculateBtn.disabled = !isValid;
  }

  function calculateFeeding(formData) {
    // Use constants from questionnaire-wizard.js (if available) or define locally
    const POUCH_GRAMS = window.POUCH_GRAMS || 120;
    const KCAL_PER_GRAM = window.KCAL_PER_GRAM || {
      fish: 1.20,
      chicken: 1.35,
      beef: 1.50
    };
    const MIN_GRAMS = window.MIN_GRAMS || 60;
    const MAX_GRAMS = window.MAX_GRAMS || 1200;
    const GRAM_ROUND = window.GRAM_ROUND || 10;
    const POUCH_ROUND = window.POUCH_ROUND || 0.5;
    const MEALS_PER_DAY = window.MEALS_PER_DAY || {
      puppy_kitten: 3,
      adult: 2,
      senior: 2
    };
    
    // Helper functions (same as questionnaire)
    function roundTo(value, step) {
      return Math.round(value / step) * step;
    }
    
    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }
    
    // Convert weight to kg
    const wVal = parseFloat(formData.weight);
    const weightKg = formData.weightUnit === 'lb' ? (wVal * 0.45359237) : wVal;
    
    // Calculate RER (Resting Energy Requirement)
    const RER = 70 * Math.pow(weightKg, 0.75);
    
    // Determine MER multiplier
    let merMult;
    if (formData.ageGroup === 'puppy_kitten') {
      merMult = 2.5;
    } else if (formData.activity === 'mellow') {
      merMult = 1.2;
    } else if (formData.activity === 'active') {
      merMult = 1.6;
    } else if (formData.activity === 'very_active') {
      merMult = 2.2;
    } else if (formData.activity === 'athlete') {
      merMult = 3.0;
    } else {
      merMult = 1.6;
    }
    
    // Adjust for neutering
    if (formData.neutered === 'yes' && formData.ageGroup !== 'puppy_kitten') {
      merMult -= 0.1;
    }
    
    const MER = RER * merMult;
    
    // Default to chicken for calculation
    const kcalPerGram = KCAL_PER_GRAM.chicken;
    let gramsPerDay = MER / kcalPerGram;
    
    // Clamp & round
    gramsPerDay = clamp(gramsPerDay, MIN_GRAMS, MAX_GRAMS);
    gramsPerDay = roundTo(gramsPerDay, GRAM_ROUND);
    
    // Calculate pouches
    let pouchesPerDay = gramsPerDay / POUCH_GRAMS;
    pouchesPerDay = Math.max(0.5, Math.round(pouchesPerDay / POUCH_ROUND) * POUCH_ROUND);
    
    // Meals per day
    const meals = MEALS_PER_DAY[formData.ageGroup] || 2;
    
    // Grams per meal
    const gramsPerMeal = roundTo(gramsPerDay / meals, GRAM_ROUND);
    
    // Display results
    displayCalculatorResults({
      grams: gramsPerDay,
      pouches: pouchesPerDay,
      pouchSize: POUCH_GRAMS,
      mealsPerDay: meals,
      gramsPerMeal: gramsPerMeal
    });
  }

  function displayCalculatorResults(daily) {
    const resultsDiv = document.getElementById('calculatorResults');
    if (!resultsDiv) return;
    
    const dailyGramsEl = document.getElementById('calcDailyGrams');
    const pouchesEl = document.getElementById('calcPouches');
    const mealsEl = document.getElementById('calcMeals');
    const perMealEl = document.getElementById('calcPerMeal');
    
    if (dailyGramsEl) dailyGramsEl.textContent = `${daily.grams.toLocaleString()} g`;
    if (pouchesEl) pouchesEl.textContent = `${daily.pouches.toFixed(1).replace('.0','')} × ${daily.pouchSize}g`;
    if (mealsEl) mealsEl.textContent = daily.mealsPerDay;
    if (perMealEl) perMealEl.textContent = `${daily.gramsPerMeal.toLocaleString()} g`;
    
    // Show results with animation
    resultsDiv.style.display = 'block';
    
    // Smooth scroll to results
    setTimeout(() => {
      resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  // ========== Initialize ==========
  function init() {
    initAccordion();
    loadPersonalizedGuide();
    initCalculator();
  }
  
  // Handle both deferred script loading and direct execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already loaded (script is deferred)
    init();
  }
})();

