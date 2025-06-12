"use client";

import { useState } from 'react';
import { isTestingMode, shouldSimulatePayments } from '@/lib/config';

interface IyzicoPaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  orderId?: string;
}

export default function IyzicoPaymentForm({ amount, onSuccess, onError, orderId }: IyzicoPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    if (!orderId) {
      setError('Order ID is missing');
      setIsProcessing(false);
      return;
    }

    // Check if we should simulate payments (testing mode)
    if (isTestingMode() && shouldSimulatePayments()) {
      // Simulate payment processing
      console.log('🧪 Testing Mode: Simulating payment...');
      
      setTimeout(() => {
        setIsProcessing(false);
        console.log('🧪 Testing Mode: Payment simulation successful');
        onSuccess();
      }, 2000);
      
      return;
    }

    // Real payment processing (production mode)
    try {
      // Parse expiry date
      const [expireMonth, expireYear] = expiry.split('/');
      const fullYear = expireYear.length === 2 ? `20${expireYear}` : expireYear;

      const response = await fetch('/api/payment/iyzico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          cardHolderName: cardholderName,
          cardNumber: cardNumber.replace(/\s/g, ''),
          expireMonth,
          expireYear: fullYear,
          cvc,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Payment failed');
      }

      if (data.success) {
        onSuccess();
      } else {
        throw new Error(data.details || 'Payment failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const formatCVC = (value: string) => {
    return value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').substring(0, 4);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
        
        {/* Testing Mode Notice */}
        {isTestingMode() && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              🧪 <strong>Testing Mode:</strong> Payments are simulated. No real charges will be made.
            </p>
          </div>
        )}
        
        {/* Card Number */}
        <div className="mb-4">
          <label htmlFor="cardNumber" className="block text-sm font-medium text-white mb-2">
            Card Number
          </label>
          <input
            type="text"
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            required
            className="w-full p-3 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Cardholder Name */}
        <div className="mb-4">
          <label htmlFor="cardholderName" className="block text-sm font-medium text-white mb-2">
            Cardholder Name
          </label>
          <input
            type="text"
            id="cardholderName"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
            placeholder="JOHN DOE"
            required
            className="w-full p-3 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Expiry and CVC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiry" className="block text-sm font-medium text-white mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              id="expiry"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              maxLength={5}
              required
              className="w-full p-3 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="cvc" className="block text-sm font-medium text-white mb-2">
              CVC
            </label>
            <input
              type="text"
              id="cvc"
              value={cvc}
              onChange={(e) => setCvc(formatCVC(e.target.value))}
              placeholder="123"
              maxLength={4}
              required
              className="w-full p-3 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Test Mode Notice */}
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            💳 <strong>Test Mode:</strong> Use any valid card details. {isTestingMode() ? 'Payments are simulated.' : 'This is a real payment form.'}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing Payment...' : `Pay ₺${amount.toFixed(2)}`}
      </button>
    </form>
  );
}
