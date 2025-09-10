"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, Bars2Icon } from '@heroicons/react/24/outline';
import { authenticatedFetchFormData, authenticatedFetch } from '@/lib/fetch-helpers';
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

function SortableMediaItem({ id, file, url, onRemove, uploading, progress }: { 
  id: string; 
  file: File; 
  url: string; 
  onRemove: () => void;
  uploading?: boolean;
  progress?: number;
}) {
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
      {uploading ? (
        <div className="flex flex-col items-center justify-center h-full bg-gray-100">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
          <div className="text-xs text-gray-600">Uploading...</div>
          {progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      ) : file.type.startsWith('video/') ? (
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
  const [media, setMedia] = useState<{ id: string; file: File; url: string; uploading?: boolean; progress?: number }[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await authenticatedFetch('/api/categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  const sensors = useSensors(useSensor(PointerSensor));

  const compressVideo = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        // Very aggressive compression for maximum speed
        const maxWidth = 640; // Much smaller for faster processing
        const maxHeight = 360; // Much smaller for faster processing
        let { videoWidth, videoHeight } = video;
        
        if (videoWidth > maxWidth || videoHeight > maxHeight) {
          const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
          videoWidth *= ratio;
          videoHeight *= ratio;
        }
        
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        video.oncanplay = () => {
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, videoWidth, videoHeight);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'video/webm',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'video/webm', 0.3); // 30% quality for maximum speed
        };
        
        video.play();
      };
    });
  };

  const handleDrop = async (acceptedFiles: File[]) => {
    const maxSize = 30 * 1024 * 1024; // 30MB - smaller limit for faster uploads
    const compressionThreshold = 25 * 1024 * 1024; // 25MB - compress files over this size
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of acceptedFiles) {
      if (file.size > maxSize) {
        if (file.type.startsWith('video/')) {
          // Only compress if file is over compression threshold
          if (file.size > compressionThreshold) {
            try {
              setError(`Compressing video ${file.name}...`);
              const compressedFile = await compressVideo(file);
              if (compressedFile.size <= maxSize) {
                validFiles.push(compressedFile);
                setError(''); // Clear compression message
              } else {
                const fileSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
                errors.push(`${file.name}: Still ${fileSizeMB}MB after compression. Please use a smaller video.`);
                setError('');
              }
            } catch (error) {
              const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
              errors.push(`${file.name}: ${fileSizeMB}MB exceeds 30MB limit and compression failed.`);
              setError('');
            }
          } else {
            // File is under compression threshold but over max size - reject
            const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
            errors.push(`${file.name}: ${fileSizeMB}MB exceeds 30MB limit. Please use a smaller video.`);
          }
        } else {
          const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
          errors.push(`${file.name}: ${fileSizeMB}MB exceeds 30MB limit`);
        }
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setError(''); // Clear any previous errors

    const newMedia = validFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      uploading: false,
      progress: 0,
    }));
    setMedia((prev) => [...prev, ...newMedia]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov'],
    },
    onDrop: handleDrop,
    multiple: true,
    // Mobile-specific optimizations
    capture: 'environment', // Use back camera on mobile
    noClick: false, // Allow clicking on mobile
    noKeyboard: true, // Disable keyboard navigation on mobile
  });

  const handleRemove = (id: string) => {
    setMedia((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setMedia((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Add media files to FormData in the correct order
      media.forEach((item, index) => {
        formData.append('images', item.file);
      });

      const response = await authenticatedFetchFormData('/api/products', formData);
      const result = await response.json();

      setSuccess('Product added successfully!');
      setTimeout(() => router.push('/admin/products'), 1000);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="space-y-6" key="new-product-form">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Product Media (Images or Videos)</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer touch-manipulation ${
              isDragActive ? 'border-black bg-gray-50' : 'border-gray-300'
            }`}
            style={{ minHeight: '120px' }} // Ensure adequate touch target
          >
            <input {...getInputProps()} />
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-black">
              Drag and drop images or videos here, or click to select files
            </p>
            <p className="text-xs text-black mt-1">
              Supports JPG, PNG, WEBP, HEIC, MP4, WEBM, OGG, MOV (max 30MB per file)
            </p>
            <p className="text-xs text-gray-500 mt-1">
              📱 Mobile: Tap to open camera or select from gallery
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
                      uploading={item.uploading}
                      progress={item.progress}
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

        {/* Reference - Auto-generated */}
        <div>
          <label className="block text-sm font-medium mb-2 text-black">
            Reference Code
          </label>
          <div className="w-full px-3 py-2 border rounded-lg bg-green-50 text-green-700 flex items-center justify-between">
            <span className="text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                ✅ Active
              </span>
              Will be auto-generated based on category
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Reference code will be automatically generated (e.g., VASE-A7B9, BOWL-X2K4)
          </p>
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

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium mb-2 text-black">
            Colors (Select all that apply)
          </label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {['Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black', 'White', 'Gray', 'Natural', 'Terracotta', 'Ceramic'].map((color) => (
              <label key={color} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="colors"
                  value={color}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-black">{color}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Size Specifications */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium mb-4 text-black">Size Specifications (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Height */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium mb-2 text-black">
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                min="0"
                step="0.1"
                placeholder="e.g., 15.5"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>

            {/* Width */}
            <div>
              <label htmlFor="width" className="block text-sm font-medium mb-2 text-black">
                Width (cm)
              </label>
              <input
                type="number"
                id="width"
                name="width"
                min="0"
                step="0.1"
                placeholder="e.g., 12.0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>

            {/* Depth */}
            <div>
              <label htmlFor="depth" className="block text-sm font-medium mb-2 text-black">
                Depth (cm)
              </label>
              <input
                type="number"
                id="depth"
                name="depth"
                min="0"
                step="0.1"
                placeholder="e.g., 8.0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>

            {/* Diameter */}
            <div>
              <label htmlFor="diameter" className="block text-sm font-medium mb-2 text-black">
                Diameter (cm)
              </label>
              <input
                type="number"
                id="diameter"
                name="diameter"
                min="0"
                step="0.1"
                placeholder="e.g., 20.0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>

            {/* Weight */}
            <div className="md:col-span-2">
              <label htmlFor="weight" className="block text-sm font-medium mb-2 text-black">
                Weight (grams)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                min="0"
                step="0.1"
                placeholder="e.g., 250.0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
          </div>
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