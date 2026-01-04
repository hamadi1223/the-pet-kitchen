/**
 * Send Test Report via Email
 * Reads Jest test results and emails summary to configured address
 */

const fs = require('fs');
const path = require('path');
const { sendEmail } = require('../services/email');

const TEST_REPORT_TO = process.env.TEST_REPORT_TO || 'hamadeyee@gmail.com';
const JUNIT_XML_PATH = path.join(__dirname, '../junit.xml');
const COVERAGE_PATH = path.join(__dirname, '../coverage/coverage-summary.json');

/**
 * Parse JUnit XML and generate summary
 */
function parseJUnitXML() {
  try {
    if (!fs.existsSync(JUNIT_XML_PATH)) {
      return null;
    }
    
    const xml = fs.readFileSync(JUNIT_XML_PATH, 'utf8');
    const testSuiteMatch = xml.match(/testsuite[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*errors="(\d+)"/);
    
    if (!testSuiteMatch) {
      return null;
    }
    
    return {
      total: parseInt(testSuiteMatch[1]),
      failures: parseInt(testSuiteMatch[2]),
      errors: parseInt(testSuiteMatch[3]),
      passed: parseInt(testSuiteMatch[1]) - parseInt(testSuiteMatch[2]) - parseInt(testSuiteMatch[3])
    };
  } catch (error) {
    console.error('Failed to parse JUnit XML:', error);
    return null;
  }
}

/**
 * Parse coverage summary
 */
function parseCoverage() {
  try {
    if (!fs.existsSync(COVERAGE_PATH)) {
      return null;
    }
    
    const coverage = JSON.parse(fs.readFileSync(COVERAGE_PATH, 'utf8'));
    return {
      lines: coverage.total.lines.pct,
      statements: coverage.total.statements.pct,
      functions: coverage.total.functions.pct,
      branches: coverage.total.branches.pct
    };
  } catch (error) {
    console.error('Failed to parse coverage:', error);
    return null;
  }
}

/**
 * Generate HTML report
 */
function generateHTMLReport(junitData, coverageData) {
  const timestamp = new Date().toLocaleString();
  const status = (junitData && junitData.failures === 0 && junitData.errors === 0) ? '✅ PASSED' : '❌ FAILED';
  const statusColor = (junitData && junitData.failures === 0 && junitData.errors === 0) ? '#059669' : '#DC2626';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .section { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
    .metric:last-child { border-bottom: none; }
    .label { font-weight: 600; }
    .value { color: #666; }
    .coverage-bar { background: #e5e7eb; height: 20px; border-radius: 4px; overflow: hidden; margin-top: 5px; }
    .coverage-fill { background: #10b981; height: 100%; transition: width 0.3s; }
    .footer { text-align: center; color: #666; margin-top: 30px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${status}</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Test Report - ${timestamp}</p>
    </div>
    
    ${junitData ? `
    <div class="section">
      <h2 style="margin-top: 0;">Test Results</h2>
      <div class="metric">
        <span class="label">Total Tests:</span>
        <span class="value">${junitData.total}</span>
      </div>
      <div class="metric">
        <span class="label">Passed:</span>
        <span class="value" style="color: #059669;">${junitData.passed}</span>
      </div>
      <div class="metric">
        <span class="label">Failed:</span>
        <span class="value" style="color: #DC2626;">${junitData.failures}</span>
      </div>
      <div class="metric">
        <span class="label">Errors:</span>
        <span class="value" style="color: #DC2626;">${junitData.errors}</span>
      </div>
    </div>
    ` : '<div class="section"><p>Test results not available</p></div>'}
    
    ${coverageData ? `
    <div class="section">
      <h2 style="margin-top: 0;">Code Coverage</h2>
      <div class="metric">
        <span class="label">Lines:</span>
        <span class="value">${coverageData.lines}%</span>
      </div>
      <div class="coverage-bar">
        <div class="coverage-fill" style="width: ${coverageData.lines}%"></div>
      </div>
      
      <div class="metric">
        <span class="label">Statements:</span>
        <span class="value">${coverageData.statements}%</span>
      </div>
      <div class="coverage-bar">
        <div class="coverage-fill" style="width: ${coverageData.statements}%"></div>
      </div>
      
      <div class="metric">
        <span class="label">Functions:</span>
        <span class="value">${coverageData.functions}%</span>
      </div>
      <div class="coverage-bar">
        <div class="coverage-fill" style="width: ${coverageData.functions}%"></div>
      </div>
      
      <div class="metric">
        <span class="label">Branches:</span>
        <span class="value">${coverageData.branches}%</span>
      </div>
      <div class="coverage-bar">
        <div class="coverage-fill" style="width: ${coverageData.branches}%"></div>
      </div>
    </div>
    ` : '<div class="section"><p>Coverage data not available</p></div>'}
    
    <div class="footer">
      <p>This is an automated test report from The Pet Kitchen CI/CD pipeline.</p>
      <p>Generated at ${timestamp}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('📊 Generating test report...');
    
    const junitData = parseJUnitXML();
    const coverageData = parseCoverage();
    
    const htmlReport = generateHTMLReport(junitData, coverageData);
    const subject = `Test Report - ${junitData && junitData.failures === 0 && junitData.errors === 0 ? '✅ PASSED' : '❌ FAILED'} - The Pet Kitchen`;
    
    // Send email
    const result = await sendEmail(TEST_REPORT_TO, subject, htmlReport);
    
    if (result.success) {
      console.log(`✅ Test report sent to ${TEST_REPORT_TO}`);
    } else {
      console.error('❌ Failed to send test report:', result.error);
      process.exit(1);
    }
    
    // Attach JUnit XML if available
    if (fs.existsSync(JUNIT_XML_PATH)) {
      console.log('📎 JUnit XML report available at:', JUNIT_XML_PATH);
    }
    
  } catch (error) {
    console.error('❌ Error generating test report:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };

