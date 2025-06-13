"use client";
import { useEffect, useState } from "react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      setName("");
      fetchCategories();
    } catch (e) {
      setError("Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      fetchCategories();
    } catch (e) {
      setError("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-black">Categories</h1>
      <form onSubmit={handleAddCategory} className="mb-4 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="New category name"
          className="border px-2 py-1 rounded text-black"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={loading}>
          Add
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <ul className="bg-white rounded shadow divide-y">
        {categories.map((cat: any) => (
          <li key={cat.id} className="flex justify-between items-center px-4 py-2">
            <span className="text-black">{cat.name}</span>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-red-600 hover:underline"
              disabled={loading}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 