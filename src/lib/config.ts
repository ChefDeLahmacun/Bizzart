// Configuration file for managing testing mode and other settings

export const config = {
  // Testing Mode Configuration
  testing: {
    enabled: process.env.NODE_ENV === 'development' || process.env.TESTING_MODE === 'true',
    paymentSimulation: true, // Simulate payments in testing mode
    showTestBanner: true, // Show testing mode banner
    allowRealPayments: false, // Block real payments in testing mode
  },
  
  // Payment Configuration
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'iyzico', // 'iyzico' or 'stripe'
    testing: {
      simulateSuccess: true, // Always simulate successful payments in testing
      simulateDelay: 2000, // Simulate 2 second processing time
      testCards: [
        '4111 1111 1111 1111', // Visa
        '5555 5555 5555 4444', // Mastercard
        '3782 822463 10005',   // American Express
      ]
    }
  },
  
  // Environment Configuration
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTesting: process.env.TESTING_MODE === 'true',
  }
};

// Helper functions
export const isTestingMode = () => config.testing.enabled;
export const isProductionMode = () => !config.testing.enabled;
export const shouldSimulatePayments = () => config.testing.paymentSimulation;
export const getPaymentProvider = () => config.payment.provider;
