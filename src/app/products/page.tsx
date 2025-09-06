"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ImageZoom } from '@/components/ImageZoom';
import { MagnifyingGlassIcon, FunnelIcon, EyeIcon } from '@heroicons/react/24/outline';

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
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    colors: [] as string[],
    minPrice: '',
    maxPrice: '',
    minHeight: '',
    maxHeight: '',
    minWidth: '',
    maxWidth: '',
    minWeight: '',
    maxWeight: ''
  });
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);

  // Available colors for filtering
  const availableColors = ['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black', 'White', 'Gray', 'Natural', 'Terracotta', 'Ceramic'];

  useEffect(() => {
    fetchProducts();
    fetchRecentlyViewed();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        fetchSearchSuggestions();
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

  const fetchRecentlyViewed = async () => {
    try {
      const response = await fetch('/api/products/recently-viewed?limit=6');
      if (response.ok) {
        const data = await response.json();
        setRecentlyViewed(data);
      }
    } catch (err) {
      // Failed to fetch recently viewed
    }
  };

  const fetchSearchSuggestions = async () => {
    try {
      const response = await fetch(`/api/products/search?q=${searchQuery}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.map((product: Product) => product.name);
        setSearchSuggestions(suggestions);
        setShowSuggestions(true);
      }
    } catch (err) {
      // Failed to fetch suggestions
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && Object.values(filters).every(f => Array.isArray(f) ? f.length === 0 : !f)) {
      fetchProducts();
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) params.append('q', searchQuery);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (filters.colors.length > 0) params.append('colors', filters.colors.join(','));
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.minHeight) params.append('minHeight', filters.minHeight);
      if (filters.maxHeight) params.append('maxHeight', filters.maxHeight);
      if (filters.minWidth) params.append('minWidth', filters.minWidth);
      if (filters.maxWidth) params.append('maxWidth', filters.maxWidth);
      if (filters.minWeight) params.append('minWeight', filters.minWeight);
      if (filters.maxWeight) params.append('maxWeight', filters.maxWeight);

      const response = await fetch(`/api/products/search?${params}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Trigger search with the selected suggestion
    setTimeout(() => handleSearch(), 100);
  };

  const handleColorToggle = (color: string) => {
    setFilters(prev => ({
      ...prev,
      colors: prev.colors.includes(color) 
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const clearFilters = () => {
    setFilters({
      colors: [],
      minPrice: '',
      maxPrice: '',
      minHeight: '',
      maxHeight: '',
      minWidth: '',
      maxWidth: '',
      minWeight: '',
      maxWeight: ''
    });
    setSearchQuery('');
    fetchProducts();
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
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for pottery, bowls, vases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-300"
            />
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </div>
          
          {/* Search Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-gray-900"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Color Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">Colors</label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorToggle(color)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filters.colors.includes(color)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Price Range (₺)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>
            </div>

            {/* Height Range */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Height (cm)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minHeight}
                  onChange={(e) => setFilters({...filters, minHeight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxHeight}
                  onChange={(e) => setFilters({...filters, maxHeight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>
            </div>

            {/* Width Range */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Width (cm)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minWidth}
                  onChange={(e) => setFilters({...filters, minWidth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxWidth}
                  onChange={(e) => setFilters({...filters, maxWidth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>
            </div>

            {/* Weight Range */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Weight (g)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minWeight}
                  onChange={(e) => setFilters({...filters, minWeight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxWeight}
                  onChange={(e) => setFilters({...filters, maxWeight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

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

      {/* Recently Viewed Products and Advanced Filters */}
      <div className="mb-6 flex justify-between items-center">
        {recentlyViewed.length > 0 && (
          <button
            onClick={() => setShowRecentlyViewed(!showRecentlyViewed)}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 group"
          >
            <EyeIcon className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm">Recently Viewed</span>
            <span className="ml-2 text-xs">
              {showRecentlyViewed ? '▼' : '▶'}
            </span>
          </button>
        )}
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Advanced Filters</span>
          </button>
          
          {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-white hover:text-gray-200 underline"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Recently Viewed Products Content */}
      {recentlyViewed.length > 0 && showRecentlyViewed && (
        <div className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentlyViewed.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group"
              >
                <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <ImageZoom
                      src={product.images[0].url}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      zoomLevel={1.5}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-white truncate">{product.name}</h3>
                  <p className="text-sm text-white">₺{product.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-white">Loading...</div>
        ) : error ? (
          <div className="col-span-full text-center text-red-500">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center text-white">
            {searchQuery ? 'No products found matching your search.' : 'No products found.'}
          </div>
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
                  <div className="mt-2 text-xs text-white">
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