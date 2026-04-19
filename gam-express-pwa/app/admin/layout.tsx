'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setChecked(true);
        if (!isLoginPage) router.replace('/admin/login');
        return;
      }
      const { data: adminRow } = await supabase.from('admins').select('id').single();
      if (!adminRow) {
        await supabase.auth.signOut();
        setChecked(true);
        if (!isLoginPage) router.replace('/admin/login');
        return;
      }
      setAuthed(true);
      setChecked(true);
    }
    checkAuth();
  }, [pathname]);

  if (isLoginPage) return <>{children}</>;
  if (!checked || !authed) return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  const navLinks = [
    { href: '/admin', label: '📊 Dashboard', exact: true },
    { href: '/admin/bookings', label: '📋 Bookings' },
    { href: '/admin/drivers', label: '🚕 Drivers' },
    { href: '/admin/admins', label: '👤 Admins' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top nav */}
      <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-xl">🚕</span>
          <span className="font-bold text-yellow-400 text-lg">Gam Express Admin</span>
        </div>
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                link.exact
                  ? pathname === link.href
                    ? 'bg-yellow-400 text-gray-900'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : pathname.startsWith(link.href)
                    ? 'bg-yellow-400 text-gray-900'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </nav>

      {/* Mobile nav */}
      <div className="sm:hidden flex border-b border-gray-800 bg-gray-900 overflow-x-auto">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 text-center px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              link.exact
                ? pathname === link.href ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'
                : pathname.startsWith(link.href) ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
