"use client";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Only redirect if user is already authenticated and did not just log in
  useEffect(() => {
    // If authenticated and not loading, redirect
    if (status === "authenticated" && !isLoading) {
      router.replace("/account");
    }
  }, [status, isLoading, router]);

  // Prevent redirect right after login
  if (status === "authenticated" && isLoading) {
    return null;
  }

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid credentials");
        setIsLoading(false);
      } else {
        // Fetch the session to get the user role
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData?.user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (e) {
      setError("An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center text-gray-800">Login</h1>
        {error && <div className="text-red-600 text-center">{error}</div>}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-800">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-800">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-indigo-600 underline">Forgot your password?</Link>
          </div>
        </div>
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
          Sign in with Google
        </button>
        <div className="mt-6 text-center">
          <span className="text-gray-600 text-sm">Don't have an account?</span>
          <Link href="/register" className="ml-2 text-indigo-600 hover:underline font-medium text-sm">Register</Link>
        </div>
      </div>
    </div>
  );
} 