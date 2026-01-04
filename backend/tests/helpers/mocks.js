/**
 * Test Mocks
 * Mock external services (email, payment gateway, etc.)
 */

/**
 * Mock email service
 */
const mockEmailService = {
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendOrderConfirmationToUser: jest.fn().mockResolvedValue({ success: true }),
  sendNewOrderNotificationToOwner: jest.fn().mockResolvedValue({ success: true }),
  sendPaymentReceivedEmail: jest.fn().mockResolvedValue({ success: true }),
  sendShippingConfirmationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendRefundInitiatedEmail: jest.fn().mockResolvedValue({ success: true }),
  sendRefundCompletedEmail: jest.fn().mockResolvedValue({ success: true }),
  sendAbandonedCartEmail: jest.fn().mockResolvedValue({ success: true }),
  sendBackInStockEmail: jest.fn().mockResolvedValue({ success: true }),
  sendContactFormReceipt: jest.fn().mockResolvedValue({ success: true }),
  sendPaymentFailedAlert: jest.fn().mockResolvedValue({ success: true }),
  sendHighRiskOrderAlert: jest.fn().mockResolvedValue({ success: true }),
  sendLowStockAlert: jest.fn().mockResolvedValue({ success: true }),
  sendDailyReport: jest.fn().mockResolvedValue({ success: true })
};

/**
 * Mock MyFatoorah payment service
 */
const mockPaymentService = {
  initiatePayment: jest.fn().mockResolvedValue({
    success: true,
    invoiceId: 'test-invoice-123',
    paymentUrl: 'https://test-payment-url.com',
    invoiceReference: 'TEST-REF-123'
  }),
  verifyPayment: jest.fn().mockResolvedValue({
    success: true,
    invoiceId: 'test-invoice-123',
    invoiceStatus: 'Paid',
    invoiceValue: 10.000,
    invoiceTransactions: [{
      TransactionId: 'test-txn-123',
      PaymentId: 'test-invoice-123',
      PaymentGateway: 'TEST',
      PaymentDate: new Date().toISOString(),
      TransactionStatus: 'SUCCESS',
      PaymentValue: 10.000
    }]
  }),
  getPaymentUrl: jest.fn().mockResolvedValue({
    success: true,
    paymentUrl: 'https://test-payment-url.com',
    invoiceId: 'test-invoice-123'
  })
};

/**
 * Setup mocks before tests
 */
function setupMocks() {
  jest.mock('../../services/email', () => mockEmailService);
  jest.mock('../../services/myfatoorah', () => mockPaymentService);
}

/**
 * Reset all mocks
 */
function resetMocks() {
  Object.values(mockEmailService).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
  Object.values(mockPaymentService).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
}

module.exports = {
  mockEmailService,
  mockPaymentService,
  setupMocks,
  resetMocks
};

