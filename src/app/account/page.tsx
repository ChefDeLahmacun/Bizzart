"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      images: Array<{ url: string }>;
    };
  }>;
  address: {
    line1: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

type TabType = 'profile' | 'orders' | 'addresses' | 'preferences';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  
  // Password management state
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  // Language management state
  const [savedLanguage, setSavedLanguage] = useState(session?.user?.language || "en");
  const [language, setLanguage] = useState(savedLanguage);
  const [langSuccess, setLangSuccess] = useState("");
  const [langError, setLangError] = useState("");
  const [langLoading, setLangLoading] = useState(false);
  
  // Address management state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
    newsletter: false,
    orderTracking: true,
    lowStockAlerts: false
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSuccess, setPreferencesSuccess] = useState("");
  const [preferencesError, setPreferencesError] = useState("");

  // Load addresses when session is available
  const loadAddresses = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch(`/api/users/${session.user.id}/address`);
      if (!response.ok) throw new Error('Failed to fetch addresses');
      const data = await response.json();
      setAddresses(data);
    } catch (error) {
      setAddressError('Failed to load addresses');
    }
  }, [session?.user?.id]);

  // Load orders when session is available
  const loadOrders = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      setOrdersLoading(true);
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      // Filter orders for current user
      const userOrders = data.filter((order: any) => order.userId === session.user.id);
      setOrders(userOrders);
    } catch (error) {
      setOrdersError('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadAddresses();
    loadOrders();
    
    // Load user preferences from localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }
  }, [loadAddresses, loadOrders]);

  // Password change function
  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setPwLoading(true);

    if (newPassword !== confirmNewPassword) {
      setPwError("New passwords do not match");
      setPwLoading(false);
      return;
    }
    if (currentPassword === newPassword) {
      setPwError("New password cannot be the same as the current password");
      setPwLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");
      setPwSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setPwError(err.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  }

  // Language change function
  async function handleLanguageChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLangError("");
    setLangSuccess("");
    setLangLoading(true);
    try {
      const res = await fetch("/api/users/me/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update language");
      setLangSuccess("Language updated successfully.");
      setSavedLanguage(language);
      await fetch('/api/auth/session?update', { method: 'POST' });
      window.location.reload();
    } catch (err: any) {
      setLangError(err.message || "Failed to update language");
    } finally {
      setLangLoading(false);
    }
  }

  // Address management functions
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    
    setAddressLoading(true);
    setAddressError("");
    setAddressSuccess("");
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });
      
      if (!response.ok) throw new Error('Failed to add address');
      
      setAddressSuccess(t('address_added'));
      setShowAddForm(false);
      setAddressForm({ line1: "", line2: "", city: "", state: "", postalCode: "", country: "", phone: "" });
      loadAddresses();
    } catch (error) {
      setAddressError('Failed to add address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleEditAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !editingAddress) return;
    
    setAddressLoading(true);
    setAddressError("");
    setAddressSuccess("");
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/address`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addressForm, addressId: editingAddress.id }),
      });
      
      if (!response.ok) throw new Error('Failed to update address');
      
      setAddressSuccess(t('address_updated'));
      setEditingAddress(null);
      setAddressForm({ line1: "", line2: "", city: "", state: "", postalCode: "", country: "", phone: "" });
      loadAddresses();
    } catch (error) {
      setAddressError('Failed to update address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!session?.user?.id) return;
    
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/address`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId }),
      });
      
      if (!response.ok) throw new Error('Failed to delete address');
      
      setAddressSuccess(t('address_deleted'));
      loadAddresses();
    } catch (error) {
      setAddressError('Failed to delete address');
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!session?.user?.id) return;
    
    try {
      // Move the selected address to the front of the array (making it default)
      const updatedAddresses = [
        addresses.find(addr => addr.id === addressId)!,
        ...addresses.filter(addr => addr.id !== addressId)
      ];
      setAddresses(updatedAddresses);
      
      // In a real app, you'd save this preference to the database
      // const response = await fetch(`/api/users/${session.user.id}/address/default`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ addressId }),
      // });
      
      setAddressSuccess('Default address updated');
      setTimeout(() => setAddressSuccess(""), 3000);
    } catch (error) {
      setAddressError('Failed to update default address');
    }
  };

  const startEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state || "",
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || "",
    });
  };

  const cancelEdit = () => {
    setEditingAddress(null);
    setShowAddForm(false);
    setAddressForm({ line1: "", line2: "", city: "", state: "", postalCode: "", country: "", phone: "" });
    setAddressError("");
    setAddressSuccess("");
  };

  // Preferences functions
  const handlePreferencesUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreferencesLoading(true);
    setPreferencesError("");
    setPreferencesSuccess("");
    
    try {
      // Save preferences to localStorage for now
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      setPreferencesSuccess("Preferences saved successfully!");
      
      // In a real app, you'd save this to the database
      // const response = await fetch('/api/users/me/preferences', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(preferences),
      // });
      
      setTimeout(() => setPreferencesSuccess(""), 3000);
    } catch (error) {
      setPreferencesError("Failed to save preferences");
    } finally {
      setPreferencesLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          alert('Push notifications enabled! You\'ll receive updates about your orders.');
        } else if (permission === 'denied') {
          alert('Push notifications were denied. You can enable them in your browser settings.');
        }
      } else {
        alert('Push notifications are not supported in your browser.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Failed to enable push notifications.');
    }
  };

  if (status === "loading") {
    return <div className="max-w-4xl mx-auto p-6">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-black">Account</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700 mb-4">You are not logged in.</p>
          <button
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
            onClick={() => signIn()}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Tab navigation component
  const TabNavigation = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {[
          { id: 'profile', label: 'Profile', icon: '👤' },
          { id: 'orders', label: 'Orders', icon: '📦' },
          { id: 'addresses', label: 'Addresses', icon: '📍' },
          { id: 'preferences', label: 'Preferences', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  // Profile tab content
  const ProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-black">Profile Information</h2>
        <p className="text-gray-700 mb-4">{t('greeting')}, <span className="font-semibold">{session.user?.name || session.user?.email}</span>!</p>
        <ul className="list-disc pl-5 text-gray-600 mb-4">
          <li>{t('email')}: <span className="font-mono">{session.user?.email}</span></li>
          {session.user?.role && <li>{t('role')}: <span className="font-mono">{session.user.role}</span></li>}
        </ul>
        <div className="mt-6">
          <button
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            {t('logout')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-black">{t('language_preference')}</h2>
        <div className="mb-2 text-black text-sm">
          {t('current_language')}: <span className="font-semibold">{session?.user?.language === 'tr' ? 'Türkçe (Tr)' : 'English (Eng)'}</span>
        </div>
        <form className="space-y-4" onSubmit={handleLanguageChange}>
          {langError && <div className="text-red-600 text-sm">{langError}</div>}
          {langSuccess && <div className="text-green-600 text-sm">{langSuccess}</div>}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-black mb-1">{t('preferred_language')}</label>
            <select
              id="language"
              name="language"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black bg-white"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              <option value="tr">Türkçe (Tr)</option>
              <option value="en">English (Eng)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={langLoading}
            className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition disabled:opacity-50"
          >
            {langLoading ? t('saving') : t('save_language')}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-black">{t('change_password')}</h2>
        <form className="space-y-4" onSubmit={handlePasswordChange}>
          {pwError && <div className="text-red-600 text-sm">{pwError}</div>}
          {pwSuccess && <div className="text-green-600 text-sm">{pwSuccess}</div>}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">{t('current_password')}</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">{t('new_password')}</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">{t('confirm_new_password')}</label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition disabled:opacity-50"
          >
            {pwLoading ? t('saving') : t('change')}
          </button>
        </form>
      </div>
    </div>
  );

  // Orders tab content
  const OrdersTab = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-black">Order History</h2>
      
      {ordersLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      ) : ordersError ? (
        <div className="text-red-600 text-center py-8">{ordersError}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Link href="/products" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">Order #{order.id.slice(-8)}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg text-black">₺{order.totalAmount.toFixed(2)}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
              
              {/* Order Items */}
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
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
              </div>

              {/* Shipping Address */}
              {order.address && (
                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Address:</h4>
                  <p className="text-sm text-gray-600">{order.address.line1}</p>
                  <p className="text-sm text-gray-600">
                    {order.address.city}, {order.address.state && `${order.address.state}, `}{order.address.postalCode}
                  </p>
                  <p className="text-sm text-gray-600">{order.address.country}</p>
                  <p className="text-sm text-gray-600">📞 {order.address.phone}</p>
                </div>
              )}

              {/* View Order Button */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Link
                  href={`/account/orders/${order.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Order Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Preferences tab content
  const PreferencesTab = () => (
    <div className="space-y-6">
      {/* Email Preferences */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-black">Email Preferences</h2>
        <form className="space-y-4" onSubmit={handlePreferencesUpdate}>
          {preferencesError && <div className="text-red-600 text-sm">{preferencesError}</div>}
          {preferencesSuccess && <div className="text-green-600 text-sm">{preferencesSuccess}</div>}
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                className="mr-3 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Receive email notifications</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.orderUpdates}
                onChange={(e) => setPreferences({ ...preferences, orderUpdates: e.target.checked })}
                className="mr-3 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Order status updates</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.orderTracking}
                onChange={(e) => setPreferences({ ...preferences, orderTracking: e.target.checked })}
                className="mr-3 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Order tracking information</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.promotionalEmails}
                onChange={(e) => setPreferences({ ...preferences, promotionalEmails: e.target.checked })}
                className="mr-3 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Promotional emails and offers</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.newsletter}
                onChange={(e) => setPreferences({ ...preferences, newsletter: e.target.checked })}
                className="mr-3 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Newsletter subscription</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.lowStockAlerts}
                onChange={(e) => setPreferences({ ...preferences, lowStockAlerts: e.target.checked })}
                className="mr-3 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Low stock alerts for wishlist items</span>
            </label>
          </div>
          
          <button
            type="submit"
            disabled={preferencesLoading}
            className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition disabled:opacity-50"
          >
            {preferencesLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-black">Notification Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Push Notifications</h3>
              <p className="text-xs text-gray-500">Receive notifications in your browser</p>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
            >
              Enable
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">SMS Notifications</h3>
              <p className="text-xs text-gray-500">Receive order updates via SMS</p>
            </div>
            <button
              onClick={() => alert('SMS notifications coming soon!')}
              className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed text-sm"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Addresses tab content
  const AddressesTab = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-black">{t('delivery_addresses')}</h2>
        {!showAddForm && !editingAddress && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            {t('add_new_address')}
          </button>
        )}
      </div>

      {addressError && <div className="text-red-600 text-sm mb-4">{addressError}</div>}
      {addressSuccess && <div className="text-green-600 text-sm mb-4">{addressSuccess}</div>}

      {/* Address Form */}
      {(showAddForm || editingAddress) && (
        <form onSubmit={editingAddress ? handleEditAddress : handleAddAddress} className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="line1" className="block text-sm font-medium text-gray-700">
                {t('address_line1')} *
              </label>
              <input
                type="text"
                id="line1"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
                value={addressForm.line1}
                onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="line2" className="block text-sm font-medium text-gray-700">
                {t('address_line2')}
              </label>
              <input
                type="text"
                id="line2"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
                value={addressForm.line2}
                onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                {t('city')} *
              </label>
              <input
                type="text"
                id="city"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                {t('state')}
              </label>
              <input
                type="text"
                id="state"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                {t('postal_code')} *
              </label>
              <input
                type="text"
                id="postalCode"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                {t('country')} *
              </label>
              <input
                type="text"
                id="country"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
                value={addressForm.country}
                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                type="text"
                id="phone"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                placeholder="+90 555 123 4567"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addressLoading}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition disabled:opacity-50"
            >
              {addressLoading ? t('loading') : (editingAddress ? t('save_address') : t('add_address'))}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Address List */}
      {addresses.length === 0 && !showAddForm && !editingAddress ? (
        <p className="text-gray-600">{t('no_addresses')}</p>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div key={address.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      📍 Address
                    </span>
                    {addresses.indexOf(address) === 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">{address.line1}</p>
                  {address.line2 && <p className="text-gray-600">{address.line2}</p>}
                  <p className="text-gray-600">
                    {address.city}, {address.state && `${address.state}, `}{address.postalCode}
                  </p>
                  <p className="text-gray-600">{address.country}</p>
                  <p className="text-gray-600">📞 {address.phone}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  {addresses.indexOf(address) !== 0 && (
                    <button
                      onClick={() => setDefaultAddress(address.id)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition"
                      title="Set as default address"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => startEditAddress(address)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    {t('edit_address')}
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    {t('delete_address')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render the appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'orders':
        return <OrdersTab />;
      case 'addresses':
        return <AddressesTab />;
      case 'preferences':
        return <PreferencesTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">{t('account')}</h1>
      
      <TabNavigation />
      {renderTabContent()}
    </div>
  );
} 