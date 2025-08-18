"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeartIcon as HeartSolidIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/components/CartContext';

interface WishlistProduct {
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
		type: 'IMAGE' | 'VIDEO';
	}[];
}

export default function WishlistPage() {
	const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const { addToCart } = useCart();
	const router = useRouter();

	useEffect(() => {
		loadWishlist();
	}, []);

	const loadWishlist = async () => {
		try {
			setLoading(true);
			const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
			
			if (wishlist.length === 0) {
				setWishlistProducts([]);
				return;
			}

			// Fetch product details for each wishlist item
			const products = await Promise.all(
				wishlist.map(async (productId: string) => {
					try {
						const response = await fetch(`/api/products/${productId}`);
						if (response.ok) {
							return await response.json();
						}
						return null;
					} catch (error) {
						return null;
					}
				})
			);

			// Filter out failed fetches and set products
			const validProducts = products.filter(product => product !== null);
			setWishlistProducts(validProducts);
		} catch (error) {
			// Failed to load wishlist
		} finally {
			setLoading(false);
		}
	};

	const removeFromWishlist = (productId: string) => {
		try {
			const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
			const newWishlist = wishlist.filter((id: string) => id !== productId);
			localStorage.setItem('wishlist', JSON.stringify(newWishlist));
			
			// Update local state
			setWishlistProducts(prev => prev.filter(product => product.id !== productId));
		} catch (error) {
			// Failed to remove from wishlist
		}
	};

	const addToCartFromWishlist = (product: WishlistProduct) => {
		addToCart({
			id: product.id,
			productId: product.id,
			name: product.name,
			price: product.price,
			image: product.images[0]?.url,
			quantity: 1,
			stock: product.stock,
		});
		
		// Optionally remove from wishlist after adding to cart
		// removeFromWishlist(product.id);
	};

	const clearWishlist = () => {
		if (confirm('Are you sure you want to clear your wishlist?')) {
			localStorage.removeItem('wishlist');
			setWishlistProducts([]);
		}
	};

	if (loading) {
		return (
			<div className="max-w-6xl mx-auto px-4 py-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
					<p className="mt-4 text-white">Loading wishlist...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold text-white">My Wishlist</h1>
					<p className="text-white mt-2">
						{wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
					</p>
				</div>
				
				{wishlistProducts.length > 0 && (
					<button
						onClick={clearWishlist}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Clear Wishlist
					</button>
				)}
			</div>

			{wishlistProducts.length === 0 ? (
				<div className="text-center py-16">
					<HeartSolidIcon className="mx-auto h-16 w-16 text-white" />
					<h2 className="text-xl font-semibold text-white mt-4">Your wishlist is empty</h2>
					<p className="text-white mt-2">
						Start browsing our handcrafted pottery and add items you love to your wishlist.
					</p>
					<button
						onClick={() => router.push('/products')}
						className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Browse Products
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{wishlistProducts.map((product) => (
						<div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
							{/* Product Image */}
							<div className="aspect-square relative overflow-hidden">
								{product.images && product.images.length > 0 ? (
									<img
										src={product.images[0].url}
										alt={product.name}
										className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
									/>
								) : (
									<div className="w-full h-full bg-gray-100 flex items-center justify-center">
										<span className="text-gray-400">No image</span>
									</div>
								)}
								
								{/* Remove from wishlist button */}
								<button
									onClick={() => removeFromWishlist(product.id)}
									className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
									title="Remove from wishlist"
								>
									<TrashIcon className="h-4 w-4 text-red-500" />
								</button>
							</div>

							{/* Product Info */}
							<div className="p-4">
								<h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
									{product.name}
								</h3>
								
								<p className="text-sm text-gray-600 mb-2 line-clamp-2">
									{product.description}
								</p>
								
								<p className="text-sm text-gray-500 mb-3">
									Category: {product.category?.name || 'Uncategorized'}
								</p>
								
								<div className="flex items-center justify-between mb-4">
									<span className="text-xl font-bold text-gray-900">
										₺{product.price.toFixed(2)}
									</span>
									<span className={`text-sm px-2 py-1 rounded-full ${
										product.stock > 0 
											? 'bg-green-100 text-green-800' 
											: 'bg-red-100 text-red-800'
									}` }>
										{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
									</span>
								</div>

								{/* Action Buttons */}
								<div className="flex gap-2">
									<button
										onClick={() => router.push(`/products/${product.id}`)}
										className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
									>
										View Details
									</button>
									
									<button
										onClick={() => addToCartFromWishlist(product)}
										disabled={product.stock === 0}
										className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									>
										{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	); 
}
