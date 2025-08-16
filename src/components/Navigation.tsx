'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCartIcon, UserIcon, Bars3Icon, XMarkIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useCart } from './CartContext';
import { useSession } from 'next-auth/react';

export function Navigation() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Wishlist', href: '/wishlist' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Bizzart</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                } px-3 py-2 text-sm font-medium transition-colors`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Icons */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {cartCount > 0 && (
              <Link
                href="/checkout"
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Checkout
              </Link>
            )}
            <div className="relative">
              <Link
                href="/cart"
                className="text-gray-500 hover:text-black p-2 transition-colors relative"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute top-5 -right-7 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10 border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
            <Link
              href="/wishlist"
              className="text-gray-500 hover:text-black p-2 transition-colors"
            >
              <HeartIcon className="h-6 w-6" />
            </Link>
            {session ? (
              <Link
                href="/account"
                className="text-gray-500 hover:text-black p-2 transition-colors"
              >
                <UserIcon className="h-6 w-6" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-gray-500 hover:text-black p-2 transition-colors"
              >
                Login / Register
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-black p-2 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'bg-gray-50 text-black'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                } block px-3 py-2 text-base font-medium transition-colors`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {cartCount > 0 && (
              <div className="px-4 mb-3">
                <Link
                  href="/checkout"
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors text-center block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Checkout
                </Link>
              </div>
            )}
            <div className="flex items-center px-4 space-x-4">
              <div className="relative">
                <Link
                  href="/cart"
                  className="text-gray-500 hover:text-black p-2 transition-colors relative"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCartIcon className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-5 -right-7 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10 border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
              {session ? (
                <Link
                  href="/account"
                  className="text-gray-500 hover:text-black p-2 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserIcon className="h-6 w-6" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-gray-500 hover:text-black p-2 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 