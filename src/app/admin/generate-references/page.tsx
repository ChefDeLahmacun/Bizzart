'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateReferencesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleGenerateReferences = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/generate-references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate references');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Admin
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Generate Product References</h1>
        <p className="text-gray-600 mt-2">
          This will generate reference codes for all products that don't have them yet.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Reference Generation</h2>
          <p className="text-sm text-gray-600 mb-4">
            Click the button below to generate reference codes for existing products. 
            This will create unique codes like VASE-A7B9, BOWL-X2K4, etc.
          </p>
        </div>

        <button
          onClick={handleGenerateReferences}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Generating...' : 'Generate References'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-green-800 font-medium">Success!</h3>
            <p className="text-green-700 text-sm mt-1">{result.message}</p>
            
            {result.examples && result.examples.length > 0 && (
              <div className="mt-3">
                <h4 className="text-green-800 font-medium text-sm">Examples:</h4>
                <ul className="text-green-700 text-sm mt-1 space-y-1">
                  {result.examples.map((example: any, index: number) => (
                    <li key={index}>
                      • {example.name} ({example.category}): {example.reference}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

