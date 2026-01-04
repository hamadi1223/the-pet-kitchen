# Auto-Popup Questionnaire for New Clients

## Overview
The Pet Questionnaire automatically pops up for new clients when they visit the website, helping capture leads and provide personalized meal recommendations from their first visit.

## Behavior

### For New Clients (First-Time Visitors)
✅ **Automatic popup** after 2 seconds on the homepage  
✅ **Shows once** - Won't show again after completion  
✅ **Clean UX** - Short delay prevents overwhelming users  

### For Returning Clients
❌ **Does not popup** - They've already completed the questionnaire  
✅ **Manual access** - Can still click "START QUESTIONNAIRE" button if needed  

## How It Works

### 1. **Detection Logic** (`app.js`)
```javascript
checkFirstVisit() {
  const hasCompletedQuestionnaire = localStorage.getItem('pkq_seen');
  
  // Only show on index page
  if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
    return;
  }
  
  // Show questionnaire for new clients (never completed it before)
  if (!hasCompletedQuestionnaire) {
    // Show questionnaire after a short delay for better UX
    setTimeout(() => {
      this.openQuestionnaire();
    }, 2000);
  }
}
```

**Key Points:**
- Checks for `pkq_seen` in browser's localStorage
- If not found → New client → Show questionnaire
- If found → Returning client → Don't show
- Only triggers on the homepage (`index.html` or `/`)

### 2. **Tracking Completion** (`questionnaire-wizard.js`)
```javascript
showResult(recommendation) {
  // ... display results
  
  // Set as seen
  localStorage.setItem('pkq_seen', Date.now().toString());
}
```

**When is it set?**
- Only when user completes ALL 4 slides
- Only when they reach the final result screen
- Stores timestamp for potential future features

### 3. **Timing**
- **2-second delay** before popup appears
- Allows page to fully load
- User can see the homepage briefly first
- Less jarring than immediate popup

## User Journey

### New Client Flow
```
1. Client visits website (index.html)
   ↓
2. Homepage loads and displays
   ↓
3. After 2 seconds → Questionnaire pops up
   ↓
4. Client sees: "Let's get to know your pet"
   ↓
5. Client completes 4 slides (or closes modal)
   ↓
6. If completed → Gets recommendation + pkq_seen is set
   ↓
7. Future visits → No automatic popup
```

### Returning Client Flow
```
1. Client visits website (index.html)
   ↓
2. System checks localStorage
   ↓
3. Finds pkq_seen → Skip popup
   ↓
4. Client browses normally
   ↓
5. Can manually click "START QUESTIONNAIRE" if desired
```

## Where It Appears

### ✅ Shows On:
- `index.html` (homepage)
- `/` (root path)

### ❌ Does Not Show On:
- `meal-plans.html`
- `events.html`
- Any other page
- Returning visitors (who completed it before)

**Reasoning:** Only show on homepage to avoid interrupting users browsing specific pages.

## localStorage Key

### Key: `pkq_seen`

**Value:** Timestamp (milliseconds since epoch)
```javascript
// Example value
"1729526400000"  // October 21, 2025, 12:00:00 UTC
```

**Purpose:**
- Track if user completed questionnaire
- Store completion time for analytics
- Prevent repeated popups

**Scope:**
- Per browser/device
- Persists across sessions
- Cleared if user clears browser data

## Testing Scenarios

### Test 1: New Client
**Steps:**
1. Clear browser localStorage (DevTools → Application → Local Storage → Clear)
2. Visit `index.html`
3. Wait 2 seconds

**Expected:**
- ✅ Questionnaire pops up automatically
- ✅ Shows "Let's get to know your pet"
- ✅ All 4 slides functional

### Test 2: Complete Questionnaire
**Steps:**
1. As new client, complete all 4 slides
2. Submit questionnaire
3. See result screen
4. Close modal
5. Refresh page

**Expected:**
- ✅ No popup on refresh
- ✅ `pkq_seen` exists in localStorage
- ✅ Can manually open via button

### Test 3: Close Without Completing
**Steps:**
1. As new client, let popup appear
2. Close modal (X button or Esc) before completing
3. Refresh page

**Expected:**
- ⚠️ Popup appears again (not marked as completed)
- ✅ Only sets `pkq_seen` after full completion

### Test 4: Other Pages
**Steps:**
1. As new client, visit `meal-plans.html`
2. Wait 5+ seconds

**Expected:**
- ✅ No popup (only shows on homepage)
- ✅ Can still manually click button

### Test 5: Returning Client
**Steps:**
1. As returning client (completed before)
2. Visit `index.html`
3. Wait 5+ seconds

