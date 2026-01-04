// ==================== REMINDERS TAB ====================

async function loadReminders() {
  try {
    const response = await window.adminAPI.getReminders();
    if (!response || response.error) {
      throw new Error(response?.error || 'Failed to load reminders');
    }

    // Update stats
    const expiringCountEl = document.getElementById('expiringCount');
    const upcomingDeliveriesCountEl = document.getElementById('upcomingDeliveriesCount');
    if (expiringCountEl) expiringCountEl.textContent = response.expiringSubscriptions?.length || 0;
    if (upcomingDeliveriesCountEl) upcomingDeliveriesCountEl.textContent = response.upcomingDeliveries?.length || 0;

    // Render expiring subscriptions
    renderExpiringSubscriptions(response.expiringSubscriptions || []);

    // Render upcoming deliveries
    renderUpcomingDeliveries(response.upcomingDeliveries || []);

    // Setup send reminder emails button
    const sendReminderBtn = document.getElementById('sendReminderEmailsBtn');
    if (sendReminderBtn) {
      sendReminderBtn.onclick = async () => {
        if (!confirm('Send reminder emails to all customers with expiring subscriptions?')) {
          return;
        }
        sendReminderBtn.disabled = true;
        sendReminderBtn.textContent = 'Sending...';
        try {
          const result = await window.adminAPI.sendReminderEmails();
          alert(`Reminder emails sent!\nTotal: ${result.results?.total || 0}\nSent: ${result.results?.sent || 0}\nFailed: ${result.results?.failed || 0}`);
          await loadReminders(); // Refresh
        } catch (error) {
          alert('Error sending reminder emails: ' + (error.message || 'Unknown error'));
        } finally {
          sendReminderBtn.disabled = false;
          sendReminderBtn.textContent = '📧 Send Reminder Emails';
        }
      };
    }
  } catch (error) {
    console.error('Error loading reminders:', error);
    const container = document.getElementById('expiringSubscriptionsContainer');
    if (container) {
      container.innerHTML = `<div class="error-message">Error loading reminders: ${error.message}</div>`;
    }
  }
}

function renderExpiringSubscriptions(subscriptions) {
  const container = document.getElementById('expiringSubscriptionsContainer');
  if (!container) return;

  if (subscriptions.length === 0) {
    container.innerHTML = '<p style="color: var(--ink-600); padding: 2rem; text-align: center;">No subscriptions expiring soon.</p>';
    return;
  }

  container.innerHTML = subscriptions.map(sub => {
    const endDate = new Date(sub.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const daysRemaining = sub.days_remaining || 0;
    
    return `
      <div class="admin-card" style="margin-bottom: 1rem;">
        <div class="card-header">
          <div>
            <h4>${sub.pet_name || 'Pet'} - ${sub.plan_type || 'Subscription'}</h4>
            <p style="color: var(--ink-600); font-size: 0.9rem; margin: 0.25rem 0;">
              Customer: ${sub.user_name || sub.user_email || 'N/A'} | Expires: ${endDate} (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''})
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-outline btn-sm" onclick="openWhatsAppReminder(${sub.id})" title="WhatsApp Reminder">
              💬 WhatsApp
            </button>
            <button class="btn btn-primary btn-sm" onclick="sendSingleReminder(${sub.id})" title="Send Email">
              📧 Email
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderUpcomingDeliveries(deliveries) {
  const container = document.getElementById('upcomingDeliveriesContainer');
  if (!container) return;

  if (deliveries.length === 0) {
    container.innerHTML = '<p style="color: var(--ink-600); padding: 2rem; text-align: center;">No upcoming deliveries.</p>';
    return;
  }

  container.innerHTML = deliveries.map(delivery => {
    const deliveryDate = new Date(delivery.next_delivery_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const daysUntil = delivery.days_until_delivery || 0;
    
    return `
      <div class="admin-card" style="margin-bottom: 1rem;">
        <div class="card-header">
          <div>
            <h4>${delivery.pet_name || 'Pet'} - ${delivery.plan_type || 'Subscription'}</h4>
            <p style="color: var(--ink-600); font-size: 0.9rem; margin: 0.25rem 0;">
              Customer: ${delivery.user_name || delivery.user_email || 'N/A'} | Delivery: ${deliveryDate} (${daysUntil} day${daysUntil !== 1 ? 's' : ''})
            </p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function openWhatsAppReminder(subscriptionId) {
  try {
    const response = await window.adminAPI.getWhatsAppReminder(subscriptionId);
    if (response.error) {
      alert('Error: ' + response.error);
      return;
    }
    
    if (response.whatsappLink) {
      window.open(response.whatsappLink, '_blank');
    } else {
      // Copy message to clipboard
      navigator.clipboard.writeText(response.message).then(() => {
        alert('WhatsApp message copied to clipboard!\n\n' + response.message);
      }).catch(() => {
        alert('WhatsApp Message:\n\n' + response.message);
      });
    }
  } catch (error) {
    alert('Error: ' + (error.message || 'Unknown error'));
  }
}

async function sendSingleReminder(subscriptionId) {
  try {
    const result = await window.adminAPI.sendReminderEmails({ subscriptionIds: [subscriptionId] });
    if (result.error) {
      alert('Error: ' + result.error);
      return;
    }
    alert('Reminder email sent!');
    await loadReminders(); // Refresh
  } catch (error) {
    alert('Error: ' + (error.message || 'Unknown error'));
  }
}

// Make functions globally available
window.openWhatsAppReminder = openWhatsAppReminder;
window.sendSingleReminder = sendSingleReminder;
window.loadReminders = loadReminders;
window.renderExpiringSubscriptions = renderExpiringSubscriptions;
window.renderUpcomingDeliveries = renderUpcomingDeliveries;

