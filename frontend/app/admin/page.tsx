'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

interface Reservation {
  id: number; ticket_number: string; status: string;
  passenger: { username: string; first_name: string; last_name: string };
  flight: {
    id: number; flight_number: string; origin_code: string; destination_code: string;
    departure_time: string; status: string; aircraft_type: string;
  };
  total_price: string; seats_booked: number; reservation_date: string;
}

export default function AdminConsolePage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState({ total_revenue: 0, total_passengers: 0, active_flights: 0 });

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    Promise.all([api.getAllReservations(), api.getReports()])
      .then(([res, rep]) => {
        setReservations(res);
        setSummary({ total_revenue: rep.total_revenue, total_passengers: rep.total_passengers, active_flights: rep.active_flights });
      })
      .catch(err => {
        if (err?.status === 403) router.push('/dashboard');
        else router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = reservations.filter(r =>
    r.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
    r.flight.flight_number.toLowerCase().includes(search.toLowerCase()) ||
    r.passenger.username.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s: string) => ({
    confirmed: 'bg-indigo-100 text-indigo-900',
    waitlisted: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-emerald-100 text-emerald-700',
  }[s] || 'bg-slate-100 text-slate-500');

  const flightStatusBadge = (s: string) => ({
    scheduled: 'bg-indigo-100 text-indigo-900',
    boarding: 'bg-emerald-100 text-emerald-700',
    in_flight: 'bg-blue-100 text-blue-700',
    delayed: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
  }[s] || 'bg-slate-100 text-slate-500');

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><span className="material-symbols-outlined text-6xl text-primary animate-pulse">dashboard</span></div>;

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Admin Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 flex flex-col py-8 z-50 border-r border-slate-200">
        <div className="px-8 mb-10">
          <h1 className="text-xl font-extrabold text-indigo-900 tracking-tighter">Shinjan Admin</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Fleet Management</p>
        </div>
        <nav className="flex-1 space-y-1">
          {[
            { href: '/admin', icon: 'dashboard', label: 'Dashboard', active: true },
            { href: '/flights', icon: 'flight_takeoff', label: 'Flights', active: false },
            { href: '/bookings', icon: 'confirmation_number', label: 'Bookings', active: false },
            { href: '/reports', icon: 'analytics', label: 'Reports', active: false },
            { href: '/add-flight', icon: 'add_circle', label: 'Add Flight', active: false },
          ].map(({ href, icon, label, active }) => (
            <Link key={href} href={href}
              className={`flex items-center px-8 py-3 transition-all hover:translate-x-1 ${active ? 'bg-indigo-100 text-indigo-900 font-bold rounded-r-lg' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span className="material-symbols-outlined mr-3 text-xl">{icon}</span>
              <span className="text-sm font-manrope">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-6 mt-auto">
          <Link href="/add-flight" className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-sm">add</span> New Flight
          </Link>
          <div className="mt-6 flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-700">person</span>
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-900">Admin User</p>
              <p className="text-[10px] text-slate-500">System Overseer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Top App Bar */}
        <header className="fixed top-0 left-64 right-0 glass-panel z-40 shadow-sm">
          <div className="flex justify-between items-center px-12 py-4">
            <div className="flex items-center gap-8">
              <h2 className="text-2xl font-bold tracking-tighter text-indigo-950">Operations Console</h2>
              <div className="hidden md:flex gap-6 items-center border-l border-slate-200 pl-8">
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Live Network</span>
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {summary.active_flights} Flights Active
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-500 hover:text-indigo-900 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <Link href="/dashboard" className="text-sm font-bold text-primary flex items-center gap-1">
                Passenger View <span className="material-symbols-outlined text-sm">open_in_new</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="pt-24 pb-12 px-12">
          {/* Stats Bento Grid */}
          <div className="grid grid-cols-12 gap-6 mb-12">
            {/* Hero Metric */}
            <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_40px_rgba(25,28,30,0.06)] flex flex-col justify-between min-h-[280px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
                <span className="material-symbols-outlined" style={{ fontSize: '300px', color: '#000666' }}>flight</span>
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-bold tracking-widest text-on-tertiary-container uppercase bg-tertiary-container/10 px-3 py-1 rounded">Real-time Performance</span>
                <h3 className="text-4xl font-bold tracking-tight text-indigo-950 mt-4 leading-tight">Global Fleet<br />Optimization: 98.4%</h3>
              </div>
              <div className="relative z-10 flex gap-8 items-end">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Revenue Generated</p>
                  <p className="text-2xl font-bold text-indigo-900">₹{parseFloat(String(summary.total_revenue)).toLocaleString()}</p>
                </div>
                <div className="flex-1 h-12 bg-slate-100 rounded-lg flex items-end px-2 pb-1 gap-1">
                  {[40, 60, 45, 75, 90, 85, 70, 95].map((h, i) => (
                    <div key={i} className="w-full rounded-sm" style={{ height: `${h}%`, backgroundColor: `rgba(0,6,102,${0.2 + i * 0.1})` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Alert Card */}
            <div className="col-span-12 lg:col-span-5">
              <div className="bg-indigo-950 text-white rounded-xl p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="material-symbols-outlined text-sky-400">bolt</span>
                    <span className="text-[10px] font-bold tracking-widest opacity-60 uppercase">Operational Summary</span>
                  </div>
                  <h4 className="text-xl font-bold mt-4 leading-tight">System Status: All Clear</h4>
                  <p className="text-indigo-300 text-sm mt-2">{summary.total_passengers} confirmed passengers across {summary.active_flights} active routes.</p>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  {[['Passengers', summary.total_passengers], ['Active Routes', summary.active_flights], ['Bookings', reservations.filter(r => r.status === 'confirmed').length]].map(([label, val]) => (
                    <div key={label as string} className="bg-white/10 rounded-lg p-3">
                      <p className="text-xl font-bold">{val}</p>
                      <p className="text-[10px] text-indigo-300 uppercase tracking-widest">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* All Reservations Table */}
          <section className="bg-surface-container-low rounded-xl overflow-hidden">
            <div className="px-8 py-6 flex justify-between items-center">
              <div>
                <h4 className="text-lg font-bold text-indigo-950 font-headline">Active Reservation Manifest</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">All passenger bookings across the network</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-white px-4 py-2 rounded-lg border-none shadow-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    className="bg-transparent border-none text-sm focus:ring-0 p-0 w-48 placeholder-slate-400 outline-none"
                    placeholder="Search ticket, flight, user..." />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                  <p>No reservations match your search</p>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left">
                      {['Ticket ID', 'Passenger', 'Flight', 'Status', 'Amount', 'Date'].map(h => (
                        <th key={h} className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-transparent">
                    {filtered.map(r => (
                      <tr key={r.id} className="group hover:bg-white transition-colors cursor-pointer">
                        <td className="px-8 py-5">
                          <span className="font-bold text-indigo-950 font-mono text-sm">{r.ticket_number}</span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-medium text-slate-700 text-sm">{r.passenger.first_name} {r.passenger.last_name}</p>
                          <p className="text-xs text-slate-400">@{r.passenger.username}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 text-sm">{r.flight.flight_number}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-sm text-slate-600">{r.flight.origin_code} → {r.flight.destination_code}</span>
                          </div>
                          <p className="text-xs text-slate-400">{r.seats_booked} seat{r.seats_booked > 1 ? 's' : ''}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${statusBadge(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-bold text-primary text-sm">₹{parseFloat(r.total_price).toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm text-indigo-950">
                            {new Date(r.reservation_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(r.reservation_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Fleet Health */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 bg-white p-8 rounded-xl shadow-[0_12px_40px_rgba(25,28,30,0.06)]">
              <h5 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-6">System Health</h5>
              <div className="space-y-5">
                {[
                  { label: 'Booking Success Rate', sub: 'Last 24 hours', val: 98.2, barVal: 98 },
                  { label: 'Waitlist Conversion', sub: 'Seats auto-promoted', val: summary.total_passengers, barVal: 60, suffix: ' passengers' },
                  { label: 'Fleet Utilization', sub: 'Across active routes', val: 84, barVal: 84, suffix: '%' },
                ].map(({ label, sub, val, barVal, suffix = '%' }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{label}</p>
                        <p className="text-[10px] text-slate-400">{sub}</p>
                      </div>
                      <span className="text-sm font-bold text-indigo-900">{val}{suffix}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(barVal, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 relative rounded-xl overflow-hidden min-h-[280px] bg-gradient-to-br from-indigo-950 to-slate-900">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 70%)" }} />
              <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h5 className="text-white text-lg font-bold tracking-tight">Active Hub Monitoring</h5>
                  <Link href="/reports" className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
                    Full Reports
                  </Link>
                </div>
                <div className="glass-panel p-4 rounded-lg inline-flex items-center gap-6 w-fit self-end border border-white/10">
                  {[['Confirmed', reservations.filter(r => r.status === 'confirmed').length],
                    ['Waitlisted', reservations.filter(r => r.status === 'waitlisted').length],
                    ['Cancelled', reservations.filter(r => r.status === 'cancelled').length]].map(([label, val], i) => (
                    <div key={label as string} className={`text-center ${i > 0 ? 'pl-6 border-l border-indigo-900/10' : ''}`}>
                      <p className="text-[10px] text-indigo-900/60 font-bold uppercase tracking-tighter">{label}</p>
                      <p className="text-xl font-bold text-indigo-900">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-indigo-950 text-slate-300 w-full py-12 px-0 grid grid-cols-4 gap-8 mt-12 rounded-xl">
            {[
              { title: 'Shinjan Aero', content: '© 2024 Shinjan Aero. Elevated Travel.', isTitle: true },
              { title: 'Navigation', links: ['Dashboard', 'Flights', 'Bookings'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service'] },
              { title: 'System', status: true },
            ].map(({ title, content, isTitle, links, status }) => (
              <div key={title} className="px-8">
                <h6 className={`${isTitle ? 'text-lg' : 'text-xs uppercase tracking-widest'} font-bold text-white mb-4`}>{title}</h6>
                {isTitle && <p className="text-sm opacity-60">{content}</p>}
                {links && <ul className="space-y-2">{links.map(l => <li key={l}><span className="text-slate-400 text-sm">{l}</span></li>)}</ul>}
                {status && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><p className="text-sm text-slate-400">All systems operational</p></div>}
              </div>
            ))}
          </footer>
        </div>
      </main>
    </div>
  );
}
