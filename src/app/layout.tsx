import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/Navigation";
import TestingModeBanner from "@/components/TestingModeBanner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bizzart - Handcrafted Pottery Shop",
  description: "Discover unique, handcrafted ceramic pieces made with love and care.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <TestingModeBanner />
          <Navigation session={session} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
