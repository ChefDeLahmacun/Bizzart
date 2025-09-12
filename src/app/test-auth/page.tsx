'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('credentials', {
        email: 'test@example.com',
        password: 'password',
        redirect: false
      });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">NextAuth Test</h1>
      
      <div className="mb-4">
        <p>Status: {status}</p>
        <p>Session: {session ? 'Authenticated' : 'Not authenticated'}</p>
      </div>

      {session ? (
        <div className="mb-4">
          <p>User: {session.user?.email}</p>
          <p>Role: {session.user?.role}</p>
          <button 
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <button 
            onClick={handleSignIn}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Test Sign In'}
          </button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Debug Info:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify({ session, status }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
