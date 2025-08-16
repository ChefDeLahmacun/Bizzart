"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    if (paymentIntent) {
      // Payment successful - additional logic can be added here
      // - Sending confirmation emails
      // - Updating inventory
      // - Analytics tracking
    }
  }, [paymentIntent]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      {/* Success Icon */}
      <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Success Message */}
      <h1 className="text-4xl font-bold text-white mb-4">Payment Successful!</h1>
      <p className="text-xl text-gray-300 mb-8">
        Thank you for your purchase. Your order has been confirmed and is being processed.
      </p>

      {/* Order Details */}
      <div className="bg-white/10 rounded-lg p-8 mb-8 max-w-md mx-auto">
        <h2 className="text-lg font-semibold text-white mb-4">What's Next?</h2>
        <ul className="text-gray-300 space-y-3 text-left">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
            Order confirmed and payment processed
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
            Order is being prepared for shipping
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
            You'll receive shipping updates via email
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/products"
          className="px-8 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Continue Shopping
        </Link>
        <Link
          href="/account"
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          View My Orders
        </Link>
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-gray-400 text-sm">
        <p>If you have any questions about your order, please contact our support team.</p>
        <p className="mt-2">A confirmation email has been sent to your email address.</p>
      </div>
    </div>
  );
}
