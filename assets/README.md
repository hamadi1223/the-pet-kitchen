# Assets Folder

This folder contains all static assets for The Pet Kitchen website.

## Folder Structure

```
assets/
├── images/          # All image files
│   ├── logo/       # Logo files (SVG, PNG)
│   ├── meals/      # Meal photos
│   ├── hero/       # Hero section images
│   ├── events/     # Event photos
│   └── icons/      # Icon files
└── README.md       # This file
```

## Images Folder

### Usage Guidelines

#### Image Naming Convention
Use lowercase, hyphen-separated names:
- ✅ Good: `chicken-brown-rice.jpg`, `dog-meal-1.jpg`, `hero-background.jpg`
- ❌ Avoid: `ChickenBrownRice.jpg`, `Dog_Meal_1.jpg`, `hero background.jpg`

#### Recommended Image Sizes

##### Meal Cards
- **Aspect Ratio**: 1:1 (Square)
- **Recommended Size**: 800x800px
- **Format**: JPEG (optimized) or WebP
- **Max File Size**: 200KB per image

##### Hero Images
- **Aspect Ratio**: 16:9 or 21:9
- **Recommended Size**: 1920x1080px
- **Format**: JPEG (optimized) or WebP
- **Max File Size**: 300KB

##### Logo
- **Format**: SVG (preferred) or PNG with transparency
- **Size**: Variable (SVG), 400x400px (PNG)

##### Icons
- **Format**: SVG (preferred)
- **Size**: 24x24px, 48x48px, or scalable

#### File Format Recommendations

| Use Case | Recommended Format | Alternative |
|----------|-------------------|-------------|
| Photos (meals, events) | JPEG (80-90% quality) | WebP |
| Logo & Icons | SVG | PNG (with transparency) |
| Backgrounds | JPEG | WebP |
| Illustrations | SVG | PNG |

### Image Optimization

Before adding images, optimize them using:
- **Online Tools**: TinyPNG, Squoosh, ImageOptim
- **Command Line**: `imagemagick`, `jpegoptim`, `pngquant`
- **Build Tools**: Vite image plugins (already configured)

### How to Add Images

#### Step 1: Place Images in Correct Subfolder
```bash
# Example: Adding a meal image
assets/images/meals/chicken-brown-rice.jpg

# Example: Adding a logo
assets/images/logo/pet-kitchen-logo.svg
```

#### Step 2: Update HTML References

**Relative Path from Root HTML:**
```html
<!-- From index.html, events.html, meal-plans.html -->
<img src="assets/images/meals/chicken-brown-rice.jpg" alt="Chicken and Brown Rice meal">
```

**Using in CSS:**
```css
/* From css/styles.css */
.hero {
  background-image: url('../assets/images/hero/hero-background.jpg');
}
```

#### Step 3: Add Alt Text
Always include descriptive alt text for accessibility:
```html
<img 
  src="assets/images/meals/beef-sweet-potato.jpg" 
  alt="Bowl of beef and sweet potato meal for dogs"
>
```

### Current Images (Placeholders)

The website currently uses external placeholder images from Pexels. These should be replaced with actual meal photos:

#### Dog Meals
- Chicken & Brown Rice
- Beef & Sweet Potato
- White Fish & Quinoa

#### Cat Meals
- Fish, Rice & Carrots
- Chicken Hearts, Liver & Rice
- Beef Hearts, Liver & Sweet Potato

### Image Checklist

When adding new images:
- [ ] Image is optimized (compressed)
- [ ] Filename follows naming convention
- [ ] Image is in correct subfolder
- [ ] Aspect ratio is correct for use case
- [ ] Alt text is descriptive and meaningful
- [ ] Image loads correctly in browser
- [ ] Mobile responsive (scales properly)

### Accessibility

- Always provide alt text
- Use descriptive filenames
- Ensure sufficient contrast for text overlays
- Consider loading performance (lazy loading for below-fold images)

### Performance Tips

1. **Use WebP format** when possible (with JPEG fallback)
2. **Implement lazy loading** for images below the fold
3. **Use srcset** for responsive images
4. **Compress images** before upload (target 80-90% quality for JPEG)
5. **Consider CDN** for production deployment

### Example Image Implementation

#### Basic Image
```html
<img 
  src="assets/images/meals/chicken-brown-rice.jpg" 
  alt="Chicken and brown rice meal"
  loading="lazy"
>
```

#### Responsive Image with srcset
```html
<img 
  src="assets/images/meals/chicken-brown-rice-800.jpg"
  srcset="
    assets/images/meals/chicken-brown-rice-400.jpg 400w,
    assets/images/meals/chicken-brown-rice-800.jpg 800w,
    assets/images/meals/chicken-brown-rice-1200.jpg 1200w
  "
  sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Chicken and brown rice meal"
  loading="lazy"
>
```

#### WebP with Fallback
```html
<picture>
  <source srcset="assets/images/meals/chicken-brown-rice.webp" type="image/webp">
  <img 
    src="assets/images/meals/chicken-brown-rice.jpg" 
    alt="Chicken and brown rice meal"
    loading="lazy"
  >
</picture>
```

## Future Assets

Additional asset types to consider:
- Fonts (if custom fonts are needed)
- Videos (for promotional content)
- PDFs (for downloadable meal guides)
- Audio (if needed for accessibility)

---

**Last Updated**: October 21, 2025  
**Maintained by**: Hamadi Alhassani

