/**
 * Base Email Template System
 * Redesigned to match the "New inquiry from The Pet Kitchen" template style
 * Dark header with gold accents, elegant typography, and premium feel
 */

/**
 * Generate base email wrapper with consistent styling
 * @param {Object} options - Email configuration
 * @param {String} options.title - Main title (default: "THE PET KITCHEN")
 * @param {String} options.tagline - Subtitle/tagline (default: "Nourishing Pets, Nurturing Bonds")
 * @param {String} options.preheader - Hidden preheader text for email clients
 * @param {String} options.content - Main email content HTML
 * @param {String} options.footerText - Footer text (optional)
 * @param {Boolean} options.showFooterBranding - Show footer branding (default: true)
 * @returns {String} Complete HTML email
 */
function getBaseEmailTemplate({ title, tagline, preheader, content, footerText, showFooterBranding = true }) {
  const emailTitle = title || 'THE <span class="pet-accent">PET</span> KITCHEN';
  const emailTagline = tagline || 'Nourishing Pets, Nurturing Bonds';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background-color: #f5f5f5;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      padding: 40px 30px;
      text-align: center;
      border-bottom: 4px solid #C6A769;
    }
    .logo-text {
      font-family: 'Didot', Georgia, serif;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: #ffffff;
      margin: 0;
    }
    .pet-accent {
      color: #C6A769;
      font-weight: 700;
    }
    .tagline {
      color: #D4B882;
      font-size: 12px;
      letter-spacing: 0.15em;
      margin-top: 8px;
      font-style: italic;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #333;
      margin-bottom: 10px;
    }
    .intro {
      font-size: 14px;
      color: #666;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 30px;
      background: #FAFAF8;
      border-radius: 8px;
      padding: 24px;
      border-left: 4px solid #C6A769;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .icon {
      font-size: 20px;
    }
    .detail-row {
      display: table;
      width: 100%;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      display: table-cell;
      width: 40%;
      color: #666;
      font-weight: 500;
      padding-right: 12px;
    }
    .detail-value {
      display: table-cell;
      color: #1a1a1a;
      font-weight: 600;
    }
    .recommendation {
      background: linear-gradient(135deg, #FFF8E7 0%, #FFFBF0 100%);
      border: 2px solid #C6A769;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 30px;
    }
    .rec-meal {
      font-size: 20px;
      font-weight: 700;
      color: #C6A769;
      margin: 0 0 16px 0;
      text-align: center;
    }
    .feeding-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 20px;
    }
    .metric-card {
      background: #ffffff;
      border-radius: 6px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #C6A769;
      margin-bottom: 4px;
    }
    .metric-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .footer {
      background: #FAFAF8;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #E9DECE;
    }
    .footer-text {
      font-size: 12px;
      color: #666;
      margin: 8px 0;
    }
    .brand-name {
      font-weight: 700;
      color: #1a1a1a;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #C6A769 50%, transparent 100%);
      margin: 24px 0;
      border: none;
    }
    .highlight {
      background: #FFF8E7;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 13px;
      color: #666;
      margin-top: 16px;
      border-left: 3px solid #C6A769;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #C6A769;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #B59A5E;
    }
    .button-secondary {
      background-color: transparent;
      border: 2px solid #C6A769;
      color: #C6A769;
    }
    .button-secondary:hover {
      background-color: #C6A769;
      color: #ffffff;
    }
    /* Preheader - hidden text for email clients */
    .preheader {
      display: none !important;
      visibility: hidden;
      opacity: 0;
      color: transparent;
      height: 0;
      width: 0;
      font-size: 1px;
      line-height: 0;
      max-height: 0;
      max-width: 0;
    }
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .content {
        padding: 30px 20px !important;
      }
      .header {
        padding: 30px 20px !important;
      }
      .logo-text {
        font-size: 24px !important;
      }
      .feeding-grid {
        grid-template-columns: 1fr !important;
      }
      .detail-row {
        display: block !important;
      }
      .detail-label {
        display: block !important;
        width: 100% !important;
        margin-bottom: 4px;
      }
      .detail-value {
        display: block !important;
      }
    }
  </style>
</head>
<body>
  ${preheader ? `<span class="preheader">${preheader}</span>` : ''}
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1 class="logo-text" style="color: #ffffff !important; font-family: 'Didot', Georgia, serif; font-size: 28px; font-weight: 600; letter-spacing: 0.1em; margin: 0; text-align: center;">${emailTitle}</h1>
      <p class="tagline" style="color: #D4B882 !important; font-size: 12px; letter-spacing: 0.15em; margin-top: 8px; font-style: italic; text-align: center;">${emailTagline}</p>
    </div>
    <!-- Main Content -->
    <div class="content">
      ${content}
    </div>
    <!-- Footer -->
    ${showFooterBranding ? `
    <div class="footer">
      ${footerText ? `<p class="footer-text">${footerText}</p>` : ''}
      <p class="footer-text">This email was sent from <span class="brand-name">The Pet Kitchen</span></p>
      <p class="footer-text" style="margin-top: 16px; color: #999; font-size: 11px;">
        Premium Pet Nutrition | Kuwait
      </p>
    </div>
    ` : (footerText ? `<div class="footer"><p class="footer-text">${footerText}</p></div>` : '')}
  </div>
</body>
</html>
  `;
}

/**
 * Generate a section card with title and content
 * @param {String} title - Section title
 * @param {String} content - Section content HTML
 * @param {String} icon - Optional emoji icon
 * @returns {String} Section HTML
 */
function generateSection(title, content, icon = null) {
  const iconHtml = icon ? `<span class="icon">${icon}</span>` : '';
  return `
    <div class="section">
      <h2 class="section-title">
        ${iconHtml}${title}
      </h2>
      ${content}
    </div>
  `;
}

/**
 * Generate a detail row (label/value pair)
 * @param {String} label - Label text
 * @param {String} value - Value text
 * @returns {String} Detail row HTML
 */
function generateDetailRow(label, value) {
  return `
    <div class="detail-row">
      <span class="detail-label">${label}:</span>
      <span class="detail-value">${value || 'N/A'}</span>
    </div>
  `;
}

/**
 * Generate recommendation/highlight block with gradient background
 * @param {String} title - Recommendation title
 * @param {String} content - Recommendation content HTML
 * @returns {String} Recommendation block HTML
 */
function generateRecommendation(title, content) {
  return `
    <div class="recommendation">
      <h2 class="rec-meal">${title}</h2>
      ${content}
    </div>
  `;
}

/**
 * Generate metrics grid (feeding guide style)
 * @param {Array} metrics - Array of {value, label} objects
 * @returns {String} Metrics grid HTML
 */
function generateMetricsGrid(metrics) {
  const metricCards = metrics.map(metric => `
    <div class="metric-card">
      <div class="metric-value">${metric.value}</div>
      <div class="metric-label">${metric.label}</div>
    </div>
  `).join('');
  
  return `
    <div class="feeding-grid">
      ${metricCards}
    </div>
  `;
}

/**
 * Generate divider line
 * @returns {String} Divider HTML
 */
function generateDivider() {
  return '<hr class="divider">';
}

/**
 * Generate highlight tip block
 * @param {String} content - Tip content HTML
 * @returns {String} Highlight tip HTML
 */
function generateHighlightTip(content) {
  return `
    <div class="highlight">
      ${content}
    </div>
  `;
}

module.exports = {
  getBaseEmailTemplate,
  generateSection,
  generateDetailRow,
  generateRecommendation,
  generateMetricsGrid,
  generateDivider,
  generateHighlightTip
};
