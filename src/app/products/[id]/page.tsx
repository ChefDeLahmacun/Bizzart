"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { ImageZoom } from "@/components/ImageZoom";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import Head from "next/head";

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
    type: 'IMAGE' | 'VIDEO';
  }[];
  height?: number | null;
  width?: number | null;
  depth?: number | null;
  diameter?: number | null;
  weight?: number | null;
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  category: {
    name: string;
  };
  images: {
    url: string;
    type: 'IMAGE' | 'VIDEO';
  }[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoThumbnails, setVideoThumbnails] = useState<{ [key: number]: string }>({});
  const [videoBlobUrls, setVideoBlobUrls] = useState<{ [key: number]: string }>({});
  const { addToCart } = useCart();
  const router = useRouter();
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);



  // Fetch product only once per mount
  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch product");
        return res.json();
      })
      .then((data) => setProduct(data))
      .catch(() => setError("Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch related products when product is loaded
  useEffect(() => {
    if (!product || !id) return;
    

    setLoadingRelated(true);
    
    fetch(`/api/products/${id}/related`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch related products");
        return res.json();
      })
      .then((data) => {

        setRelatedProducts(data);
      })
      .catch(() => {
        setRelatedProducts([]);
      })
      .finally(() => {
        setLoadingRelated(false);
      });
  }, [product?.id]); // Only depend on product.id, not the entire product object

  // Check if product is in wishlist
  useEffect(() => {
    if (!product?.id) return;
    
    // Check localStorage for wishlist
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsInWishlist(wishlist.includes(product.id));
  }, [product?.id]);

  // Handle video blob URL for base64 videos (main video)
  useEffect(() => {
    if (!product) return;
    const media = product.images || [];
    const currentMedia = media[currentMediaIndex];
    let urlToRevoke: string | null = null;
    if (currentMedia && currentMedia.type === 'VIDEO') {
      if (currentMedia.url.startsWith('data:')) {
        try {
          const arr = currentMedia.url.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : null;
          if (!mime) {
            setVideoUrl(null);
            return;
          }
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          urlToRevoke = url;
        } catch (e) {
          setVideoUrl(null);
        }
      } else {
        setVideoUrl(currentMedia.url);
      }
    } else {
      setVideoUrl(null);
    }
    return () => {
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [product, currentMediaIndex]);

  // Generate video thumbnails for all videos in the gallery (per-thumbnail effect)
  useEffect(() => {
    if (!product) return;
    const media = product.images || [];
    media.forEach((m, idx) => {
      if (m.type === 'VIDEO' && !videoThumbnails[idx]) {
        let blobUrl: string | null = null;
        let videoSrc = m.url;
        if (m.url.startsWith('data:')) {
          try {
            const arr = m.url.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : null;
            if (!mime) return;
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            blobUrl = URL.createObjectURL(blob);
            videoSrc = blobUrl;
            setVideoBlobUrls(prev => ({ ...prev, [idx]: blobUrl! }));
          } catch (e) {
            return;
          }
        }
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = videoSrc;
        video.addEventListener('canplay', function capture() {
          video.currentTime = 0.1;
        });
        video.addEventListener('seeked', function captureFrame() {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
            setVideoThumbnails(prev => ({ ...prev, [idx]: thumbnailUrl }));
          }
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }
        });
        video.addEventListener('error', () => {
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }
        });
      }
    });
  }, [product, videoThumbnails]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error || !product) return <div className="p-8 text-center text-red-500">{error || "Product not found."}</div>;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      productId: product.id, // Add this for checkout
      name: product.name,
      price: product.price,
      image: product.images[0]?.url,
      quantity: Number(quantity),
      stock: product.stock,
    });
    router.push("/cart");
  };

  const toggleWishlist = () => {
    if (!product?.id) return;
    
    setWishlistLoading(true);
    
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      
      if (isInWishlist) {
        // Remove from wishlist
        const newWishlist = wishlist.filter((id: string) => id !== product.id);
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        setIsInWishlist(false);
      } else {
        // Add to wishlist
        const newWishlist = [...wishlist, product.id];
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setQuantity("");
      return;
    }
    if (Number(value) < 1) {
      setQuantity("1");
      return;
    }
    setQuantity(value);
  };

  const media = product.images || [];
  const currentMedia = media[currentMediaIndex];

  return (
    <>
      {/* SEO Meta Tags */}
      {product && (
        <Head>
          <title>{`${product.name} - Bizzart Handcrafted Pottery`}</title>
          <meta name="description" content={product.description} />
          <meta name="keywords" content={`pottery, ceramics, handcrafted, ${product.category?.name || 'art'}, ${product.name}`} />
          
          {/* Open Graph */}
          <meta property="og:title" content={product.name} />
          <meta property="og:description" content={product.description} />
          <meta property="og:type" content="product" />
          <meta property="og:url" content={window.location.href} />
          {product.images[0] && (
            <meta property="og:image" content={product.images[0].url} />
          )}
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={product.name} />
          <meta name="twitter:description" content={product.description} />
          {product.images[0] && (
            <meta name="twitter:image" content={product.images[0].url} />
          )}
          
          {/* Product Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": product.name,
                "description": product.description,
                "image": product.images.map(img => img.url),
                "category": product.category?.name,
                "brand": {
                  "@type": "Brand",
                  "name": "Bizzart"
                },
                "offers": {
                  "@type": "Offer",
                  "price": product.price,
                  "priceCurrency": "TRY",
                  "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  "seller": {
                    "@type": "Organization",
                    "name": "Bizzart"
                  }
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "reviewCount": "127"
                }
              })
            }}
          />
        </Head>
      )}
      
      <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Image/Video Section */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Main Media Display */}
          {currentMedia ? (
            currentMedia.type === 'VIDEO' ? (
              videoUrl ? (
                <div className="w-full max-w-lg">
                  <video
                    controls
                    className="rounded-lg object-contain w-full h-96 mb-4"
                  >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="w-full max-w-lg h-96 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 mb-4">
                  Video could not be loaded
                </div>
              )
            ) : (
              <div className="w-full max-w-lg">
                <ImageZoom
                  src={currentMedia.url}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-96 rounded-lg mb-4"
                  zoomLevel={1.5}
                />
              </div>
            )
          ) : (
            <div className="w-full max-w-lg h-96 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 mb-4">
              No image
            </div>
          )}

          {/* Thumbnails */}
          {media.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto max-w-full">
              {media.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentMediaIndex(idx)}
                  className={`border-2 rounded-lg overflow-hidden w-16 h-16 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    idx === currentMediaIndex 
                      ? 'border-blue-500 shadow-lg scale-105' 
                      : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                  }`}
                  tabIndex={0}
                  aria-label={`Show media ${idx + 1}`}
                >
                  {m.type === 'VIDEO' ? (
                    videoThumbnails[idx] ? (
                      <img 
                        src={videoThumbnails[idx]} 
                        alt="Video thumbnail" 
                        className="object-cover w-full h-full" 
                      />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <span className="absolute text-white text-xs">▶</span>
                      </div>
                    )
                  ) : (
                    <img 
                      src={m.url} 
                      alt={`${product.name} thumbnail ${idx + 1}`} 
                      className="object-cover w-full h-full" 
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="flex-1 max-w-lg">
          <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
          {product.reference ? (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <span className="mr-2">📋</span>
                Reference: {product.reference}
              </span>
            </div>
          ) : (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                <span className="mr-2">📋</span>
                Reference: Not assigned yet
              </span>
            </div>
          )}
          <p className="text-lg text-white mb-4">{product.description}</p>
          <p className="text-2xl font-semibold text-white mb-4">₺{product.price.toFixed(2)}</p>
          <p className="text-sm text-white mb-4">Category: {product.category?.name || 'Uncategorized'}</p>
          
          {/* Size Specifications */}
          {(product.height || product.width || product.depth || product.diameter || product.weight) && (
            <div className="mb-6 p-4 bg-white/10 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Size Specifications</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.height && (
                  <div>
                    <span className="text-gray-300">Height:</span>
                    <span className="text-white ml-2">{product.height} cm</span>
                  </div>
                )}
                {product.width && (
                  <div>
                    <span className="text-gray-300">Width:</span>
                    <span className="text-white ml-2">{product.width} cm</span>
                  </div>
                )}
                {product.depth && (
                  <div>
                    <span className="text-gray-300">Depth:</span>
                    <span className="text-white ml-2">{product.depth} cm</span>
                  </div>
                )}
                {product.diameter && (
                  <div>
                    <span className="text-gray-300">Diameter:</span>
                    <span className="text-white ml-2">{product.diameter} cm</span>
                  </div>
                )}
                {product.weight && (
                  <div className="col-span-2">
                    <span className="text-gray-300">Weight:</span>
                    <span className="text-white ml-2">{product.weight} grams</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-4">
            <label htmlFor="quantity" className="text-sm text-white">Quantity:</label>
            <input
              id="quantity"
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={handleQuantityChange}
              className="w-16 px-2 py-1 border border-gray-300 rounded bg-white text-black"
            />
            <span className="text-xs text-white">(Stock: {product.stock})</span>
          </div>
          
          {quantity !== "" && Number(quantity) > product.stock && (
            <div className="text-red-400 text-sm mb-4">Stock: {product.stock} available</div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 px-6 bg-white text-black rounded-lg font-semibold border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={product.stock === 0 || quantity === "" || Number(quantity) > product.stock}
            >
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
            
            <button
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              className="py-3 px-4 bg-transparent text-white border border-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {wishlistLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isInWishlist ? (
                <HeartSolidIcon className="w-5 h-5 text-red-500" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Social Sharing */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                const url = window.location.href;
                const text = `Check out this beautiful ${product.name} from Bizzart!`;
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Share on Twitter
            </button>
            <button
              onClick={() => {
                const url = window.location.href;
                const text = `Check out this beautiful ${product.name} from Bizzart!`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Share on Facebook
            </button>
            <button
              onClick={() => {
                const url = window.location.href;
                const text = `Check out this beautiful ${product.name} from Bizzart!`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              Share on WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-white mb-6">Related Products</h2>
        
        {loadingRelated ? (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse flex-shrink-0 w-48">
                <div className="aspect-square bg-gray-700 rounded-lg"></div>
                <div className="mt-3">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {relatedProducts.map((relatedProduct) => (
              <div
                key={relatedProduct.id}
                onClick={() => router.push(`/products/${relatedProduct.id}`)}
                className="group cursor-pointer flex-shrink-0 w-48"
              >
                <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                  {relatedProduct.images && relatedProduct.images.length > 0 ? (
                    <img
                      src={relatedProduct.images[0].url}
                      alt={relatedProduct.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-medium text-white group-hover:text-gray-300 transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-sm text-white mt-1">
                    ₺{relatedProduct.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No related products found in this category.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
} 