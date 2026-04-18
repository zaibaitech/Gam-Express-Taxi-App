import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gam Express Taxi - Simple, Safe & Reliable",
  description: "Book your taxi quickly and safely in The Gambia. Fast booking, trusted drivers, mobile money accepted.",
  manifest: "/manifest.json",
  themeColor: "#0ea5e9",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gam Express Taxi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1">
            {children}
          </main>
          <AppFooter />
        </div>
      </body>
    </html>
  );
}
