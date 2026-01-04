/**
 * Daily Admin Reports Service
 * Generates and sends daily reports to administrators
 */

const pool = require('../config/database');
const { sendEmail } = require('./email');
const { getBaseEmailTemplate, generateSection, generateDetailRow, generateMetricsGrid } = require('./emailBase');
const { error, info } = require('../utils/logger');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.OUTLOOK_EMAIL;

/**
 * Generate daily report data
 */
async function generateDailyReport(reportDate = null) {
  const date = reportDate || new Date();
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  try {
    // Orders metrics
    const [ordersStats] = await pool.execute(
      `SELECT 
         COUNT(*) as orders_count,
         SUM(total_amount) as gross_revenue,
         SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as net_revenue,
         AVG(total_amount) as average_order_value,
         SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunds_count,
         SUM(CASE WHEN status = 'refunded' THEN total_amount ELSE 0 END) as refunds_amount
       FROM orders
       WHERE DATE(created_at) = DATE(?)`,
      [date]
    );

    const stats = ordersStats[0] || {};

    // Payment metrics
    const [paymentStats] = await pool.execute(
      `SELECT 
         SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as payments_succeeded,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as payments_failed
       FROM orders
       WHERE DATE(created_at) = DATE(?)`,
      [date]
    );

    const paymentData = paymentStats[0] || {};

    // Customer metrics
    const [customerStats] = await pool.execute(
      `SELECT 
         COUNT(DISTINCT CASE WHEN DATE(created_at) = DATE(?) THEN id END) as new_customers,
         COUNT(DISTINCT CASE WHEN DATE(created_at) < DATE(?) AND id IN (
           SELECT DISTINCT user_id FROM orders WHERE DATE(created_at) = DATE(?)
         ) THEN id END) as returning_customers
       FROM users`,
      [date, date, date]
    );

    const customerData = customerStats[0] || {};

    // Inventory metrics
    const [inventoryStats] = await pool.execute(
      `SELECT 
         COUNT(CASE WHEN quantity <= low_stock_threshold AND quantity > 0 THEN 1 END) as low_stock_items,
         COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_items
       FROM inventory
       WHERE product_id IN (SELECT id FROM products WHERE is_active = 1)`
    );

    const inventoryData = inventoryStats[0] || {};

    // Top products
    const [topProducts] = await pool.execute(
      `SELECT 
         p.name,
         p.sku,
         SUM(oi.quantity) as total_quantity,
         SUM(oi.quantity * oi.unit_price) as total_revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE DATE(o.created_at) = DATE(?)
       GROUP BY p.id, p.name, p.sku
       ORDER BY total_revenue DESC
       LIMIT 5`,
      [date]
    );

    // Failed payments details
    const [failedPayments] = await pool.execute(
      `SELECT id, email, total_amount, payment_invoice_id, created_at
       FROM orders
       WHERE status = 'failed' AND DATE(created_at) = DATE(?)
       ORDER BY created_at DESC
       LIMIT 10`,
      [date]
    );

    return {
      reportDate: date.toISOString().split('T')[0],
      orders: {
        count: parseInt(stats.orders_count || 0),
        grossRevenue: parseFloat(stats.gross_revenue || 0),
        netRevenue: parseFloat(stats.net_revenue || 0),
        averageOrderValue: parseFloat(stats.average_order_value || 0),
        refundsCount: parseInt(stats.refunds_count || 0),
        refundsAmount: parseFloat(stats.refunds_amount || 0)
      },
      payments: {
        succeeded: parseInt(paymentData.payments_succeeded || 0),
        failed: parseInt(paymentData.payments_failed || 0)
      },
      customers: {
        new: parseInt(customerData.new_customers || 0),
        returning: parseInt(customerData.returning_customers || 0)
      },
      inventory: {
        lowStock: parseInt(inventoryData.low_stock_items || 0),
        outOfStock: parseInt(inventoryData.out_of_stock_items || 0)
      },
      topProducts: topProducts || [],
      failedPayments: failedPayments || []
    };
  } catch (err) {
    error('Failed to generate daily report', { error: err.message, date });
    throw err;
  }
}

/**
 * Generate daily report email template
 */
