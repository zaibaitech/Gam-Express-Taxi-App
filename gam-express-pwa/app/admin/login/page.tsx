'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Small artificial delay to prevent brute-force timing
    await new Promise(r => setTimeout(r, 400));

    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      sessionStorage.setItem('gam_admin_auth', 'true');
      router.replace('/admin');
    } else {
      setError('Incorrect password.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-400 text-4xl mb-4">
            🚕
          </div>
          <h1 className="text-2xl font-bold text-white">Gam Express</h1>
          <p className="text-gray-400 mt-1">Admin Panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">
            Admin Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter password"
            autoFocus
            className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 mb-4"
          />

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Checking...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Gam Express Taxi · Banjul, The Gambia
        </p>
      </div>
    </div>
  );
}
