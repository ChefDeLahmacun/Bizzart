"use client";
import { useEffect, useState } from "react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch(() => setError("Failed to fetch reviews"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reviews</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Review ID</th>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-left">Rating</th>
              <th className="px-4 py-2 text-left">Comment</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review: any) => (
              <tr key={review.id} className="border-t">
                <td className="px-4 py-2">{review.id}</td>
                <td className="px-4 py-2">{review.user?.email || "-"}</td>
                <td className="px-4 py-2">{review.product?.name || "-"}</td>
                <td className="px-4 py-2">{review.rating}</td>
                <td className="px-4 py-2">{review.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 