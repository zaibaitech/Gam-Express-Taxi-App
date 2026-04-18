'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Driver } from '@/lib/supabase';

type NewDriver = {
  full_name: string;
  phone: string;
  vehicle_plate: string;
  vehicle_model: string;
  password: string;
};

const EMPTY: NewDriver = {
  full_name: '',
  phone: '',
  vehicle_plate: '',
  vehicle_model: '',
  password: '',
};

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewDriver>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadDrivers(); }, []);

  async function loadDrivers() {
    const { data } = await supabase.from('drivers').select('*').order('full_name');
    setDrivers((data ?? []) as Driver[]);
    setLoading(false);
  }

  function phoneToEmail(phone: string) {
    return `${phone.replace(/\D/g, '')}@gamexpress.com`;
  }

  async function handleAddDriver(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!form.full_name || !form.phone || !form.vehicle_plate || !form.vehicle_model || !form.password) {
      setFormError('All fields are required.');
      return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      const email = phoneToEmail(form.phone);

      // Call our server-side API route (uses service role key — bypasses RLS)
      const res = await fetch('/api/admin/create-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: form.password,
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          vehicle_plate: form.vehicle_plate.trim().toUpperCase(),
          vehicle_model: form.vehicle_model.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setFormError(result.error ?? 'Failed to create driver.');
        return;
      }

      setSuccessMsg(`✅ Driver "${form.full_name}" added! They can now sign in with their phone number.`);
      setForm(EMPTY);
      setShowForm(false);
      loadDrivers();
    } finally {
      setSaving(false);
    }
  }

  async function toggleOnline(driver: Driver) {
    await supabase
      .from('drivers')
      .update({ is_online: !driver.is_online })
      .eq('id', driver.id);
    loadDrivers();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Drivers</h1>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); setSuccessMsg(''); }}
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ Add Driver'}
        </button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 text-sm">
          {successMsg}
        </div>
      )}

      {/* Add driver form */}
      {showForm && (
        <form
          onSubmit={handleAddDriver}
          className="bg-gray-900 border border-yellow-500/30 rounded-xl p-5 space-y-4"
        >
          <h2 className="font-semibold text-white text-lg">New Driver</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Full Name *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Ousman Jallow"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Phone Number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+220 772 1234"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Vehicle Plate *</label>
              <input
                type="text"
                value={form.vehicle_plate}
                onChange={e => setForm(p => ({ ...p, vehicle_plate: e.target.value }))}
                placeholder="BJL 1234"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Vehicle Model *</label>
              <input
                type="text"
                value={form.vehicle_model}
                onChange={e => setForm(p => ({ ...p, vehicle_model: e.target.value }))}
                placeholder="Toyota Corolla 2018"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
                Initial Password * <span className="text-gray-600 normal-case">(driver can change later)</span>
              </label>
              <input
                type="text"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 6 characters"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {formError && (
            <p className="text-red-400 text-sm">{formError}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving ? 'Creating...' : 'Create Driver'}
            </button>
            <p className="text-xs text-gray-500">
              This creates their Supabase auth account and driver profile in one step.
            </p>
          </div>
        </form>
      )}

      {/* Driver list */}
      {loading ? (
        <div className="text-gray-400 animate-pulse text-sm py-8 text-center">Loading drivers...</div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">🚕</div>
          <p>No drivers yet — add one above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {drivers.map(d => (
            <div
              key={d.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 flex-wrap"
            >
              {/* Online indicator */}
              <div className={`w-3 h-3 rounded-full shrink-0 ${d.is_online ? 'bg-green-400 shadow-lg shadow-green-400/30' : 'bg-gray-700'}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">{d.full_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.is_online ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                    {d.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{d.phone}</p>
                <p className="text-xs text-gray-600">{d.vehicle_plate} · {d.vehicle_model}</p>
              </div>

              {/* GPS if online */}
              {d.is_online && d.current_lat && d.current_lng && (
                <a
                  href={`https://maps.google.com/?q=${d.current_lat},${d.current_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 rounded-lg px-3 py-1.5 transition-colors"
                >
                  📍 Track
                </a>
              )}

              {/* Force offline toggle */}
              {d.is_online && (
                <button
                  onClick={() => toggleOnline(d)}
                  className="text-xs text-orange-400 hover:text-orange-300 border border-orange-800 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Force Offline
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
