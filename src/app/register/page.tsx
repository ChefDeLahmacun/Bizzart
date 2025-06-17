'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const language = formData.get('language') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email,
          password,
          language,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Something went wrong');
      }

      router.push('/login?registered=true');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-black hover:text-gray-800"
            >
              sign in to your account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-1/2">
                <label htmlFor="firstName" className="sr-only">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                  placeholder="First name"
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="lastName" className="sr-only">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                  placeholder="Last name"
                />
              </div>
            </div>
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-black mb-1">Preferred Language</label>
              <select
                id="language"
                name="language"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black bg-white"
                defaultValue=""
              >
                <option value="" disabled>Select language</option>
                <option value="tr">Türkçe (Tr)</option>
                <option value="en">English (Eng)</option>
              </select>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
              placeholder="Password"
            />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
              placeholder="Confirm password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300" />
          <span className="mx-2 text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-gray-300" />
        </div>
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_17_40)">
              <path d="M47.5 24.5C47.5 22.6 47.3 20.8 47 19H24.5V29.1H37.3C36.7 32.1 34.7 34.6 31.8 36.2V42H39.3C44 38.1 47.5 32.1 47.5 24.5Z" fill="#4285F4"/>
              <path d="M24.5 48C31.1 48 36.7 45.8 39.3 42L31.8 36.2C30.3 37.2 28.5 37.8 26.5 37.8C20.2 37.8 14.9 33.7 13.1 28.1H5.4V33C8.9 40.1 16.1 45.8 24.5 48Z" fill="#34A853"/>
              <path d="M13.1 28.1C12.6 26.9 12.3 25.6 12.3 24.2C12.3 22.8 12.6 21.5 13.1 20.3V15.4H5.4C3.7 18.4 2.7 21.7 2.7 24.2C2.7 26.7 3.7 30 5.4 33L13.1 28.1Z" fill="#FBBC05"/>
              <path d="M24.5 10.6C27.1 10.6 29.4 11.5 31.2 13.2L39.4 5C36.7 2.5 31.1 0 24.5 0C16.1 0 8.9 5.7 5.4 13L13.1 18C14.9 12.4 20.2 10.6 24.5 10.6Z" fill="#EA4335"/>
            </g>
            <defs>
              <clipPath id="clip0_17_40">
                <rect width="48" height="48" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          Sign up with Google
        </button>
      </div>
    </div>
  );
} 