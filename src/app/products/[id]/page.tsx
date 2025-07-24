"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";

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
            setVideoBlobUrls((prev) => ({ ...prev, [idx]: blobUrl! }));
          } catch (e) {
            return;
          }
        }
        const video = document.createElement('video');
        video.src = videoSrc;
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;
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
            const dataUrl = canvas.toDataURL('image/png');
            setVideoThumbnails((prev) => ({ ...prev, [idx]: dataUrl }));
          }
          video.removeEventListener('seeked', captureFrame);
          if (blobUrl) URL.revokeObjectURL(blobUrl);
        });
        video.load();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Clean up all blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(videoBlobUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [videoBlobUrls]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error || !product) return <div className="p-8 text-center text-red-500">{error || "Product not found."}</div>;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url,
      quantity: Number(quantity),
      stock: product.stock,
    });
    router.push("/cart");
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Main Media Display */}
          {currentMedia ? (
            currentMedia.type === 'VIDEO' ? (
              videoUrl ? (
                <video
                  controls
                  className="rounded-lg object-cover w-full max-w-xs h-72 mb-2"
                >
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full max-w-xs h-72 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 mb-2">
                  Video could not be loaded
                </div>
              )
            ) : (
              <img
                src={currentMedia.url}
                alt={product.name}
                className="rounded-lg object-cover w-full max-w-xs h-72 mb-2"
              />
            )
          ) : (
            <div className="w-full max-w-xs h-72 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 mb-2">
              No image
            </div>
          )}
          {/* Thumbnails */}
          <div className="flex gap-2 mt-2">
            {media.map((m, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentMediaIndex(idx)}
                className={`border rounded-lg overflow-hidden w-14 h-14 flex items-center justify-center ${idx === currentMediaIndex ? 'border-blue-500' : 'border-gray-300'}`}
                tabIndex={0}
                aria-label={`Show media ${idx + 1}`}
              >
                {m.type === 'VIDEO' ? (
                  videoThumbnails[idx] ? (
                    <img src={videoThumbnails[idx]} alt="Video thumbnail" className="object-cover w-full h-full" />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      <span className="absolute text-white text-xs">▶</span>
                    </div>
                  )
                ) : (
                  <img src={m.url} alt={product.name + ' thumbnail'} className="object-cover w-full h-full" />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
          <p className="text-lg text-white mb-4">{product.description}</p>
          <p className="text-xl font-semibold text-white mb-2">₺{product.price.toFixed(2)}</p>
          <p className="text-sm text-white mb-4">Category: {product.category?.name || 'Uncategorized'}</p>
          <div className="flex items-center gap-2 mb-2">
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
          <button
            onClick={handleAddToCart}
            className="w-full py-3 px-6 bg-white text-black rounded-lg font-semibold border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={product.stock === 0 || quantity === "" || Number(quantity) > product.stock}
          >
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
} 