"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, Bars2Icon } from '@heroicons/react/24/outline';
import { addProductAction } from './addProductAction';
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

function SortableMediaItem({ id, file, url, onRemove }: { id: string; file: File; url: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-default group">
      <div className="absolute top-2 left-2 z-20">
        <button type="button" {...attributes} {...listeners} className="p-1 bg-gray-200 rounded-full cursor-move hover:bg-gray-300" aria-label="Drag handle">
          <Bars2Icon className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      {file.type.startsWith('video/') ? (
        <video src={url} controls className="object-cover w-full h-full" />
      ) : (
        <img src={url} alt="Preview" className="object-cover w-full h-full" />
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

export default function AddProductPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<{ id: string; file: File; url: string }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDrop = (acceptedFiles: File[]) => {
    const newMedia = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
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
      const itemToRemove = prev.find(item => item.id === id);
      if (itemToRemove) {
        URL.revokeObjectURL(itemToRemove.url);
      }
      console.log('Removing media with id:', id);
      return prev.filter(item => item.id !== id);
    });
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

  async function handleServerAction(formData: FormData) {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Add media to formData in the chosen order
      media.forEach((item) => {
        formData.append('images', item.file);
      });
      const result = await addProductAction(formData);
      if (result.error) {
        throw new Error(result.error);
      }
      setSuccess('Product added successfully!');
      setTimeout(() => router.push('/admin/products'), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setLoading(false);
    }
  }

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      media.forEach(item => {
        URL.revokeObjectURL(item.url);
      });
    };
  }, [media]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Add New Product</h1>

      <form action={handleServerAction} className="space-y-6">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Product Media (Images or Videos)</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
              isDragActive ? 'border-black bg-gray-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-black">
              Drag and drop images or videos here, or click to select files
            </p>
            <p className="text-xs text-black mt-1">
              Supports JPG, PNG, WEBP, MP4, WEBM, OGG, MOV (no file limit)
            </p>
          </div>
          {/* Sortable/Removable Media Previews */}
          {media.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={media.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="mt-4 grid grid-cols-5 gap-4">
                  {media.map((item) => (
                    <SortableMediaItem
                      key={item.id}
                      id={item.id}
                      file={item.file}
                      url={item.url}
                      onRemove={() => handleRemove(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
} 