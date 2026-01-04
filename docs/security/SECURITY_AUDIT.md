# Security Vulnerability Audit Report

**Date**: October 21, 2025  
**Audited By**: Automated Security Check  
**Project**: The Pet Kitchen Website  
**Version**: 1.0.0

---

## Executive Summary

**Total Vulnerabilities Found**: 7  
- 🔴 **Critical**: 0  
- 🟠 **High**: 2  
- 🟡 **Moderate**: 3  
- 🔵 **Low**: 2  

**Risk Level**: ⚠️ **MODERATE-HIGH**  
**Action Required**: YES - Immediate fixes recommended for XSS vulnerabilities

---

## 1. Dependency Vulnerabilities

### 🟡 Moderate: Vite Development Server Vulnerabilities

**Affected Package**: `vite` (current version: ~5.4.x)  
**Severity**: Moderate  
**CVE References**:
- GHSA-93m4-6634-74q7 - Backslash bypass on Windows
- GHSA-jqfw-vq24-v9c3 - fs settings not applied to HTML files
- GHSA-g4jq-h2w9-997c - File serving vulnerability

**Impact**:
- Development server may serve unintended files
- Directory traversal potential on Windows
- File system restrictions can be bypassed

**Fix**:
```bash
npm install vite@latest --save-dev
```

**Status**: ⚠️ NEEDS FIX  
**Risk in Production**: 🔵 LOW (only affects dev server, not production build)

---

### 🟡 Moderate: esbuild CORS Vulnerability

**Affected Package**: `esbuild` (<=0.24.2)  
**Severity**: Moderate  
**CVE**: GHSA-67mh-4wv8-2f99  
**CVSS Score**: 5.3

**Impact**:
- Development server can receive and respond to arbitrary requests
- Potential information disclosure during development

**Fix**:
```bash
npm install vite@latest --save-dev
```
(This will update esbuild as a transitive dependency)

**Status**: ⚠️ NEEDS FIX  
**Risk in Production**: 🔵 LOW (only affects dev server)

---

## 2. Code Vulnerabilities

### 🟠 High: Cross-Site Scripting (XSS) - User Name Input

**Location**: `js/questionnaire-wizard.js:853`  
**Severity**: HIGH  
**Type**: Stored/Reflected XSS

**Vulnerable Code**:
```javascript
resultContent.innerHTML = `
  <p class="result-subtitle">We suggest <strong>${recommendation.meal}</strong> for ${this.formData.name}.</p>
  <p class="result-description">${recommendation.reason}</p>
  <p class="result-whatsapp">You will be contacted soon via WhatsApp at <strong>${this.formData.phone}</strong>.</p>
`;
```

**Vulnerability**:
User-controlled input (`this.formData.name` and `this.formData.phone`) is inserted directly into HTML without sanitization.

**Attack Vector**:
```javascript
// Malicious user enters:
name: '<img src=x onerror="alert(document.cookie)">'
// Result: JavaScript code execution
```

**Impact**:
- Cookie theft
- Session hijacking
- Malicious redirects
- Keylogging
- Defacement

**Fix**:
```javascript
// Option 1: Use textContent (recommended)
const nameEl = document.createElement('strong');
nameEl.textContent = this.formData.name;

// Option 2: HTML escape function
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

resultContent.innerHTML = `
  <p class="result-subtitle">We suggest <strong>${recommendation.meal}</strong> for ${escapeHtml(this.formData.name)}.</p>
  <p class="result-whatsapp">You will be contacted soon via WhatsApp at <strong>${escapeHtml(this.formData.phone)}</strong>.</p>
`;
```

**Status**: 🔴 CRITICAL - NEEDS IMMEDIATE FIX

---

### 🟠 High: Cross-Site Scripting (XSS) - Allergies Input

**Location**: `js/questionnaire-wizard.js:644-648`  
**Severity**: HIGH  
**Type**: Stored XSS

**Vulnerable Code**:
```javascript
tagContainer.innerHTML = this.formData.allergies.map(allergy => `
  <span class="tag">
    ${allergy}
    <button type="button" class="tag-remove" data-allergy="${allergy}" aria-label="Remove ${allergy}">×</button>
  </span>
`).join('');
```

**Vulnerability**:
User-entered allergies are rendered as HTML without sanitization in THREE places:
1. Tag content
2. `data-allergy` attribute
3. `aria-label` attribute

