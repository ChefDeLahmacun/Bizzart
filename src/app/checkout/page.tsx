"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/components/CartContext';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import IyzicoPaymentForm from '@/components/IyzicoPaymentForm';

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

interface CheckoutFormData {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Turkey',
    phone: ''
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (cart.length === 0) {
      router.push('/cart');
      return;
    }

    fetchAddresses();
  }, [status, cart.length, router]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/users/me/address');
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      }
    } catch (error) {
      // Failed to fetch addresses
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/me/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create address');
      }

      const newAddress = await response.json();
      setAddresses(prev => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
      setShowNewAddressForm(false);
      setFormData({
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Turkey',
        phone: ''
      });
      setSuccess('Address added successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create address');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      setError('Please select or create a shipping address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const checkoutData = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: total,
        addressId: selectedAddressId,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Checkout failed');
      }

      setOrderId(result.id);
      setOrderCreated(true);
      setSuccess('Order created successfully! Now complete your payment.');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccess('Payment successful! Your order has been confirmed.');
    clearCart();
    
    // Redirect to order confirmation after a short delay
    setTimeout(() => {
      router.push(`/account/orders/${orderId}`);
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setError(`Payment failed: ${error}`);
  };

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Checkout</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
          {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Shipping Address */}
        <div className="bg-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Shipping Address</h2>
          
          {/* Existing Addresses */}
          {addresses.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">
                Select Address:
              </label>
              <select
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                className="w-full p-2 rounded border bg-white/20 text-white border-white/30"
              >
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.line1}, {address.city} - {address.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add New Address Button */}
          <button
            onClick={() => setShowNewAddressForm(!showNewAddressForm)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mb-4"
          >
            {showNewAddressForm ? 'Cancel' : 'Add New Address'}
          </button>

          {/* New Address Form */}
          {showNewAddressForm && (
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="line1"
                  value={formData.line1}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 rounded border bg-white/20 text-white border-white/30"
                  placeholder="123 Main St"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Apartment, suite, etc.
                </label>
                <input
                  type="text"
                  name="line2"
                  value={formData.line2}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border bg-white/20 text-white border-white/30"
                  placeholder="Apt 4B"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 rounded border bg-white/20 text-white border-white/30"
                    placeholder="Istanbul"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border bg-white/20 text-white border-white/30"
                    placeholder="Istanbul"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 rounded border bg-white/20 text-white border-white/30"
                    placeholder="34000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 rounded border bg-white/20 text-white border-white/30"
                    placeholder="Turkey"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 rounded border bg-white/20 text-white border-white/30"
                  placeholder="+90 555 123 4567"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Address'}
              </button>
            </form>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Order Summary</h2>
          
          <div className="space-y-3 mb-6">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">{item.name}</div>
                    <div className="text-gray-300 text-sm">Qty: {item.quantity}</div>
                  </div>
                </div>
                <div className="text-white font-medium">
                  ₺{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/20 pt-4">
            <div className="flex justify-between items-center text-xl font-bold text-white">
              <span>Total:</span>
              <span>₺{total.toFixed(2)}</span>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={loading || !selectedAddressId}
            className="w-full mt-6 py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </button>
        </div>
      </div>

      {/* Payment Section - Show after order is created */}
      {orderCreated && (
        <div className="mt-8">
          <div className="bg-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Payment</h2>
            <IyzicoPaymentForm
              amount={total}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              orderId={orderId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
