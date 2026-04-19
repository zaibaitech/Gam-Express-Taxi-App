'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BookingData } from '@/types';
import BookingSummaryCard from '@/components/booking/BookingSummaryCard';

type LiveStatus = 'pending' | 'accepted' | 'en_route' | 'arrived' | 'completed' | 'cancelled';

const STATUS_UI: Record<LiveStatus, { icon: string; label: string; desc: string; color: string }> = {
  pending:   { icon: '⏳', label: 'Waiting for Driver',   desc: 'We are assigning a driver to your trip.',           color: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
  accepted:  { icon: '🚕', label: 'Driver Assigned!',     desc: 'A driver has accepted your booking and is coming.', color: 'bg-blue-50 border-blue-300 text-blue-800' },
  en_route:  { icon: '🚗', label: 'Driver On The Way',    desc: 'Your driver is heading to your pickup location.',   color: 'bg-blue-50 border-blue-300 text-blue-800' },
  arrived:   { icon: '📍', label: 'Driver Arrived!',      desc: 'Your driver is at the pickup location.',            color: 'bg-purple-50 border-purple-300 text-purple-800' },
  completed: { icon: '✅', label: 'Ride Completed',       desc: 'Thank you for riding with Gam Express!',            color: 'bg-green-50 border-green-300 text-green-800' },
  cancelled: { icon: '❌', label: 'Booking Cancelled',    desc: 'This booking has been cancelled.',                  color: 'bg-red-50 border-red-300 text-red-800' },
};

export default function ConfirmationPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('pending');

  useEffect(() => {
    const saved = sessionStorage.getItem('currentBooking');
    if (!saved) { router.push('/'); return; }

    const parsed = JSON.parse(saved) as BookingData & { dbId?: string };
    setBooking(parsed);

    const dbId = parsed.dbId;
    if (!dbId) return;

    const fetchStatus = () =>
      supabase.from('bookings').select('status').eq('id', dbId).single().then(({ data }) => {
        if (data?.status) setLiveStatus(data.status as LiveStatus);
      });

    // Fetch immediately, then poll every 5s as fallback for when realtime doesn't fire
    fetchStatus();
    const poll = setInterval(fetchStatus, 5000);

    // Real-time subscription for instant updates
    const channel = supabase
      .channel(`booking-${dbId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${dbId}`,
      }, (payload) => {
        if (payload.new?.status) setLiveStatus(payload.new.status as LiveStatus);
      })
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
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

  const ui = STATUS_UI[liveStatus];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">

          {/* Live status banner */}
          <div className={`border-2 rounded-2xl p-5 mb-6 flex items-center gap-4 ${ui.color}`}>
            <span className="text-4xl">{ui.icon}</span>
            <div>
              <p className="font-bold text-lg">{ui.label}</p>
              <p className="text-sm opacity-80">{ui.desc}</p>
            </div>
            {liveStatus === 'pending' && (
              <div className="ml-auto flex gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          <BookingSummaryCard booking={booking} liveStatus={liveStatus} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <Link href="/" className="btn-secondary text-center">← Back to Home</Link>
            <Link href="/booking" className="btn-primary text-center">Book Another Taxi</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="card bg-white">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center space-x-2">
                <span>📋</span><span>What Happens Next?</span>
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

            <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white">
              <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
                <span>💬</span><span>Need Help?</span>
              </h3>
              <p className="text-blue-100 mb-4 text-sm">Our customer support team is available 24/7.</p>
              <div className="space-y-3">
                <a href="tel:+2203456789" className="flex items-center justify-between bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-lg transition-all duration-200">
                  <span className="flex items-center space-x-2"><span>📞</span><span className="font-semibold">Call Support</span></span>
                  <span className="text-sm">+220 345 6789</span>
                </a>
                <a href="https://wa.me/2203456789" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-lg transition-all duration-200">
                  <span className="flex items-center space-x-2"><span>💬</span><span className="font-semibold">WhatsApp</span></span>
                  <span className="text-sm">Chat Now →</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 card bg-accent-50 border-2 border-accent-300">
            <div className="flex items-start space-x-3">
              <span className="text-3xl">💡</span>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Save Your Booking Reference</h4>
                <p className="text-gray-700 text-sm">
                  Please save your booking reference <strong>{booking.id}</strong> to track your booking or contact support.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
