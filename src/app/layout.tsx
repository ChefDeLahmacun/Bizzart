import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/Navigation";
import TestingModeBanner from "@/components/TestingModeBanner";

export const metadata: Metadata = {
  title: "Bizzart - Handcrafted Pottery Shop",
  description: "Discover unique, handcrafted ceramic pieces made with love and care.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <TestingModeBanner />
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
