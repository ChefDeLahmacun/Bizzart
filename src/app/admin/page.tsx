import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Products</h2>
          <p className="text-gray-800">Manage your pottery products.</p>
          <Link href="/admin/products" className="text-blue-600 hover:underline mt-2 inline-block">Go to Products</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Categories</h2>
          <p className="text-gray-800">Organize your product categories.</p>
          <Link href="/admin/categories" className="text-blue-600 hover:underline mt-2 inline-block">Go to Categories</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Orders</h2>
          <p className="text-gray-800">View and manage customer orders.</p>
          <Link href="/admin/orders" className="text-blue-600 hover:underline mt-2 inline-block">Go to Orders</Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Users</h2>
          <p className="text-gray-800">Manage shop users and admins.</p>
          <Link href="/admin/users" className="text-blue-600 hover:underline mt-2 inline-block">Go to Users</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Reviews</h2>
          <p className="text-gray-800">Moderate product reviews.</p>
          <Link href="/admin/reviews" className="text-blue-600 hover:underline mt-2 inline-block">Go to Reviews</Link>
        </div>
      </div>
    </div>
  );
} 