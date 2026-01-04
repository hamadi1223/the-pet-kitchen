# Folder Structure Organization

## Overview
Reorganized the project into a professional folder structure for better maintainability, scalability, and collaboration.

## Previous Structure (Before)
```
The Pet Kitchen Website/
├── index.html
├── events.html
├── meal-plans.html
├── styles.css
├── questionnaire-wizard.css
├── app.js
├── questionnaire-wizard.js
├── package.json
├── vite.config.js
├── QUESTIONNAIRE_WIZARD.md
├── WIZARD_STYLING_UPDATE.md
├── BREED_SIZE_AUTOLOCK_FIX.md
├── ALLERGIES_INPUT_FIX.md
├── AUTO_POPUP_QUESTIONNAIRE.md
├── NAVIGATION_FIX.md
├── MEAL_PLANS_GRID_LAYOUT.md
├── CONTENT_SCROLLING_FIX.md
├── HOW_IT_WORKS_RESPONSIVE_FIX.md
├── FEEDING_GUIDE_REMOVAL.md
├── MEAL_CATEGORIES_FIX.md
├── MEAL_PREVIEW_COLORS.md
└── IMPLEMENTATION_SUMMARY.md
```

**Issues:**
- ❌ All files in root directory
- ❌ Hard to navigate as project grows
- ❌ No separation of concerns
- ❌ No organized place for assets

## New Structure (After)
```
The Pet Kitchen Website/
│
├── index.html                    # Root HTML files stay in root
├── meal-plans.html
├── events.html
├── package.json                  # Config files stay in root
├── vite.config.js
├── README.md                     # Main project documentation
│
├── css/                          # 🎨 All stylesheets
│   ├── styles.css               # Main site styles
│   └── questionnaire-wizard.css # Wizard-specific styles
│
├── js/                           # ⚙️ All JavaScript
│   ├── app.js                   # Main application logic
│   └── questionnaire-wizard.js  # Wizard functionality
│
├── assets/                       # 📦 Static assets
│   ├── images/                  # All images
│   │   ├── logo/               # Brand logos
│   │   ├── meals/              # Meal photos
│   │   ├── hero/               # Hero/banner images
│   │   ├── events/             # Event photos
│   │   └── icons/              # Icon files
│   └── README.md               # Asset usage guidelines
│
└── docs/                         # 📚 Project documentation
    ├── QUESTIONNAIRE_WIZARD.md
    ├── WIZARD_STYLING_UPDATE.md
    ├── BREED_SIZE_AUTOLOCK_FIX.md
    ├── ALLERGIES_INPUT_FIX.md
    ├── AUTO_POPUP_QUESTIONNAIRE.md
    ├── NAVIGATION_FIX.md
    ├── MEAL_PLANS_GRID_LAYOUT.md
    ├── CONTENT_SCROLLING_FIX.md
    ├── HOW_IT_WORKS_RESPONSIVE_FIX.md
    ├── FEEDING_GUIDE_REMOVAL.md
    ├── MEAL_CATEGORIES_FIX.md
    ├── MEAL_PREVIEW_COLORS.md
    ├── IMPLEMENTATION_SUMMARY.md
    └── FOLDER_STRUCTURE.md        # This file
```

## Benefits

### ✅ Better Organization
- **Separation of concerns**: CSS, JS, assets, docs in dedicated folders
- **Scalability**: Easy to add more files without clutter
- **Maintainability**: Developers can quickly find what they need

### ✅ Professional Structure
- Follows industry best practices
- Similar to React, Vue, Angular project structures
- Easy onboarding for new developers

### ✅ Asset Management
- Dedicated `assets/` folder with organized subfolders
- Clear place for images, fonts, videos, etc.
- README with usage guidelines

### ✅ Clean Root
- Only essential files in root (HTML pages, config)
- Less visual clutter
- Easier to see project overview

## File Changes Made

### Created Folders
```bash
mkdir -p css js assets/images docs
mkdir -p assets/images/{logo,meals,hero,events,icons}
```

### Moved Files
```bash
# CSS files → css/
styles.css → css/styles.css
questionnaire-wizard.css → css/questionnaire-wizard.css

# JS files → js/
app.js → js/app.js
questionnaire-wizard.js → js/questionnaire-wizard.js

# Documentation → docs/
*.md → docs/*.md
```

### Updated References
All HTML files updated to reference new paths:

**CSS Links (in `<head>`):**
```html
<!-- Before -->
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="questionnaire-wizard.css">

<!-- After -->
<link rel="stylesheet" href="css/styles.css">
<link rel="stylesheet" href="css/questionnaire-wizard.css">
```

