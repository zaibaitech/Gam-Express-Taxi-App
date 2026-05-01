'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

type LiveStatus = 'pending' | 'accepted' | 'en_route' | 'arrived' | 'completed' | 'cancelled';

interface DriverInfo {
  full_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  phone: string;
  current_lat: number | null;
  current_lng: number | null;
}

interface BookingInfo {
  id: string;           // db UUID
  booking_reference: string;
  status: LiveStatus;
  pickup_address: string | null;
  dropoff_address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  estimated_fare: number | null;
  payment_method: string | null;
  driver?: DriverInfo | null;
}

const STEPS: { status: LiveStatus; label: string; icon: string }[] = [
  { status: 'pending',   label: 'Finding Driver',     icon: '🔍' },
  { status: 'accepted',  label: 'Driver Assigned',    icon: '🚕' },
  { status: 'en_route',  label: 'Driver On The Way',  icon: '🚗' },
  { status: 'arrived',   label: 'Driver Arrived',     icon: '📍' },
  { status: 'completed', label: 'Ride Complete',      icon: '✅' },
];

const STATUS_ORDER: LiveStatus[] = ['pending', 'accepted', 'en_route', 'arrived', 'completed'];

const STATUS_HERO: Record<LiveStatus, { bg: string; border: string; text: string; subtext: string; pulse: boolean }> = {
  pending:   { bg: 'bg-amber-50',  border: 'border-amber-400',  text: 'Finding you a driver...', subtext: "Please wait, we're assigning the nearest driver to your trip.", pulse: true  },
  accepted:  { bg: 'bg-blue-50',   border: 'border-blue-400',   text: 'Driver is on the way!',   subtext: 'Your driver has accepted the ride and is heading to your pickup.',  pulse: false },
  en_route:  { bg: 'bg-blue-50',   border: 'border-blue-400',   text: "You're on the move!",     subtext: 'Your driver is taking you to your destination.',                    pulse: false },
  arrived:   { bg: 'bg-purple-50', border: 'border-purple-400', text: 'Driver has arrived!',     subtext: 'Your driver is at the pickup location. Please come out.',           pulse: false },
  completed: { bg: 'bg-green-50',  border: 'border-green-400',  text: 'Ride Complete!',          subtext: 'Thank you for riding with Gam Express. Have a great day!',         pulse: false },
  cancelled: { bg: 'bg-red-50',    border: 'border-red-400',    text: 'Booking Cancelled',       subtext: 'This booking has been cancelled. Book again if you still need a ride.', pulse: false },
};

const CANCEL_ALLOWED = new Set<LiveStatus>(['pending', 'accepted']);

