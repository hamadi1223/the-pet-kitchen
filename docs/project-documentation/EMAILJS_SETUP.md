# 📧 EmailJS Integration Setup Guide

## ✅ What's Been Installed

EmailJS has been fully integrated into your Pet Kitchen website. When a user completes the questionnaire, you'll automatically receive an email with all their details and the meal recommendation.

---

## 🔧 Setup Steps (5 Minutes)

### **Step 1: Get Your EmailJS Credentials**

1. Go to your **EmailJS Dashboard**: https://dashboard.emailjs.com/
2. If you haven't created an account, sign up (it's free for up to 200 emails/month)

---

### **Step 2: Create an Email Service**

1. In the EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (recommended for personal)
   - **Outlook/Hotmail**
   - **Yahoo**
   - Or use a custom SMTP service
4. Follow the connection steps
5. **Copy your Service ID** (e.g., `service_abc123`)

---

### **Step 3: Create an Email Template**

1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Set up the template:

#### **Template Name:** 
`Pet Kitchen Questionnaire`

#### **Subject:**
```
New Pet Food Inquiry from {{pet_name}}'s Owner
```

#### **Email Body:**
```html
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h2 { color: #C6A769; border-bottom: 2px solid #C6A769; padding-bottom: 10px; }
    .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
    .label { font-weight: bold; color: #555; }
    .value { color: #000; }
    .highlight { background: #FFF8E7; padding: 15px; border-left: 4px solid #C6A769; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="color: #000;">🐾 New Pet Kitchen Inquiry</h1>
    
    <div class="section">
      <h2>📞 Contact Information</h2>
      <p><span class="label">Owner Name:</span> <span class="value">{{owner_name}}</span></p>
      <p><span class="label">Phone (WhatsApp):</span> <span class="value">{{phone}}</span></p>
      <p><span class="label">Email:</span> <span class="value">{{email}}</span></p>
    </div>
    
    <div class="section">
      <h2>🐕 Pet Details</h2>
      <p><span class="label">Pet Name:</span> <span class="value">{{pet_name}}</span></p>
      <p><span class="label">Pet Type:</span> <span class="value">{{pet_type}}</span></p>
      <p><span class="label">Age Group:</span> <span class="value">{{age_group}}</span></p>
      <p><span class="label">Weight:</span> <span class="value">{{weight}}</span></p>
      <p><span class="label">Activity Level:</span> <span class="value">{{activity_level}}</span></p>
      <p><span class="label">Neutered/Spayed:</span> <span class="value">{{neutered}}</span></p>
      <p><span class="label">Allergies:</span> <span class="value">{{allergies}}</span></p>
    </div>
    
    <div class="highlight">
      <h2 style="margin-top: 0;">✨ Our Recommendation</h2>
      <p><strong>Suggested Meal:</strong> {{recommended_meal}}</p>
      <p><strong>Reason:</strong> {{recommendation_reason}}</p>
      
      <h3 style="color: #C6A769;">📊 Feeding Guide:</h3>
      <ul>
        <li><strong>Daily Amount:</strong> {{daily_grams}} grams</li>
        <li><strong>Pouches per Day:</strong> {{daily_pouches}} × 120g pouches</li>
        <li><strong>Meals per Day:</strong> {{meals_per_day}}</li>
        <li><strong>Per Meal:</strong> {{grams_per_meal}} grams</li>
      </ul>
    </div>
    
    <div class="section">
      <p><span class="label">Submission Date:</span> {{submission_date}} at {{submission_time}}</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #777; font-size: 12px; text-align: center;">
      This inquiry was submitted through The Pet Kitchen website questionnaire.
    </p>
  </div>
</body>
</html>
```

4. Click **Save**
5. **Copy your Template ID** (e.g., `template_xyz789`)

---

### **Step 4: Get Your Public Key**

