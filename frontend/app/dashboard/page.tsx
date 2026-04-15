'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api, getUser } from '@/lib/api';

interface Flight {
  id: number; flight_number: string; flight_name: string;
  origin: string; origin_code: string; destination: string; destination_code: string;
  departure_time: string; arrival_time: string; seat_type: string;
  available_seats: number; price: string; status: string; aircraft_type: string;
}
interface Reservation {
  id: number; ticket_number: string; status: string;
  flight: Flight; reservation_date: string; total_price: string; seats_booked: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = getUser();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [upcomingFlights, setUpcomingFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [seatClass, setSeatClass] = useState('First Class');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.getDashboard().then(data => {
      setStats(data.stats);
      setMyReservations(data.my_reservations);
      setUpcomingFlights(data.upcoming_flights);
    }).catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const isAdmin = user?.user_type === 'flight_official' || user?.user_type === 'ministry_official';

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-emerald-100 text-emerald-700',
      waitlisted: 'bg-amber-100 text-amber-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-slate-100 text-slate-500',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  const flightStatusBadge = (s: string) => {
    const map: Record<string, string> = {
      scheduled: 'bg-indigo-100 text-indigo-700',
      boarding: 'bg-emerald-100 text-emerald-700',
      in_flight: 'bg-blue-100 text-blue-700',
      delayed: 'bg-amber-100 text-amber-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-[#1e1b4b] animate-pulse">flight</span>
        <p className="mt-4 text-slate-500 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f8f9fb] min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20">

        {/* ── Hero ── */}
        <section className="bg-white px-8 md:px-16 pt-12 pb-0 max-w-screen-xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Left copy */}
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3">Elevated Travel</p>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-[#0d0f2b] leading-[1.08] mb-5">
                The Horizon is <br />
                <span className="text-[#1e1b4b]">Yours to </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#6366f1]">Command.</span>
              </h1>
              <p className="text-slate-500 text-base">
                Welcome back, <strong className="text-[#0d0f2b]">{(user?.first_name as string) || (user?.username as string)}</strong>.{' '}
                {isAdmin ? 'Manage your fleet below.' : 'Ready for your next journey?'}
              </p>
            </div>

            {/* Right — Frequent Flyer Card */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Frequent Flyer</p>
                    <p className="text-lg font-bold text-[#0d0f2b]">Skyward Elite</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Loyalty Points</p>
                    <p className="text-lg font-bold text-[#3b82f6]">{(stats.loyalty_points || 0).toLocaleString()}</p>
                  </div>
                </div>
                {upcomingFlights.length > 0 ? (
                  <div className="bg-[#1e1b4b] rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-lg">flight_takeoff</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Next Departure</p>
                      <p className="text-white text-sm font-bold">
                        {upcomingFlights[0].origin_code} → {upcomingFlights[0].destination_code} •{' '}
                        {new Date(upcomingFlights[0].departure_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1e1b4b] rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-lg">flight_takeoff</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Active Bookings</p>
                      <p className="text-white text-sm font-bold">{stats.active_bookings || 0} confirmed reservation{stats.active_bookings !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-10 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 flex flex-col md:flex-row gap-2">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-1">
              {[
                { id: 'search-from', label: 'From', placeholder: 'New York (JFK)', type: 'text' },
                { id: 'search-to', label: 'To', placeholder: 'London (LHR)', type: 'text' },
                { id: 'search-date', label: 'Departure', placeholder: '', type: 'date' },
              ].map(({ id, label, placeholder, type }) => (
                <div key={id} className="px-5 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">{label}</label>
                  <input id={id} type={type} placeholder={placeholder}
                    className="bg-transparent border-none p-0 focus:ring-0 font-semibold text-[#0d0f2b] placeholder:text-slate-300 outline-none text-sm w-full" />
                </div>
              ))}
              <div className="px-5 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Class</label>
                <select value={seatClass} onChange={e => setSeatClass(e.target.value)}
                  className="bg-transparent border-none p-0 focus:ring-0 font-semibold text-[#0d0f2b] outline-none text-sm w-full cursor-pointer">
                  <option>First Class</option>
                  <option>Business</option>
                  <option>Economy</option>
                </select>
              </div>
            </div>
            <button onClick={() => {
              const from = (document.getElementById('search-from') as HTMLInputElement)?.value;
              const to = (document.getElementById('search-to') as HTMLInputElement)?.value;
              const date = (document.getElementById('search-date') as HTMLInputElement)?.value;
              const params = new URLSearchParams();
              if (from) params.set('origin', from);
              if (to) params.set('destination', to);
              if (date) params.set('date', date);
              router.push(`/flights?${params.toString()}`);
            }} className="bg-[#1e1b4b] hover:bg-[#312e81] text-white px-8 py-4 rounded-xl font-bold tracking-tight transition-all flex items-center justify-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-lg">search</span>
              Find Flights
            </button>
          </div>
        </section>

        {/* ── Stats Grid ── */}
        <section className="px-8 md:px-16 py-10 max-w-screen-xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: 'confirmation_number', label: 'Active Bookings', value: stats.active_bookings || 0, color: 'text-indigo-500' },
              { icon: 'flight', label: 'Available Flights', value: stats.total_flights || 0, color: 'text-emerald-500' },
              { icon: 'stars', label: 'Loyalty Points', value: (stats.loyalty_points || 0).toLocaleString(), color: 'text-amber-500' },
              { icon: isAdmin ? 'groups' : 'travel_explore', label: isAdmin ? 'Total Passengers' : 'Destinations', value: isAdmin ? (stats.total_reservations || 0) : '40+', color: 'text-blue-500' },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{label}</p>
                  <p className="text-3xl font-extrabold text-[#0d0f2b]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Curated Escapes ── */}
        <section className="px-8 md:px-16 pb-0 max-w-screen-xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0d0f2b] tracking-tight">Curated Escapes</h2>
              <p className="text-slate-400 text-sm mt-1">Hand-picked destinations offering the pinnacle of luxury and cultural immersion.</p>
            </div>
            <Link href="/flights" className="text-sm font-bold text-[#0d0f2b] flex items-center gap-1 hover:gap-2 transition-all">
              Explore Global Destinations <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Large left card */}
            <div className="relative rounded-2xl overflow-hidden h-[480px] group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
                alt="Maldives" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-7">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-black/30 px-3 py-1 rounded-full mb-3 inline-block">Seasonal Feature</span>
                <h3 className="text-3xl font-extrabold text-white">The Maldives</h3>
                <p className="text-white/70 text-sm mt-1">Secluded atolls and private sanctuaries.</p>
              </div>
            </div>

            {/* Right column — two stacked cards */}
            <div className="flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden h-[232px] group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80"
                  alt="Kyoto" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <h3 className="text-xl font-extrabold text-white">Kyoto</h3>
                  <p className="text-white/70 text-xs">Heritage &amp; Serenity</p>
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden h-[232px] group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80"
                  alt="Santorini" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <h3 className="text-xl font-extrabold text-white">Santorini</h3>
                  <p className="text-white/70 text-xs">Azure Horizons</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats + Recent Bookings row ── */}
        <section className="px-8 md:px-16 py-6 max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Distance / Air Time */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex gap-10 items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 text-lg">explore</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Distance</p>
                  <p className="text-2xl font-extrabold text-[#0d0f2b]">42,800 <span className="text-sm font-normal text-slate-400">km</span></p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 text-lg">schedule</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Air Time</p>
                  <p className="text-2xl font-extrabold text-[#0d0f2b]">154 <span className="text-sm font-normal text-slate-400">hours</span></p>
                </div>
              </div>
            </div>

            {/* Recent Bookings dark card */}
            <div className="bg-[#1e1b4b] rounded-2xl p-6 text-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg tracking-tight">Recent Bookings</h3>
                <span className="material-symbols-outlined text-[#3b82f6] text-xl">history</span>
              </div>
              {myReservations.length === 0 ? (
                <div className="text-center py-4 text-indigo-300">
                  <span className="material-symbols-outlined text-3xl mb-2 block">confirmation_number</span>
                  <p className="text-sm">No Reservations Have Been Made</p>
                  <Link href="/flights" className="mt-3 inline-block text-xs font-bold text-[#3b82f6] border border-[#3b82f6]/30 px-4 py-2 rounded-lg">
                    Browse Flights
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReservations.slice(0, 3).map(r => (
                    <div key={r.id} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                      <div>
                        <p className="font-bold text-sm">{r.flight.origin} ({r.flight.origin_code})</p>
                        <p className="text-xs text-indigo-300">{r.ticket_number} • {r.status.charAt(0).toUpperCase() + r.status.slice(1)}</p>
                      </div>
                      <p className="text-xs text-indigo-300">
                        {new Date(r.reservation_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/bookings" className="mt-4 block text-center text-xs font-bold text-[#3b82f6]">
                View All Bookings →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Upcoming Flights ── */}
        <section className="px-8 md:px-16 pb-10 max-w-screen-xl mx-auto">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#0d0f2b] tracking-tight">Upcoming Flights</h3>
              <Link href="/flights" className="text-xs font-bold text-[#3b82f6] flex items-center gap-1">
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            {upcomingFlights.length === 0 ? (
  <p className="text-slate-400 text-sm text-center py-6">No upcoming flights scheduled</p>
) : (
  <div className="divide-y divide-slate-50">
    {upcomingFlights.filter(f => f.id).map(f => (
      <div key={f.id} className="flex items-center justify-between py-3 group">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#1e1b4b] transition-colors">
            <span className="material-symbols-outlined text-[#1e1b4b] group-hover:text-white text-base transition-colors">flight_takeoff</span>
          </div>
          <div>
            <p className="font-bold text-[#0d0f2b] text-sm">{f.origin_code} → {f.destination_code}</p>
            <p className="text-xs text-slate-400">{f.flight_number} • {new Date(f.departure_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${flightStatusBadge(f.status)}`}>{f.status.replace('_', ' ')}</span>
          <Link href={`/flights/${f.id}/reserve`} className="bg-[#1e1b4b] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#312e81] transition-colors">
            Book
          </Link>
        </div>
      </div>
    ))}
  </div>
)}
          </div>
        </section>

        {/* ── Admin Quick Actions ── */}
        {isAdmin && (
          <section className="px-8 md:px-16 pb-16 max-w-screen-xl mx-auto">
            <h3 className="text-xl font-bold text-[#0d0f2b] tracking-tight mb-5">Admin Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Link href="/add-flight" className="bg-[#1e1b4b] hover:bg-[#312e81] p-8 rounded-2xl text-white flex flex-col justify-between min-h-[160px] hover:-translate-y-1 transition-all">
                <span className="material-symbols-outlined text-3xl">add_circle</span>
                <div>
                  <h4 className="text-lg font-bold">Add New Flight</h4>
                  <p className="text-indigo-300 text-sm">Schedule a new route</p>
                </div>
              </Link>
              <Link href="/reports" className="bg-white border border-slate-100 shadow-sm p-8 rounded-2xl flex flex-col justify-between min-h-[160px] hover:-translate-y-1 transition-all">
                <span className="material-symbols-outlined text-3xl text-[#3b82f6]">analytics</span>
                <div>
                  <h4 className="text-lg font-bold text-[#0d0f2b]">View Reports</h4>
                  <p className="text-slate-400 text-sm">Reservations per flight</p>
                </div>
              </Link>
              <Link href="/admin" className="bg-[#0d0f2b] p-8 rounded-2xl text-white flex flex-col justify-between min-h-[160px] hover:-translate-y-1 transition-all">
                <span className="material-symbols-outlined text-3xl text-sky-400">dashboard</span>
                <div>
                  <h4 className="text-lg font-bold">Operations Console</h4>
                  <p className="text-indigo-300 text-sm">Full fleet management</p>
                </div>
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0d0f2b] text-white px-8 md:px-16 py-12">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <p className="font-extrabold text-lg tracking-tight mb-1">Shinjan Aero</p>
            <p className="text-slate-400 text-xs">© 2024 Shinjan Aero. Elevated Travel.</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-4">Company</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Global Destinations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Fleet Excellence</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-4">Legal</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-4">Contact</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>concierge@shinjan.aero</li>
              <li className="flex gap-3 pt-1">
                <a href="#" className="hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-base">language</span>
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-base">public</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}