**Attack Vector**:
```javascript
// Malicious user enters allergy:
'"><script>alert("XSS")</script><span class="'
// Results in code execution
```

**Impact**:
- Same as above XSS vulnerability
- Can affect multiple users if allergies are shared/displayed

**Fix**:
```javascript
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

tagContainer.innerHTML = this.formData.allergies.map(allergy => {
  const safe = escapeHtml(allergy);
  return `
    <span class="tag">
      ${safe}
      <button type="button" class="tag-remove" data-allergy="${safe}" aria-label="Remove ${safe}">×</button>
    </span>
  `;
}).join('');
```

**Status**: 🔴 CRITICAL - NEEDS IMMEDIATE FIX

---

### 🟡 Moderate: XSS in Dynamic Pet Name Display

**Location**: `js/questionnaire-wizard.js:117` (wizard structure), `js/questionnaire-wizard.js:527`  
**Severity**: MODERATE  
**Type**: Reflected XSS

**Vulnerable Code**:
```javascript
// Dynamic pet name insertion in slide titles
el.textContent = this.formData.name || (id.includes('2') || id.includes('3') || id.includes('5') ? 'their' : 'your pet');
```

**Good News**: ✅ This one uses `textContent` which is safe!

**However**, the wizard structure is created with:
```javascript
modalContent.innerHTML = ` ... ${this.formData.name} ... `;
```

**Status**: ⚠️ Partially Safe - Review all dynamic name insertions

---

### 🟡 Moderate: Breed List Rendering

**Location**: `js/questionnaire-wizard.js:551`  
**Severity**: MODERATE (but likely safe due to controlled input)

**Code**:
```javascript
breedList.innerHTML = filtered.map(breed => `
  <div class="breed-item" role="option" tabindex="0">${breed}</div>
`).join('');
```

**Analysis**:
- Breeds come from predefined arrays (`CAT_BREEDS`, `DOG_BREEDS`)
- Not user input, so likely safe
- However, best practice is to still escape

**Recommendation**: Add HTML escaping for defense-in-depth

**Status**: 🟢 LOW RISK - But should still escape

---

### 🔵 Low: Phone Number Validation

**Location**: `js/questionnaire-wizard.js:713-722`  
**Severity**: LOW  
**Type**: Input Validation

**Code**:
```javascript
validateSlide4() {
  // Phone validation - basic E.164 check
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  const isPhoneValid = phoneRegex.test(this.formData.phone || '');
  // ...
}
```

**Issue**:
- Basic regex doesn't prevent all malicious input
- No length limit enforcement
- No sanitization before display

**Recommendation**:
- Add maxlength attribute to input
- Sanitize before displaying
- Consider using a phone validation library

**Status**: ⚠️ SHOULD FIX (when fixing other XSS issues)

---

### 🔵 Low: localStorage Usage

**Location**: Multiple files  
**Severity**: LOW  
**Type**: Information Disclosure

**Usage**:
```javascript
localStorage.setItem('pkq_seen', Date.now().toString());
```

**Issues**:
- localStorage is accessible to all scripts (including malicious ones from XSS)
- Not encrypted
- Persists across sessions

**Current Risk**: 🔵 LOW
- Only storing non-sensitive timestamp
- No PII in localStorage

**Recommendation**:
- ✅ Good: Not storing sensitive data
- Keep it this way - never store PII, tokens, or secrets in localStorage

**Status**: ✅ ACCEPTABLE (current usage is safe)

---

## 3. Missing Security Headers

### 🔵 Low: No Content Security Policy (CSP)

**Issue**: HTML files don't include CSP headers  
**Risk**: Makes XSS exploitation easier

**Recommendation**:
Add to all HTML files in `<head>`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self'; 
  script-src 'self'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' https://images.pexels.com data:; 
  connect-src 'self';
  font-src 'self';
