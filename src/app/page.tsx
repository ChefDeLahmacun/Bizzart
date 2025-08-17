"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface FeaturedCategory {
  id: string;
  name: string;
  thumbnail?: string | null;
  _count: {
    products: number;
  };
}

export default function Home() {
  const [featuredCategories, setFeaturedCategories] = useState<FeaturedCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCategories();
  }, []);

  const fetchFeaturedCategories = async () => {
    try {
      const response = await fetch('/api/categories/featured');
      if (response.ok) {
        const data = await response.json();
        setFeaturedCategories(data);
      }
    } catch (error) {
      // Failed to fetch featured categories
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gray-100">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Handcrafted Pottery
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Discover unique ceramic pieces made with love and care
          </p>
          <Link
            href="/products"
            className="bg-white text-black px-8 py-3 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Categories</h2>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="w-64 h-40 bg-gray-300 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        ) : featuredCategories.length > 0 ? (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCategories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.name}`}
                  className={`relative w-64 h-40 rounded-lg overflow-hidden group cursor-pointer ${
                    featuredCategories.length === 4 && index === 3 ? 'md:col-start-2' : ''
                  }`}
                >
                  {category.thumbnail ? (
                    <img
                      src={category.thumbnail}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-lg">{category.name}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <h3 className="text-lg font-semibold text-white mb-1 leading-tight">{category.name}</h3>
                    <p className="text-white/80 text-xs">{category._count.products} products</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No featured categories available.</p>
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Story</h2>
          <p className="text-lg text-gray-800 mb-8">
            Each piece in our collection is carefully handcrafted by skilled artisans,
            bringing together traditional techniques and modern design. We believe in
            creating pieces that are not just beautiful, but also functional and
            sustainable.
          </p>
          <Link
            href="/about"
            className="text-black border-2 border-black px-8 py-3 rounded-full text-lg font-semibold hover:bg-black hover:text-white transition-colors"
          >
            Learn More
          </Link>
        </div>
      </section>
    </main>
  );
}
