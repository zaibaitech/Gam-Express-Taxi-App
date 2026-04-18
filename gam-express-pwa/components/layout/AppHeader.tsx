'use client';

import Link from 'next/link';

export default function AppHeader() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🚕</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gam Express Taxi</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Simple, Safe & Reliable</p>
            </div>
          </Link>

          {/* Quick Action Button */}
          <a 
            href="tel:+2203456789" 
            className="flex items-center space-x-2 bg-accent-400 hover:bg-accent-500 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-md"
          >
            <span className="text-lg">📞</span>
            <span className="hidden sm:inline font-semibold">Call Support</span>
            <span className="sm:hidden font-semibold">Call</span>
          </a>
        </div>
      </div>
    </header>
  );
}
