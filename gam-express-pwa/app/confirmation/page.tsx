'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookingData } from '@/types';
import BookingSummaryCard from '@/components/booking/BookingSummaryCard';

export default function ConfirmationPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);

  useEffect(() => {
    // Retrieve booking from session storage
    const savedBooking = sessionStorage.getItem('currentBooking');
    
    if (savedBooking) {
      setBooking(JSON.parse(savedBooking));
    } else {
      // If no booking found, redirect to home
      router.push('/');
    }
  }, [router]);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Booking Summary */}
          <BookingSummaryCard booking={booking} />

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <Link href="/" className="btn-secondary text-center">
              ← Back to Home
            </Link>
            <Link href="/booking" className="btn-primary text-center">
              Book Another Taxi
            </Link>
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* What Happens Next */}
            <div className="card bg-white">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center space-x-2">
                <span>📋</span>
                <span>What Happens Next?</span>
              </h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-primary-600 mt-0.5">1.</span>
                  <span>We'll assign the nearest available driver to your booking</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-primary-600 mt-0.5">2.</span>
                  <span>The driver will call you to confirm pickup details</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-primary-600 mt-0.5">3.</span>
                  <span>Your taxi will arrive at the scheduled time</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold text-primary-600 mt-0.5">4.</span>
                  <span>Enjoy your safe and comfortable ride!</span>
                </li>
              </ol>
            </div>

            {/* Need Help */}
            <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white">
              <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
                <span>💬</span>
                <span>Need Help?</span>
              </h3>
              <p className="text-blue-100 mb-4 text-sm">
                Our customer support team is available 24/7 to assist you.
              </p>
              <div className="space-y-3">
                <a
                  href="tel:+2203456789"
                  className="flex items-center justify-between bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-lg transition-all duration-200"
                >
                  <span className="flex items-center space-x-2">
                    <span>📞</span>
                    <span className="font-semibold">Call Support</span>
                  </span>
                  <span className="text-sm">+220 345 6789</span>
                </a>
                <a
                  href="https://wa.me/2203456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-lg transition-all duration-200"
                >
                  <span className="flex items-center space-x-2">
                    <span>💬</span>
                    <span className="font-semibold">WhatsApp</span>
                  </span>
                  <span className="text-sm">Chat Now →</span>
                </a>
              </div>
            </div>
          </div>

          {/* Save Booking Reference Reminder */}
          <div className="mt-8 card bg-accent-50 border-2 border-accent-300">
            <div className="flex items-start space-x-3">
              <span className="text-3xl">💡</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Save Your Booking Reference</h4>
                <p className="text-gray-700 text-sm">
                  Please save your booking reference <strong>{booking.id}</strong> to track your booking status or contact support.
                  You can track your booking anytime from our homepage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
