/**
 * Email Queue Service
 * Handles email queuing, retries, and delivery tracking
 */

const pool = require('../config/database');
const { sendEmail } = require('./email');
const { error, warn, info } = require('../utils/logger');

/**
 * Add email to queue
 */
async function queueEmail(toEmail, subject, htmlContent, textContent = null) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO email_queue (to_email, subject, html_content, text_content, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [toEmail, subject, htmlContent, textContent]
    );

    info('Email queued', { emailId: result.insertId, toEmail, subject });
    return { success: true, emailId: result.insertId };
  } catch (err) {
    error('Failed to queue email', { error: err.message, toEmail });
    return { success: false, error: err.message };
  }
}

/**
 * Process email queue (send pending emails)
 */
async function processEmailQueue(limit = 50) {
  try {
    // Get pending emails
    const [emails] = await pool.execute(
      `SELECT * FROM email_queue 
       WHERE status = 'pending' AND attempts < max_attempts
       ORDER BY created_at ASC
       LIMIT ?`,
      [limit]
    );

    if (emails.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    let succeeded = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        const result = await sendEmail(
          email.to_email,
          email.subject,
          email.html_content,
          email.text_content
        );

        if (result.success) {
          // Mark as sent
          await pool.execute(
            `UPDATE email_queue 
             SET status = 'sent', sent_at = NOW(), attempts = attempts + 1
             WHERE id = ?`,
            [email.id]
          );
          succeeded++;
          info('Email sent from queue', { emailId: email.id, toEmail: email.to_email });
        } else {
          // Increment attempts
          await pool.execute(
            `UPDATE email_queue 
             SET attempts = attempts + 1, 
                 error_message = ?,
                 status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed' ELSE 'pending' END
             WHERE id = ?`,
            [result.error || 'Unknown error', email.id]
          );
          failed++;
          warn('Email send failed', { emailId: email.id, error: result.error });
        }
      } catch (err) {
        // Increment attempts
        await pool.execute(
          `UPDATE email_queue 
           SET attempts = attempts + 1, 
               error_message = ?,
               status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed' ELSE 'pending' END
           WHERE id = ?`,
          [err.message, email.id]
        );
        failed++;
        error('Email processing error', { emailId: email.id, error: err.message });
      }
    }

    return { processed: emails.length, succeeded, failed };
  } catch (err) {
    error('Email queue processing error', { error: err.message });
    return { processed: 0, succeeded: 0, failed: 0, error: err.message };
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  try {
    const [stats] = await pool.execute(
      `SELECT 
         status,
         COUNT(*) as count,
         SUM(attempts) as total_attempts
       FROM email_queue
       GROUP BY status`
    );

    return stats;
  } catch (err) {
    error('Failed to get queue stats', { error: err.message });
    return [];
  }
}

module.exports = {
  queueEmail,
  processEmailQueue,
  getQueueStats
};

