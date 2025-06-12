"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  thumbnail?: string | null;
  featured: boolean;
  order: number;
  _count: {
    products: number;
  };
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', featured: false, order: 0 });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      // Ensure all categories have the required fields with defaults
      const normalizedCategories = data.map((cat: any) => ({
        ...cat,
        featured: cat.featured ?? false,
        order: cat.order ?? 0,
        thumbnail: cat.thumbnail ?? null
      }));
      setCategories(normalizedCategories);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', newCategory.name);
      formData.append('featured', (newCategory.featured ?? false).toString());
      formData.append('order', (newCategory.order ?? 0).toString());
      
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create category');
      }

      setSuccess('Category created successfully!');
      setNewCategory({ name: '', featured: false, order: 0 });
      setThumbnailFile(null);
    fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', editingCategory.name);
      formData.append('featured', (editingCategory.featured ?? false).toString());
      formData.append('order', (editingCategory.order ?? 0).toString());
      
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      
      if (removeThumbnail) {
        formData.append('removeThumbnail', 'true');
      }

      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update category');
      }

      setSuccess('Category updated successfully!');
      setEditingCategory(null);
      setThumbnailFile(null);
      setRemoveThumbnail(false);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete category');
      }

      setSuccess('Category deleted successfully!');
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleToggleFeatured = async (category: Category) => {
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', category.name);
      formData.append('featured', (!category.featured).toString());
      formData.append('order', (category.order ?? 0).toString());

      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update category');
      }

      setSuccess(`Category ${!category.featured ? 'featured' : 'unfeatured'} successfully!`);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setRemoveThumbnail(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory({
      ...category,
      featured: category.featured ?? false,
      order: category.order ?? 0,
      thumbnail: category.thumbnail ?? null
    });
    setThumbnailFile(null);
    setRemoveThumbnail(false);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setThumbnailFile(null);
    setRemoveThumbnail(false);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading categories...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-black">Manage Categories</h1>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}

      {/* Create New Category */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-black">Create New Category</h2>
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div>
              <label className="block text-sm font-medium text-black mb-1">Name</label>
        <input
          type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
          required
        />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Order</label>
              <input
                type="number"
                value={newCategory.order}
                onChange={(e) => setNewCategory({ ...newCategory, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                min="0"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center text-black">
                <input
                  type="checkbox"
                  checked={newCategory.featured}
                  onChange={(e) => setNewCategory({ ...newCategory, featured: e.target.checked })}
                  className="mr-2"
                />
                Featured
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">Thumbnail</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="create-thumbnail-upload"
                />
                <label
                  htmlFor="create-thumbnail-upload"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white cursor-pointer hover:bg-gray-50 text-center"
                >
                  Choose File
                </label>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Category
        </button>
      </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">Categories</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thumbnail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.thumbnail ? (
                      <img
                        src={category.thumbnail}
                        alt={category.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {editingCategory?.id === category.id ? (
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-black"
                      />
                    ) : (
                      category.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category._count.products}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCategory?.id === category.id ? (
                      <input
                        type="checkbox"
                        checked={editingCategory.featured}
                        onChange={(e) => setEditingCategory({ ...editingCategory, featured: e.target.checked })}
                        className="mr-2"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${category.featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {category.featured ? 'Yes' : 'No'}
                        </span>
                        <button
                          onClick={() => handleToggleFeatured(category)}
                          className={`text-xs px-2 py-1 rounded ${category.featured ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                        >
                          {category.featured ? 'Unfeature' : 'Feature'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCategory?.id === category.id ? (
                      <input
                        type="number"
                        value={editingCategory.order ?? 0}
                        onChange={(e) => setEditingCategory({ ...editingCategory, order: parseInt(e.target.value) || 0 })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-black"
                        min="0"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">{category.order ?? 0}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingCategory?.id === category.id ? (
                      <div className="space-x-2">
                        <button
                          onClick={handleUpdateCategory}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <button
                          onClick={() => startEditing(category)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
            <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={category._count.products > 0}
            >
              Delete
            </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-black">Edit Category</h3>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Order</label>
                <input
                  type="number"
                  value={editingCategory.order ?? 0}
                  onChange={(e) => setEditingCategory({ ...editingCategory, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  min="0"
                />
              </div>
              
              <div>
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={editingCategory.featured}
                    onChange={(e) => setEditingCategory({ ...editingCategory, featured: e.target.checked })}
                    className="mr-2"
                  />
                  Featured Category
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">Thumbnail</label>
                {editingCategory.thumbnail && !removeThumbnail && (
                  <div className="mb-2">
                    <img
                      src={editingCategory.thumbnail}
                      alt="Current thumbnail"
                      className="w-20 h-20 object-cover rounded"
                    />
                  </div>
                )}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white cursor-pointer hover:bg-gray-50 text-center"
                  >
                    Choose File
                  </label>
                </div>
                {editingCategory.thumbnail && (
                  <label className="flex items-center text-black mt-2">
                    <input
                      type="checkbox"
                      checked={removeThumbnail}
                      onChange={(e) => setRemoveThumbnail(e.target.checked)}
                      className="mr-2"
                    />
                    Remove thumbnail
                  </label>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex-1 bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 