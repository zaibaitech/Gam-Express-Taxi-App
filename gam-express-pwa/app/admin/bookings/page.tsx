'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking, BookingStatus } from '@/lib/supabase';

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

type Filter = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBookings();
    const channel = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadBookings)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadBookings() {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    setBookings((data ?? []) as Booking[]);
    setLoading(false);
  }

  async function cancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return;
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
  }

  const filtered = bookings.filter(b => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'active' ? ['accepted', 'en_route', 'arrived'].includes(b.status) :
      b.status === filter;

    const q = search.toLowerCase();
    const matchSearch = !q || [
      b.customer_name, b.customer_phone, b.pickup_address,
      b.dropoff_address, b.booking_reference,
    ].some(f => f?.toLowerCase().includes(q));

    return matchFilter && matchSearch;
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Bookings</h1>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, phone, address, reference..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
        />
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-gray-400 animate-pulse text-sm py-8 text-center">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">📋</div>
          <p>No bookings found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => (
            <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                {/* Left */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {b.booking_reference && (
                      <span className="text-xs text-gray-500 font-mono">#{b.booking_reference}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(b.created_at).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Customer</span>
                      <p className="text-sm text-white font-medium">{b.customer_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{b.customer_phone ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Route</span>
                      <p className="text-sm text-white truncate">📍 {b.pickup_address ?? '—'}</p>
                      <p className="text-sm text-gray-300 truncate">🏁 {b.dropoff_address ?? '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="text-right shrink-0">
                  {b.estimated_fare && (
                    <p className="text-lg font-bold text-yellow-400">D {b.estimated_fare}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.payment_method === 'mobile_money' ? '📱 Mobile Money' : '💵 Cash'}
                  </p>
                  {['pending', 'accepted'].includes(b.status) && (
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="mt-2 text-xs text-red-400 hover:text-red-300 border border-red-800 rounded-lg px-3 py-1 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
