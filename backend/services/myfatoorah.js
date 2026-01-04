const axios = require('axios');

const MYFATOORAH_BASE_URL = process.env.MYFATOORAH_BASE_URL || 'https://apitest.myfatoorah.com';
const MYFATOORAH_API_KEY = process.env.MYFATOORAH_API_KEY;

// Test mode configuration
const TEST_DISABLE_MYFATOORAH = process.env.TEST_DISABLE_MYFATOORAH === 'true' || 
                                 process.env.NODE_ENV === 'test' ||
                                 process.env.DISABLE_MYFATOORAH === 'true';

// Initialize payment with MyFatoorah
async function initiatePayment(orderData) {
  // TEST MODE: Return mock response without calling MyFatoorah
  if (TEST_DISABLE_MYFATOORAH) {
    const mockInvoiceId = `test-invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const mockInvoiceReference = `TEST-REF-${Date.now()}`;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    console.log('🧪 [TEST MODE] Base URL:', baseUrl);
    const mockPaymentUrl = `${baseUrl}/order-confirmation.html?orderId=${orderData.orderId || 'pending'}&test=true`;
    
    console.log('🧪 [TEST MODE] Mock MyFatoorah Payment Initiated');
    console.log('🧪 [TEST MODE] Order Data:', {
      amount: orderData.amount,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      itemsCount: orderData.items.length
    });
    console.log('🧪 [TEST MODE] Mock Invoice ID:', mockInvoiceId);
    console.log('🧪 [TEST MODE] Mock Invoice Reference:', mockInvoiceReference);
    console.log('🧪 [TEST MODE] Mock Payment URL:', mockPaymentUrl);
    console.log('🧪 [TEST MODE] ⚠️  NO EXTERNAL API CALL MADE TO MYFATOORAH');
    
    return {
      success: true,
      invoiceId: mockInvoiceId,
      paymentUrl: mockPaymentUrl,
      invoiceReference: mockInvoiceReference,
      _testMode: true
    };
  }

  // PRODUCTION MODE: Real MyFatoorah API call
  try {
    console.log('💳 [PRODUCTION] Initiating MyFatoorah payment...');
    console.log('💳 [PRODUCTION] API URL:', `${MYFATOORAH_BASE_URL}/v2/SendPayment`);
    
    // Build payment payload
    const paymentPayload = {
      InvoiceValue: orderData.amount,
      CurrencyIso: 'KWD',
      CustomerName: orderData.customerName || 'Customer',
      CustomerEmail: orderData.customerEmail,
      CustomerMobile: orderData.customerPhone || '',
      CallBackUrl: orderData.callbackUrl,
      ErrorUrl: orderData.errorUrl,
      Language: 'en',
      NotificationOption: 'Lnk', // Lnk = Send invoice link via email
      InvoiceItems: orderData.items.map(item => ({
        ItemName: item.name,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice
      }))
    };
    
    // Add CustomerReference if provided (MyFatoorah supports this field)
    if (orderData.customerReference) {
      paymentPayload.CustomerReference = orderData.customerReference;
    }
    
    console.log('💳 [PRODUCTION] MyFatoorah payment payload:', {
      CustomerName: paymentPayload.CustomerName,
      CustomerEmail: paymentPayload.CustomerEmail,
      CustomerMobile: paymentPayload.CustomerMobile || 'Not provided',
      CustomerReference: paymentPayload.CustomerReference || 'Not provided',
      InvoiceValue: paymentPayload.InvoiceValue
    });
    
    const response = await axios.post(
      `${MYFATOORAH_BASE_URL}/v2/SendPayment`,
      paymentPayload,
      {
        headers: {
          'Authorization': `Bearer ${MYFATOORAH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.IsSuccess) {
      console.log('💳 [PRODUCTION] Payment initiated successfully');
      console.log('💳 [PRODUCTION] Invoice ID:', response.data.Data.InvoiceId);
      console.log('💳 [PRODUCTION] Invoice URL:', response.data.Data.InvoiceURL);
      return {
        success: true,
        invoiceId: response.data.Data.InvoiceId,
        paymentUrl: response.data.Data.InvoiceURL || response.data.Data.PaymentURL,
        invoiceReference: response.data.Data.CustomerReference || response.data.Data.InvoiceReference
      };
    } else {
      throw new Error(response.data.Message || 'Payment initiation failed');
    }
  } catch (error) {
    console.error('💳 [PRODUCTION] MyFatoorah payment error:', error.response?.data || error.message);
    throw error;
  }
}

