"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (params.id) {
      fetchOrder();
    }
  }, [status, params.id, router]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
        <div className="text-center mt-4">
          <Link href="/account" className="text-blue-400 hover:underline">
            Back to Account
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-white">Order not found</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-400';
      case 'processing':
        return 'text-blue-400';
      case 'shipped':
        return 'text-purple-400';
      case 'delivered':
        return 'text-green-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Success Message */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
        <p className="text-gray-300">Thank you for your purchase. Your order has been successfully placed.</p>
      </div>

      {/* Order Details */}
      <div className="bg-white/10 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Order Details</h2>
        <div className="grid md:grid-cols-2 gap-4 text-white">
          <div>
            <span className="text-gray-300">Order ID:</span>
            <span className="ml-2 font-mono">{order.id}</span>
          </div>
          <div>
            <span className="text-gray-300">Date:</span>
            <span className="ml-2">{formatDate(order.createdAt)}</span>
          </div>
          <div>
            <span className="text-gray-300">Status:</span>
            <span className={`ml-2 ${getStatusColor(order.status)} font-medium`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
            </span>
          </div>
          <div>
            <span className="text-gray-300">Total:</span>
            <span className="ml-2 font-bold text-lg">₺{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      {order.address && (
        <div className="bg-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Shipping Address</h2>
          <div className="text-white">
            <p>{order.address.line1}</p>
            {order.address.line2 && <p>{order.address.line2}</p>}
            <p>{order.address.city}, {order.address.state} {order.address.postalCode}</p>
            <p>{order.address.country}</p>
            <p className="mt-2 text-blue-300">📞 {order.address.phone}</p>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white/10 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Order Items</h2>
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
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{item.product.name}</h3>
                <p className="text-gray-300 text-sm">Quantity: {item.quantity}</p>
              </div>
              <div className="text-white font-medium">
                ₺{(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">What's Next?</h3>
        <ul className="text-gray-300 space-y-2">
          <li>• You'll receive an email confirmation shortly</li>
          <li>• We'll notify you when your order ships</li>
          <li>• Track your order status in your account</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/products"
          className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
        >
          Continue Shopping
        </Link>
        <Link
          href="/account"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
        >
          View My Orders
        </Link>
      </div>
    </div>
  );
}