**Expected:**
- ✅ No popup
- ✅ Can manually open questionnaire
- ✅ Data not lost from previous session

## Manual Override (For Testing)

### Clear localStorage (Reset to New Client)
```javascript
// In browser console
localStorage.removeItem('pkq_seen');
// Refresh page → Will show popup
```

### Check Current Status
```javascript
// In browser console
localStorage.getItem('pkq_seen');
// Returns: null (new client) or timestamp (returning client)
```

### Set as Returning Client
```javascript
// In browser console
localStorage.setItem('pkq_seen', Date.now().toString());
// Refresh page → Won't show popup
```

## Performance Impact

### Minimal Impact
- ✅ Single localStorage read (< 1ms)
- ✅ No network requests
- ✅ No heavy calculations
- ✅ Modal already in DOM

### Optimization
- Modal HTML already loaded (not dynamically created)
- Only CSS class toggle to show/hide
- Wizard JS loaded once on page load

## Privacy & Data

### What is Stored
- ✅ Completion timestamp
- ❌ No personal data
- ❌ No questionnaire answers (logged to console only)
- ❌ No tracking cookies

### GDPR/Privacy Compliance
- Uses localStorage (not cookies)
- No personal data stored
- User can clear at any time
- Fully client-side (no server tracking)

## Customization Options

### Change Delay Time
```javascript
// In app.js, line ~484
setTimeout(() => {
  this.openQuestionnaire();
}, 2000);  // Change 2000 to desired milliseconds
```

### Show on All Pages
```javascript
// In app.js, remove lines ~476-478
// Comment out or delete:
// if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
//   return;
// }
```

### Show Multiple Times
```javascript
// In questionnaire-wizard.js, comment out line ~860
// localStorage.setItem('pkq_seen', Date.now().toString());
```

### Add Frequency Limit (e.g., once per week)
```javascript
checkFirstVisit() {
  const lastSeen = localStorage.getItem('pkq_seen');
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  
  if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
    return;
  }
  
  if (!lastSeen || (now - parseInt(lastSeen)) > oneWeekMs) {
    setTimeout(() => {
      this.openQuestionnaire();
    }, 2000);
  }
}
```

## Troubleshooting

### Popup Not Appearing
**Check:**
1. Are you on `index.html`?
2. Is `pkq_seen` in localStorage? (Clear it)
3. Is JavaScript enabled?
4. Any console errors?
5. Is modal HTML present in DOM?

### Popup Appearing Too Often
**Check:**
1. Is `pkq_seen` being set after completion?
2. Check browser console for errors
3. Verify localStorage is not disabled

### Popup Appearing Too Quickly
**Solution:**
Increase delay in `app.js` (line ~484):
```javascript
setTimeout(() => {
  this.openQuestionnaire();
}, 5000);  // 5 seconds instead of 2
```

## Analytics Integration (Future)

### Potential Tracking Events
```javascript
// Track popup shown
analytics.track('Questionnaire Popup Shown', {
  page: window.location.pathname,
  timestamp: Date.now()
});

// Track completion
analytics.track('Questionnaire Completed', {
  recommendation: recommendation.meal,
  timestamp: Date.now()
});

// Track abandonment
analytics.track('Questionnaire Closed', {
  slide: currentSlide,
  timestamp: Date.now()
});
```

## Conversion Rate Tracking

### Metrics to Monitor
1. **Popup Show Rate**: How many visitors see the popup
2. **Completion Rate**: % who complete all 4 slides
3. **Abandonment Rate**: % who close before completing
4. **Time to Complete**: Average time spent
5. **Recommendations Given**: Which meals are most common

## Benefits

### Business Impact
✅ **Higher lead capture** - Engage visitors immediately  
✅ **Personalized experience** - Recommendations from first visit  
✅ **Data collection** - Understand customer needs  
✅ **Reduced bounce** - Interactive element keeps users engaged  

### User Experience
✅ **Helpful** - Gets personalized recommendations  
✅ **Not intrusive** - 2-second delay, can close anytime  
✅ **One-time only** - Won't annoy returning customers  
✅ **Clear value** - Knows why it's asking for info  

## Files Modified

1. **`app.js`**
   - Updated `checkFirstVisit()` function
   - Removed 24-hour expiry check
   - Simplified to check only for first-time visitors

## Summary

✅ **Auto-popup for new clients** - Shows after 2 seconds on homepage  
✅ **One-time experience** - Only shows once per browser/device  
✅ **Clean implementation** - Uses localStorage, no cookies  
✅ **Non-intrusive** - Only on homepage, can be closed  
✅ **Lead generation** - Captures info from first visit  

**Status**: ✅ Active and working  
**Last Updated**: October 21, 2025

