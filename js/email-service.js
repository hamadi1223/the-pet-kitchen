// Email Service - Handles all email notifications via Backend API (Outlook SMTP)
// All emails are now sent through the backend using Outlook SMTP

const EMAIL_SENDING_ENABLED = true; // Set to false to disable all emails

/**
 * Send account confirmation email to customer
 * Called when a new account is created
 */
async function sendAccountConfirmationEmail(userData) {
  if (!EMAIL_SENDING_ENABLED) {
    console.info('📪 Account confirmation email skipped (testing mode).');
    return { success: true, skipped: true };
  }

  try {
    const token = window.getToken ? window.getToken() : null;
    const apiBase = window.API_BASE_URL || '/api/v1';
    
    const response = await fetch(`${apiBase}/email/account-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        email: userData.email,
        name: userData.name || 'Valued Customer'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to send email' }));
      throw new Error(errorData.error || 'Failed to send account confirmation email');
    }

    const result = await response.json();
    console.log('✅ Account confirmation email sent successfully!');
    return { success: true, ...result };

  } catch (error) {
    console.error('❌ Account confirmation email failed:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send order confirmation email to customer
 * Called when order payment is successful
 */
async function sendOrderConfirmationEmail(orderData) {
  if (!EMAIL_SENDING_ENABLED) {
    console.info('📪 Order confirmation email skipped (testing mode).');
    return { success: true, skipped: true };
  }

  try {
    const token = window.getToken ? window.getToken() : null;
    const apiBase = window.API_BASE_URL || '/api/v1';
    
    const response = await fetch(`${apiBase}/email/order-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        orderData: orderData
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to send email' }));
      throw new Error(errorData.error || 'Failed to send order confirmation email');
    }

    const result = await response.json();
    console.log('✅ Order confirmation email sent successfully!');
    return { success: true, ...result };

  } catch (error) {
    console.error('❌ Order confirmation email failed:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send new order notification to owner/admin
 * Called when a new order is placed and paid
 */
async function sendNewOrderNotificationEmail(orderData) {
  if (!EMAIL_SENDING_ENABLED) {
    console.info('📪 New order notification email skipped (testing mode).');
    return { success: true, skipped: true };
  }

  try {
    const token = window.getToken ? window.getToken() : null;
    const apiBase = window.API_BASE_URL || '/api/v1';
    
    const response = await fetch(`${apiBase}/email/new-order-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        orderData: orderData
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to send email' }));
      throw new Error(errorData.error || 'Failed to send new order notification email');
    }

    const result = await response.json();
    console.log('✅ New order notification email sent successfully!');
    return { success: true, ...result };

  } catch (error) {
    console.error('❌ New order notification email failed:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send questionnaire email to admin
 * Called when questionnaire is completed
 */
async function sendQuestionnaireEmail(formData, recommendation) {
  if (!EMAIL_SENDING_ENABLED) {
    console.info('📪 Questionnaire email skipped (testing mode).');
    return { success: true, skipped: true };
  }

  try {
    const token = window.getToken ? window.getToken() : null;
    const apiBase = window.API_BASE_URL || '/api/v1';
    
    const response = await fetch(`${apiBase}/email/questionnaire`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        formData: formData,
        recommendation: recommendation || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to send email' }));
      throw new Error(errorData.error || 'Failed to send questionnaire email');
    }

    const result = await response.json();
    console.log('✅ Questionnaire email sent successfully!');
    return { success: true, ...result };

  } catch (error) {
    console.error('❌ Questionnaire email failed:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

// Export functions globally
if (typeof window !== 'undefined') {
  window.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
  window.sendNewOrderNotificationEmail = sendNewOrderNotificationEmail;
  window.sendAccountConfirmationEmail = sendAccountConfirmationEmail;
  window.sendQuestionnaireEmail = sendQuestionnaireEmail;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendOrderConfirmationEmail,
    sendNewOrderNotificationEmail,
    sendAccountConfirmationEmail,
    sendQuestionnaireEmail
  };
}
