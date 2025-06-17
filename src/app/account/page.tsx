"use client";

import React from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { useState } from "react";
import { useTranslations } from 'next-intl';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const t = useTranslations();
  const [savedLanguage, setSavedLanguage] = useState(session?.user?.language || "en");
  const [language, setLanguage] = useState(savedLanguage);
  const [langSuccess, setLangSuccess] = useState("");
  const [langError, setLangError] = useState("");
  const [langLoading, setLangLoading] = useState(false);

  if (status === "loading") {
    return <div className="max-w-2xl mx-auto p-6">Loading...</div>;
  }

  // Debug: log only the session user's language
  console.log("Session language:", session?.user?.language);

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

    if (newPassword !== confirmNewPassword) {
      setPwError("New passwords do not match");
      setPwLoading(false);
      return;
    }
    if (currentPassword === newPassword) {
      setPwError("New password cannot be the same as the current password");
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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setPwError(err.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleLanguageChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLangError("");
    setLangSuccess("");
    setLangLoading(true);
    try {
      const res = await fetch("/api/users/me/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update language");
      setLangSuccess("Language updated successfully.");
      setSavedLanguage(language);
      await fetch('/api/auth/session?update', { method: 'POST' });
      window.location.reload();
    } catch (err: any) {
      setLangError(err.message || "Failed to update language");
    } finally {
      setLangLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">{t('account')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-700 mb-4">{t('greeting')}, <span className="font-semibold">{session.user?.name || session.user?.email}</span>!</p>
        <ul className="list-disc pl-5 text-gray-600 mb-4">
          <li>{t('email')}: <span className="font-mono">{session.user?.email}</span></li>
          {session.user?.role && <li>{t('role')}: <span className="font-mono">{session.user.role}</span></li>}
        </ul>
        <ul className="list-disc pl-5 text-gray-600">
          <li>{t('profile_info')}</li>
          <li>{t('order_history')}</li>
          <li>{t('account_settings')}</li>
        </ul>
        <div className="mt-6">
          <button
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            {t('logout')}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4 text-black">{t('language_preference')}</h2>
        <div className="mb-2 text-black text-sm">
          {t('current_language')}: <span className="font-semibold">{session?.user?.language === 'tr' ? 'Türkçe (Tr)' : 'English (Eng)'}</span>
        </div>
        <form className="space-y-4" onSubmit={handleLanguageChange}>
          {langError && <div className="text-red-600 text-sm">{langError}</div>}
          {langSuccess && <div className="text-green-600 text-sm">{langSuccess}</div>}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-black mb-1">{t('preferred_language')}</label>
            <select
              id="language"
              name="language"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black bg-white"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              <option value="tr">Türkçe (Tr)</option>
              <option value="en">English (Eng)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={langLoading}
            className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition disabled:opacity-50"
          >
            {langLoading ? t('saving') : t('save_language')}
          </button>
        </form>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4 text-black">{t('change_password')}</h2>
        <form className="space-y-4" onSubmit={handlePasswordChange}>
          {pwError && <div className="text-red-600 text-sm">{pwError}</div>}
          {pwSuccess && <div className="text-green-600 text-sm">{pwSuccess}</div>}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">{t('current_password')}</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">{t('new_password')}</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">{t('confirm_new_password')}</label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition disabled:opacity-50"
          >
            {pwLoading ? t('saving') : t('change')}
          </button>
        </form>
      </div>
    </div>
  );
} 