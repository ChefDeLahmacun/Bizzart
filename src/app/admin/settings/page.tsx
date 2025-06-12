"use client";

import React from "react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-8 text-black">
      <h1 className="text-2xl font-bold mb-6 text-black">Admin Settings</h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-2 text-black">Site Settings</h2>
          <div className="bg-white rounded shadow p-4 text-black">(Coming soon: site title, logo, etc.)</div>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2 text-black">Email Settings</h2>
          <div className="bg-white rounded shadow p-4 text-black">(Coming soon: email provider, sender address, etc.)</div>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2 text-black">Security</h2>
          <div className="bg-white rounded shadow p-4 text-black">(Coming soon: password policy, 2FA, etc.)</div>
        </section>
      </div>
    </div>
  );
} 