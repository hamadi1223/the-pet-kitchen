# Questionnaire Wizard Documentation

## Overview

The Pet Kitchen questionnaire has been refactored into an elegant 4-slide wizard with luxurious styling that inherits the site's design system. The wizard provides a smooth, accessible user experience for collecting pet information and generating meal recommendations.

## Features

### ✨ 4-Slide Progressive Flow
1. **Slide 1**: Pet type (Cat/Dog) + Pet name
2. **Slide 2**: Breed (searchable, 40 options) + Size (auto-set for known breeds)
3. **Slide 3**: Age + Activity level (4-level segmented control)
4. **Slide 4**: Allergies (tag input) + Phone (WhatsApp, E.164 validation)

### 🎯 Key Capabilities

- **Progress Indicator**: Visual progress bar + "Step X of 4" text
- **Smart Navigation**: Back/Next buttons with state preservation
- **Per-Slide Validation**: Next button disabled until slide is valid
- **Searchable Breed Select**: 40 cat breeds + 40 dog breeds with filtering
- **Auto-Size Detection**: Breeds with default sizes auto-lock size selection
- **Tag Input**: Add/remove allergies as chips
- **Phone Validation**: E.164 format (e.g., +1234567890)
- **Smart Recommendations**: Based on allergies and activity level

### ♿ Accessibility

- Full ARIA support (roles, labels, live regions)
- Keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Focus management and visible focus rings
- Screen reader friendly
- Semantic HTML structure

### 📱 Responsive Design

- Mobile-first approach
- Adapts to all screen sizes
- Touch-friendly controls
- Elegant on both desktop and mobile

## Files

### 1. `questionnaire-wizard.js`
Main wizard logic and functionality:
- **QuestionnaireWizard class**: Manages wizard state and navigation
- **Data arrays**: CAT_BREEDS (40), DOG_BREEDS (40), BREED_SIZE_MAP
- **Validation**: Per-slide validation logic
- **Recommendation engine**: Smart meal suggestions
- **Event handlers**: All user interactions

### 2. `questionnaire-wizard.css`
Elegant, luxurious styling:
- Inherits site CSS variables (colors, spacing, fonts)
- Custom wizard-specific styles
- Smooth animations and transitions
- Responsive breakpoints
- Dark mode support
- Reduced motion support

### 3. Updated Files
- `index.html`: Added CSS + JS references
- `meal-plans.html`: Added CSS + JS references
- `events.html`: Added CSS + JS references
- `app.js`: Updated to work seamlessly with wizard

## Usage

The wizard automatically initializes when the page loads. Users can open it via:
- Header "START QUESTIONNAIRE" button
- Hero CTA button
- Events "Get Notified" button
- Any element with `id="openQuestionnaire"`

## Recommendation Logic

The wizard uses the following logic to recommend meals:

1. **Allergy-Based Filtering**:
   - Has chicken allergy → Exclude chicken meals
   - Has beef allergy → Exclude beef meals
   - Has fish allergy → Exclude fish meals

2. **Activity-Based Selection**:
   - **Athlete**: Beef Hearts, Liver & Sweet Potato (high energy)
   - **Active/Moderate**: Chicken Hearts, Liver & Rice (balanced)
   - **Low/Kitten/Puppy**: White Fish & Quinoa (gentle)

3. **Default**: Chicken & Brown Rice (most popular)

## Data Structures

### Form Data
```javascript
{
  petType: 'cat' | 'dog',
  name: string,
  breed: string,
  size: 'Small' | 'Medium' | 'Large',
  age: 'Kitten' | 'Puppy' | 'Kid' | 'Adult',
  activity: 'Low' | 'Moderate' | 'Active' | 'Athlete',
  allergies: string[],
  phone: string (E.164 format),
  recommendation: string
}
```

### Breed Size Map (Extendable)
Subset of breeds with default sizes:
```javascript
{
  "Maine Coon": "Large",
  "Chihuahua": "Small",
  "Labrador Retriever": "Large",
  // ... more breeds
}
```

## Customization

### Adding Breeds
Edit `CAT_BREEDS` or `DOG_BREEDS` arrays in `questionnaire-wizard.js`:
```javascript
const CAT_BREEDS = [
  "Abyssinian",
  "Your New Breed",
  // ...
];
```

### Adding Breed Sizes
Add to `BREED_SIZE_MAP`:
```javascript
const BREED_SIZE_MAP = {
  "Your New Breed": "Medium",
  // ...
};
```

### Customizing Recommendations
Edit `generateRecommendation()` method in `questionnaire-wizard.js`.

### Styling
Override CSS variables in `questionnaire-wizard.css`:
```css
:root {
  --wiz-accent: #YourColor;
  --wiz-radius: 20px;
  /* ... more variables */
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS Grid and Flexbox
- CSS Custom Properties

## Validation

### Slide 1
- Pet type: Required (Cat or Dog)
- Pet name: Required (non-empty string)

### Slide 2
- Breed: Required (from dropdown)
- Size: Required (auto-set or manual)

### Slide 3
- Age: Required (from select)
- Activity: Required (4 levels)

### Slide 4
- Allergies: Optional (tag input)
- Phone: Required (E.164 format: `+[country][number]`)

## Keyboard Shortcuts

- **Tab**: Navigate forward
- **Shift+Tab**: Navigate backward
- **Enter**: Select/Submit
- **Escape**: Close modal
- **Arrow Down/Up**: Navigate breed list

## State Management

The wizard preserves all entered data when navigating backward, allowing users to review and modify their responses without losing information.

## Local Storage

The wizard sets `pkq_seen` in localStorage after successful submission to track that the user has completed the questionnaire.

## Console Logging

On submission, the complete form payload is logged to console in JSON format for development/debugging:
```javascript
{
  petType: "dog",
  name: "Max",
  breed: "Golden Retriever",
  size: "Large",
  age: "Adult",
  activity: "Active",
  allergies: ["chicken", "grain"],
  phone: "+1234567890",
  recommendation: "Beef & Sweet Potato"
}
```

## Integration with Existing Code

The wizard is designed to work alongside the existing `app.js`:
- Uses the same modal shell (`#questionnaireModal`)
- Integrates with existing open/close logic
- Maintains backward compatibility
- No breaking changes to existing functionality

## Future Enhancements

Potential additions:
- Email input for receipt/confirmation
- Multi-pet support
- Meal quantity calculator
- Delivery scheduling
- Price estimation
- Progress save/resume with localStorage
- Backend API integration
- Analytics tracking

## Support

For questions or issues, review the code comments in:
- `questionnaire-wizard.js` (logic)
- `questionnaire-wizard.css` (styling)

