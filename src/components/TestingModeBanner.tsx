"use client";

import { isTestingMode } from '@/lib/config';

export default function TestingModeBanner() {
  if (!isTestingMode()) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-black px-4 py-2 text-center font-medium">
      🧪 <strong>TESTING MODE</strong> - No real payments will be processed. This is a demo environment.
    </div>
  );
}
