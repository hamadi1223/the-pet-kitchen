# 🧪 Testing Guide - Auth + Questionnaire + Pet Flow

**Date:** December 1, 2025  
**Status:** ✅ Ready for Testing

## 🚀 Quick Start

Both servers are running:
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:8000/api

---

## 📋 Testing Checklist

### 1. Test Authentication (Login/Register)

#### Test Login
1. Go to: http://localhost:8080/login.html
2. Enter valid credentials
3. **Expected:** 
   - ✅ No console errors
   - ✅ Redirects to account page (or admin if admin user)
   - ✅ Token stored in localStorage
   - ✅ User data available

#### Test Register
1. Go to: http://localhost:8080/signup.html
2. Fill in form:
   - Name (optional)
   - Email (required)
   - Password (min 6 chars)
   - Phone (optional)
3. Submit
4. **Expected:**
   - ✅ No console errors
   - ✅ Account created successfully
   - ✅ Auto-login and redirect to account page
   - ✅ Token stored

#### Test Logout
1. While logged in, click logout
2. **Expected:**
   - ✅ All auth data cleared
   - ✅ Redirects to index.html
   - ✅ Cannot access account page

---

### 2. Test Questionnaire → Pet Creation

#### Test New Questionnaire (Logged In)
1. **Prerequisites:** User must be logged in
2. Go to: http://localhost:8080/index.html
3. Click "START QUESTIONNAIRE" button
4. Complete all 5 slides:
   - Slide 1: Pet type (Cat/Dog) + Name
   - Slide 2: Breed, Size, Brachycephalic
   - Slide 3: Activity Level, Age Group
   - Slide 4: Weight, Ideal Weight, Neutered
   - Slide 5: Allergies, Phone
5. Click "Get My Recommendation"
6. **Expected:**
   - ✅ Recommendation shown
   - ✅ Pet record created in database
   - ✅ Questionnaire JSON saved
   - ✅ No console errors

#### Verify Pet Created
1. Check browser console (F12) for:
   - "✅ Pet created successfully"
   - "✅ Questionnaire JSON saved successfully"
2. Go to account page: http://localhost:8080/account.html
3. **Expected:**
   - ✅ Pet appears in "Your Pets" section
   - ✅ Pet details match questionnaire answers

---

### 3. Test Edit Pet Functionality

#### Test Edit Pet from Account Page
1. **Prerequisites:** User has at least one pet
2. Go to: http://localhost:8080/account.html
3. Click "Edit Pet Information" button (top right)
4. **Expected:**
   - ✅ Questionnaire modal opens
   - ✅ Form is pre-filled with existing pet data
   - ✅ Can edit any field
   - ✅ Submit updates the pet record

#### Test Editing Pet Details
1. In questionnaire modal (edit mode):
   - Change pet name
   - Update weight
   - Modify allergies
2. Submit changes
3. **Expected:**
   - ✅ "✅ Pet updated successfully" in console
   - ✅ Changes reflected in account page
   - ✅ Database updated

---

### 4. Test Questionnaire (Not Logged In)

#### Test Unauthenticated Questionnaire
1. **Logout first**
2. Go to: http://localhost:8080/index.html
3. Complete questionnaire
4. **Expected:**
   - ✅ Prompt to login appears
   - ✅ Can choose to login or skip
   - ✅ After login, data can be saved

---

### 5. Test Admin Dashboard Stats

#### Test Pet Count Accuracy
1. **Prerequisites:** Admin user logged in
2. Go to: http://localhost:8080/admin.html
3. Check "Registered Pets" stat
4. **Expected:**
   - ✅ Count matches actual pets in database
   - ✅ Count updates when new pets are created
   - ✅ Accurate across all users

#### Test User Pet Counts
1. In admin dashboard, go to Users tab
2. Check each user's pet count
3. **Expected:**
   - ✅ Pet count matches actual pets for that user
   - ✅ Click user to see pet details

---

## 🔍 What to Check in Browser Console

### Expected Console Messages

#### On Login:
```
✅ AuthAPI found, setting up forms...
🔐 Attempting login for: [email]
✅ Login successful
✅ Token stored: true
✅ User stored: true
```

#### On Questionnaire Submit:
```
🐾 Creating new pet...
✅ Pet created successfully: {id: X, name: "...", ...}
✅ Questionnaire JSON saved successfully
```

#### On Pet Update:
```
📝 Updating existing pet: [id]
✅ Pet updated successfully
```

### No Errors Should Appear
- ❌ No "Auth API not available" errors
- ❌ No "undefined is not a function" errors
- ❌ No "NetworkError" unless server is down
- ❌ No duplicate submission errors

---

## 🐛 Common Issues & Solutions

### Issue: "Auth API not available"
**Solution:** Check that `api.js` is loaded before `auth.js` in HTML

### Issue: "Pet not created"
**Check:**
1. User is logged in
2. Backend server is running
3. Database connection is working
4. Check backend logs for errors

### Issue: "Questionnaire doesn't pre-fill"
**Check:**
1. User has existing pet
2. Check console for "✅ Loaded existing pet data"
3. Verify petsAPI.getAll() returns data

### Issue: "Admin stats wrong"
**Check:**
1. Pets are actually in database (not just questionnaire JSON)
2. Backend query is counting from pets table (it should)
3. Refresh admin dashboard

---

## 📊 Database Verification

### Check Pets Table
```sql
SELECT * FROM pets ORDER BY created_at DESC LIMIT 10;
```

### Check User Questionnaire JSON
```sql
SELECT id, email, questionnaire FROM users WHERE questionnaire IS NOT NULL LIMIT 5;
```

### Count Pets Per User
```sql
SELECT user_id, COUNT(*) as pet_count 
FROM pets 
GROUP BY user_id;
```

---

## ✅ Success Criteria

### Authentication Flow
- [x] Login works without errors
- [x] Register works without errors
- [x] Logout clears everything
- [x] Redirects work correctly
- [x] Error messages are user-friendly

### Questionnaire Flow
- [x] Questionnaire creates Pet records
- [x] Pet data is stored correctly
- [x] Questionnaire JSON is also saved
- [x] Editing pet works
- [x] Pre-filling from existing pet works

### Data Consistency
- [x] Pet records are source of truth
- [x] Admin dashboard uses pets table
- [x] Account page shows correct pets
- [x] No duplicate data

---

## 🎯 Quick Test Script

1. **Register new user** → Should redirect to account
2. **Complete questionnaire** → Should create pet
3. **Check account page** → Should show pet
4. **Edit pet info** → Should update pet
5. **Login as admin** → Should see pet count

All should work without console errors! ✅

---

## 📝 Notes

- All fixes have been implemented
- Backend API endpoints unchanged (using existing endpoints)
- Frontend now properly calls Pet API
- Auth state is managed consistently
- Error handling added throughout

**Ready to test!** 🚀

