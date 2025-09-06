'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  HomeIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
  { name: 'Customers', href: '/admin/customers', icon: UserGroupIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/admin');
      return;
    }

    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              Admin Panel
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <Link
              href="/"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" />
              Back to Shop
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md w-full mt-2 transition-colors"
              type="button"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        } transition-margin duration-300 ease-in-out`}
      >
        <div className="p-8">{children}</div>
      </div>

      {/* Mobile sidebar toggle */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-4 left-4 p-3 bg-gray-200 text-gray-700 rounded-full shadow-lg z-50 hover:bg-gray-300"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
} 