function stepIndex(status: LiveStatus) {
  return STATUS_ORDER.indexOf(status);
}

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve booking ID: prefer ?id= URL param, fall back to sessionStorage
  const resolveId = useCallback((): string | null => {
    const paramId = searchParams.get('id');
    if (paramId) return paramId;
    try {
      const saved = sessionStorage.getItem('currentBooking');
      if (saved) {
        const parsed = JSON.parse(saved) as { dbId?: string };
        return parsed.dbId ?? null;
      }
    } catch { /* ignore */ }
    return null;
  }, [searchParams]);

  const TERMINAL = new Set<LiveStatus>(['completed', 'cancelled']);

  const fetchBooking = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`);
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) return;
      const data = await res.json() as BookingInfo;
      setBooking(data);
      setLoading(false);
      // Stop polling once ride reaches a terminal state
      if (TERMINAL.has(data.status) && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch { /* network error — keep polling */ }
  }, []);

  useEffect(() => {
    const id = resolveId();
    if (!id) { router.replace('/'); return; }

    // Push id into URL so refresh works without sessionStorage
    if (!searchParams.get('id')) {
      router.replace(`/confirmation?id=${id}`, { scroll: false });
    }

    fetchBooking(id);

    intervalRef.current = setInterval(() => fetchBooking(id), 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resolveId, fetchBooking, router, searchParams]);

  async function handleCancel() {
    if (!booking) return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'POST' });
      if (res.ok) {
        setBooking(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      }
    } finally {
      setCancelling(false);
    }
  }

  async function handleRating(stars: number) {
    if (!booking || ratingSubmitted) return;
    setRating(stars);
    setSubmittingRating(true);
    try {
      await fetch(`/api/bookings/${booking.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: stars }),
      });
      setRatingSubmitted(true);
    } finally {
      setSubmittingRating(false);
    }
  }

  if (loading && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600">Loading your booking...</p>
        </div>
      </div>
    );
  }

  if (notFound || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔍</div>
          <p className="text-gray-700 font-semibold text-lg">Booking not found</p>
          <p className="text-gray-500 text-sm">This booking may have expired or the link is incorrect.</p>
          <Link href="/" className="inline-block mt-4 bg-amber-400 text-gray-900 font-bold px-6 py-3 rounded-xl">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const hero = STATUS_HERO[booking.status];
  const currentStep = stepIndex(booking.status);
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';
  const canCancel = CANCEL_ALLOWED.has(booking.status);
  const shareUrl = typeof globalThis.window !== 'undefined' ? globalThis.window.location.href : '';
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`Track my Gam Express ride 🚕\nRef: ${booking.booking_reference}\n${shareUrl}`)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚖</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">Gam Express Taxi</p>
            <p className="text-xs text-gray-500">{booking.booking_reference}</p>
          </div>
        </div>
        <a
          href="tel:+2203456789"
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-full transition-colors"
        >
          📞 Support
        </a>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Hero Status Card */}
        <div className={`${hero.bg} ${hero.border} border-2 rounded-2xl p-6 text-center`}>
          {hero.pulse ? (
            <div className="flex justify-center mb-3">
              <span className="relative flex h-12 w-12">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-12 w-12 bg-amber-500 items-center justify-center text-2xl">🔍</span>
              </span>
            </div>
          ) : (
            <div className="text-5xl mb-3">
              {isCancelled ? '❌' : STEPS[Math.max(currentStep, 0)]?.icon}
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900 mb-1">{hero.text}</h2>
          <p className="text-sm text-gray-600">{hero.subtext}</p>
        </div>

        {/* Post-ride Rating */}
        {isCompleted && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            {ratingSubmitted ? (
              <div>
                <div className="text-4xl mb-2">🙏</div>
                <p className="font-bold text-gray-900">Thanks for your rating!</p>
                <p className="text-sm text-gray-500 mt-1">Your feedback helps us improve.</p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-gray-900 mb-1">How was your ride?</p>
                <p className="text-sm text-gray-500 mb-4">Rate your driver</p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      disabled={submittingRating}
                      className={`text-4xl transition-transform hover:scale-110 ${
                        rating !== null && star <= rating ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                {submittingRating && <p className="text-xs text-gray-400 mt-3">Saving...</p>}
              </div>
            )}
          </div>
        )}

        {/* Trip Progress Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Trip Progress</h3>
            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const done   = i < currentStep || (i === currentStep && isCompleted);
                const active = i === currentStep && !isCompleted;
                const future = i > currentStep;
                return (
                  <div key={step.status} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                        ${done   ? 'bg-green-500 text-white' : ''}
                        ${active ? 'bg-amber-400 text-gray-900 ring-4 ring-amber-100' : ''}
                        ${future ? 'bg-gray-100 text-gray-400' : ''}
                      `}>
                        {done ? '✓' : step.icon}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pt-1 pb-8">
                      <p className={`text-sm font-semibold ${active ? 'text-amber-700' : (done ? 'text-green-700' : 'text-gray-400')}`}>
                        {step.label}
                      </p>
                      {active && <p className="text-xs text-gray-500 mt-0.5">In progress...</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Driver Info Card */}
        {booking.driver && !isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Your Driver</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-3xl">👨‍✈️</div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{booking.driver.full_name}</p>
                <p className="text-sm text-gray-500">{booking.driver.vehicle_model} · {booking.driver.vehicle_plate}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={`tel:${booking.driver.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                📞 Call Driver
              </a>
              <a
                href={`https://wa.me/${booking.driver.phone.replaceAll(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Driver Live Location */}
        {booking.driver?.current_lat && booking.driver?.current_lng && !isCompleted && !isCancelled && (
          <a
            href={`https://maps.google.com/?q=${booking.driver.current_lat},${booking.driver.current_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white rounded-2xl border border-amber-300 p-5 hover:bg-amber-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl shrink-0">
              📍
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">Track Driver on Map</p>
              <p className="text-xs text-gray-500 mt-0.5">Tap to open live location in Google Maps</p>
            </div>
            <span className="text-amber-500 text-lg">›</span>
          </a>
        )}

        {/* Trip Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Trip Details</h3>

          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup</p>
              <p className="text-gray-900 font-medium font-mono text-sm">{booking.pickup_address ?? '—'}</p>
            </div>
          </div>
          <div className="border-l-2 border-dashed border-gray-200 ml-1.5 h-4" />
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Drop-off</p>
              <p className="text-gray-900 font-medium font-mono text-sm">{booking.dropoff_address ?? '—'}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Passenger</p>
              <p className="text-gray-900 font-medium text-sm">{booking.customer_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
              <p className="text-gray-900 font-medium text-sm">{booking.customer_phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Payment</p>
              <p className="text-gray-900 font-medium text-sm">
                {booking.payment_method === 'mobile_money' ? '📱 Mobile Money' : '💵 Cash'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Reference</p>
              <p className="text-blue-700 font-bold text-sm tracking-wider">{booking.booking_reference}</p>
            </div>
          </div>
        </div>

        {/* Fare */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Estimated Fare</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {booking.estimated_fare ? formatCurrency(booking.estimated_fare) : 'Agree on pickup'}
            </p>
          </div>
          {isCompleted && (
            <span className="bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full">
              Ride Complete ✓
            </span>
          )}
        </div>

        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 rounded-xl border-2 border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : '✕ Cancel This Booking'}
          </button>
        )}

        {/* Share via WhatsApp */}
        {!isCompleted && !isCancelled && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors"
          >
            💬 Share Ride on WhatsApp
          </a>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Link href="/" className="flex-1 text-center py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors">
            ← Home
          </Link>
          <Link href="/booking" className="flex-1 text-center py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm transition-colors">
            Book Again
          </Link>
        </div>

      </div>
    </div>
  );
}
