'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BookingData } from '@/types';
import { formatCurrency } from '@/lib/utils';

type LiveStatus = 'pending' | 'accepted' | 'en_route' | 'arrived' | 'completed' | 'cancelled';

interface DriverInfo {
  full_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  phone: string;
}

const STEPS: { status: LiveStatus; label: string; icon: string }[] = [
  { status: 'pending',   label: 'Finding Driver',      icon: '🔍' },
  { status: 'accepted',  label: 'Driver Assigned',      icon: '🚕' },
  { status: 'en_route',  label: 'Driver On The Way',    icon: '🚗' },
  { status: 'arrived',   label: 'Driver Arrived',       icon: '📍' },
  { status: 'completed', label: 'Ride Complete',        icon: '✅' },
];

const STATUS_ORDER: LiveStatus[] = ['pending', 'accepted', 'en_route', 'arrived', 'completed'];

const STATUS_HERO: Record<LiveStatus, { bg: string; border: string; text: string; subtext: string; pulse: boolean }> = {
  pending:   { bg: 'bg-amber-50',  border: 'border-amber-400',  text: 'Finding you a driver...', subtext: 'Please wait, we\'re assigning the nearest driver to your trip.',    pulse: true  },
  accepted:  { bg: 'bg-blue-50',   border: 'border-blue-400',   text: 'Driver is on the way!',   subtext: 'Your driver has accepted the ride and is heading to your pickup.',   pulse: false },
  en_route:  { bg: 'bg-blue-50',   border: 'border-blue-400',   text: 'You\'re on the move!',    subtext: 'Your driver is taking you to your destination.',                     pulse: false },
  arrived:   { bg: 'bg-purple-50', border: 'border-purple-400', text: 'Driver has arrived!',     subtext: 'Your driver is at the pickup location. Please come out.',            pulse: false },
  completed: { bg: 'bg-green-50',  border: 'border-green-400',  text: 'Ride Complete!',          subtext: 'Thank you for riding with Gam Express. Have a great day!',          pulse: false },
  cancelled: { bg: 'bg-red-50',    border: 'border-red-400',    text: 'Booking Cancelled',       subtext: 'This booking has been cancelled. Book again if you still need a ride.', pulse: false },
};

function stepIndex(status: LiveStatus) {
  return STATUS_ORDER.indexOf(status);
}

export default function ConfirmationPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData & { dbId?: string } | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('pending');
  const [driver, setDriver] = useState<DriverInfo | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('currentBooking');
    if (!saved) { router.push('/'); return; }

    const parsed = JSON.parse(saved) as BookingData & { dbId?: string };
    setBooking(parsed);

    const dbId = parsed.dbId;
    if (!dbId) return;

    const fetchFull = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('status, driver_id')
        .eq('id', dbId)
        .single();

      if (!data) return;
      const newStatus = data.status as LiveStatus;
      setLiveStatus(newStatus);

      if (data.driver_id && newStatus !== 'pending') {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('full_name, vehicle_plate, vehicle_model, phone')
          .eq('id', data.driver_id)
          .single();
        if (driverData) setDriver(driverData);
      }
    };

    fetchFull();
    const poll = setInterval(fetchFull, 5000);

    const channel = supabase
      .channel(`booking-${dbId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${dbId}`,
      }, (payload) => {
        const newStatus = payload.new?.status as LiveStatus;
        if (newStatus) {
          setLiveStatus(newStatus);
          // Fetch driver info if just assigned
          if (payload.new?.driver_id && newStatus !== 'pending') {
            supabase
              .from('drivers')
              .select('full_name, vehicle_plate, vehicle_model, phone')
              .eq('id', payload.new.driver_id)
              .single()
              .then(({ data: d }) => { if (d) setDriver(d); });
          }
        }
      })
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [router]);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600">Loading your booking...</p>
        </div>
      </div>
    );
  }

  const hero = STATUS_HERO[liveStatus];
  const currentStep = stepIndex(liveStatus);
  const isCancelled = liveStatus === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚖</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">Gam Express Taxi</p>
            <p className="text-xs text-gray-500">Booking {booking.id}</p>
          </div>
        </div>
        <a
          href="tel:+2203456789"
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm px-4 py-2 rounded-full transition-colors"
        >
          📞 Call Support
        </a>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Hero Status Card */}
        <div className={`${hero.bg} ${hero.border} border-2 rounded-2xl p-6 text-center`}>
          {hero.pulse ? (
            <div className="flex justify-center mb-3">
              <span className="relative flex h-12 w-12">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
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

        {/* Trip Progress Timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Trip Progress</h3>
            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
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
                      <p className={`text-sm font-semibold ${active ? 'text-amber-700' : done ? 'text-green-700' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {active && (
                        <p className="text-xs text-gray-500 mt-0.5">In progress...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Driver Info Card — shown once driver is assigned */}
        {driver && !isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Your Driver</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
                👨‍✈️
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{driver.full_name}</p>
                <p className="text-sm text-gray-500">{driver.vehicle_model} · {driver.vehicle_plate}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={`tel:${driver.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                📞 Call Driver
              </a>
              <a
                href={`https://wa.me/${driver.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Booking Reference */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Booking Reference</p>
          <p className="text-2xl font-bold text-blue-700 tracking-widest">{booking.id}</p>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Trip Details</h3>

          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup</p>
              <p className="text-gray-900 font-medium">{booking.pickupLocation}</p>
            </div>
          </div>

          <div className="border-l-2 border-dashed border-gray-200 ml-1.5 h-4" />

          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Drop-off</p>
              <p className="text-gray-900 font-medium">{booking.dropoffLocation}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Passenger</p>
              <p className="text-gray-900 font-medium">{booking.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
              <p className="text-gray-900 font-medium">{booking.phoneNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup Time</p>
              <p className="text-gray-900 font-medium">{booking.pickupTime}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Payment</p>
              <p className="text-gray-900 font-medium">
                {booking.paymentMethod === 'mobile-money' ? '📱 Mobile Money' : '💵 Cash'}
              </p>
            </div>
          </div>
        </div>

        {/* Fare */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Estimated Fare</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(booking.estimatedFare)}</p>
          </div>
          {liveStatus === 'completed' && (
            <span className="bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full">Ride Complete</span>
          )}
        </div>

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