// Verify payment status
async function verifyPayment(invoiceId, keyType = 'InvoiceId') {
  // TEST MODE: Return mock successful payment verification
  if (TEST_DISABLE_MYFATOORAH) {
    console.log('🧪 [TEST MODE] Mock MyFatoorah Payment Verification');
    console.log('🧪 [TEST MODE] Invoice ID:', invoiceId);
    console.log('🧪 [TEST MODE] ⚠️  NO EXTERNAL API CALL MADE TO MYFATOORAH');
    console.log('🧪 [TEST MODE] Returning mock "Paid" status');
    
    return {
      success: true,
      invoiceId: invoiceId,
      invoiceStatus: 'Paid', // Always return "Paid" in test mode
      invoiceValue: 0, // Will be updated from order
      invoiceTransactions: [{
        TransactionId: `test-txn-${Date.now()}`,
        PaymentId: invoiceId,
        PaymentGateway: 'TEST_MODE',
        PaymentDate: new Date().toISOString(),
        TransactionStatus: 'SUCCESS',
        PaymentValue: 0
      }],
      _testMode: true
    };
  }

  // PRODUCTION MODE: Real MyFatoorah API call
  try {
    console.log('💳 [PRODUCTION] Verifying MyFatoorah payment...');
    console.log('💳 [PRODUCTION] Invoice ID:', invoiceId);
    
    const response = await axios.post(
      `${MYFATOORAH_BASE_URL}/v2/GetPaymentStatus`,
      {
        Key: invoiceId,
        KeyType: keyType // 'InvoiceId' or 'PaymentId'
      },
      {
        headers: {
          'Authorization': `Bearer ${MYFATOORAH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.IsSuccess) {
      const payment = response.data.Data;
      console.log('💳 [PRODUCTION] Payment verified. Status:', payment.InvoiceStatus);
      console.log('💳 [PRODUCTION] Invoice Transactions:', payment.InvoiceTransactions?.length || 0);
      
      // Check transaction status for successful payments
      const transactions = payment.InvoiceTransactions || [];
      const successfulTransaction = transactions.find(t => {
        const status = (t.TransactionStatus || '').toLowerCase();
        return status === 'succss' || status === 'success' || status === 'succeeded';
      });
      
      // If invoice status is not "Paid" but we have a successful transaction, consider it paid
      let invoiceStatus = payment.InvoiceStatus;
      if (successfulTransaction && invoiceStatus !== 'Paid') {
        console.log('💳 [PRODUCTION] Found successful transaction, marking as Paid');
        invoiceStatus = 'Paid';
      }
      
      return {
        success: true,
        invoiceId: payment.InvoiceId,
        invoiceStatus: invoiceStatus,
        invoiceValue: payment.InvoiceValue,
        invoiceTransactions: transactions
      };
    } else {
      throw new Error(response.data.Message || 'Payment verification failed');
    }
  } catch (error) {
    console.error('💳 [PRODUCTION] MyFatoorah verification error:', error.response?.data || error.message);
    throw error;
  }
}

// Get payment URL for an existing invoice
async function getPaymentUrl(invoiceId) {
  // TEST MODE: Return mock payment URL
  if (TEST_DISABLE_MYFATOORAH) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    const mockPaymentUrl = `${baseUrl}/order-confirmation.html?invoiceId=${invoiceId}&test=true`;
    console.log('🧪 [TEST MODE] Mock Payment URL for invoice:', invoiceId);
    return {
      success: true,
      paymentUrl: mockPaymentUrl,
      invoiceId: invoiceId,
      _testMode: true
    };
  }

  // PRODUCTION MODE: Get payment URL from MyFatoorah
  try {
    console.log('💳 [PRODUCTION] Getting payment URL for invoice:', invoiceId);
    
    // Get invoice details from MyFatoorah
    const response = await axios.post(
      `${MYFATOORAH_BASE_URL}/v2/GetPaymentStatus`,
      {
        Key: invoiceId,
        KeyType: 'InvoiceId'
      },
      {
        headers: {
          'Authorization': `Bearer ${MYFATOORAH_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.IsSuccess) {
      const invoiceData = response.data.Data;
      
      // MyFatoorah provides InvoiceURL in the response
      // If not available, construct it using the standard format
      let paymentUrl = invoiceData.InvoiceURL || invoiceData.PaymentURL;
      
      if (!paymentUrl) {
        // Fallback: construct payment URL
        const baseUrl = process.env.MYFATOORAH_PAYMENT_BASE_URL || 'https://myfatoorah.com';
        paymentUrl = `${baseUrl}/paypage/invoiceid/${invoiceId}`;
      }
      
      console.log('💳 [PRODUCTION] Payment URL:', paymentUrl);
      
      return {
        success: true,
        paymentUrl: paymentUrl,
        invoiceId: invoiceId
      };
    } else {
      throw new Error(response.data.Message || 'Failed to retrieve invoice information');
    }
  } catch (error) {
    console.error('💳 [PRODUCTION] Error getting payment URL:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { initiatePayment, verifyPayment, getPaymentUrl };

