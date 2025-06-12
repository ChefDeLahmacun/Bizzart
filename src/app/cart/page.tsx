"use client";

import { useCart } from '@/components/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Shopping Cart</h1>
      {cart.length === 0 ? (
        <div className="text-center text-gray-200">
          Your cart is empty.<br />
          <Link href="/products" className="text-blue-300 hover:underline">Continue shopping</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6 mb-8">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-4 bg-white/10 rounded-lg shadow p-4">
                <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">{item.name}</h2>
                  <p className="text-sm text-white">₺{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="px-2 py-1 bg-gray-200 rounded text-black"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e => updateQuantity(item.id, Math.max(1, Number(e.target.value)))}
                    className="w-12 text-center border rounded text-black"
                  />
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2 py-1 bg-gray-200 rounded text-black"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="ml-4 text-red-400 hover:underline text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={clearCart}
              className="text-red-400 hover:underline text-sm"
            >
              Clear Cart
            </button>
            <div className="text-xl font-bold text-white">
              Total: ₺{total.toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => router.push('/checkout')}
            className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Proceed to Checkout
          </button>
        </>
      )}
    </div>
  );
} 