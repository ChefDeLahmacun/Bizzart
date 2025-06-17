"use client";

import React from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { useState } from "react";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  if (status === "loading") {
    return <div className="max-w-2xl mx-auto p-6">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-black">Account</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700 mb-4">You are not logged in.</p>
          <button
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
            onClick={() => signIn()}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setPwLoading(true);
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmNewPassword = formData.get("confirmNewPassword") as string;
    if (newPassword !== confirmNewPassword) {
      setPwError("New passwords do not match");
      setPwLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");
      setPwSuccess("Password changed successfully");
      e.currentTarget.reset();
    } catch (err: any) {
      setPwError(err.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Account</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-700 mb-4">Welcome, <span className="font-semibold">{session.user?.name || session.user?.email}</span>!</p>
        <ul className="list-disc pl-5 text-gray-600 mb-4">
          <li>Email: <span className="font-mono">{session.user?.email}</span></li>
          {session.user?.role && <li>Role: <span className="font-mono">{session.user.role}</span></li>}
        </ul>
        <ul className="list-disc pl-5 text-gray-600">
          <li>View and edit your profile information</li>
          <li>See your order history</li>
          <li>Manage your account settings</li>
        </ul>
        <div className="mt-6">
          <button
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <form className="space-y-4" onSubmit={handlePasswordChange}>
          {pwError && <div className="text-red-600 text-sm">{pwError}</div>}
          {pwSuccess && <div className="text-green-600 text-sm">{pwSuccess}</div>}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition disabled:opacity-50"
          >
            {pwLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
} 