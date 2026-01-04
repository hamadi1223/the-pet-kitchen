# Project Architecture

This folder contains documentation about the overall project structure, organization, and system architecture of The Pet Kitchen Website.

---

## 📋 Documents in This Folder

### [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)
**Project File Organization**

Complete documentation of how the project files are organized into folders, including the rationale for the structure and guidelines for maintaining it.

**Topics**:
- Before/after folder structure
- Organization rationale
- File path references
- Best practices
- Migration guide

**Status**: ✅ Complete and Current

---

### [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
**Overall Project Overview**

High-level summary of the entire project implementation, features, and technical decisions.

**Topics**:
- Project overview
- Technology stack
- Feature list
- Architecture decisions
- Development guidelines

**Status**: ✅ Complete

---

## 🏗️ Project Structure

### Current Organization

```
The Pet Kitchen Website/
│
├── 📄 HTML Files (Root)
│   ├── index.html              # Homepage
│   ├── meal-plans.html         # Meal plans page
│   └── events.html             # Events page
│
├── 🎨 css/                     # Stylesheets
│   ├── styles.css             # Main styles
│   └── questionnaire-wizard.css # Wizard styles
│
├── ⚙️ js/                      # JavaScript
│   ├── app.js                 # Main logic
│   ├── questionnaire-wizard.js # Wizard
│   └── security.js            # Security utilities
│
├── 📦 assets/                  # Static assets
│   └── images/                # Images
│       ├── logo/              # Brand logos
│       ├── meals/             # Meal photos
│       ├── hero/              # Hero images
│       ├── events/            # Event photos
│       └── icons/             # Icons
│
└── 📚 docs/                    # Documentation
    ├── features/              # Feature docs
    ├── fixes/                 # Bug fixes
    ├── ui-ux/                 # Design docs
    ├── security/              # Security
    └── architecture/          # This folder
```

---

## 🎯 Architecture Principles

### Separation of Concerns
- **HTML**: Structure and content
- **CSS**: Styling and presentation
- **JavaScript**: Behavior and interactivity
- **Assets**: Static resources
- **Docs**: Documentation

### Modularity
- Separate CSS files for different features
- Modular JavaScript files
- Organized documentation by topic
- Asset categorization

### Maintainability
- Clear naming conventions
- Logical folder structure
- Comprehensive documentation
- Consistent code style

### Scalability
- Easy to add new pages
- Simple to extend features
- Room for growth
- Flexible architecture

---

## 🔧 Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling (Grid, Flexbox, Custom Properties)
- **JavaScript**: Vanilla ES6+
- **No frameworks**: Lightweight, fast, no dependencies

### Build Tools
- **Vite**: Development server and build tool
- **npm**: Package management
- **ESLint**: Code linting (optional)

### Assets
- **SVG**: Icons and logos (scalable)
- **JPEG/WebP**: Photos (optimized)
- **Web Fonts**: Didot serif for headings

---

## 📐 Code Organization

### CSS Architecture

```css
/* Main Stylesheet (css/styles.css) */
1. CSS Variables
2. Reset & Base Styles
3. Layout Components
4. Navigation
5. Hero Section
6. How It Works
7. Meal Cards
8. Claims
9. Reviews
10. Footer
11. Modal
12. Responsive Breakpoints
13. Accessibility
```

### JavaScript Architecture

```javascript
// Main App (js/app.js)
class App {
  - Navigation handling
  - Modal management
  - Form submission
  - Filter logic
  - First visit check
}

// Wizard (js/questionnaire-wizard.js)
class PetQuestionnaireWizard {
  - Slide management
  - Form validation
  - Data collection
  - Recommendation engine
}

// Security (js/security.js)
- escapeHtml()
- sanitize functions
- validation functions
```

---

## 🗂️ File Naming Conventions

### HTML Files
- Lowercase with hyphens: `meal-plans.html`
- Descriptive names
- Located in root

### CSS Files
- Lowercase with hyphens: `questionnaire-wizard.css`
- Feature-based naming
- Located in `css/`

### JavaScript Files
- Lowercase with hyphens: `questionnaire-wizard.js`
- Feature or purpose-based
- Located in `js/`

### Documentation
- UPPERCASE with underscores: `SECURITY_AUDIT.md`
- Descriptive and specific
- Organized in `docs/` subfolders

### Assets
- Lowercase with hyphens: `chicken-brown-rice.jpg`
- Descriptive of content
- Organized in `assets/images/` subfolders

---

## 📊 Project Metrics

### Code Stats
- **HTML**: ~1,300 lines (3 pages)
- **CSS**: ~1,200 lines (2 files)
- **JavaScript**: ~1,500 lines (3 files)
- **Documentation**: ~15,000 words (15 files)

