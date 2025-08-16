"use client";
import { useEffect, useState } from "react";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  TruckIcon, 
  XCircleIcon,
  EyeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  user?: {
    email: string;
    name?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }>;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders");
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError("Failed to fetch orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update order");
      
      setSuccess(`Order ${orderId.slice(-8)} marked as ${newStatus.toLowerCase()}`);
      fetchOrders(); // Refresh orders
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update order status");
      console.error(err);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This will restore product stock and create a refund record.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Order cancelled by admin",
          refundAmount: null, // Will use full order amount
          refundMethod: "AUTOMATIC"
        }),
      });

      if (!response.ok) throw new Error("Failed to cancel order");
      
      setSuccess(`Order ${orderId.slice(-8)} cancelled successfully`);
      fetchOrders(); // Refresh orders
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to cancel order");
      console.error(err);
      setTimeout(() => setError(""), 3000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'PROCESSING':
        return <TruckIcon className="h-5 w-5 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'CANCELLED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <div className="text-sm text-gray-600">
          Total Orders: {orders.length}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      #{order.id.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.user?.email || 'Guest'}
                    </div>
                    {order.address && (
                      <div className="text-xs text-gray-500">
                        {order.address.city}, {order.address.postalCode}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ₺{order.totalAmount?.toFixed(2) || '0.00'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {order.status !== 'COMPLETED' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                          className="p-2 text-green-400 hover:text-green-600 transition-colors"
                          title="Mark as Completed"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
                          className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                          title="Mark as Processing"
                        >
                          <TruckIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          title="Cancel Order"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Order #{selectedOrder.id.slice(-8)} Details
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Customer Information</h4>
                <p className="text-sm text-gray-600">
                  Email: {selectedOrder.user?.email || 'Guest'}
                </p>
                {selectedOrder.address && (
                  <p className="text-sm text-gray-600">
                    Address: {selectedOrder.address.line1}, {selectedOrder.address.city} {selectedOrder.address.postalCode}
                  </p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product.name} x {item.quantity}</span>
                      <span>₺{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ₺{selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 