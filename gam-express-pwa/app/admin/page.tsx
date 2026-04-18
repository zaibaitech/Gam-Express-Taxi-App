'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking, Driver } from '@/lib/supabase';
import Link from 'next/link';

type Stats = {
  pending: number;
  active: number;
  completed: number;
  cancelled: number;
  onlineDrivers: number;
  earningsToday: number;
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  accepted: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  en_route: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  arrived: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  en_route: 'En Route',
  arrived: 'At Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();

    // Live updates for bookings
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => loadDashboard())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadDashboard() {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [bookingsRes, driversRes] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('drivers').select('*').order('full_name'),
    ]);

    const bookings = (bookingsRes.data ?? []) as Booking[];
    const allDrivers = (driversRes.data ?? []) as Driver[];

    const todayBookings = bookings.filter(b => new Date(b.created_at) >= today);

    setStats({
      pending: bookings.filter(b => b.status === 'pending').length,
      active: bookings.filter(b => ['accepted', 'en_route', 'arrived'].includes(b.status)).length,
      completed: todayBookings.filter(b => b.status === 'completed').length,
      cancelled: todayBookings.filter(b => b.status === 'cancelled').length,
      onlineDrivers: allDrivers.filter(d => d.is_online).length,
      earningsToday: todayBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.estimated_fare ?? 0), 0),
    });

    setRecentBookings(bookings.slice(0, 10));
    setDrivers(allDrivers);
    setLoading(false);
  }

  async function cancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return;
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    loadDashboard();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          Live
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Pending', value: stats!.pending, color: 'text-yellow-400', icon: '⏳' },
          { label: 'Active Rides', value: stats!.active, color: 'text-blue-400', icon: '🚕' },
          { label: 'Completed Today', value: stats!.completed, color: 'text-green-400', icon: '✅' },
          { label: 'Cancelled Today', value: stats!.cancelled, color: 'text-red-400', icon: '❌' },
          { label: 'Drivers Online', value: stats!.onlineDrivers, color: 'text-purple-400', icon: '📍' },
          { label: 'Earnings Today', value: `D ${stats!.earningsToday.toFixed(0)}`, color: 'text-yellow-300', icon: '💰' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h2 className="font-semibold text-white">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-xs text-yellow-400 hover:text-yellow-300">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {recentBookings.length === 0 && (
              <p className="text-gray-500 text-sm p-4 text-center">No bookings yet</p>
            )}
            {recentBookings.map(b => (
              <div key={b.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-white text-sm truncate">
                      {b.customer_name ?? 'Unknown'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {b.pickup_address ?? '—'} → {b.dropoff_address ?? '—'}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {formatDate(b.created_at)} {formatTime(b.created_at)}
                    {b.estimated_fare ? ` · D ${b.estimated_fare}` : ''}
                  </p>
                </div>
                {['pending', 'accepted'].includes(b.status) && (
                  <button
                    onClick={() => cancelBooking(b.id)}
                    className="text-xs text-red-400 hover:text-red-300 shrink-0 mt-0.5"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Drivers status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h2 className="font-semibold text-white">Drivers</h2>
            <Link href="/admin/drivers" className="text-xs text-yellow-400 hover:text-yellow-300">
              Manage →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {drivers.length === 0 && (
              <p className="text-gray-500 text-sm p-4 text-center">No drivers yet</p>
            )}
            {drivers.map(d => (
              <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.is_online ? 'bg-green-400' : 'bg-gray-600'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{d.full_name}</p>
                  <p className="text-xs text-gray-500">{d.vehicle_plate} · {d.vehicle_model}</p>
                </div>
                <span className={`text-xs ${d.is_online ? 'text-green-400' : 'text-gray-600'}`}>
                  {d.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
