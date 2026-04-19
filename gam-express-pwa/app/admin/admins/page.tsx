'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Admin = { id: string; email: string; created_at: string };

const EMPTY = { email: '', password: '' };

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentId(session?.user.id ?? null);
    });
    loadAdmins();
  }, []);

  async function loadAdmins() {
    const { data } = await supabase.from('admins').select('*').order('created_at');
    setAdmins((data ?? []) as Admin[]);
    setLoading(false);
  }

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? '';
  }

  async function handleAddAdmin(e: React.SyntheticEvent) {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');
    if (!form.email || !form.password) { setFormError('All fields are required.'); return; }
    if (form.password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) { setFormError(result.error ?? 'Failed to create admin.'); return; }
      setSuccessMsg(`Admin "${form.email}" added successfully.`);
      setForm(EMPTY);
      setShowForm(false);
      loadAdmins();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(admin: Admin) {
    if (!confirm(`Remove admin access for ${admin.email}? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/create-admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
      body: JSON.stringify({ id: admin.id }),
    });
    const result = await res.json();
    if (!res.ok) { alert(result.error); return; }
    loadAdmins();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Admins</h1>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); setSuccessMsg(''); }}
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ Add Admin'}
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 text-sm">
          {successMsg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddAdmin} className="bg-gray-900 border border-yellow-500/30 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-white text-lg">New Admin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="admin@gamexpress.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Password *</label>
              <input
                type="text"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min 8 characters"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {saving ? 'Creating...' : 'Create Admin'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400 animate-pulse text-sm py-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-2">
          {admins.map(a => (
            <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-bold text-sm shrink-0">
                {a.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{a.email}</p>
                <p className="text-xs text-gray-500">
                  Added {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {a.id === currentId && <span className="ml-2 text-yellow-400">(you)</span>}
                </p>
              </div>
              {a.id !== currentId && (
                <button
                  onClick={() => handleRemove(a)}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-800 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
