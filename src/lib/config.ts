// Configuration file for managing testing mode and other settings

export const config = {
  // Testing Mode Configuration
  testing: {
    enabled: process.env.TESTING_MODE === 'true',
    paymentSimulation: process.env.TESTING_MODE === 'true',
    showTestBanner: process.env.TESTING_MODE === 'true',
    allowRealPayments: process.env.TESTING_MODE !== 'true',
  },
  
  // Payment Configuration
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'iyzico', // 'iyzico' or 'stripe'
    testing: {
      simulateSuccess: process.env.TESTING_MODE === 'true',
      simulateDelay: process.env.TESTING_MODE === 'true' ? 2000 : 0,
      testCards: [
        '4111 1111 1111 1111', // Visa
        '5555 5555 5555 4444', // Mastercard
        '3782 822463 10005',   // American Express
      ]
    }
  },
  
  // Environment Configuration
  environment: {
    isTesting: process.env.TESTING_MODE === 'true',
  }
};

// Helper functions
export const isTestingMode = () => config.testing.enabled;
export const isProductionMode = () => !config.testing.enabled;
export const shouldSimulatePayments = () => config.testing.paymentSimulation;
export const getPaymentProvider = () => config.payment.provider;
