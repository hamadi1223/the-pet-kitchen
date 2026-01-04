# Feeding Guide Removal

## Change Summary
Removed all "Feeding Guide" sections from meal cards on the Meal Plans page to simplify the card layout and focus on ingredients, benefits, and nutrition information.

## Affected File
- `/meal-plans.html`

## Sections Removed
All 6 meal cards had their feeding guide sections removed:

### Dog Meals (3)
1. **Chicken & Brown Rice**
   - Removed: "Small dogs: 1/2 - 1 cup daily / Medium dogs: 1 - 2 cups daily / Large dogs: 2 - 3 cups daily"

2. **Beef & Sweet Potato**
   - Removed: "Small dogs: 1/2 - 1 cup daily / Medium dogs: 1 - 2 cups daily / Large dogs: 2 - 3 cups daily"

3. **White Fish & Quinoa** (shared with cats)
   - Removed: "Small pets: 1/2 - 1 cup daily / Medium pets: 1 - 2 cups daily / Large pets: 2 - 3 cups daily"

### Cat Meals (2 + 1 shared)
4. **Chicken Hearts, Liver & Rice**
   - Removed: "Feed ½–3 pouches daily depending on cat size and activity."

5. **Beef Hearts, Liver & Sweet Potato**
   - Removed: "Feed ½–3 pouches daily depending on cat size and activity."

## Current Meal Card Structure
Each meal card now contains:
1. **Image** - Square aspect ratio (1:1)
2. **Title** - Meal name
3. **Subtitle** - Health benefit tagline
4. **Ingredients** - List of all ingredients
5. **Benefits** - Bullet-pointed list of health benefits
6. **Nutrition** - 5-value grid (Protein, Fiber, Moisture, Fats, Ash)

## Rationale
- **Cleaner Design**: Reduces visual clutter and makes cards more elegant
- **Personalized Approach**: Feeding amounts should be personalized via the questionnaire rather than generic guidelines
- **Focus on Quality**: Emphasizes the quality of ingredients and health benefits over quantity
- **Better UX**: Users complete the questionnaire to get personalized portion recommendations

## Layout Remains
- 3 cards per row on desktop (≥1024px)
- 2 cards per row on tablet (768px - 1023.98px)
- 1 card per row on mobile (≤767.98px)
- Square images (aspect-ratio: 1/1)
- Elegant gold, beige, and Didot styling
- Hover lift effect
- Filter buttons (All/Dogs/Cats)

## Files Modified
- `meal-plans.html` - Removed 6 feeding guide sections

## Status
✅ Complete - All feeding guides successfully removed  
✅ No linter errors  
✅ Layout and styling preserved  
✅ Nutrition information retained  

**Last Updated**: October 21, 2025

