'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearAuth, getUser } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const isAdmin = (): boolean => 
    user?.user_type === 'flight_official' || 
    user?.user_type === 'ministry_official' || 
    user?.is_staff === true;

  useEffect(() => { setUser(getUser()); }, []);

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    clearAuth();
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Home' },
    { href: '/flights', label: 'Flights' },
    { href: '/bookings', label: 'My Bookings' },
    { href: '/reports', label: 'Reports' },
  ];

  const mobileLinks: { href: string; icon: string; label: string }[] = [
    { href: '/dashboard', icon: 'home', label: 'Home' },
    { href: '/flights', icon: 'flight', label: 'Flights' },
    { href: '/bookings', icon: 'event_note', label: 'Bookings' },
    { href: '/cancel', icon: 'cancel', label: 'Cancel' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="flex justify-between items-center px-12 py-4 max-w-full mx-auto">
        <Link href="/dashboard" className="text-2xl font-bold tracking-tighter text-indigo-950 font-headline">
          Shinjan Aero
        </Link>
        <div className="hidden md:flex gap-8 items-center font-manrope tracking-tight font-medium">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={pathname.startsWith(l.href)
                ? 'text-indigo-900 border-b-2 border-indigo-900 pb-1'
                : 'text-slate-500 hover:text-indigo-700 transition-colors'}>
              {l.label}
            </Link>
          ))}
          {isAdmin() && (
            <>
              <Link href="/add-flight" className={pathname === '/add-flight' ? 'text-indigo-900 border-b-2 border-indigo-900 pb-1' : 'text-slate-500 hover:text-indigo-700 transition-colors'}>
                Add Flight
              </Link>
              <Link href="/admin" className={pathname === '/admin' ? 'text-indigo-900 border-b-2 border-indigo-900 pb-1' : 'text-slate-500 hover:text-indigo-700 transition-colors'}>
                Console
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-6">
          <button className="text-slate-500 hover:text-indigo-700 transition-all scale-95">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <span className="material-symbols-outlined text-indigo-900">account_circle</span>
            <span className="text-sm font-semibold text-indigo-950">
              {user ? String(user.first_name || user.username || 'Guest') : 'Guest'}
            </span>
          </div>
          <button onClick={handleLogout}
            className="bg-primary text-on-primary px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all">
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
     <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-xl bg-white/90 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-slate-100 flex justify-around items-center pt-3 pb-6">
  {mobileLinks.map(({ href, icon, label }) => (
    <Link key={href} href={href} className={`flex flex-col items-center ${pathname.startsWith(href) ? 'text-indigo-900 font-bold' : 'text-slate-400'}`}>
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-manrope text-[10px] uppercase tracking-widest mt-1">{label}</span>
    </Link>
  ))}
  <button onClick={handleLogout} className="flex flex-col items-center text-slate-400">
    <span className="material-symbols-outlined">logout</span>
    <span className="font-manrope text-[10px] uppercase tracking-widest mt-1">Logout</span>
  </button>
</nav>
</nav>
  );
}