function getDailyReportTemplate(reportData) {
  const date = new Date(reportData.reportDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const ordersMetrics = generateMetricsGrid([
    { label: 'Orders', value: reportData.orders.count },
    { label: 'Gross Revenue', value: `${reportData.orders.grossRevenue.toFixed(3)} KD` },
    { label: 'Net Revenue', value: `${reportData.orders.netRevenue.toFixed(3)} KD` },
    { label: 'AOV', value: `${reportData.orders.averageOrderValue.toFixed(3)} KD` }
  ]);

  const paymentMetrics = generateMetricsGrid([
    { label: 'Succeeded', value: reportData.payments.succeeded },
    { label: 'Failed', value: reportData.payments.failed },
    { label: 'Success Rate', value: reportData.payments.succeeded + reportData.payments.failed > 0 
      ? `${((reportData.payments.succeeded / (reportData.payments.succeeded + reportData.payments.failed)) * 100).toFixed(1)}%`
      : 'N/A' }
  ]);

  const customerMetrics = generateMetricsGrid([
    { label: 'New Customers', value: reportData.customers.new },
    { label: 'Returning', value: reportData.customers.returning },
    { label: 'Return Rate', value: reportData.customers.new + reportData.customers.returning > 0
      ? `${((reportData.customers.returning / (reportData.customers.new + reportData.customers.returning)) * 100).toFixed(1)}%`
      : 'N/A' }
  ]);

  const inventoryMetrics = generateMetricsGrid([
    { label: 'Low Stock', value: reportData.inventory.lowStock },
    { label: 'Out of Stock', value: reportData.inventory.outOfStock }
  ]);

  const topProductsList = reportData.topProducts.length > 0
    ? reportData.topProducts.map(p => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #E5E5E5;">${p.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E5E5E5; text-align: center;">${p.sku}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E5E5E5; text-align: center;">${p.total_quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E5E5E5; text-align: right;">${parseFloat(p.total_revenue || 0).toFixed(3)} KD</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #999;">No orders today</td></tr>';

  const failedPaymentsList = reportData.failedPayments.length > 0
    ? reportData.failedPayments.map(p => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #E5E5E5;">#${p.id}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E5E5E5;">${p.email}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E5E5E5; text-align: right;">${parseFloat(p.total_amount || 0).toFixed(3)} KD</td>
          <td style="padding: 8px; border-bottom: 1px solid #E5E5E5;">${p.payment_invoice_id || 'N/A'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #999;">No failed payments</td></tr>';

  const content = `
    <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Daily Report - ${date}</p>
    
    ${generateSection('📊 Orders Overview', ordersMetrics)}
    
    ${generateSection('💳 Payment Status', paymentMetrics)}
    
    ${generateSection('👥 Customer Metrics', customerMetrics)}
    
    ${generateSection('📦 Inventory Status', inventoryMetrics)}
    
    ${generateSection('🏆 Top Products Today', `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #F8F9FA;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #C6A769; color: #333;">Product</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #C6A769; color: #333;">SKU</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #C6A769; color: #333;">Quantity</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #C6A769; color: #333;">Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${topProductsList}
        </tbody>
      </table>
    `)}
    
    ${reportData.failedPayments.length > 0 ? generateSection('⚠️ Failed Payments', `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #FEF2F2;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #DC2626; color: #333;">Order ID</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #DC2626; color: #333;">Email</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #DC2626; color: #333;">Amount</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #DC2626; color: #333;">Invoice ID</th>
          </tr>
        </thead>
        <tbody>
          ${failedPaymentsList}
        </tbody>
      </table>
    `) : ''}
    
    <p style="font-size: 14px; color: #666; margin-top: 32px; text-align: center;">
      This is an automated daily report. For detailed analytics, please visit the admin dashboard.
    </p>
  `;

  return getBaseEmailTemplate({
    title: '📊 Daily Report',
    tagline: 'The Pet Kitchen - Admin',
    preheader: `Daily report for ${date} - ${reportData.orders.count} orders, ${reportData.orders.netRevenue.toFixed(3)} KD revenue`,
    content: content,
    showFooterBranding: false
  });
}

/**
 * Store report in database
 */
async function storeDailyReport(reportData) {
  try {
    await pool.execute(
      `INSERT INTO daily_reports (
         report_date, orders_count, gross_revenue, net_revenue, average_order_value,
         refunds_count, refunds_amount, payments_succeeded, payments_failed,
         new_customers, returning_customers, low_stock_items, out_of_stock_items, report_data
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         orders_count = VALUES(orders_count),
         gross_revenue = VALUES(gross_revenue),
         net_revenue = VALUES(net_revenue),
         average_order_value = VALUES(average_order_value),
         refunds_count = VALUES(refunds_count),
         refunds_amount = VALUES(refunds_amount),
         payments_succeeded = VALUES(payments_succeeded),
         payments_failed = VALUES(payments_failed),
         new_customers = VALUES(new_customers),
         returning_customers = VALUES(returning_customers),
         low_stock_items = VALUES(low_stock_items),
         out_of_stock_items = VALUES(out_of_stock_items),
         report_data = VALUES(report_data)`,
      [
        reportData.reportDate,
        reportData.orders.count,
        reportData.orders.grossRevenue,
        reportData.orders.netRevenue,
        reportData.orders.averageOrderValue,
        reportData.orders.refundsCount,
        reportData.orders.refundsAmount,
        reportData.payments.succeeded,
        reportData.payments.failed,
        reportData.customers.new,
        reportData.customers.returning,
        reportData.inventory.lowStock,
        reportData.inventory.outOfStock,
        JSON.stringify(reportData)
      ]
    );

    info('Daily report stored', { reportDate: reportData.reportDate });
  } catch (err) {
    error('Failed to store daily report', { error: err.message });
    throw err;
  }
}

/**
 * Send daily report email
 */
async function sendDailyReport(reportDate = null) {
  try {
    if (!ADMIN_EMAIL) {
      throw new Error('Admin email not configured');
    }

    const reportData = await generateDailyReport(reportDate);
    const html = getDailyReportTemplate(reportData);
    const subject = `📊 Daily Report - ${new Date(reportData.reportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - The Pet Kitchen`;

    // Store report
    await storeDailyReport(reportData);

    // Send email
    const result = await sendEmail(ADMIN_EMAIL, subject, html);

    if (result.success) {
      // Update sent_at timestamp
      await pool.execute(
        `UPDATE daily_reports SET sent_at = NOW() WHERE report_date = ?`,
        [reportData.reportDate]
      );
      info('Daily report sent', { reportDate: reportData.reportDate });
    }

    return { success: result.success, reportData, error: result.error };
  } catch (err) {
    error('Failed to send daily report', { error: err.message });
    return { success: false, error: err.message };
  }
}

module.exports = {
  generateDailyReport,
  sendDailyReport,
  storeDailyReport,
  getDailyReportTemplate
};

