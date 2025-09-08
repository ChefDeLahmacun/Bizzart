"use client";

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface GuestOrder {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  guestEmail: string;
  guestName: string;
  guestPhone: string;
  guestAddress: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      images: Array<{
        url: string;
      }>;
    };
  }>;
}

function OrderTrackingContent() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  // Check if orderId is in URL params
  const urlOrderId = searchParams.get('orderId');
  if (urlOrderId && !orderId) {
    setOrderId(urlOrderId);
    handleTrackOrder(urlOrderId);
  }

  const handleTrackOrder = async (id?: string) => {
    const orderIdToTrack = id || orderId;
    if (!orderIdToTrack) {
      setError('Please enter an order ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/guest/${orderIdToTrack}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Order not found');
      }

      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-400';
      case 'CONFIRMED':
        return 'text-blue-400';
      case 'SHIPPED':
        return 'text-purple-400';
      case 'DELIVERED':
        return 'text-green-400';
      case 'CANCELLED':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Payment Pending';
      case 'CONFIRMED':
        return 'Order Confirmed';
      case 'SHIPPED':
        return 'Shipped';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Track Your Order</h1>
      
      {/* Search Form */}
      <div className="bg-white/10 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Enter Order ID</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter your order ID"
            className="flex-1 p-3 rounded border bg-white/20 text-white border-white/30 placeholder-gray-400"
          />
          <button
            onClick={() => handleTrackOrder()}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* Order Details */}
      {order && (
        <div className="space-y-6">
          {/* Order Header */}
          <div className="bg-white/10 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Order #{order.id}</h2>
                <p className="text-gray-300">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </div>
                <div className="text-white text-xl font-bold">
                  ₺{order.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                    {item.product.images && item.product.images.length > 0 ? (
                      <img 
                        src={item.product.images[0].url} 
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{item.product.name}</h4>
                    <p className="text-gray-300">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-white font-semibold">
                    ₺{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Shipping Address</h3>
            <div className="text-white">
              <p className="font-medium">{order.guestName}</p>
              <p>{order.guestAddress.line1}</p>
              {order.guestAddress.line2 && <p>{order.guestAddress.line2}</p>}
              <p>{order.guestAddress.city}, {order.guestAddress.state} {order.guestAddress.postalCode}</p>
              <p>{order.guestAddress.country}</p>
              <p className="mt-2 text-gray-300">Phone: {order.guestPhone}</p>
              <p className="text-gray-300">Email: {order.guestEmail}</p>
            </div>
          </div>

          {/* Back to Shop */}
          <div className="text-center">
            <Link 
              href="/products"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-white">Need Help?</h3>
        <p className="text-gray-300 mb-4">
          If you can't find your order or have any questions, please contact our support team.
        </p>
        <Link 
          href="/contact"
          className="inline-block px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Track Your Order</h1>
        <div className="bg-white/10 rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <OrderTrackingContent />
    </Suspense>
  );
}