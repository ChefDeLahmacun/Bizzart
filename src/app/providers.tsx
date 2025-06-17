'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { CartProvider } from '@/components/CartContext';
import { IntlProvider } from "next-intl";
import React from "react";
import enMessages from '../messages/en.json';
import trMessages from '../messages/tr.json';

function IntlSessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  // Use the user's preferred language or default to 'en'
  const locale = (session?.user && 'language' in session.user && session.user.language) ? session.user.language : "en";
  const messagesMap: Record<string, any> = {
    en: enMessages,
    tr: trMessages,
  };
  const messages = messagesMap[locale] || enMessages;
  return (
    <IntlProvider locale={locale} messages={messages} timeZone="Europe/Istanbul">
      {children}
    </IntlProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IntlSessionProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </IntlSessionProvider>
    </SessionProvider>
  );
} 