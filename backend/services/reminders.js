/**
 * Reminder Service
 * Handles automated reminders for subscriptions and deliveries
 */

const pool = require('../config/database');
const { sendSubscriptionReminderEmail } = require('./email');

/**
 * Calculate next delivery date based on subscription plan
 * @param {String} planType - 'weekly', 'monthly', or 'quarterly'
 * @param {Date} lastDeliveryDate - Last delivery date (or start date for first delivery)
 * @param {Number} deliveryFrequency - For monthly plans, how often deliveries happen (e.g., 7 for weekly deliveries in monthly plan)
 * @returns {Date} Next delivery date
 */
function calculateNextDeliveryDate(planType, lastDeliveryDate, deliveryFrequency = 7) {
  const nextDate = new Date(lastDeliveryDate);
  
  switch (planType) {
    case 'weekly':
      // Weekly plan: deliver every 7 days
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      // Monthly plan: can have weekly deliveries (every 7 days) or monthly (every 30 days)
      if (deliveryFrequency === 7) {
        // Weekly deliveries within monthly subscription
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        // Monthly delivery
        nextDate.setDate(nextDate.getDate() + 30);
      }
      break;
    case 'quarterly':
      // Quarterly plan: typically monthly deliveries (every 30 days)
      nextDate.setDate(nextDate.getDate() + 30);
      break;
    default:
      // Default to weekly
      nextDate.setDate(nextDate.getDate() + 7);
  }
  
  return nextDate;
}

/**
 * Get subscriptions expiring soon (within 7 days)
 * @param {Number} daysAhead - Number of days ahead to check (default: 7)
 * @returns {Array} Array of subscriptions expiring soon
 */
async function getExpiringSubscriptions(daysAhead = 7) {
  try {
    const [subscriptions] = await pool.execute(
      `SELECT s.*,
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              p.name as pet_name, p.type as pet_type,
              DATEDIFF(s.end_date, NOW()) as days_remaining
       FROM subscriptions s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN pets p ON s.pet_id = p.id
       WHERE s.status IN ('active', 'confirmed')
         AND s.end_date >= NOW()
         AND DATEDIFF(s.end_date, NOW()) <= ?
         AND (s.reminder_sent = 0 OR s.reminder_sent IS NULL)
       ORDER BY s.end_date ASC`,
      [daysAhead]
    );

    return subscriptions;
  } catch (error) {
    console.error('Error getting expiring subscriptions:', error);
    return [];
  }
}

/**
 * Send reminder emails for expiring subscriptions
 * @param {Number} daysAhead - Number of days ahead to check (default: 7)
 * @returns {Object} Results of reminder sending
 */
async function sendExpiringSubscriptionReminders(daysAhead = 7) {
  try {
    const subscriptions = await getExpiringSubscriptions(daysAhead);
    const results = {
      total: subscriptions.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const subscription of subscriptions) {
      try {
        const result = await sendSubscriptionReminderEmail(
          subscription.user_email,
          subscription.user_name,
          subscription,
          { name: subscription.pet_name, type: subscription.pet_type }
        );

        if (result.success) {
          // Mark reminder as sent
          await pool.execute(
            'UPDATE subscriptions SET reminder_sent = 1 WHERE id = ?',
            [subscription.id]
          );
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            subscriptionId: subscription.id,
            email: subscription.user_email,
            error: result.error
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          subscriptionId: subscription.id,
          email: subscription.user_email,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error sending subscription reminders:', error);
    return {
      total: 0,
      sent: 0,
      failed: 0,
      errors: [{ error: error.message }]
    };
  }
}

/**
 * Get subscriptions with upcoming deliveries
 * @param {Number} daysAhead - Number of days ahead to check (default: 7)
 * @returns {Array} Array of subscriptions with upcoming deliveries
 */
async function getUpcomingDeliveries(daysAhead = 7) {
  try {
    const [subscriptions] = await pool.execute(
      `SELECT s.*,
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              p.name as pet_name, p.type as pet_type,
              DATEDIFF(s.next_delivery_date, NOW()) as days_until_delivery
       FROM subscriptions s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN pets p ON s.pet_id = p.id
       WHERE s.status IN ('active', 'confirmed')
         AND s.next_delivery_date IS NOT NULL
         AND s.next_delivery_date >= NOW()
         AND DATEDIFF(s.next_delivery_date, NOW()) <= ?
       ORDER BY s.next_delivery_date ASC`,
      [daysAhead]
    );

    return subscriptions;
  } catch (error) {
    console.error('Error getting upcoming deliveries:', error);
    return [];
  }
}

/**
 * Generate WhatsApp message for subscription reminder
 * @param {Object} subscription - Subscription object
 * @param {Object} user - User object
 * @param {Object} pet - Pet object
 * @returns {String} Formatted WhatsApp message
 */
function generateWhatsAppReminderMessage(subscription, user, pet) {
  const endDate = new Date(subscription.end_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const daysRemaining = subscription.days_remaining || 0;
  const frontendUrl = process.env.FRONTEND_URL || 'https://thepetkitchen.net';
  const renewLink = `${frontendUrl}/subscriptions.html`;

  return `🐾 *The Pet Kitchen - Subscription Reminder*

Hello ${user.name || 'there'}!

Your subscription for *${pet?.name || 'your pet'}* is expiring soon.

📅 *Expires:* ${endDate}
⏰ *Days Remaining:* ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}
📦 *Plan:* ${subscription.plan_type || 'Subscription'}

To continue receiving fresh meals, please renew your subscription:
${renewLink}

Questions? Contact us at hello@thepetkitchen.net

Thank you! 🐾`;
}

module.exports = {
  calculateNextDeliveryDate,
  getExpiringSubscriptions,
  sendExpiringSubscriptionReminders,
  getUpcomingDeliveries,
  generateWhatsAppReminderMessage
};

