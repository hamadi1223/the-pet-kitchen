// Email Configuration - Now using Outlook SMTP via Backend API
// This file maintains backward compatibility for questionnaire emails

const EMAIL_SENDING_ENABLED = true; // Set to false to disable all emails

// Function to send questionnaire data via Backend API (Outlook SMTP)
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

// Export for global use
if (typeof window !== 'undefined') {
  window.sendQuestionnaireEmail = sendQuestionnaireEmail;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendQuestionnaireEmail
  };
}
