"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images: { id: string; url: string }[];
  colors: string[];
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product data
        const productRes = await fetch(`/api/products/${params.id}`);
        if (!productRes.ok) throw new Error('Failed to fetch product');
        const productData = await productRes.json();
        console.log('Fetched product data:', productData);
        console.log('Product colors:', productData.colors);
        setProduct(productData);
        setPreviewUrls(productData.images.map((img: any) => img.url));
        setSelectedColors(productData.colors || []);
        console.log('Set selected colors to:', productData.colors || []);

        // Fetch categories
        const categoriesRes = await fetch('/api/categories');
        if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    };

    fetchData();
  }, [params.id]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      setImages(acceptedFiles);
      setPreviewUrls(
        acceptedFiles.map((file) => URL.createObjectURL(file))
      );
    },
  });

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append('id', params.id);
      
      // Add selected colors to form data
      selectedColors.forEach(color => {
        formData.append('colors', color);
      });

      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Edit Product</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Debug Info */}
        <div className="border border-red-300 p-4 rounded-lg bg-red-50">
          <h3 className="text-lg font-bold text-red-800 mb-2">DEBUG INFO</h3>
          <p className="text-sm text-red-700">Product ID: {params.id}</p>
          <p className="text-sm text-red-700">Product Name: {product.name}</p>
          <p className="text-sm text-red-700">Product Colors: {JSON.stringify(product.colors)}</p>
          <p className="text-sm text-red-700">Selected Colors: {JSON.stringify(selectedColors)}</p>
          <p className="text-sm text-red-700">Colors Section Should Be Below</p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Product Images</label>
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <input {...getInputProps()} />
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-black">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-xs text-black mt-1">
              Supports JPG, PNG, WEBP (max 5 images)
            </p>
          </div>

          {/* Image Previews */}
          {previewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-5 gap-4">
              {previewUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden"
                >
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2 text-black">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={product.name}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2 text-black">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={product.description}
            required
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-2 text-black">
            Price (₺)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            defaultValue={product.price}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
          />
        </div>

        {/* Stock */}
        <div>
          <label htmlFor="stock" className="block text-sm font-medium mb-2 text-black">
            Stock
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            defaultValue={product.stock}
            required
            min="0"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium mb-2 text-black">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product.categoryId}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Colors */}
        <div className="border border-gray-300 p-4 rounded-lg bg-gray-50">
          <label className="block text-sm font-medium mb-2 text-black">
            Colors (Select all that apply) - Current: [{selectedColors.join(', ')}]
          </label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black', 'White', 'Gray', 'Natural', 'Terracotta', 'Ceramic'].map((color) => (
              <label key={color} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color)}
                  onChange={() => handleColorToggle(color)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-black">{color}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Debug: selectedColors = [{selectedColors.join(', ')}]</p>
          <p className="text-xs text-gray-500 mt-1">Debug: product.colors = [{product.colors?.join(', ') || 'undefined'}]</p>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 