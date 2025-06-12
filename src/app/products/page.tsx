"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ImageZoom } from '@/components/ImageZoom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: {
    name: string;
  };
  images: {
    url: string;
  }[];
  height?: number | null;
  width?: number | null;
  depth?: number | null;
  diameter?: number | null;
  weight?: number | null;
}

const categories = ['All', 'Bowls', 'Vases', 'Plates', 'Mugs'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  let filteredProducts = products.filter(
    (product) =>
      selectedCategory === 'All' || product.category?.name === selectedCategory
  );

  // Sorting
  if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'newest') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.id.localeCompare(a.id));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-900"
        >
          <option value="featured">Featured</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="col-span-full text-center text-red-500">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">No products found.</div>
        ) : (
          filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group"
            >
              <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <ImageZoom
                    src={product.images[0].url}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="w-full h-full"
                    zoomLevel={1.5}
                  />
                ) : (
                  <span className="text-xs text-gray-400">No image</span>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-white">{product.name}</h3>
                <p className="mt-1 text-sm text-white">{product.description}</p>
                <p className="mt-2 text-lg font-medium text-white">
                  ₺{product.price.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-white">
                  Stock: {product.stock}
                </p>
                <p className="mt-1 text-xs text-white">
                  Category: {product.category?.name || 'Uncategorized'}
                </p>
                {/* Size Specifications Preview */}
                {(product.height || product.width || product.depth || product.diameter || product.weight) && (
                  <div className="mt-2 text-xs text-gray-300">
                    {product.diameter && <span className="mr-2">Ø{product.diameter}cm</span>}
                    {product.height && !product.diameter && <span className="mr-2">H:{product.height}cm</span>}
                    {product.width && !product.diameter && <span className="mr-2">W:{product.width}cm</span>}
                    {product.weight && <span className="mr-2">{product.weight}g</span>}
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 