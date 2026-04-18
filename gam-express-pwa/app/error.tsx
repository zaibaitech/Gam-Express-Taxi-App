'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-9xl mb-4">⚠️</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Something Went Wrong</h1>
          <p className="text-gray-600 text-lg mb-8">
            We encountered an unexpected error. Don't worry, our team has been notified.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="btn-primary"
          >
            Try Again
          </button>
          <Link href="/" className="btn-secondary ml-4">
            Back to Home
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white rounded-xl shadow-md">
          <h3 className="font-bold text-gray-900 mb-3">Still Having Issues?</h3>
          <p className="text-gray-600 text-sm mb-4">
            Contact our support team for immediate assistance.
          </p>
          <a href="tel:+2203456789" className="text-primary-600 hover:text-primary-800 font-semibold">
            📞 Call +220 345 6789
          </a>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-lg text-left">
            <p className="text-xs font-mono text-red-800 break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
