"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBagIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
  recentOrders: any[];
  topProducts: any[];
  // Enhanced analytics
  monthlyRevenue: { month: string; revenue: number }[];
  orderStatusBreakdown: { status: string; count: number }[];
  topCategories: { name: string; productCount: number }[];
  customerGrowth: { month: string; newUsers: number }[];
  averageOrderValue: number;
  conversionRate: number;
}

interface RevenueStats {
  totalRevenue: number;
  revenueSinceReset: number;
  lastResetDate: string | null;
  orderCount: number;
  completedOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueMessage, setRevenueMessage] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    fetchRevenueStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const productsRes = await fetch('/api/products');
      const products = await productsRes.ok ? await productsRes.json() : [];
      
      // Fetch orders
      const ordersRes = await fetch('/api/orders');
      const orders = await ordersRes.ok ? await ordersRes.json() : [];
      
      // Fetch users
      const usersRes = await fetch('/api/users');
      const users = await usersRes.ok ? await usersRes.json() : [];
      
      // Calculate stats
      const totalProducts = products.length;
      const totalOrders = orders.length;
      const totalUsers = users.length;
      
      // Calculate revenue and low stock
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
      const lowStockProducts = products.filter((p: any) => (p.stock || 0) < 5).length;
      const pendingOrders = orders.filter((o: any) => o.status === 'PENDING').length;
      
      // Get recent orders
      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      // Get top products (by stock sold - simplified)
      const topProducts = products
        .sort((a: any, b: any) => (b.stock || 0) - (a.stock || 0))
        .slice(0, 5);

      // Enhanced analytics calculations
      const monthlyRevenue = calculateMonthlyRevenue(orders);
      const orderStatusBreakdown = calculateOrderStatusBreakdown(orders);
      const topCategories = await calculateTopCategories(products);
      const customerGrowth = calculateCustomerGrowth(users);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const conversionRate = calculateConversionRate(users, orders);

      setStats({
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        lowStockProducts,
        pendingOrders,
        recentOrders,
        topProducts,
        monthlyRevenue,
        orderStatusBreakdown,
        topCategories,
        customerGrowth,
        averageOrderValue,
        conversionRate
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueStats = async () => {
    try {
      console.log('Fetching revenue stats...');
      const response = await fetch(`/api/admin/revenue?t=${Date.now()}`);
      console.log('Revenue response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Revenue data received:', data);
        setRevenueStats(data);
      } else {
        console.error('Revenue response not ok:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Revenue stats error:', err);
    }
  };

  const resetRevenue = async () => {
    if (!confirm('Gelir sayacını sıfırlamak istediğinizden emin misiniz? Bu işlem mevcut tarihi sıfırlama noktası olarak işaretleyecektir.')) {
      return;
    }

    try {
      setRevenueLoading(true);
      const response = await fetch('/api/admin/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (response.ok) {
        const data = await response.json();
        setRevenueMessage(data.message);
        
        // Refresh revenue stats to get the updated data
        await fetchRevenueStats();
        
        // Show success message
        setTimeout(() => setRevenueMessage(''), 5000);
      }
    } catch (err) {
      setRevenueMessage('Gelir sıfırlama başarısız oldu');
      setTimeout(() => setRevenueMessage(''), 5000);
          } finally {
        setRevenueLoading(false);
      }
  };

  const testEmailSystem = async () => {
    try {
      const response = await fetch('/api/admin/test-email');
      const data = await response.json();
      
      if (data.success) {
        alert('Email system test successful! Check the console for details.');
        console.log('Email test result:', data);
      } else {
        alert(`Email system test failed: ${data.error}`);
        console.error('Email test error:', data);
      }
    } catch (err) {
      alert('Failed to test email system');
      console.error('Email test error:', err);
    }
  };

  // Analytics helper functions
  const calculateMonthlyRevenue = (orders: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(month => ({ month, revenue: 0 }));
    
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthIndex = date.getMonth();
      monthlyData[monthIndex].revenue += order.totalAmount || 0;
    });
    
    return monthlyData;
  };

  const calculateOrderStatusBreakdown = (orders: any[]) => {
    const statusCounts: { [key: string]: number } = {};
    orders.forEach(order => {
      const status = order.status || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
  };

  const calculateTopCategories = async (products: any[]) => {
    const categoryCounts: { [key: string]: number } = {};
    products.forEach(product => {
      if (product.category?.name) {
        categoryCounts[product.category.name] = (categoryCounts[product.category.name] || 0) + 1;
      }
    });
    
    return Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const calculateCustomerGrowth = (users: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(month => ({ month, newUsers: 0 }));
    
    users.forEach(user => {
      const date = new Date(user.createdAt);
      const monthIndex = date.getMonth();
      monthlyData[monthIndex].newUsers += 1;
    });
    
    return monthlyData;
  };

  const calculateConversionRate = (users: any[], orders: any[]) => {
    if (users.length === 0) return 0;
    const usersWithOrders = new Set(orders.map(order => order.userId));
    return (usersWithOrders.size / users.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Admin Dashboard</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalProducts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">₺{stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalOrders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-teal-500">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-semibold text-gray-900">₺{stats?.averageOrderValue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Customer Purchase Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.conversionRate?.toFixed(1) || '0.0'}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-pink-500">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.lowStockProducts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.pendingOrders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Management Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-2" />
            Revenue Management
          </h2>
          <button
            onClick={resetRevenue}
            disabled={revenueLoading}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            {revenueLoading ? 'Resetting...' : 'Reset Revenue'}
          </button>
        </div>

        {revenueMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            revenueMessage.includes('Failed') 
              ? 'bg-red-50 border border-red-200 text-red-700' 
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {revenueMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₺{revenueStats?.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Revenue Since Reset</p>
            <p className="text-2xl font-bold text-blue-600">₺{revenueStats?.revenueSinceReset?.toFixed(2) || '0.00'}</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600">Last Reset Date</p>
            <p className="text-lg font-medium text-gray-900">
              {revenueStats?.lastResetDate 
                ? new Date(revenueStats.lastResetDate).toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Hiç sıfırlanmadı'
              }
            </p>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Not:</strong> Gelir sıfırlama, mevcut tarihi sıfırlama noktası olarak işaretleyecektir. Sıfırlamadan sonraki gelir, o tarihten itibaren kazanılan geliri gösterecektir.</p>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
            Monthly Revenue
          </h2>
          <div className="h-64 flex items-end justify-between space-x-2">
            {stats?.monthlyRevenue?.map((month, index) => (
              <div key={month.month} className="flex flex-col items-center">
                <div 
                  className="w-8 bg-blue-500 rounded-t"
                  style={{ 
                    height: `${Math.max((month.revenue / Math.max(...(stats?.monthlyRevenue?.map(m => m.revenue) || [1]))) * 200, 10)}px` 
                  }}
                ></div>
                <p className="text-xs text-gray-600 mt-2">{month.month}</p>
                <p className="text-xs text-gray-500">₺{month.revenue.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 text-green-600 mr-2" />
            Order Status Breakdown
          </h2>
          <div className="space-y-3">
            {stats?.orderStatusBreakdown?.map((status) => (
              <div key={status.status} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">{status.status}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${(status.count / Math.max(...(stats?.orderStatusBreakdown?.map(s => s.count) || [1]))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{status.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Categories and Customer Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Categories */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 text-purple-600 mr-2" />
            Top Categories
          </h2>
          <div className="space-y-3">
            {stats?.topCategories?.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
                <span className="text-sm text-gray-600">{category.productCount} products</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Growth */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 text-indigo-600 mr-2" />
            Customer Growth
          </h2>
          <div className="h-64 flex items-end justify-between space-x-2">
            {stats?.customerGrowth?.map((month, index) => (
              <div key={month.month} className="flex flex-col items-center">
                <div 
                  className="w-8 bg-indigo-500 rounded-t"
                  style={{ 
                    height: `${Math.max((month.newUsers / Math.max(...(stats?.customerGrowth?.map(m => m.newUsers) || [1]))) * 200, 10)}px` 
                  }}
                ></div>
                <p className="text-xs text-gray-600 mt-2">{month.month}</p>
                <p className="text-xs text-gray-500">{month.newUsers}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Alerts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
            Alerts & Notifications
          </h2>
          <div className="space-y-3">
            {stats?.lowStockProducts && stats.lowStockProducts > 0 && (
              <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-md">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    {stats.lowStockProducts} products have low stock (&lt;5 items)
                  </p>
                  <Link href="/admin/products" className="text-xs text-orange-600 hover:underline">
                    View products →
                  </Link>
                </div>
              </div>
            )}
            
            {stats?.pendingOrders && stats.pendingOrders > 0 && (
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                <ClockIcon className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {stats.pendingOrders} orders pending processing
                  </p>
                  <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline">
                    View orders →
                  </Link>
                </div>
              </div>
            )}

            {(!stats?.lowStockProducts || stats.lowStockProducts === 0) && (!stats?.pendingOrders || stats.pendingOrders === 0) && (
              <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                <p className="text-sm font-medium text-green-800">All systems operational</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link 
              href="/admin/products/new"
              className="p-3 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-center"
            >
              <ShoppingBagIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-800">Add Product</p>
            </Link>
            
            <Link 
              href="/admin/categories"
              className="p-3 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors text-center"
            >
              <ChartBarIcon className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">Manage Categories</p>
            </Link>
            
            <Link 
              href="/admin/orders"
              className="p-3 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors text-center"
            >
              <EyeIcon className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-800">View Orders</p>
            </Link>
            
            <Link 
              href="/admin/users"
              className="p-3 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors text-center"
            >
              <UserGroupIcon className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-800">Manage Users</p>
            </Link>
            
            <button 
              onClick={testEmailSystem}
              disabled
              className="p-3 bg-gray-50 border border-gray-200 rounded-md text-center cursor-not-allowed opacity-50"
              title="Email system temporarily disabled - configure SMTP settings first"
            >
              <EnvelopeIcon className="h-6 w-6 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Test Email (Disabled)</p>
            </button>

            <Link 
              href="/admin/products/bulk-upload"
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors text-center"
            >
              <ChartBarIcon className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-emerald-800">Bulk Upload</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Recent Orders</h2>
          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order #{order.id.slice(-8)}</p>
                    <p className="text-xs text-gray-600">₺{order.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent orders</p>
          )}
          <div className="mt-4 text-center">
            <Link href="/admin/orders" className="text-blue-600 hover:underline text-sm">
              View all orders →
            </Link>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Top Products</h2>
          {stats?.topProducts && stats.topProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.topProducts.map((product: any) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-600">Stock: {product.stock || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">₺{product.price?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No products available</p>
          )}
          <div className="mt-4 text-center">
            <Link href="/admin/products" className="text-blue-600 hover:underline text-sm">
              View all products →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 