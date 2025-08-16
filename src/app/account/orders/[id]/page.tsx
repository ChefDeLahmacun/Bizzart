"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  TruckIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
  };
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface TrackingEvent {
  status: string;
  description: string;
  timestamp: string;
  location?: string;
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (id) {
      fetchOrder();
    }
  }, [id, session, router]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Order not found");
        } else if (response.status === 403) {
          setError("You don't have permission to view this order");
        } else {
          setError("Failed to load order");
        }
        return;
      }

      const data = await response.json();
      setOrder(data);
    } catch (error) {
      setError("Failed to load order");
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'PROCESSING':
        return <ClockIcon className="h-6 w-6 text-blue-500" />;
      case 'SHIPPED':
        return <TruckIcon className="h-6 w-6 text-purple-500" />;
      case 'DELIVERED':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'CANCELLED':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackingEvents = (order: Order): TrackingEvent[] => {
    const events: TrackingEvent[] = [];
    
    // Order created
    events.push({
      status: 'Order Placed',
      description: 'Your order has been successfully placed',
      timestamp: order.createdAt,
      location: 'Online'
    });

    // Order status updates
    if (order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      events.push({
        status: 'Processing',
        description: 'Your order is being prepared for shipping',
        timestamp: order.updatedAt,
        location: 'Warehouse'
      });
    }

    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      events.push({
        status: 'Shipped',
        description: 'Your order has been shipped',
        timestamp: order.updatedAt,
        location: 'Shipping Center'
      });
    }

    if (order.status === 'DELIVERED') {
      events.push({
        status: 'Delivered',
        description: 'Your order has been delivered',
        timestamp: order.updatedAt,
        location: order.address.city
      });
    }

    if (order.status === 'CANCELLED') {
      events.push({
        status: 'Cancelled',
        description: 'Your order has been cancelled',
        timestamp: order.updatedAt,
        location: 'Online'
      });
    }

    return events.reverse(); // Show most recent first
  };

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your orders.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Order not found"}</p>
          <button
            onClick={() => router.push('/account')}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            Back to Account
          </button>
        </div>
      </div>
    );
  }

  const trackingEvents = getTrackingEvents(order);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/account')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Account
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Order #{order.id.slice(-8)}</h1>
        <p className="text-gray-600 mt-2">
          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Status & Tracking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon(order.status)}
              <div>
                <p className="font-medium text-gray-900">
                  {order.status === 'PENDING' && 'Order Placed'}
                  {order.status === 'PROCESSING' && 'Processing'}
                  {order.status === 'SHIPPED' && 'Shipped'}
                  {order.status === 'DELIVERED' && 'Delivered'}
                  {order.status === 'CANCELLED' && 'Cancelled'}
                </p>
                <p className="text-sm text-gray-600">
                  {order.status === 'PENDING' && 'We\'re preparing your order'}
                  {order.status === 'PROCESSING' && 'Your order is being prepared'}
                  {order.status === 'SHIPPED' && 'Your order is on its way'}
                  {order.status === 'DELIVERED' && 'Your order has been delivered'}
                  {order.status === 'CANCELLED' && 'Your order has been cancelled'}
                </p>
              </div>
            </div>

            {order.trackingNumber && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Tracking Number</p>
                <p className="font-mono text-lg text-gray-900">{order.trackingNumber}</p>
              </div>
            )}

            {order.estimatedDelivery && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-700 mb-2">Estimated Delivery</p>
                <p className="text-blue-900">
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Tracking Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {trackingEvents.map((event, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                    {index < trackingEvents.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-300 mx-auto mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.status}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {event.location && ` • ${event.location}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
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
                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">₺{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">₺{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 text-gray-500 mr-2" />
              Shipping Address
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>{order.address.city}, {order.address.state && `${order.address.state}, `}{order.address.postalCode}</p>
              <p>{order.address.country}</p>
              <div className="flex items-center mt-3">
                <PhoneIcon className="h-4 w-4 text-gray-500 mr-2" />
                <span>{order.address.phone}</span>
              </div>
            </div>
          </div>

          {/* Need Help */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
            <p className="text-sm text-blue-700 mb-4">
              Questions about your order? We're here to help!
            </p>
            <button
              onClick={() => router.push('/contact')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
