# CI Test Reporting Setup

This document explains how to configure automated test result emailing in CI/CD pipelines.

---

## Overview

The test reporting system automatically emails test results to configured recipients after test runs complete. It generates:
- **HTML Summary**: Human-readable test results with metrics
- **JUnit XML**: Machine-readable test report (for CI integration)

---

## Configuration

### Environment Variables

Add to `.env` or CI environment:

```env
# Test Report Recipient
TEST_REPORT_TO=hamadeyee@gmail.com

# Email Configuration (uses same as production)
OUTLOOK_EMAIL=no-reply@thepetkitchen.net
OUTLOOK_PASSWORD=your-email-password
OUTLOOK_NAME=The Pet Kitchen
```

### `.env.example` Entry

```env
# Test Reporting
TEST_REPORT_TO=hamadeyee@gmail.com
```

---

## GitHub Actions Setup

### Basic Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: petkitchen_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run tests
        working-directory: ./backend
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_USER: root
          DB_PASSWORD: root
          DB_NAME: petkitchen_test
          JWT_SECRET: test-jwt-secret
          TEST_DISABLE_MYFATOORAH: true
          OUTLOOK_EMAIL: ${{ secrets.OUTLOOK_EMAIL }}
          OUTLOOK_PASSWORD: ${{ secrets.OUTLOOK_PASSWORD }}
          TEST_REPORT_TO: ${{ secrets.TEST_REPORT_TO }}
        run: npm run test:ci
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            backend/junit.xml
            backend/coverage/
```

### Secrets Configuration

In GitHub repository settings → Secrets, add:
- `OUTLOOK_EMAIL`: Email address for sending
- `OUTLOOK_PASSWORD`: Email password
- `TEST_REPORT_TO`: Recipient email (default: hamadeyee@gmail.com)

---

## Local Testing

### Run Tests with Reporting

```bash
cd backend
npm run test:ci
```

This will:
1. Run all tests
2. Generate JUnit XML report
3. Generate coverage report
4. Email results to `TEST_REPORT_TO`

### Manual Report Generation

```bash
cd backend
node scripts/send-test-report.js
```

---

## Report Format

### HTML Summary Includes:
- **Test Status**: Passed/Failed indicator
- **Test Metrics**: Total, Passed, Failed, Errors
- **Code Coverage**: Lines, Statements, Functions, Branches with visual bars
- **Timestamp**: When report was generated

### JUnit XML Includes:
- Test suite information
- Individual test results
- Failure details
- Execution times

---

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials**:
   ```bash
   # Test email service
   node -e "require('./services/email').verifyConnection()"
   ```

2. **Verify environment variables**:
   ```bash
   echo $TEST_REPORT_TO
   echo $OUTLOOK_EMAIL
   ```

3. **Check logs**: Review console output for errors

### Reports Not Generated

1. **JUnit XML missing**:
   - Ensure `jest-junit` is installed
   - Check `jest.config.js` has JUnit reporter configured

2. **Coverage missing**:
   - Ensure `--coverage` flag is used
   - Check `coverage/` directory exists

### CI Integration Issues

1. **Tests failing in CI but passing locally**:
   - Check database connection settings
   - Verify test database is created
   - Check environment variables

2. **Email not sending in CI**:
   - Verify secrets are set correctly
   - Check CI logs for SMTP errors
   - Ensure email service is accessible from CI environment

---

## Customization

### Change Report Recipient

```env
TEST_REPORT_TO=another@email.com
```

### Add Multiple Recipients

Modify `scripts/send-test-report.js`:

```javascript
const recipients = process.env.TEST_REPORT_TO.split(',');
for (const recipient of recipients) {
  await sendEmail(recipient.trim(), subject, htmlReport);
}
```

### Custom Report Format

Modify `generateHTMLReport()` function in `scripts/send-test-report.js` to customize HTML template.

---

## Best Practices

1. **Always run tests before merging**: Use branch protection rules
2. **Monitor test trends**: Track pass/fail rates over time
3. **Review coverage**: Aim for >80% coverage on critical paths
4. **Fix failing tests immediately**: Don't let technical debt accumulate
5. **Use test reports for debugging**: JUnit XML can be parsed by CI tools

---

## Integration with Other CI Systems

### GitLab CI

```yaml
test:
  script:
    - cd backend
    - npm ci
    - npm run test:ci
  artifacts:
    reports:
      junit: backend/junit.xml
    paths:
      - backend/coverage/
```

### Jenkins

1. Install "JUnit Plugin"
2. Configure "Publish JUnit test result report" with pattern: `backend/junit.xml`
3. Add post-build step to email test results

### CircleCI

```yaml
- run:
    name: Run tests
    command: |
      cd backend
      npm run test:ci
- store_test_results:
    path: backend/junit.xml
- store_artifacts:
    path: backend/coverage
```

---

## Support

For issues with test reporting:
1. Check CI logs
2. Verify email configuration
3. Test email service manually
4. Review `scripts/send-test-report.js` for errors

---

**Last Updated**: January 2025

