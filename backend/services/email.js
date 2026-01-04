const nodemailer = require('nodemailer');
const {
  getBaseEmailTemplate,
  generateSection,
  generateDetailRow,
  generateRecommendation,
  generateMetricsGrid,
  generateDivider,
  generateHighlightTip
} = require('./emailBase');

// Outlook SMTP Configuration
const OUTLOOK_EMAIL = process.env.OUTLOOK_EMAIL; // Your Outlook email (e.g., yourname@outlook.com)
const OUTLOOK_PASSWORD = process.env.OUTLOOK_PASSWORD; // Your Outlook password or app password
const OUTLOOK_NAME = process.env.OUTLOOK_NAME || 'The Pet Kitchen'; // Display name for emails
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || OUTLOOK_EMAIL; // Admin email for notifications

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!OUTLOOK_EMAIL || !OUTLOOK_PASSWORD) {
    console.warn('⚠️ Outlook email credentials not configured. Emails will not be sent.');
    return null;
  }

  // Use Office 365 SMTP for Microsoft 365/Entra ID emails
  transporter = nodemailer.createTransport({
    host: 'smtp.office365.com', // Office 365 SMTP server (not smtp-mail.outlook.com)
    port: 587,
    secure: false, // true for 465, false for 587 (STARTTLS)
    auth: {
      user: OUTLOOK_EMAIL,
      pass: OUTLOOK_PASSWORD
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false // Allow self-signed certificates if needed
    }
  });

  return transporter;
}

// Verify transporter connection
async function verifyConnection() {
  const transporter = getTransporter();
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Outlook SMTP connection verified');
    return true;
  } catch (error) {
    console.error('❌ Outlook SMTP connection failed:', error.message);
    return false;
  }
}

// Send email helper function
async function sendEmail(to, subject, html, text = null) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('⚠️ Email transporter not available, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${OUTLOOK_NAME}" <${OUTLOOK_EMAIL}>`,
      to: to,
      subject: subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Plain text version (strip HTML)
      html: html
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

// ==================== EMAIL TEMPLATES ====================

// Order Confirmation Email Template
function getOrderConfirmationTemplate(order, user, items, pet = null) {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const orderTime = new Date(order.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E5E5E5;">${item.product_name || 'Meal Plan'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: right;">${parseFloat(item.unit_price || 0).toFixed(3)} KD</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: right; font-weight: 600;">${parseFloat((item.unit_price || 0) * item.quantity).toFixed(3)} KD</td>
    </tr>
  `).join('');

  const orderDetailsRows = [
    generateDetailRow('Order ID', `#${order.id}`),
    generateDetailRow('Order Date', `${orderDate} at ${orderTime}`),
    generateDetailRow('Status', order.status),
    ...(pet ? [generateDetailRow('Pet', `${pet.name} (${pet.type})`)] : []),
    ...(order.payment_reference ? [generateDetailRow('Payment Reference', order.payment_reference)] : []),
    ...(order.payment_invoice_id ? [generateDetailRow('Invoice ID', order.payment_invoice_id)] : [])
  ].join('');

  const itemsTable = `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #F8F9FA;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #C6A769; color: #333;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #C6A769; color: #333;">Quantity</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #C6A769; color: #333;">Unit Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #C6A769; color: #333;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 16px; text-align: right; font-weight: 700; font-size: 18px; color: #333; border-top: 2px solid #C6A769;">Total:</td>
          <td style="padding: 16px; text-align: right; font-weight: 700; font-size: 20px; color: #C6A769; border-top: 2px solid #C6A769;">${parseFloat(order.total_amount || 0).toFixed(3)} KD</td>
        </tr>
      </tfoot>
    </table>
  `;

  const content = `
    <p class="greeting">Dear ${user.name || user.email},</p>
    <p class="intro">Thank you for your order! We've received your order and are preparing it for delivery.</p>
    
    ${generateSection('📦 Order Details', orderDetailsRows + itemsTable)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">We'll send you another email when your order is ready for delivery.</p>
    <p style="font-size: 16px; color: #555;">If you have any questions, please don't hesitate to contact us.</p>
    
    <p style="font-size: 16px; color: #1a1a1a; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '🐾 The Pet Kitchen',
    tagline: 'Order Confirmation',
    preheader: `Your order #${order.id} has been confirmed. We're preparing it for delivery.`,
    content: content
  });
}

