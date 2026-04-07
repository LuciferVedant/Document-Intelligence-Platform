import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/components/StoreProvider";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocIntel - AI Document Platform",
  description: "Upload and chat with your documents using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen text-gray-900 antialiased`}>
        <StoreProvider>
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
        </StoreProvider>
      </body>
    </html>
  );
}
