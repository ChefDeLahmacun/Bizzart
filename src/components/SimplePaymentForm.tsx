"use client";

import { useState } from 'react';

interface SimplePaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  orderId?: string;
}

export default function SimplePaymentForm({ amount, onSuccess, onError, orderId }: SimplePaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      // For testing, always succeed
      // In production, this would integrate with a real payment processor
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Information</h3>
        
        {/* Card Number */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-2">
            Card Number
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className="w-full p-3 rounded border bg-white/20 text-white border-white/30 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Cardholder Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-2">
            Cardholder Name
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="John Doe"
            className="w-full p-3 rounded border bg-white/20 text-white border-white/30 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Expiry and CVC */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              maxLength={5}
              className="w-full p-3 rounded border bg-white/20 text-white border-white/30 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              CVC
            </label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 3))}
              placeholder="123"
              maxLength={3}
              className="w-full p-3 rounded border bg-white/20 text-white border-white/30 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Test Card Info */}
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            💳 <strong>Test Mode:</strong> Use any valid card details. This is a demo payment form.
          </p>
        </div>
      </div>
      
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
