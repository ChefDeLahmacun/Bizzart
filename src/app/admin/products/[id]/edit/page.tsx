"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, Bars2Icon } from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  images: { url: string; type: 'IMAGE' | 'VIDEO' }[];
  colors: string[];
  height?: number | null;
  width?: number | null;
  depth?: number | null;
  diameter?: number | null;
  weight?: number | null;
}

function SortableMediaItem({ id, url, type, onRemove }: { id: string; url: string; type: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [videoUrl, setVideoUrl] = useState<string>(url);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Convert base64 video URLs to Blob URLs for better playback
  useEffect(() => {
    if (type === 'video' && url.startsWith('data:')) {
      try {
        const arr = url.split(',');
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
        const blobUrl = URL.createObjectURL(blob);
        setVideoUrl(blobUrl);
        
        return () => {
          URL.revokeObjectURL(blobUrl);
        };
              } catch (e) {
          // Failed to convert base64 video
        }
    } else {
      setVideoUrl(url);
    }
  }, [url, type]);

  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-default group">
      <div className="absolute top-2 left-2 z-20">
        <button type="button" {...attributes} {...listeners} className="p-1 bg-gray-200 rounded-full cursor-move hover:bg-gray-300" aria-label="Drag handle">
          <Bars2Icon className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      {type === 'video' ? (
        <video src={videoUrl} controls className="object-cover w-full h-full" />
      ) : (
        <img src={url} alt="Media" className="object-cover w-full h-full" />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-20 w-7 h-7 flex items-center justify-center"
        style={{ aspectRatio: '1/1' }}
        aria-label="Remove image or video"
      >
        ×
      </button>
    </div>
  );
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [media, setMedia] = useState<{ id: string; url: string; type: string; file?: File }[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (!params.id) return;
    const fetchData = async () => {
      try {
        const productRes = await fetch(`/api/products/${params.id}`);
        if (!productRes.ok) throw new Error('Failed to fetch product');
        const productData = await productRes.json();
        setProduct(productData);
        setMedia(productData.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          type: img.type === 'VIDEO' ? 'video' : 'image',
        })));
        setSelectedColors(productData.colors || []);

        const categoriesRes = await fetch('/api/categories');
        if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const handleDrop = (acceptedFiles: File[]) => {
    const newMedia = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      file,
    }));
    setMedia((prev) => [...prev, ...newMedia]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov'],
    },
    onDrop: handleDrop,
  });

  const handleRemove = (id: string) => {
    setMedia((prev) => {
      return prev.filter((item) => item.id !== id);
    });
    // If it's an existing media (id is not a temp id), track for deletion
    if (!id.includes('-')) {
      setRemovedMediaIds((prev) => {
        if (!prev.includes(id)) {
          return [...prev, id];
        }
        return prev;
      });
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setMedia((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  async function handleSubmit(formData: FormData) {
    setError('');
    setSuccess('');
    try {
      // Add new files in order
      media.forEach((item, idx) => {
        if (item.file) {
          formData.append('images', item.file);
        }
        // Always send the order for all media
        if (!item.file) {
          formData.append('mediaOrder[]', JSON.stringify({ id: item.id, order: idx }));
        }
      });
      // Send removed media IDs
      removedMediaIds.forEach((id) => {
        formData.append('removeMediaIds[]', id);
      });
      
      // Add colors to form data
      selectedColors.forEach(color => {
        formData.append('colors', color);
      });
      
      // Add other form fields
      const formElement = document.querySelector('form');
      if (formElement) {
        const nameInput = formElement.querySelector('[name="name"]') as HTMLInputElement;
        const descriptionInput = formElement.querySelector('[name="description"]') as HTMLTextAreaElement;
        const priceInput = formElement.querySelector('[name="price"]') as HTMLInputElement;
        const stockInput = formElement.querySelector('[name="stock"]') as HTMLInputElement;
        const categoryInput = formElement.querySelector('[name="categoryId"]') as HTMLSelectElement;
        const heightInput = formElement.querySelector('[name="height"]') as HTMLInputElement;
        const widthInput = formElement.querySelector('[name="width"]') as HTMLInputElement;
        const depthInput = formElement.querySelector('[name="depth"]') as HTMLInputElement;
        const diameterInput = formElement.querySelector('[name="diameter"]') as HTMLInputElement;
        const weightInput = formElement.querySelector('[name="weight"]') as HTMLInputElement;
        
        if (nameInput) formData.append('name', nameInput.value);
        if (descriptionInput) formData.append('description', descriptionInput.value);
        if (priceInput) formData.append('price', priceInput.value);
        if (stockInput) formData.append('stock', stockInput.value);
        if (categoryInput) formData.append('categoryId', categoryInput.value);
        if (heightInput && heightInput.value) formData.append('height', heightInput.value);
        if (widthInput && widthInput.value) formData.append('width', widthInput.value);
        if (depthInput && depthInput.value) formData.append('depth', depthInput.value);
        if (diameterInput && diameterInput.value) formData.append('diameter', diameterInput.value);
        if (weightInput && weightInput.value) formData.append('weight', weightInput.value);
      }
      
      formData.append('id', params.id);
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to update product');
      setSuccess('Product updated successfully!');
      setTimeout(() => router.push('/admin/products'), 1000);
    } catch (e) {
      setError('Failed to update product. Please try again.');
    }
  }

  if (loading || !params.id) {
    return <div>Loading...</div>;
  }
  if (error) return <div className="text-center py-4 text-red-600">{error}</div>;
  if (!product) return <div className="text-center py-4">Product not found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Edit Product</h1>
      <form action={handleSubmit} className="space-y-6">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}

        {/* Product Media */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Media (Images or Videos)
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
              isDragActive ? 'border-black bg-gray-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop images or videos here, or click to select files
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Supports JPG, PNG, WEBP, MP4, WEBM, OGG, MOV (no file limit)
            </p>
          </div>
          {/* Sortable/Removable Media Previews */}
          {media.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={media.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {media.map((item) => (
                    <SortableMediaItem
                      key={item.id}
                      id={item.id}
                      url={item.url}
                      type={item.type}
                      onRemove={() => handleRemove(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Product Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={product.name}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm text-gray-900"
            required
          />
        </div>

        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reference Code
          </label>
          <div className="mt-1 flex items-center space-x-3">
            <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 flex items-center">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                📋
              </span>
              <span className="text-sm font-mono">
                {product.reference || 'No reference assigned'}
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/products/${params.id}/regenerate-reference`, {
                    method: 'POST',
                  });
                  if (response.ok) {
                    const updatedProduct = await response.json();
                    setProduct(updatedProduct);
                  }
                } catch (error) {
                  console.error('Failed to regenerate reference:', error);
                }
              }}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Regenerate
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Reference code for customer inquiries (auto-generated)
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={product.description}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm text-gray-900"
            required
          />
        </div>

        {/* Price and Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-700 sm:text-sm">₺</span>
              </div>
              <input
                type="number"
                id="price"
                name="price"
                defaultValue={product.price}
                className="block w-full pl-7 rounded-md border-gray-300 focus:border-black focus:ring-black sm:text-sm text-gray-900"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
              Stock
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              defaultValue={product.stock}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm text-gray-900"
              min="0"
              required
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={product.categoryId}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm text-gray-900"
            required
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
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900">Colors (Select all that apply)</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black', 'White', 'Gray', 'Natural', 'Terracotta', 'Ceramic'].map((color) => (
              <label key={color} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedColors.includes(color)}
                  onChange={() => handleColorToggle(color)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">{color}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Size Specifications */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900">Size Specifications (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Height */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-2 text-gray-700">
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                min="0"
                step="0.1"
                placeholder="e.g., 15.5"
                defaultValue={product.height || ''}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* Width */}
            <div>
              <label htmlFor="width" className="block text-sm font-medium mb-2 text-gray-700">
                Width (cm)
              </label>
              <input
                type="number"
                id="width"
                name="width"
                min="0"
                step="0.1"
                placeholder="e.g., 12.0"
                defaultValue={product.width || ''}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* Depth */}
            <div>
              <label htmlFor="depth" className="block text-sm font-medium mb-2 text-gray-700">
                Depth (cm)
              </label>
              <input
                type="number"
                id="depth"
                name="depth"
                min="0"
                step="0.1"
                placeholder="e.g., 8.0"
                defaultValue={product.depth || ''}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* Diameter */}
            <div>
              <label htmlFor="diameter" className="block text-sm font-medium mb-2 text-gray-700">
                Diameter (cm)
              </label>
              <input
                type="number"
                id="diameter"
                name="diameter"
                min="0"
                step="0.1"
                placeholder="e.g., 20.0"
                defaultValue={product.diameter || ''}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* Weight */}
            <div className="md:col-span-2">
              <label htmlFor="weight" className="block text-sm font-medium mb-2 text-gray-700">
                Weight (grams)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                min="0"
                step="0.1"
                placeholder="e.g., 250.0"
                defaultValue={product.weight || ''}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-black text-white font-semibold rounded-md shadow hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
} 