">
```

Or configure in server headers (preferred).

---

## 4. Remediation Summary

### Immediate Actions Required (Critical/High)

#### 1. Create HTML Sanitization Utility
Add to `js/app.js` or create `js/utils.js`:

```javascript
// HTML Escape Function
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Make available globally
window.escapeHtml = escapeHtml;
```

#### 2. Fix XSS in questionnaire-wizard.js

**Line 644-648** (Allergies):
```javascript
tagContainer.innerHTML = this.formData.allergies.map(allergy => {
  const safe = escapeHtml(allergy);
  return `
    <span class="tag">
      ${safe}
      <button type="button" class="tag-remove" data-allergy="${safe}" aria-label="Remove ${safe}">×</button>
    </span>
  `;
}).join('');
```

**Line 852-856** (Results):
```javascript
resultContent.innerHTML = `
  <p class="result-subtitle">We suggest <strong>${recommendation.meal}</strong> for ${escapeHtml(this.formData.name)}.</p>
  <p class="result-description">${recommendation.reason}</p>
  <p class="result-whatsapp">You will be contacted soon via WhatsApp at <strong>${escapeHtml(this.formData.phone)}</strong>.</p>
`;
```

**Line 551** (Breed list - defense in depth):
```javascript
breedList.innerHTML = filtered.map(breed => `
  <div class="breed-item" role="option" tabindex="0">${escapeHtml(breed)}</div>
`).join('');
```

#### 3. Update Dependencies
```bash
npm install vite@latest --save-dev
npm audit fix
```

### Recommended Actions (Moderate/Low)

#### 1. Add Input Validation Attributes
```html
<input 
  type="text" 
  id="petName" 
  maxlength="50"
  pattern="[a-zA-Z0-9\s'-]+"
  required
>

<input 
  type="tel" 
  id="phone" 
  maxlength="15"
  pattern="^\+?[1-9]\d{1,14}$"
  required
>
```

#### 2. Add Content Security Policy
See section above for CSP meta tag.

#### 3. Implement Rate Limiting
Consider adding rate limiting for form submissions to prevent abuse.

---

## 5. Testing Recommendations

### XSS Testing Payloads
Test with these inputs to verify fixes:

```javascript
// Pet Name
'<script>alert("XSS")</script>'
'<img src=x onerror="alert(1)">'
'"><script>alert(String.fromCharCode(88,83,83))</script>'

// Allergies
'<svg/onload=alert(1)>'
'" onclick="alert(1)"'
'javascript:alert(1)'

// Phone
'+1<script>alert(1)</script>'
```

After fixes, these should display as plain text, not execute.

---

## 6. Security Checklist

- [ ] Install HTML sanitization function
- [ ] Fix XSS in allergies rendering
- [ ] Fix XSS in results display
- [ ] Add HTML escaping to breed list
- [ ] Update Vite to latest version
- [ ] Run `npm audit fix`
- [ ] Add input maxlength attributes
- [ ] Add Content Security Policy
- [ ] Test with XSS payloads
- [ ] Review all innerHTML usages
- [ ] Enable HTTPS in production
- [ ] Configure security headers on server

---

## 7. Additional Recommendations

### Future Enhancements
1. **Input Validation Library**: Consider using a library like DOMPurify for robust sanitization
2. **Form Validation**: Use HTML5 constraints and client-side validation
3. **HTTPS Only**: Ensure production uses HTTPS
4. **Security Headers**: Configure server to send security headers
5. **Regular Audits**: Run `npm audit` monthly
6. **Dependency Updates**: Keep dependencies updated
7. **Code Reviews**: Review all user input handling

### Security Best Practices
- ✅ Never trust user input
- ✅ Always escape output
- ✅ Use `textContent` instead of `innerHTML` when possible
- ✅ Validate input on both client and server
- ✅ Keep dependencies updated
- ✅ Use Content Security Policy
- ✅ Enable HTTPS in production

---

## 8. Priority Matrix

| Vulnerability | Severity | Effort | Priority | Deadline |
|--------------|----------|--------|----------|----------|
| XSS - Allergies | HIGH | Low | 🔴 Critical | ASAP |
| XSS - Name/Phone | HIGH | Low | 🔴 Critical | ASAP |
| Update Vite | MODERATE | Low | 🟡 High | 1 week |
| Add CSP | LOW | Low | 🔵 Medium | 2 weeks |
| Input Validation | LOW | Medium | 🔵 Medium | 2 weeks |

---

## Conclusion

The website has **2 critical XSS vulnerabilities** that should be fixed immediately before production deployment. The good news is that all fixes are straightforward and can be implemented quickly.

**Estimated Time to Fix All Issues**: 2-4 hours

**Next Steps**:
1. Implement HTML escaping function
2. Apply escaping to all user inputs
3. Update dependencies
4. Test with XSS payloads
5. Deploy fixes

---

**Audit Completed**: October 21, 2025  
**Status**: ⚠️ NEEDS ATTENTION  
**Re-audit Recommended**: After fixes are applied