**JS Scripts (before `</body>`):**
```html
<!-- Before -->
<script src="questionnaire-wizard.js"></script>
<script src="app.js"></script>

<!-- After -->
<script src="js/questionnaire-wizard.js"></script>
<script src="js/app.js"></script>
```

## Path Reference Guide

### From HTML Files (Root Level)
HTML files are in the root, so paths are relative to root:

```html
<!-- CSS -->
<link rel="stylesheet" href="css/styles.css">

<!-- JS -->
<script src="js/app.js"></script>

<!-- Images (when added) -->
<img src="assets/images/meals/chicken-rice.jpg" alt="Meal">
```

### From CSS Files (css/ folder)
CSS files are in `css/`, so use `../` to go up one level:

```css
/* Background image */
.hero {
  background-image: url('../assets/images/hero/hero-bg.jpg');
}

/* Logo */
.logo {
  background-image: url('../assets/images/logo/logo.svg');
}
```

### From JavaScript Files (js/ folder)
JavaScript rarely references static assets directly, but if needed:

```javascript
// Usually handled via HTML or CSS, but if needed:
const logoPath = '../assets/images/logo/logo.svg';
```

## Adding New Files

### Adding a New CSS File
1. Create file in `css/` folder
2. Link in HTML: `<link rel="stylesheet" href="css/new-file.css">`

### Adding a New JS File
1. Create file in `js/` folder
2. Link in HTML: `<script src="js/new-file.js"></script>`

### Adding Images
1. Place in appropriate `assets/images/` subfolder
2. Reference in HTML: `<img src="assets/images/meals/new-meal.jpg">`
3. See `assets/README.md` for detailed guidelines

### Adding Documentation
1. Create `.md` file in `docs/` folder
2. Use clear, descriptive filename
3. Update this file if needed

## Future Expansion

### Potential Additional Folders

```
The Pet Kitchen Website/
├── fonts/              # Custom web fonts
├── data/               # JSON data files
├── components/         # Reusable HTML components
├── templates/          # Page templates
├── utils/              # Utility functions
└── tests/              # Test files
```

### If Using a Framework (Future)
```
The Pet Kitchen Website/
├── src/                # Source files
│   ├── components/    # UI components
│   ├── pages/         # Page components
│   ├── styles/        # SCSS/CSS modules
│   ├── utils/         # Helper functions
│   └── data/          # Static data
├── public/            # Public assets
└── dist/              # Build output
```

## Migration Checklist

When organizing a new project:
- [ ] Create folder structure
- [ ] Move files to appropriate folders
- [ ] Update all file references in HTML
- [ ] Update relative paths in CSS
- [ ] Test all pages locally
- [ ] Verify all assets load correctly
- [ ] Update build configuration if needed
- [ ] Update documentation
- [ ] Commit changes to version control

## Best Practices

### DO ✅
- Keep HTML files in root for easy access
- Group related files (CSS with CSS, JS with JS)
- Use descriptive folder names
- Document your structure
- Keep assets organized by type

### DON'T ❌
- Don't nest too deeply (max 3-4 levels)
- Don't mix concerns (CSS in JS folder, etc.)
- Don't use spaces in folder names
- Don't create folders for single files
- Don't forget to update references

## Verification

After restructuring, verify:
1. ✅ All pages load without errors
2. ✅ CSS styles apply correctly
3. ✅ JavaScript functions work
4. ✅ No 404 errors in browser console
5. ✅ Responsive design still works
6. ✅ Navigation functions properly
7. ✅ Questionnaire wizard operates correctly

## Tools Used

```bash
# Create folders
mkdir -p css js assets/images docs

# Move files
mv styles.css css/
mv app.js js/
mv *.md docs/

# Create subfolders
mkdir -p assets/images/{logo,meals,hero,events,icons}
```

## Files Modified

### HTML Files
- ✅ `index.html` - Updated CSS and JS paths
- ✅ `events.html` - Updated CSS and JS paths
- ✅ `meal-plans.html` - Updated CSS and JS paths

### Documentation
- ✅ Created `README.md` (project root)
- ✅ Created `assets/README.md` (asset guidelines)
- ✅ Created `docs/FOLDER_STRUCTURE.md` (this file)

## Summary

**Before**: 23 files in root directory  
**After**: 5 files + 4 organized folders  

**Improvements**:
- 🎯 Better organization
- 📁 Clear separation of concerns
- 🚀 Easier to maintain and scale
- 📦 Ready for asset additions
- 📚 Comprehensive documentation

## Status
✅ Complete and tested  
✅ All pages loading correctly  
✅ No broken references  
✅ Documentation updated  

**Last Updated**: October 21, 2025  
**Migration Completed**: October 21, 2025

