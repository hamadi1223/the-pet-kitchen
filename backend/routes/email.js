const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  sendOrderConfirmationToUser,
  sendNewOrderNotificationToOwner,
  sendPasswordResetEmail,
  sendAccountConfirmationEmail,
  sendEmail
} = require('../services/email');
const {
  getBaseEmailTemplate,
  generateSection,
  generateDetailRow,
  generateRecommendation,
  generateMetricsGrid
} = require('../services/emailBase');

const router = express.Router();

// Questionnaire Email Template (Reference Design)
function getQuestionnaireEmailTemplate(formData, recommendation) {
  const submissionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const submissionTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Build pet information section
  const petInfoRows = [
    generateDetailRow('Name', formData.pet_name || 'N/A'),
    generateDetailRow('Type', formData.pet_type || 'N/A'),
    generateDetailRow('Breed', formData.breed || 'N/A'),
    ...(formData.size && formData.size !== 'N/A' ? [generateDetailRow('Size', formData.size.charAt(0).toUpperCase() + formData.size.slice(1))] : []),
    generateDetailRow('Age Group', formData.age || 'N/A'),
    generateDetailRow('Weight', formData.weight || 'N/A'),
    ...(formData.ideal_weight && formData.ideal_weight !== 'N/A' ? [generateDetailRow('Ideal Weight', formData.ideal_weight)] : []),
    generateDetailRow('Activity Level', formData.activity_level || 'N/A'),
    generateDetailRow('Neutered/Spayed', formData.neutered || 'N/A'),
    ...(formData.brachycephalic ? [generateDetailRow('Brachycephalic', formData.brachycephalic)] : []),
    generateDetailRow('Allergies', formData.allergies || 'None')
  ].join('');

  // Build owner information section
  const ownerInfoRows = [
    ...(formData.owner_name && formData.owner_name !== 'Not provided' ? [generateDetailRow('Name', formData.owner_name)] : []),
    generateDetailRow('Email', formData.email || 'N/A'),
    generateDetailRow('Phone', formData.phone || 'N/A')
  ].join('');

  // Build recommendation section with metrics grid
  let recommendationContent = '';
  if (recommendation) {
    const metrics = [
      { value: recommendation.daily?.grams || 'N/A', label: 'Daily Grams' },
      { value: recommendation.daily?.pouches || 'N/A', label: 'Pouches/Day' },
      { value: recommendation.daily?.mealsPerDay || 'N/A', label: 'Meals/Day' },
      { value: recommendation.daily?.gramsPerMeal || 'N/A', label: 'Grams/Meal' }
    ];
    
    recommendationContent = generateRecommendation('✨ Our Recommendation', `
      ${generateDetailRow('Suggested Meal', recommendation.meal || 'N/A')}
      ${generateDetailRow('Reason', recommendation.reason || 'N/A')}
      ${generateMetricsGrid(metrics)}
    `);
  }

  // Build main content
  const content = `
    ${generateDetailRow('Submission Date', `${submissionDate} at ${submissionTime}`)}
    
    ${generateSection('🐕 Pet Details', petInfoRows)}
    
    ${generateSection('📞 Contact Information', ownerInfoRows)}
    
    ${recommendationContent}
  `;

  return getBaseEmailTemplate({
    title: '🐾 The Pet Kitchen',
    tagline: 'New Pet Food Inquiry',
    preheader: `New inquiry from ${formData.pet_name || 'a customer'} - ${formData.pet_type || 'pet'}`,
    content: content,
    footerText: 'This inquiry was submitted through The Pet Kitchen website questionnaire.'
  });
}