// New Order Notification Template (for admin/owner)
function getNewOrderNotificationTemplate(order, user, items, pet = null) {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const orderTime = new Date(order.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E5E5E5;">${item.product_name || 'Meal Plan'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: right;">${parseFloat(item.unit_price || 0).toFixed(3)} KD</td>
    </tr>
  `).join('');

  const customerRows = [
    generateDetailRow('Name', user.name || 'N/A'),
    generateDetailRow('Email', user.email),
    ...(user.phone ? [generateDetailRow('Phone', user.phone)] : [])
  ].join('');

  const orderRows = [
    generateDetailRow('Order ID', `#${order.id}`),
    generateDetailRow('Order Date', `${orderDate} at ${orderTime}`),
    generateDetailRow('Status', order.status),
    generateDetailRow('Total Amount', `${parseFloat(order.total_amount || 0).toFixed(3)} KD`),
    ...(order.payment_reference ? [generateDetailRow('Payment Reference', order.payment_reference)] : []),
    ...(order.payment_invoice_id ? [generateDetailRow('Payment Invoice ID', order.payment_invoice_id)] : [])
  ].join('');

  const petRows = pet ? [
    generateDetailRow('Name', pet.name || 'N/A'),
    generateDetailRow('Type', pet.type || 'N/A'),
    generateDetailRow('Breed', pet.breed || 'N/A'),
    generateDetailRow('Weight', pet.weight_kg ? `${pet.weight_kg} kg` : 'N/A')
  ].join('') : '';

  const itemsTable = `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #F8F9FA;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #C6A769; color: #333;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #C6A769; color: #333;">Quantity</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #C6A769; color: #333;">Unit Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
    </table>
  `;

    const alertContent = generateHighlightTip(`
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">🔔 New Order #${order.id}</p>
      <p style="margin: 8px 0 0 0; color: #666;">This order has been placed and requires your attention.</p>
    `);

  const content = `
    ${alertContent}
    
    ${generateSection('👤 Customer Information', customerRows)}
    
    ${generateSection('📦 Order Details', orderRows + itemsTable)}
    
    ${pet ? generateSection('🐕 Pet Information', petRows) : ''}
    
    <p style="font-size: 16px; color: #1a1a1a; margin-top: 24px; font-weight: 600;">Please process this order as soon as possible.</p>
  `;

  return getBaseEmailTemplate({
    title: '🔔 New Order Received',
    tagline: 'The Pet Kitchen',
    preheader: `New order #${order.id} - ${parseFloat(order.total_amount || 0).toFixed(3)} KD`,
    content: content,
    showFooterBranding: false
  });
}

