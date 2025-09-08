'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  reference?: string | null;
  category: {
    name: string;
  };
  images: {
    url: string;
  }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = ['All', 'Bowls', 'Vases', 'Plates', 'Mugs'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete product');
      
      // Remove the deleted product from the state
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || product.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all products in your store.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 sm:w-auto"
          >
            Add Product
          </Link>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="group relative bg-white rounded-lg shadow-sm overflow-hidden"
          >
            {/* Product Image */}
            <div className="flex justify-center">
              <div className="relative w-28 h-28 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No image</span>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
              <div className="mt-1">
                {product.reference ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <span className="mr-1">📋</span>
                    {product.reference}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <span className="mr-1">📋</span>
                    No reference
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {product.description}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-lg font-medium text-gray-900">
                  ₺{product.price.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Stock: {product.stock}
                </p>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Category: {product.category?.name || 'Uncategorized'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <PencilIcon className="w-5 h-5" />
                </Link>
              </div>
              <button
                onClick={() => handleDelete(product.id)}
                className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50"
              >
                <TrashIcon className="h-5 w-5 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 