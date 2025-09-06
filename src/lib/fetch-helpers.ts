/**
 * Helper function for authenticated fetch requests
 * Automatically includes credentials and handles common error cases
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

/**
 * Helper function for authenticated fetch with FormData
 * Automatically includes credentials for file uploads
 */
export async function authenticatedFetchFormData(url: string, formData: FormData, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    method: 'POST',
    credentials: 'include',
    body: formData,
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}