1. Go to **Account** → **General** in the EmailJS dashboard
2. Find the **Public Key** section
3. **Copy your Public Key** (e.g., `your_public_key_here`)

---

### **Step 5: Update Your Configuration File**

1. Open the file: **`/js/emailjs-config.js`**
2. Replace the placeholder values with your actual credentials:

```javascript
const EMAILJS_CONFIG = {
  publicKey: 'YOUR_PUBLIC_KEY_HERE',        // ← Paste your public key
  serviceID: 'YOUR_SERVICE_ID_HERE',        // ← Paste your service ID
  templateID: 'YOUR_TEMPLATE_ID_HERE'       // ← Paste your template ID
};
```

**Example:**
```javascript
const EMAILJS_CONFIG = {
  publicKey: 'AbCdEfGh123456',
  serviceID: 'service_abc123',
  templateID: 'template_xyz789'
};
```

3. **Save the file**

---

## 🧪 Testing

### **Test the Integration:**

1. **Refresh** your website (hard refresh: Cmd + Shift + R)
2. Click **"START QUESTIONNAIRE"**
3. Fill out the form completely
4. Submit the questionnaire
5. Check your email inbox (and spam folder just in case)

### **Check Console for Errors:**

1. Open **Developer Tools** (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Look for:
   - ✅ `Email sent successfully!` (success)
   - ❌ Error messages (if something went wrong)

---

## 📊 What Data is Sent

Every submission includes:

### **Contact Info:**
- Owner name
- Phone (WhatsApp)
- Email (if collected)

### **Pet Details:**
- Pet name
- Pet type (Cat/Dog)
- Age group
- Weight
- Activity level
- Neutered status
- Allergies

### **Recommendation:**
- Suggested meal
- Reason for recommendation
- Daily grams
- Pouches per day
- Meals per day
- Grams per meal

### **Metadata:**
- Submission date
- Submission time

---

## 💰 EmailJS Pricing

- **Free Tier:** 200 emails/month
- **Personal Plan:** $7/month for 1,000 emails
- **Professional Plan:** $15/month for 5,000 emails

For a small business, the free tier is usually sufficient to start!

---

## 🔒 Security Note

Your EmailJS credentials are safe:
- The **Public Key** is meant to be public (it's OK in frontend code)
- EmailJS handles authentication securely
- Rate limiting prevents abuse
- Your actual email password is **never** exposed

---

## 🚨 Troubleshooting

### **Email not sending?**

1. **Check Console:**
   - Open Developer Tools → Console
   - Look for error messages

2. **Common Issues:**
   - ❌ **"Invalid public key"** → Check if you copied the correct public key
   - ❌ **"Service not found"** → Verify your Service ID
   - ❌ **"Template not found"** → Verify your Template ID
   - ❌ **"Request failed"** → Check your internet connection

3. **Verify EmailJS Dashboard:**
   - Make sure your service is **connected** (green checkmark)
   - Make sure your template is **active**

4. **Test in EmailJS Dashboard:**
   - Go to your template
   - Click **"Test It"**
   - If it works there but not on your site, it's a config issue

### **Email going to spam?**

- Check your spam folder
- Add your sending email to contacts
- Use a professional email service (Gmail recommended)

---

## 📝 Next Steps

1. **Set up Email Notifications:**
   - Configure your email to forward questionnaire submissions to your phone
   - Set up a dedicated folder/label for Pet Kitchen inquiries

2. **Response Template:**
   - Create a WhatsApp message template for quick responses
   - Include pricing, delivery info, and next steps

3. **Track Conversions:**
   - Keep a spreadsheet of submissions
   - Track conversion rates
   - Follow up within 24 hours for best results

---

## 🎉 You're All Set!

Once you've updated the config file with your credentials, your website will automatically send you an email every time someone completes the questionnaire.

**Questions?** Check the EmailJS documentation: https://www.emailjs.com/docs/

---

**Last Updated:** October 23, 2025