### File Counts
- HTML Pages: 3
- CSS Files: 2
- JS Files: 3
- Documentation: 15
- Asset Folders: 5

### Performance
- Total Page Weight: ~50KB (before images)
- CSS Bundle: ~20KB
- JS Bundle: ~30KB
- First Paint: <1s
- Interactive: <2s

---

## 🔀 Data Flow

### Questionnaire Flow
```
User Input
    ↓
Validation (client-side)
    ↓
Form Data Object
    ↓
Sanitization (security.js)
    ↓
Recommendation Engine
    ↓
Display Result
    ↓
localStorage (completion flag)
```

### Meal Filter Flow
```
User Clicks Filter
    ↓
Update Active Button
    ↓
Filter Meal Cards
    ↓
Update Display
    ↓
Update URL (history.pushState)
```

### Navigation Flow
```
Page Load
    ↓
Check Screen Size
    ↓
Desktop: Show Nav Bar
Mobile: Show Hamburger
    ↓
User Interaction
    ↓
Navigate / Toggle Menu
```

---

## 🎨 Design Patterns

### Component Pattern
Reusable, self-contained components:
- Meal cards
- Filter buttons
- Modal dialogs
- Navigation menus

### Observer Pattern
Event-driven interactions:
- Form validation
- Button clicks
- Window resize
- Keyboard events

### Factory Pattern
Creating similar objects:
- Breed list items
- Allergy tags
- Meal cards

### Module Pattern
Encapsulated functionality:
- App class
- Wizard class
- Security utilities

---

## 📝 Development Workflow

### Adding a New Page
1. Create HTML file in root
2. Link CSS files in `<head>`
3. Link JS files before `</body>`
4. Update navigation links
5. Test responsive design
6. Update documentation

### Adding a Feature
1. Plan implementation
2. Create feature branch (if using git)
3. Write code in appropriate files
4. Test thoroughly
5. Document in `docs/features/`
6. Update main README

### Fixing a Bug
1. Reproduce the issue
2. Identify root cause
3. Implement fix
4. Test fix and regressions
5. Document in `docs/fixes/`
6. Update relevant docs

---

## 🔗 File Dependencies

### index.html Dependencies
```
index.html
├── css/styles.css
├── css/questionnaire-wizard.css
├── js/security.js
├── js/questionnaire-wizard.js
└── js/app.js
```

### CSS Dependencies
```
css/styles.css
└── (no external dependencies)

css/questionnaire-wizard.css
└── css/styles.css (inherits variables)
```

### JavaScript Dependencies
```
js/app.js
├── js/security.js (uses escapeHtml)
└── js/questionnaire-wizard.js (instantiates)

js/questionnaire-wizard.js
└── js/security.js (uses escapeHtml)

js/security.js
└── (no dependencies)
```

---

## 🚀 Deployment Architecture

### Development
```
localhost:5173 (Vite dev server)
├── Hot reload
├── Source maps
└── Debug mode
```

### Production
```
Static Files (dist/)
├── Minified HTML
├── Minified CSS
├── Minified JS
├── Optimized images
└── Hosted on CDN/Static host
```

---

## 📚 Documentation Standards

### Document Structure
1. **Title**: Clear, descriptive
2. **Summary**: Brief overview
3. **Problem/Goal**: What and why
4. **Solution**: How it was done
5. **Files Modified**: List of changes
6. **Testing**: Verification steps
7. **Status**: Current state

### Categorization
- **features/**: Major functionality
- **fixes/**: Bug corrections
- **ui-ux/**: Design improvements
- **security/**: Security-related
- **architecture/**: Structure & design

---

## ✅ Architecture Checklist

### Structure
- [x] Logical folder organization
- [x] Clear naming conventions
- [x] Separation of concerns
- [x] Modular components

### Code Quality
- [x] Consistent style
- [x] Well-commented
- [x] DRY principle
- [x] SOLID principles where applicable

### Documentation
- [x] README files in all folders
- [x] Inline code comments
- [x] Feature documentation
- [x] Architecture docs

### Performance
- [x] Minimal dependencies
- [x] Optimized assets
- [x] Efficient code
- [x] Fast load times

---

## 🔗 Related Documentation

### Root Level
- [Main README](../../README.md) - Project overview
- [Quick Start](../../QUICK_START.md) - Getting started
- [Security Fixes](../../SECURITY_FIXES_APPLIED.md) - Security updates

### Other Categories
- [Features](../features/) - Feature documentation
- [Fixes](../fixes/) - Bug fixes
- [UI/UX](../ui-ux/) - Design decisions
- [Security](../security/) - Security docs

---

**Category**: Architecture  
**Last Updated**: October 21, 2025  
**Maintained By**: Hamadi Alhassani  
**Architecture Version**: 1.0.0

