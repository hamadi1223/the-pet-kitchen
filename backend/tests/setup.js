/**
 * Test Setup
 * Configures test environment, database, and mocks
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'petkitchen_test';
process.env.DB_USER = process.env.TEST_DB_USER || 'root';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || '';
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.TEST_DISABLE_MYFATOORAH = 'true';
process.env.OUTLOOK_EMAIL = 'test@example.com';
process.env.OUTLOOK_PASSWORD = 'test-password';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.FRONTEND_URL = 'http://localhost:8000';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Will be populated by test helpers
};

// Cleanup after all tests
afterAll(async () => {
  // Close any open connections
  const pool = require('../config/database');
  await pool.end();
});

