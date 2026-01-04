# Meal Categories Fix

## Problem
The "All" section was not displaying all the meals correctly because the meal cards had incorrect category assignments. Specifically:
- The "White Fish & Quinoa" meal was shared between dogs and cats
- There was no dedicated fish meal for cats

## Solution
Updated the meal cards to have the correct category assignments:

### Dog Meals (3 total)
1. **Chicken & Brown Rice** - `data-category="dogs"`
2. **Beef & Sweet Potato** - `data-category="dogs"`
3. **White Fish & Quinoa** - `data-category="dogs"` (changed from "dogs cats")

### Cat Meals (3 total)
1. **Fish, Rice & Carrots** - `data-category="cats"` (NEW)
2. **Chicken Hearts, Liver & Rice** - `data-category="cats"`
3. **Beef Hearts, Liver & Sweet Potato** - `data-category="cats"`

## Changes Made

### 1. Updated White Fish & Quinoa
**Before:**
```html
<article class="meal-card meal--fish" data-category="dogs cats">
```

**After:**
```html
<article class="meal-card meal--fish" data-category="dogs">
```

Now exclusive to dogs only.

### 2. Added New Cat Meal: Fish, Rice & Carrots
Created a brand new meal card for cats:

```html
<article class="meal-card meal--fish" data-category="cats">
  <h2 class="meal-title">Fish, Rice & Carrots</h2>
  <p class="meal-subtitle">Digestive Health</p>
</article>
```

**Details:**
- **Ingredients**: Wild-caught fish, white rice, carrots, green peas, salmon oil, taurine supplement, calcium carbonate
- **Benefits**:
  - Gentle on sensitive stomachs
  - Rich in omega-3 for skin and coat
  - Easy to digest rice and vegetables
  - Supports overall feline health
- **Nutrition**: 16% Protein, 2% Fiber, 72% Moisture, 5% Fats, 2% Ash

## Filter Behavior

### "All" Filter
Shows all 6 meals:
- Chicken & Brown Rice (Dog)
- Beef & Sweet Potato (Dog)
- White Fish & Quinoa (Dog)
- Fish, Rice & Carrots (Cat)
- Chicken Hearts, Liver & Rice (Cat)
- Beef Hearts, Liver & Sweet Potato (Cat)

### "Dogs" Filter
Shows 3 dog meals:
- Chicken & Brown Rice
- Beef & Sweet Potato
- White Fish & Quinoa

### "Cats" Filter
Shows 3 cat meals:
- Fish, Rice & Carrots
- Chicken Hearts, Liver & Rice
- Beef Hearts, Liver & Sweet Potato

## Layout
- **Desktop (≥1024px)**: 3 cards per row = 2 rows for All (6 total), 1 row each for Dogs/Cats (3 each)
- **Tablet (768px-1024px)**: 2 cards per row
- **Mobile (≤767px)**: 1 card per row

## Files Modified
- `meal-plans.html`
  - Updated White Fish & Quinoa `data-category` from "dogs cats" to "dogs"
  - Added new Fish, Rice & Carrots meal card with `data-category="cats"`

## Filter Logic (No changes needed)
The existing filter logic in `app.js` already handles this correctly:
```javascript
applyFilter(filter, buttons, cards) {
  cards.forEach(card => {
    const categories = card.dataset.category || '';
    const shouldShow = filter === 'all' || categories.includes(filter);
    
    if (shouldShow) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}
```

## Result
✅ "All" section now shows all 6 meals (3 dogs + 3 cats)  
✅ "Dogs" section shows exactly 3 dog meals  
✅ "Cats" section shows exactly 3 cat meals  
✅ Each category has distinct meals (no sharing between categories)  
✅ Grid layout maintains 3 cards per row on desktop  

## Status
✅ Complete and tested  
✅ No linter errors  
✅ All filters working correctly  

**Last Updated**: October 21, 2025

