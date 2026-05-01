'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/supabase';

type OnlineDriver = { id: string; full_name: string; vehicle_plate: string };
type Filter = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  accepted:  'bg-blue-500/10 text-blue-400 border-blue-500/30',
  en_route:  'bg-purple-500/10 text-purple-400 border-purple-500/30',
  arrived:   'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  completed: 'bg-green-500/10 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  accepted:  'Accepted',
  en_route:  'En Route',
  arrived:   'At Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const ACTIVE_STATUSES = new Set(['accepted', 'en_route', 'arrived']);
const CANCELLABLE_STATUSES = new Set(['pending', 'accepted']);

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function matchesFilter(b: Booking, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return ACTIVE_STATUSES.has(b.status);
  return b.status === filter;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const [onlineDrivers, setOnlineDrivers] = useState<OnlineDriver[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadBookings();
    loadOnlineDrivers();
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

  async function loadOnlineDrivers() {
    const { data } = await supabase
      .from('drivers')
      .select('id, full_name, vehicle_plate')
      .eq('is_online', true)
      .order('full_name');
    setOnlineDrivers((data ?? []) as OnlineDriver[]);
  }

  async function cancelBooking(id: string) {
    if (!confirm('Cancel this booking?')) return;
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
  }

  async function assignDriver() {
    if (!assigningId || !selectedDriver) return;
    setAssigning(true);
    await supabase
      .from('bookings')
      .update({ driver_id: selectedDriver, status: 'accepted', driver_accepted_at: new Date().toISOString() })
      .eq('id', assigningId);
    setAssigningId(null);
    setSelectedDriver('');
    setAssigning(false);
  }

  const filtered = bookings.filter(b => {
    const matchSearch = (() => {
      const q = search.toLowerCase();
      if (!q) return true;
      return [b.customer_name, b.customer_phone, b.pickup_address, b.dropoff_address, b.booking_reference]
        .some(f => f?.toLowerCase().includes(q));
    })();
    return matchesFilter(b, filter) && matchSearch;
  });

  function renderList() {
    if (loading) {
      return <div className="text-gray-400 animate-pulse text-sm py-8 text-center">Loading...</div>;
    }
    if (filtered.length === 0) {
      return (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">📋</div>
          <p>No bookings found</p>
        </div>
      );
    }
    return (
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
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
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

                {/* Assign driver inline */}
                {b.status === 'pending' && assigningId === b.id && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedDriver}
                      onChange={e => setSelectedDriver(e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-400"
                    >
                      <option value="">— Select online driver —</option>
                      {onlineDrivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.full_name} · {d.vehicle_plate}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={assignDriver}
                      disabled={!selectedDriver || assigning}
                      className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {assigning ? 'Assigning...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => { setAssigningId(null); setSelectedDriver(''); }}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1.5"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Right */}
              <div className="text-right shrink-0">
                {b.estimated_fare && (
                  <p className="text-lg font-bold text-yellow-400">D {b.estimated_fare}</p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">
                  {b.payment_method === 'mobile_money' ? '📱 Mobile Money' : '💵 Cash'}
                </p>
                <div className="flex flex-col gap-1 mt-2 items-end">
                  {b.status === 'pending' && assigningId !== b.id && (
                    <button
                      onClick={() => { setAssigningId(b.id); setSelectedDriver(''); loadOnlineDrivers(); }}
                      className="text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-800 rounded-lg px-3 py-1 transition-colors"
                    >
                      Assign Driver
                    </button>
                  )}
                  {CANCELLABLE_STATUSES.has(b.status) && (
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="text-xs text-red-400 hover:text-red-300 border border-red-800 rounded-lg px-3 py-1 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

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
          {FILTERS.map(f => {
            const count = f.key === 'pending'
              ? bookings.filter(b => b.status === 'pending').length
              : null;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filter === f.key ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {f.label}
                {count !== null && count > 0 && (
                  <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${
                    filter === f.key ? 'bg-gray-900 text-yellow-400' : 'bg-yellow-500 text-gray-900'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {renderList()}
    </div>
  );
}
