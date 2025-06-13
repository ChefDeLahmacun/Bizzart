"use client";

import { useEffect, useState } from "react";
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
  }[];
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const { addToCart } = useCart();
  const router = useRouter();

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex items-center justify-center">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="rounded-lg object-cover w-full max-w-xs h-72"
            />
          ) : (
            <div className="w-full max-w-xs h-72 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400">
              No image
            </div>
          )}
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
            <div className="text-red-400 text-sm mb-4">Stock is only {product.stock}</div>
          )}
          <button
            onClick={handleAddToCart}
            className="w-full py-3 px-6 bg-white text-black rounded-lg font-semibold border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              product.stock === 0 ||
              quantity === "" ||
              Number(quantity) > product.stock
            }
          >
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
} 