// Send account confirmation email
router.post('/account-confirmation', [
  body('email').isEmail().normalizeEmail(),
  body('name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const { email, name } = req.body;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    
    const result = await sendAccountConfirmationEmail(email, name || 'Valued Customer', frontendUrl);
    
    if (result.success) {
      res.json({ success: true, message: 'Account confirmation email sent' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Account confirmation email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send questionnaire email (to admin)
router.post('/questionnaire', [
  body('formData').isObject(),
  body('recommendation').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const { formData, recommendation } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.OUTLOOK_EMAIL;
    
    if (!adminEmail) {
      return res.status(500).json({ error: 'Admin email not configured' });
    }
    
    // Map formData fields to match email template expectations
    // formData uses: name, petType, breed, ageGroup, weightValue, weightUnit, activity, neutered, allergies, phone, email
    // Template expects: pet_name, pet_type, breed, age, weight, activity_level, neutered, allergies, phone, email
    const mappedFormData = {
      pet_name: formData.name || formData.pet_name || 'Unnamed Pet',
      pet_type: (formData.petType || formData.pet_type || '').charAt(0).toUpperCase() + (formData.petType || formData.pet_type || '').slice(1) || 'N/A',
      breed: formData.breed || formData.customBreed || 'Not specified',
      age: formData.ageGroup || formData.age || 'N/A',
      weight: formData.weightValue ? 
        `${formData.weightValue} ${formData.weightUnit || 'kg'}` : 
        (formData.weight || 'N/A'),
      activity_level: formData.activity || formData.activity_level || 'N/A',
      neutered: formData.neutered === 'yes' ? 'Yes' : (formData.neutered === 'no' ? 'No' : 'N/A'),
      allergies: formData.allergies && Array.isArray(formData.allergies) ? 
        formData.allergies.join(', ') : 
        (formData.allergies || 'None'),
      phone: formData.phone || 'Not provided',
      email: formData.email || 'Not provided',
      owner_name: formData.owner_name || formData.name || 'Not provided',
      size: formData.size || 'N/A',
      brachycephalic: formData.brachycephalic ? 'Yes' : 'No',
      ideal_weight: formData.idealWeightValue ? 
        `${formData.idealWeightValue} ${formData.weightUnit || 'kg'}` : 
        'N/A'
    };
    
    console.log('📧 Sending questionnaire email with data:', mappedFormData);
    
    const html = getQuestionnaireEmailTemplate(mappedFormData, recommendation);
    const subject = `New Pet Food Inquiry - ${mappedFormData.pet_name} (${mappedFormData.pet_type})`;
    
    const result = await sendEmail(adminEmail, subject, html);
    
    if (result.success) {
      console.log('✅ Questionnaire email sent successfully to', adminEmail);
      res.json({ success: true, message: 'Questionnaire email sent' });
    } else {
      console.error('❌ Failed to send questionnaire email:', result.error);
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Questionnaire email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send order confirmation email (public endpoint, called from frontend)
router.post('/order-confirmation', [
  body('orderData').isObject(),
  body('orderData.email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const { orderData } = req.body;
    
    // Format data for email service
    const order = {
      id: orderData.order_number || orderData.id,
      created_at: orderData.order_date || new Date(),
      status: orderData.order_status || orderData.status || 'paid',
      total_amount: orderData.total || 0,
      payment_reference: orderData.invoice_id || orderData.payment_invoice_id,
      payment_invoice_id: orderData.invoice_id || orderData.payment_invoice_id
    };
    
    const user = {
      name: orderData.customer_name || orderData.name,
      email: orderData.customer_email || orderData.email
    };
    
    const items = (orderData.items || []).map(item => ({
      product_name: item.product_name || item.name,
      quantity: item.quantity || 1,
      unit_price: item.price || item.unit_price || 0
    }));
    
    const result = await sendOrderConfirmationToUser(order, user, items);
    
    if (result.success) {
      res.json({ success: true, message: 'Order confirmation email sent' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Order confirmation email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send new order notification email (to admin)
router.post('/new-order-notification', [
  body('orderData').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const { orderData } = req.body;
    
    // Format data for email service
    const order = {
      id: orderData.order_number || orderData.id,
      created_at: orderData.order_date || new Date(),
      status: orderData.order_status || orderData.status || 'paid',
      total_amount: orderData.total || 0,
      payment_reference: orderData.invoice_id || orderData.payment_invoice_id,
      payment_invoice_id: orderData.invoice_id || orderData.payment_invoice_id
    };
    
    const user = {
      name: orderData.customer_name || orderData.name,
      email: orderData.customer_email || orderData.email,
      phone: orderData.customer_phone || orderData.phone
    };
    
    const items = (orderData.items || []).map(item => ({
      product_name: item.product_name || item.name,
      quantity: item.quantity || 1,
      unit_price: item.price || item.unit_price || 0
    }));
    
    const result = await sendNewOrderNotificationToOwner(order, user, items);
    
    if (result.success) {
      res.json({ success: true, message: 'New order notification email sent' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('New order notification email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;

