"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowUpTrayIcon, 
  DocumentArrowDownIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface BulkUploadResult {
  success: boolean;
  message: string;
  details?: {
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  };
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,description,price,stock,categoryId,height,width,depth,diameter,weight,colors
"Handcrafted Vase","Beautiful handcrafted ceramic vase",29.99,10,"category_id_here",20,15,15,0,500,"blue,green"
"Pottery Bowl","Traditional pottery bowl",19.99,15,"category_id_here",8,20,8,0,300,"brown,red"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/products/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Upload failed. Please try again.',
        details: {
          total: 0,
          successful: 0,
          failed: 1,
          errors: ['Network error occurred']
        }
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Product Upload</h1>
        <p className="mt-2 text-gray-600">
          Upload multiple products at once using a CSV file. Download the template below to get started.
        </p>
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center">
          <DocumentArrowDownIcon className="h-8 w-8 text-blue-600 mr-4" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-blue-900">Download Template</h3>
            <p className="text-blue-700">
              Use this CSV template to format your product data correctly. Make sure to fill in the categoryId with actual category IDs from your system.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Download Template
          </button>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="bg-white rounded-lg shadow border-2 border-dashed border-gray-300 p-8">
        <div
          className={`text-center ${dragActive ? 'border-blue-400 bg-blue-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-semibold text-gray-900">
                {file ? file.name : 'Drop your CSV file here, or click to browse'}
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                CSV files only, max 10MB
              </span>
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept=".csv"
              onChange={handleFileSelect}
            />
          </div>
          
          {file && (
            <div className="mt-4">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Products'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Result */}
      {result && (
        <div className={`mt-8 p-6 rounded-lg border ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            {result.success ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
            ) : (
              <XCircleIcon className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-medium ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.message}
              </h3>
              
              {result.details && (
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-gray-600">Total</p>
                      <p className="text-lg font-semibold text-gray-900">{result.details.total}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-gray-600">Successful</p>
                      <p className="text-lg font-semibold text-green-600">{result.details.successful}</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-gray-600">Failed</p>
                      <p className="text-lg font-semibold text-red-600">{result.details.failed}</p>
                    </div>
                  </div>
                  
                  {result.details.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                      <ul className="space-y-1">
                        {result.details.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-700 flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
            <p>Download the CSV template above</p>
          </div>
          <div className="flex items-start">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
            <p>Fill in your product data following the template format</p>
          </div>
          <div className="flex items-start">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
            <p>Make sure to use valid category IDs from your existing categories</p>
          </div>
          <div className="flex items-start">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
            <p>Upload the CSV file and review the results</p>
          </div>
        </div>
      </div>
    </div>
  );
}
