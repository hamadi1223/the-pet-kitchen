# Wave Spacer Implementation Guide

**Date**: October 22, 2025  
**Color**: #E9DECE (Beige)  
**Goal**: Add elegant wave dividers to both top and bottom of sections

---

## 🌊 Wave Spacer Overview

The wave spacers create elegant, flowing transitions between sections using SVG paths with a consistent beige color (#E9DECE).

---

## 📐 HTML Structure

### **Pattern: Section with Waves on Both Sides**

```html
<!-- Wave at TOP of section (waves flowing down) -->
<div class="wave-spacer wave-spacer-top">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 C200,100 400,20 600,70 C800,100 1000,30 1200,80 L1200,120 L0,120 Z"/>
  </svg>
</div>

<!-- Your Section Content -->
<section class="your-section">
  <div class="container">
    <h2>Section Title</h2>
    <p>Section content here...</p>
  </div>
</section>

<!-- Wave at BOTTOM of section (waves flowing up) -->
<div class="wave-spacer wave-spacer-bottom wave-spacer-reverse">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 C200,100 400,20 600,70 C800,100 1000,30 1200,80 L1200,120 L0,120 Z"/>
  </svg>
</div>
```

---

## 🎨 CSS Classes

### **Base Classes**

| Class | Purpose |
|-------|---------|
| `.wave-spacer` | Base wave container |
| `.wave-spacer-reverse` | Flips wave upside down (180deg rotation) |
| `.wave-spacer-top` | Use at top of section (adds -1px margin-bottom for seamless join) |
| `.wave-spacer-bottom` | Use at bottom of section (adds -1px margin-top for seamless join) |

### **Class Combinations**

```css
/* Top wave (flows down into section) */
.wave-spacer.wave-spacer-top

/* Bottom wave (flows up out of section) */
.wave-spacer.wave-spacer-bottom.wave-spacer-reverse
```

---

## 🎯 Complete Examples

### **Example 1: How It Works Section**

```html
<!-- Top Wave -->
<div class="wave-spacer wave-spacer-top">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 C200,100 400,20 600,70 C800,100 1000,30 1200,80 L1200,120 L0,120 Z"/>
  </svg>
</div>

<!-- Section -->
<section class="how-it-works">
  <div class="container">
    <h2 class="section-title">How It Works</h2>
    <!-- Content -->
  </div>
</section>

<!-- Bottom Wave -->
<div class="wave-spacer wave-spacer-bottom wave-spacer-reverse">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 C200,100 400,20 600,70 C800,100 1000,30 1200,80 L1200,120 L0,120 Z"/>
  </svg>
</div>
```

### **Example 2: Meal Preview Section**

```html
<!-- Top Wave -->
<div class="wave-spacer wave-spacer-top">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 C200,100 400,20 600,70 C800,100 1000,30 1200,80 L1200,120 L0,120 Z"/>
  </svg>
</div>

<!-- Section -->
<section class="meal-preview">
  <div class="container">
    <h2 class="section-title">Our Meal Plans</h2>
    <div class="meal-cards-preview">
      <!-- Meal cards -->
    </div>
  </div>
</section>

<!-- Bottom Wave -->
<div class="wave-spacer wave-spacer-bottom wave-spacer-reverse">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 C200,100 400,20 600,70 C800,100 1000,30 1200,80 L1200,120 L0,120 Z"/>
  </svg>
</div>
```

### **Example 3: Reviews Section**

```html
<!-- Top Wave -->
<div class="wave-spacer wave-spacer-top">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 C200,100 400,20 600,70 C800,100 1000,30 1200,80 L1200,120 L0,120 Z"/>
  </svg>
</div>

<!-- Section -->
<section class="reviews">
  <div class="container">
    <h2 class="section-title">What Pet Parents Say</h2>
    <div class="reviews-grid">
      <!-- Reviews -->
    </div>
  </div>
</section>

<!-- Bottom Wave -->
<div class="wave-spacer wave-spacer-bottom wave-spacer-reverse">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 C200,100 400,20 600,70 C800,100 1000,30 1200,80 L1200,120 L0,120 Z"/>
  </svg>
</div>
```

---

## 📱 Responsive Behavior

### **Desktop (> 1024px)**
- Wave height: **120px**
- Full flowing curves

### **Tablet (768px - 1023px)**
- Wave height: **90px**
- Medium curves

### **Mobile (< 768px)**
- Wave height: **70px**
- Compact curves

---

## 🎨 Color Specification

### **Current Color**
```css
fill: #E9DECE; /* Warm beige */
```

### **Customization**
To change the wave color, update in `css/styles.css`:

```css
.wave-spacer svg {
  fill: #E9DECE; /* Your custom color */
}

.wave-spacer-reverse svg {
  fill: #E9DECE; /* Keep same for consistency */
}
```

---

## ✅ Key Features

1. **Seamless Alignment**: -1px margins eliminate gaps between waves and sections
2. **Responsive**: Automatically adjusts height on different screen sizes
3. **Consistent Color**: Single beige tone (#E9DECE) throughout
4. **Smooth Curves**: SVG path creates elegant, flowing shapes
5. **Subtle Shadow**: Drop shadow adds depth (3% opacity)
6. **Performance**: SVG scales without pixelation
7. **Accessibility**: Purely decorative, doesn't interfere with content

---

## 🔧 Troubleshooting

### **Issue: Gap between wave and section**
**Solution**: Ensure you're using `.wave-spacer-top` or `.wave-spacer-bottom` classes

```html
<!-- ✅ Correct -->
<div class="wave-spacer wave-spacer-top">...</div>

<!-- ❌ Wrong (will have gap) -->
<div class="wave-spacer">...</div>
```

### **Issue: Wave pointing wrong direction**
**Solution**: Use `.wave-spacer-reverse` for bottom waves

```html
<!-- Top wave (points down) -->
<div class="wave-spacer wave-spacer-top">...</div>

<!-- Bottom wave (points up) -->
<div class="wave-spacer wave-spacer-bottom wave-spacer-reverse">...</div>
```

### **Issue: Different colors on top and bottom**
**Solution**: Both now use #E9DECE - check your CSS is updated

```css
/* Both should be the same */
.wave-spacer svg { fill: #E9DECE; }
.wave-spacer-reverse svg { fill: #E9DECE; }
```

---

## 📋 Quick Reference

### **Top Wave (Flows Down)**
```html
<div class="wave-spacer wave-spacer-top">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 C200,100 400,20 600,70 C800,100 1000,30 1200,80 L1200,120 L0,120 Z"/>
  </svg>
</div>
```

### **Bottom Wave (Flows Up)**
```html
<div class="wave-spacer wave-spacer-bottom wave-spacer-reverse">
  <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="M0,50 C200,100 400,20 600,70 C800,100 1000,30 1200,80 L1200,120 L0,120 Z"/>
  </svg>
</div>
```

---

## 🎯 Best Practices

1. **Always use pairs**: If adding a top wave, consider adding a bottom wave for symmetry
2. **Consistent spacing**: Let the section's padding control vertical space, not the waves
3. **Background colors**: Waves work best when sections have contrasting backgrounds
4. **Mobile testing**: Always test on mobile to ensure waves look good at smaller heights
5. **Accessibility**: Waves are decorative; ensure content remains accessible without them

---

## 🌟 Current Implementation

The following sections currently have waves in `index.html`:

| Section | Top Wave | Bottom Wave |
|---------|----------|-------------|
| Hero | ❌ | ✅ |
| How It Works | ✅ | ❌ |
| Meal Preview | ❌ | ✅ |
| Claims | ✅ | ❌ |
| Reviews | ❌ | ✅ |
| CTA | ✅ | ❌ |

**To add waves to both sides**: Follow the examples above for any section.

---

## 📝 Summary

✅ **Wave color**: #E9DECE (beige)  
✅ **Responsive**: 70px (mobile), 90px (tablet), 120px (desktop)  
✅ **Seamless**: -1px margins for perfect alignment  
✅ **Easy to use**: Copy-paste examples above  
✅ **Consistent**: Same color top and bottom  
✅ **Elegant**: Smooth flowing curves with subtle shadow

Your waves are now ready to add to both top and bottom of any section! 🌊✨