// Password Reset Email Template
function getPasswordResetTemplate(userEmail, userName, resetLink, resetToken) {
  const warningContent = generateHighlightTip(`
    <p style="margin: 0 0 12px 0; font-weight: 600; color: #1a1a1a;">⚠️ Important:</p>
    <ul style="margin: 0; padding-left: 20px; color: #666;">
      <li>This link will expire in 1 hour</li>
      <li>If you didn't request this, please ignore this email</li>
      <li>For security, never share this link with anyone</li>
    </ul>
  `);

  const resetDetails = [
    generateDetailRow('Reset Link', `<a href="${resetLink}" style="color: #C6A769; word-break: break-all;">${resetLink}</a>`),
    generateDetailRow('Reset Token', `<code style="font-family: monospace; background: #F8F9FA; padding: 8px 12px; border-radius: 6px; color: #333; font-size: 14px;">${resetToken}</code>`)
  ].join('');

  const content = `
    <p class="greeting">Dear ${userName || userEmail},</p>
    <p class="intro">We received a request to reset your password for your The Pet Kitchen account.</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">Click the button below to reset your password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    
    ${warningContent}
    
    ${generateSection('🔑 Reset Information', resetDetails)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">If the button doesn't work, copy and paste the reset link above into your browser.</p>
    
    <p style="font-size: 16px; color: #1a1a1a; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '🔐 Password Reset',
    tagline: 'The Pet Kitchen',
    preheader: 'Reset your password for your The Pet Kitchen account',
    content: content,
    footerText: 'This is an automated email. Please do not reply to this message. If you have questions, contact us through our website.'
  });
}

// ==================== EMAIL FUNCTIONS ====================

// Send order confirmation to user
async function sendOrderConfirmationToUser(order, user, items, pet = null) {
  try {
    const html = getOrderConfirmationTemplate(order, user, items, pet);
    const subject = `Order Confirmation - Order #${order.id}`;
    
    const result = await sendEmail(user.email, subject, html);
    
    if (result.success) {
      console.log(`✅ Order confirmation email sent to ${user.email}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send new order notification to owner/admin
async function sendNewOrderNotificationToOwner(order, user, items, pet = null) {
  try {
    const html = getNewOrderNotificationTemplate(order, user, items, pet);
    const subject = `🔔 New Order #${order.id} - ${parseFloat(order.total_amount || 0).toFixed(3)} KD`;
    
    const result = await sendEmail(ADMIN_EMAIL, subject, html);
    
    if (result.success) {
      console.log(`✅ New order notification sent to ${ADMIN_EMAIL}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending owner notification:', error.message);
    return { success: false, error: error.message };
  }
}

// Send password reset email to user
async function sendPasswordResetEmail(userEmail, userName, resetToken) {
  try {
    // Get frontend URL from environment or default
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000' || 'https://thepetkitchen.net';
    const resetLink = `${frontendUrl}/reset-password.html?token=${resetToken}`;

    const html = getPasswordResetTemplate(userEmail, userName, resetLink, resetToken);
    const subject = 'Password Reset Request - The Pet Kitchen';
    
    const result = await sendEmail(userEmail, subject, html);
    
    if (result.success) {
      console.log(`✅ Password reset email sent to ${userEmail}`);
      return { success: true, resetLink }; // Return link for testing/fallback
    } else {
      // Even if email fails, return the link for testing
      console.warn('⚠️ Email send failed, but reset link is available:', resetLink);
      return { success: false, error: result.error, resetLink };
    }
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000' || 'https://thepetkitchen.net';
    const resetLink = `${frontendUrl}/reset-password.html?token=${resetToken}`;
    console.log('🔗 Password Reset Link (fallback):', resetLink);
    return { success: false, error: error.message, resetLink };
  }
}

// Verify email service on startup
if (OUTLOOK_EMAIL && OUTLOOK_PASSWORD) {
  verifyConnection().catch(err => {
    console.error('❌ Failed to verify email connection:', err.message);
  });
}

// Welcome Email Template (Enhanced - using base system)
function getWelcomeEmailTemplate(userEmail, userName, websiteUrl) {
  const introContent = `
    <p style="color: #555; margin: 0; font-size: 16px;">
      At The Pet Kitchen, we believe that every pet deserves the best. Our meals are crafted with love, using only the freshest, premium ingredients. We're not just a meal service – we're your partner in ensuring your pet lives a long, healthy, and happy life.
    </p>
  `;

  const benefitsContent = `
    <div style="margin: 20px 0;">
      <div style="display: flex; align-items: flex-start; margin: 16px 0; padding: 16px; background: #FFFBF0; border-radius: 8px;">
        <div style="font-size: 32px; margin-right: 16px; flex-shrink: 0;">🥘</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">Fresh, Premium Ingredients</h3>
          <p style="margin: 0; color: #555; font-size: 15px;">Every meal is prepared with carefully selected, high-quality ingredients that meet our strict nutritional standards.</p>
        </div>
      </div>
      
      <div style="display: flex; align-items: flex-start; margin: 16px 0; padding: 16px; background: #FFFBF0; border-radius: 8px;">
        <div style="font-size: 32px; margin-right: 16px; flex-shrink: 0;">🎯</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">Personalized Meal Plans</h3>
          <p style="margin: 0; color: #555; font-size: 15px;">Our expert nutritionists create customized meal plans based on your pet's unique needs, age, breed, and activity level.</p>
        </div>
      </div>
      
      <div style="display: flex; align-items: flex-start; margin: 16px 0; padding: 16px; background: #FFFBF0; border-radius: 8px;">
        <div style="font-size: 32px; margin-right: 16px; flex-shrink: 0;">📦</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">Convenient Delivery</h3>
          <p style="margin: 0; color: #555; font-size: 15px;">Get fresh meals delivered right to your door on a schedule that works for you and your pet.</p>
        </div>
      </div>
      
      <div style="display: flex; align-items: flex-start; margin: 16px 0; padding: 16px; background: #FFFBF0; border-radius: 8px;">
        <div style="font-size: 32px; margin-right: 16px; flex-shrink: 0;">❤️</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">Made with Love</h3>
          <p style="margin: 0; color: #555; font-size: 15px;">Every recipe is crafted with care, ensuring your pet receives the nutrition they need to thrive.</p>
        </div>
      </div>
    </div>
  `;

  const stepsContent = `
    <div style="margin: 20px 0;">
      <div style="display: flex; align-items: center; margin: 20px 0; padding: 16px;">
        <div style="background: #C6A769; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin-right: 20px; flex-shrink: 0;">1</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 5px 0; color: #333; font-size: 18px;">Complete Your Pet's Profile</h3>
          <p style="margin: 0; color: #555; font-size: 15px;">Tell us about your pet through our quick questionnaire. We'll use this to create personalized recommendations.</p>
        </div>
      </div>
      
      <div style="display: flex; align-items: center; margin: 20px 0; padding: 16px;">
        <div style="background: #C6A769; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin-right: 20px; flex-shrink: 0;">2</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 5px 0; color: #333; font-size: 18px;">Choose Your Meal Plan</h3>
          <p style="margin: 0; color: #555; font-size: 15px;">Browse our selection of premium meal plans and subscriptions that match your pet's nutritional needs.</p>
        </div>
      </div>
      
      <div style="display: flex; align-items: center; margin: 20px 0; padding: 16px;">
        <div style="background: #C6A769; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin-right: 20px; flex-shrink: 0;">3</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 5px 0; color: #333; font-size: 18px;">Receive Fresh Meals</h3>
          <p style="margin: 0; color: #555; font-size: 15px;">Enjoy the convenience of having nutritious, delicious meals delivered to your door regularly.</p>
        </div>
      </div>
      
      <div style="display: flex; align-items: center; margin: 20px 0; padding: 16px;">
        <div style="background: #C6A769; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin-right: 20px; flex-shrink: 0;">4</div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 5px 0; color: #333; font-size: 18px;">Watch Your Pet Thrive</h3>
          <p style="margin: 0; color: #555; font-size: 15px;">See the positive difference in your pet's health, energy, and overall well-being!</p>
        </div>
      </div>
    </div>
  `;

  const contactContent = `
    <p style="margin: 8px 0; color: #555;"><strong>Email:</strong> <a href="mailto:hello@thepetkitchen.net" style="color: #C6A769; text-decoration: none; font-weight: 600;">hello@thepetkitchen.net</a></p>
    <p style="margin: 8px 0; color: #555;"><strong>Phone:</strong> <a href="tel:+96512345678" style="color: #C6A769; text-decoration: none; font-weight: 600;">+965 1234 5678</a></p>
    <p style="margin-top: 15px; color: #888; font-size: 14px; color: #888;">Our friendly team is always ready to assist you and answer any questions about our meal plans and services.</p>
  `;

  const content = `
    <p style="font-size: 20px; color: #333; margin-bottom: 20px; font-weight: 500;">Hello ${userName || 'there'}! 👋</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 24px;">
      We're absolutely thrilled to have you join The Pet Kitchen family! You've taken the first step toward providing your furry friend with the finest, most nutritious meals tailored just for them.
    </p>

    ${generateSection('Why The Pet Kitchen?', introContent)}
    
    <div style="margin: 32px 0;">
      <h2 style="color: #333; font-size: 22px; margin-bottom: 20px;">What Makes Us Special</h2>
      ${benefitsContent}
    </div>

    <div style="background: linear-gradient(135deg, #C6A769 0%, #A8925A 100%); padding: 30px; text-align: center; margin: 40px 0; border-radius: 8px;">
      <h2 style="color: white; margin: 0 0 15px 0; font-size: 26px;">Ready to Get Started?</h2>
      <p style="color: rgba(255, 255, 255, 0.95); margin: 0 0 25px 0; font-size: 16px;">Discover our meal plans and subscriptions designed to keep your pet healthy and happy!</p>
      <a href="${websiteUrl}/meal-plans.html" class="button" style="background: white; color: #C6A769; margin-right: 10px;">Browse Meal Plans →</a>
      <a href="${websiteUrl}/index.html" class="button button-secondary" style="background: transparent; border: 2px solid white; color: white;">Visit Our Website</a>
    </div>

    <div style="margin: 32px 0;">
      <h2 style="color: #333; font-size: 22px; margin-bottom: 20px;">Your Journey Starts Here</h2>
      ${stepsContent}
    </div>

    ${generateSection('Have Questions? We\'re Here to Help!', contactContent)}

    <p style="font-size: 16px; color: #333; margin-top: 40px; text-align: center;">
      <strong>Thank you for choosing The Pet Kitchen!</strong><br>
      We're excited to be part of your pet's wellness journey. 🐾
    </p>

    <p style="color: #555; text-align: center; margin-top: 30px;">
      With love and care,<br>
      <strong style="color: #C6A769;">The Pet Kitchen Team</strong>
    </p>
  `;

  return getBaseEmailTemplate({
    title: '🐾 Welcome to The Pet Kitchen!',
    tagline: 'Fresh, Premium Nutrition for Your Beloved Pets',
    preheader: `Welcome ${userName || 'to The Pet Kitchen'}! Your journey to happier, healthier pets starts here.`,
    content: content,
    footerText: '📍 Kuwait | This is an automated welcome email. You\'re receiving this because you created an account with The Pet Kitchen.'
  });
}

// Send welcome email (new user signup)
async function sendWelcomeEmail(userEmail, userName, websiteUrl = null) {
  try {
    const frontendUrl = websiteUrl || process.env.FRONTEND_URL || 'http://localhost:8000';
    const html = getWelcomeEmailTemplate(userEmail, userName, frontendUrl);
    const subject = '🐾 Welcome to The Pet Kitchen - Your Pet\'s Wellness Journey Starts Here!';
    
    const result = await sendEmail(userEmail, subject, html);
    
    if (result.success) {
      console.log(`✅ Welcome email sent to ${userEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send account confirmation email (legacy function - kept for backwards compatibility)
async function sendAccountConfirmationEmail(userEmail, userName, websiteUrl = null) {
  // Use the new welcome email function
  return await sendWelcomeEmail(userEmail, userName, websiteUrl);
}

// Email Verification Template
function getEmailVerificationTemplate(userEmail, userName, verificationLink, verificationToken) {
  const warningContent = `
    <p style="margin: 0 0 12px 0; font-weight: 600; color: #1a1a1a;">⚠️ Important:</p>
    <ul style="margin: 0; padding-left: 20px; color: #666;">
      <li>This verification link will expire in 24 hours</li>
      <li>If you didn't create an account, please ignore this email</li>
      <li>For security, never share this link with anyone</li>
    </ul>
  `;

  const content = `
    <p class="greeting">Dear ${userName || userEmail},</p>
    <p class="intro">Thank you for signing up with The Pet Kitchen! To complete your registration and ensure you receive important updates, please verify your email address.</p>
    
    <p style="font-size: 16px; color: #555; margin-bottom: 20px;">Click the button below to verify your email:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${verificationLink}" class="button">Verify Email Address</a>
    </div>
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; background: #F8F9FA; padding: 12px; border-radius: 8px; font-size: 14px; margin: 16px 0;">${verificationLink}</p>
    
    ${generateHighlightTip(warningContent)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">If the button doesn't work, you can also use this verification code:</p>
    <p style="font-family: monospace; background: #F8F9FA; padding: 16px; border-radius: 8px; color: #333; font-size: 18px; letter-spacing: 2px; text-align: center; margin: 16px 0;">${verificationToken}</p>
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">Once verified, you'll have full access to your account and can start ordering fresh meals for your pets!</p>
    
    <p style="font-size: 16px; color: #1a1a1a; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '🐾 The Pet Kitchen',
    tagline: 'Verify Your Email Address',
    preheader: 'Complete your registration by verifying your email address',
    content: content,
    footerText: 'If you have questions, contact us through our website.'
  });
}

// Send email verification email
async function sendEmailVerificationEmail(userEmail, userName, verificationToken) {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000' || 'https://thepetkitchen.net';
    const verificationLink = `${frontendUrl}/verify-email.html?token=${verificationToken}`;

    const html = getEmailVerificationTemplate(userEmail, userName, verificationLink, verificationToken);
    const subject = 'Verify Your Email - The Pet Kitchen';
    
    const result = await sendEmail(userEmail, subject, html);
    
    if (result.success) {
      console.log(`✅ Email verification sent to ${userEmail}`);
      return { success: true, verificationLink }; // Return link for testing/fallback
    } else {
      console.warn('⚠️ Email send failed, but verification link is available:', verificationLink);
      return { success: false, error: result.error, verificationLink };
    }
  } catch (error) {
    console.error('❌ Error sending email verification:', error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000' || 'https://thepetkitchen.net';
    const verificationLink = `${frontendUrl}/verify-email.html?token=${verificationToken}`;
    console.log('🔗 Email Verification Link (fallback):', verificationLink);
    return { success: false, error: error.message, verificationLink };
  }
}

// Subscription Expiring Soon Reminder Email Template
function getSubscriptionReminderTemplate(userEmail, userName, subscription, pet) {
  const endDate = new Date(subscription.end_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const daysRemaining = subscription.days_remaining || 0;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
  const renewLink = `${frontendUrl}/subscriptions.html`;

  const subscriptionDetails = [
    generateDetailRow('Plan Type', subscription.plan_type || 'Subscription'),
    generateDetailRow('Expires On', endDate),
    generateDetailRow('Days Remaining', `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`),
    ...(pet ? [generateDetailRow('Pet', `${pet.name || 'N/A'} (${pet.type || 'N/A'})`)] : [])
  ].join('');

  const alertContent = generateHighlightTip(`
    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">⏰ Your subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}!</p>
    <p style="margin: 8px 0 0 0; color: #666;">Don't miss out on fresh, premium meals for ${pet?.name || 'your pet'}. Renew now to continue your subscription.</p>
  `);

  const content = `
    <p class="greeting">Dear ${userName || 'Valued Customer'},</p>
    <p class="intro">We wanted to let you know that your subscription for <strong>${pet?.name || 'your pet'}</strong> is expiring soon.</p>
    
    ${alertContent}
    
    ${generateSection('📋 Subscription Details', subscriptionDetails)}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">To continue receiving fresh, premium meals for your pet, please renew your subscription before it expires.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${renewLink}" class="button">Renew Subscription →</a>
    </div>
    
    <p style="font-size: 16px; color: #555;">If you have any questions or need assistance, please don't hesitate to contact us.</p>
    
    <p style="font-size: 16px; color: #1a1a1a; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '⏰ Subscription Reminder',
    tagline: 'The Pet Kitchen',
    preheader: `Your subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Renew now to continue receiving fresh meals.`,
    content: content,
    footerText: 'This is an automated reminder email. If you have questions, contact us at hello@thepetkitchen.net'
  });
}

// Send subscription expiring reminder email
async function sendSubscriptionReminderEmail(userEmail, userName, subscription, pet) {
  try {
    const html = getSubscriptionReminderTemplate(userEmail, userName, subscription, pet);
    const daysRemaining = subscription.days_remaining || 0;
    const subject = `⏰ Your Pet Kitchen Subscription Expires in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}`;
    
    const result = await sendEmail(userEmail, subject, html);
    
    if (result.success) {
      console.log(`✅ Subscription reminder email sent to ${userEmail}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending subscription reminder email:', error.message);
    return { success: false, error: error.message };
  }
}

// Order Cancelled Email Template
function getOrderCancelledTemplate(order, user, items, pet = null, reason = null) {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const orderDetails = [
    generateDetailRow('Order ID', `#${order.id}`),
    generateDetailRow('Order Date', orderDate),
    generateDetailRow('Total Amount', `${parseFloat(order.total_amount || 0).toFixed(3)} KD`),
    ...(reason ? [generateDetailRow('Reason', reason)] : [])
  ].join('');

  const itemsList = items.map(item => `<li style="margin: 8px 0;">${item.product_name || 'Item'} - ${item.quantity}x</li>`).join('');

  const alertContent = generateHighlightTip(`
    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">❌ Order #${order.id} - Cancelled</p>
    <p style="margin: 8px 0 0 0; color: #666;">Your order has been cancelled.</p>
  `);

  const content = `
    <p class="greeting">Dear ${user.name || user.email},</p>
    <p class="intro">We're writing to inform you that your order has been cancelled.</p>
    
    ${alertContent}
    
    ${generateSection('📦 Order Details', orderDetails)}
    
    ${generateSection('📋 Order Items', `<ul style="margin: 0; padding-left: 20px;">${itemsList}</ul>`)}
    
    ${order.payment_invoice_id ? `
      <p style="font-size: 16px; color: #555; margin-top: 24px;"><strong>Payment Status:</strong> If payment was already processed, a refund will be issued according to our refund policy.</p>
    ` : ''}
    
    <p style="font-size: 16px; color: #555; margin-top: 24px;">If you have any questions about this cancellation, please contact us at <a href="mailto:hello@thepetkitchen.net" style="color: #C6A769; text-decoration: none; font-weight: 600;">hello@thepetkitchen.net</a>.</p>
    
    <p style="font-size: 16px; color: #555;">We apologize for any inconvenience.</p>
    
    <p style="font-size: 16px; color: #1a1a1a; margin-top: 32px;">Best regards,<br><strong style="color: #C6A769;">The Pet Kitchen Team</strong></p>
  `;

  return getBaseEmailTemplate({
    title: '❌ Order Cancelled',
    tagline: 'The Pet Kitchen',
    preheader: `Your order #${order.id} has been cancelled.`,
    content: content
  });
}

// Send order cancelled email
async function sendOrderCancelledEmail(order, user, items, pet = null, reason = null) {
  try {
    const html = getOrderCancelledTemplate(order, user, items, pet, reason);
    const subject = `Order #${order.id} Has Been Cancelled - The Pet Kitchen`;
    
    const result = await sendEmail(user.email, subject, html);
    
    if (result.success) {
      console.log(`✅ Order cancellation email sent to ${user.email}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending order cancellation email:', error.message);
    return { success: false, error: error.message };
  }
}

// Import new email templates
const {
  getPaymentReceivedTemplate,
  getOrderProcessingTemplate,
  getShippingConfirmationTemplate,
  getDeliveredConfirmationTemplate,
  getRefundInitiatedTemplate,
  getRefundCompletedTemplate,
  getAbandonedCartTemplate,
  getBackInStockTemplate,
  getContactFormReceiptTemplate,
  getPaymentFailedAlertTemplate,
  getHighRiskOrderTemplate,
  getLowStockAlertTemplate,
  getNewUserRegisteredTemplate,
  getOrderPaidNotificationTemplate,
  getOrderShippedNotificationTemplate,
  getOrderDeliveredNotificationTemplate,
  getSubscriptionCreatedNotificationTemplate,
  getSubscriptionExpiringAdminNotificationTemplate,
  getOutOfStockAlertTemplate,
  getHighValueOrderAlertTemplate,
  getCustomerSupportInquiryTemplate
} = require('./emailTemplates');

// Send payment received email
async function sendPaymentReceivedEmail(order, user, items, pet = null) {
  try {
    const html = getPaymentReceivedTemplate(order, user, items, pet);
    const subject = `Payment Received - Order #${order.id} - The Pet Kitchen`;
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending payment received email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send order processing update
async function sendOrderProcessingEmail(order, user, updateMessage = null) {
  try {
    const html = getOrderProcessingTemplate(order, user, updateMessage);
    const subject = `Order Update - Order #${order.id} - The Pet Kitchen`;
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending order processing email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send shipping confirmation
async function sendShippingConfirmationEmail(order, user, trackingNumber, estimatedDelivery = null) {
  try {
    const html = getShippingConfirmationTemplate(order, user, trackingNumber, estimatedDelivery);
    const subject = `Your Order Has Shipped - Order #${order.id} - The Pet Kitchen`;
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending shipping confirmation email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send delivered confirmation
async function sendDeliveredConfirmationEmail(order, user) {
  try {
    const html = getDeliveredConfirmationTemplate(order, user);
    const subject = `Order Delivered - Order #${order.id} - The Pet Kitchen`;
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending delivered confirmation email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send refund initiated email
async function sendRefundInitiatedEmail(refund, order, user) {
  try {
    const html = getRefundInitiatedTemplate(refund, order, user);
    const subject = `Refund Initiated - Order #${order.id} - The Pet Kitchen`;
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending refund initiated email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send refund completed email
async function sendRefundCompletedEmail(refund, order, user) {
  try {
    const html = getRefundCompletedTemplate(refund, order, user);
    const subject = `Refund Completed - Order #${order.id} - The Pet Kitchen`;
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending refund completed email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send abandoned cart reminder
async function sendAbandonedCartEmail(cart, user, items) {
  try {
    const html = getAbandonedCartTemplate(cart, user, items);
    const subject = `Don't Forget Your Cart - The Pet Kitchen`;
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending abandoned cart email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send back-in-stock alert
async function sendBackInStockEmail(product, user) {
  try {
    const html = getBackInStockTemplate(product, user);
    const subject = `${product.name} is Back in Stock! - The Pet Kitchen`;
    return await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending back-in-stock email:', error.message);
    return { success: false, error: error.message };
  }
}

// Send contact form receipt
async function sendContactFormReceipt(formData) {
  try {
    const html = getContactFormReceiptTemplate(formData);
    const subject = `Thank You for Contacting Us - The Pet Kitchen`;
    return await sendEmail(formData.email, subject, html);
  } catch (error) {
    console.error('❌ Error sending contact form receipt:', error.message);
    return { success: false, error: error.message };
  }
}

// Send payment failed alert (admin)
async function sendPaymentFailedAlert(order, user, errorMessage) {
  try {
    const html = getPaymentFailedAlertTemplate(order, user, errorMessage);
    const subject = `⚠️ Payment Failed - Order #${order.id} - The Pet Kitchen`;
    return await sendEmail(ADMIN_EMAIL, subject, html);
  } catch (error) {
    console.error('❌ Error sending payment failed alert:', error.message);
    return { success: false, error: error.message };
  }
}

// Send high-risk order alert (admin)
async function sendHighRiskOrderAlert(order, user, riskFactors) {
  try {
    const html = getHighRiskOrderTemplate(order, user, riskFactors);
    const subject = `🚨 High-Risk Order - Order #${order.id} - The Pet Kitchen`;
    return await sendEmail(ADMIN_EMAIL, subject, html);
  } catch (error) {
    console.error('❌ Error sending high-risk order alert:', error.message);
    return { success: false, error: error.message };
  }
}

// Send low stock alert (admin)
async function sendLowStockAlert(products) {
  try {
    const html = getLowStockAlertTemplate(products);
    const subject = `📦 Low Stock Alert - ${products.length} Product(s) - The Pet Kitchen`;
    return await sendEmail(ADMIN_EMAIL, subject, html);
  } catch (error) {
    console.error('❌ Error sending low stock alert:', error.message);
    return { success: false, error: error.message };
  }
}

// Send new user registered notification (admin)
async function sendNewUserRegisteredNotification(user) {
  try {
    const html = getNewUserRegisteredTemplate(user);
    const subject = `👤 New User Registered - ${user.email} - The Pet Kitchen`;
    const result = await sendEmail(ADMIN_EMAIL, subject, html);
    if (result.success) {
      console.log(`✅ New user registration notification sent to ${ADMIN_EMAIL}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error sending new user notification:', error.message);
    return { success: false, error: error.message };
  }
}

// Send order paid notification (admin)
async function sendOrderPaidNotification(order, user, items, pet = null) {
  try {
    const html = getOrderPaidNotificationTemplate(order, user, items, pet);
    const subject = `💰 Payment Received - Order #${order.id} - ${parseFloat(order.total_amount || 0).toFixed(3)} KD`;
    const result = await sendEmail(ADMIN_EMAIL, subject, html);
    if (result.success) {
      console.log(`✅ Order paid notification sent to ${ADMIN_EMAIL}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error sending order paid notification:', error.message);
    return { success: false, error: error.message };
  }
}

// Send order shipped notification (admin)
async function sendOrderShippedNotification(order, user, trackingNumber) {
  try {
    const html = getOrderShippedNotificationTemplate(order, user, trackingNumber);
    const subject = `🚚 Order Shipped - Order #${order.id} - The Pet Kitchen`;
    const result = await sendEmail(ADMIN_EMAIL, subject, html);
    if (result.success) {
      console.log(`✅ Order shipped notification sent to ${ADMIN_EMAIL}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error sending order shipped notification:', error.message);
    return { success: false, error: error.message };
  }
}

// Send order delivered notification (admin)
async function sendOrderDeliveredNotification(order, user) {
  try {
    const html = getOrderDeliveredNotificationTemplate(order, user);
    const subject = `✅ Order Delivered - Order #${order.id} - The Pet Kitchen`;
    const result = await sendEmail(ADMIN_EMAIL, subject, html);
    if (result.success) {
      console.log(`✅ Order delivered notification sent to ${ADMIN_EMAIL}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error sending order delivered notification:', error.message);
    return { success: false, error: error.message };
  }
}

// Send subscription created notification (admin)
async function sendSubscriptionCreatedNotification(subscription, user, pet = null) {
  try {
    const html = getSubscriptionCreatedNotificationTemplate(subscription, user, pet);
    const subject = `📋 New Subscription Created - #${subscription.id} - The Pet Kitchen`;
    const result = await sendEmail(ADMIN_EMAIL, subject, html);
    if (result.success) {
      console.log(`✅ Subscription created notification sent to ${ADMIN_EMAIL}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error sending subscription created notification:', error.message);
    return { success: false, error: error.message };
  }
}

// Send subscription expiring admin notification
async function sendSubscriptionExpiringAdminNotification(subscription, user, pet, daysRemaining) {
  try {
    const html = getSubscriptionExpiringAdminNotificationTemplate(subscription, user, pet, daysRemaining);
    const subject = `⏰ Subscription Expiring - #${subscription.id} - ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Remaining`;
    const result = await sendEmail(ADMIN_EMAIL, subject, html);
    if (result.success) {
      console.log(`✅ Subscription expiring admin notification sent to ${ADMIN_EMAIL}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error sending subscription expiring admin notification:', error.message);
    return { success: false, error: error.message };
  }
}

// Send out of stock alert (admin)
async function sendOutOfStockAlert(products) {
  try {
    const html = getOutOfStockAlertTemplate(products);
    const subject = `🚨 Out of Stock Alert - ${products.length} Product(s) - The Pet Kitchen`;
    const result = await sendEmail(ADMIN_EMAIL, subject, html);
    if (result.success) {
      console.log(`✅ Out of stock alert sent to ${ADMIN_EMAIL}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error sending out of stock alert:', error.message);
    return { success: false, error: error.message };
  }
}

// Send high-value order alert (admin)
async function sendHighValueOrderAlert(order, user, items, threshold = 50) {
  try {
    const html = getHighValueOrderAlertTemplate(order, user, items, threshold);
    const subject = `💎 High-Value Order - Order #${order.id} - ${parseFloat(order.total_amount || 0).toFixed(3)} KD`;
    const result = await sendEmail(ADMIN_EMAIL, subject, html);
    if (result.success) {
      console.log(`✅ High-value order alert sent to ${ADMIN_EMAIL}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error sending high-value order alert:', error.message);
    return { success: false, error: error.message };
  }
}

// Send customer support inquiry notification (admin)
async function sendCustomerSupportInquiryNotification(inquiry) {
  try {
    const html = getCustomerSupportInquiryTemplate(inquiry);
    const subject = `📧 Customer Support Inquiry - ${inquiry.name || inquiry.email} - The Pet Kitchen`;
    const result = await sendEmail(ADMIN_EMAIL, subject, html);
    if (result.success) {
      console.log(`✅ Customer support inquiry notification sent to ${ADMIN_EMAIL}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Error sending customer support inquiry notification:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOrderConfirmationToUser,
  sendNewOrderNotificationToOwner,
  sendPasswordResetEmail,
  sendAccountConfirmationEmail,
  sendWelcomeEmail,
  sendEmailVerificationEmail,
  sendSubscriptionReminderEmail,
  sendOrderCancelledEmail,
  sendPaymentReceivedEmail,
  sendOrderProcessingEmail,
  sendShippingConfirmationEmail,
  sendDeliveredConfirmationEmail,
  sendRefundInitiatedEmail,
  sendRefundCompletedEmail,
  sendAbandonedCartEmail,
  sendBackInStockEmail,
  sendContactFormReceipt,
  sendPaymentFailedAlert,
  sendHighRiskOrderAlert,
  sendLowStockAlert,
  sendNewUserRegisteredNotification,
  sendOrderPaidNotification,
  sendOrderShippedNotification,
  sendOrderDeliveredNotification,
  sendSubscriptionCreatedNotification,
  sendSubscriptionExpiringAdminNotification,
  sendOutOfStockAlert,
  sendHighValueOrderAlert,
  sendCustomerSupportInquiryNotification,
  sendEmail, // Export sendEmail for use in routes
  verifyConnection
};
