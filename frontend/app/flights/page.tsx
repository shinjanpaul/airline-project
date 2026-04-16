'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

interface Flight {
  id: number; flight_number: string; flight_name: string;
  origin: string; origin_code: string; destination: string; destination_code: string;
  departure_time: string; arrival_time: string; seat_type: string;
  available_seats: number; total_seats: number; price: string; status: string;
  aircraft_type: string; duration_minutes: number;
  economy_seats: number; economy_available: number; economy_price: string;
  business_seats: number; business_available: number; business_price: string;
  first_seats: number; first_available: number; first_price: string;
  premium_economy_seats: number; premium_economy_available: number; premium_economy_price: string;
}

function FlightsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    date: '',
    seat_type: '',
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    loadFlights({});
  }, []);

  // Reload flights when date changes in filters
  useEffect(() => {
    if (filters.date) {
      loadFlights({ date: filters.date });
    }
  }, [filters.date]);

  const loadFlights = async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const p = params !== undefined ? params : Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const data = await api.getFlights(p);
      setFlights(Array.isArray(data) ? data.filter((f: Flight) => f.id) : []);
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    loadFlights(p);
  };

  const formatDuration = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      scheduled: 'bg-indigo-100 text-indigo-700',
      boarding: 'bg-emerald-100 text-emerald-700',
      in_flight: 'bg-blue-100 text-blue-700',
      delayed: 'bg-amber-100 text-amber-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return map[s] || 'bg-slate-100 text-slate-500';
  };

  const getClassInfo = (f: Flight) => [
    { key: 'economy', label: 'Economy', available: f.economy_available, total: f.economy_seats, price: f.economy_price },
    { key: 'business', label: 'Business', available: f.business_available, total: f.business_seats, price: f.business_price },
    { key: 'first', label: 'First Class', available: f.first_available, total: f.first_seats, price: f.first_price },
    { key: 'premium_economy', label: 'Prem. Eco', available: f.premium_economy_available, total: f.premium_economy_seats, price: f.premium_economy_price },
  ];

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />
      <main className="pt-24 pb-32 px-6 md:px-12 max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-tertiary-container">Available Journeys</span>
            <h1 className="text-5xl font-extrabold tracking-tighter text-primary font-headline">
              {filters.origin && filters.destination ? `${filters.origin} to ${filters.destination}` : 'All Flights'}
            </h1>
            <p className="text-lg text-secondary font-light">
              {flights.length} flight{flights.length !== 1 ? 's' : ''} found
              {filters.date && ` • ${new Date(filters.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-28">
            <form onSubmit={handleSearch} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-secondary mb-3">Search</h3>
                <div className="space-y-3">
                  {[
                    { key: 'origin', placeholder: 'From (city or code)', icon: 'flight_takeoff' },
                    { key: 'destination', placeholder: 'To (city or code)', icon: 'flight_land' },
                  ].map(({ key, placeholder, icon }) => (
                    <div key={key} className="flex items-center gap-2 bg-surface-container-low px-4 py-3 rounded-lg">
                      <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                      <input value={filters[key as keyof typeof filters]}
                        onChange={e => setFilters({ ...filters, [key]: e.target.value })}
                        className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-indigo-950 placeholder:text-slate-400 outline-none w-full"
                        placeholder={placeholder} />
                    </div>
                  ))}
                  <div className="flex items-center gap-2 bg-surface-container-low px-4 py-3 rounded-lg">
                    <span className="material-symbols-outlined text-primary text-sm">calendar_today</span>
                    <input type="date" value={filters.date}
                      onChange={e => setFilters({ ...filters, date: e.target.value })}
                      className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-indigo-950 outline-none w-full" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-secondary mb-3">Class</h3>
                <div className="space-y-2">
                  {[['', 'All Classes'], ['first', 'First Class'], ['business', 'Business'], ['premium_economy', 'Premium Economy'], ['economy', 'Economy']].map(([val, label]) => (
                    <label key={val} className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg cursor-pointer hover:bg-surface-container transition-colors">
                      <input type="radio" name="seat_type" value={val}
                        checked={filters.seat_type === val}
                        onChange={() => setFilters({ ...filters, seat_type: val })}
                        className="text-primary focus:ring-primary" />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">search</span>
                Search Flights
              </button>
              <button type="button"
                onClick={() => { setFilters({ origin: '', destination: '', date: '', seat_type: '' }); loadFlights({}); }}
                className="w-full bg-surface-container-high text-primary py-3 rounded-lg font-bold text-sm">
                Clear Filters
              </button>
            </form>

            {!filters.date && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-bold text-amber-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Select a date to see real-time seat availability
                </p>
              </div>
            )}
          </aside>

          {/* Flight Cards */}
          <div className="lg:col-span-9 space-y-6">
            {loading ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-5xl text-primary animate-pulse">flight</span>
                <p className="mt-4 text-slate-500">Searching flights...</p>
              </div>
            ) : flights.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-12 text-center shadow-sm">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">flight_off</span>
                <h3 className="text-xl font-bold text-primary mb-2">No flights found</h3>
                <p className="text-slate-500 mb-6">Try adjusting your search criteria</p>
                <button onClick={() => { setFilters({ origin: '', destination: '', date: '', seat_type: '' }); loadFlights({}); }}
                  className="bg-primary text-white px-6 py-3 rounded-lg font-bold">View All Flights</button>
              </div>
            ) : (
              flights.map((f, i) => (
                <div key={f.id}
                  className={`bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${i === 0 && f.status === 'scheduled' ? 'border-l-4 border-primary' : ''}`}>
                  {i === 0 && f.status === 'scheduled' && (
                    <div className="absolute top-0 right-0 px-4 py-1 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest">Recommended</div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-2xl">flight_takeoff</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-extrabold text-primary">{f.flight_number} • {f.aircraft_type}</h4>
                          <p className="text-xs font-medium text-outline uppercase tracking-wider">
                            {f.duration_minutes ? formatDuration(f.duration_minutes) : ''}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ml-auto ${statusBadge(f.status)}`}>{f.status.replace('_', ' ')}</span>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-8 mb-5">
                        <div>
                          <p className="text-3xl font-black tracking-tight text-primary">{new Date(f.departure_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                          <p className="text-xs font-bold text-secondary">{f.origin_code}</p>
                          <p className="text-xs text-slate-400">{f.origin}</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1 px-4">
                          <div className="w-full h-[1px] bg-outline-variant relative">
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 material-symbols-outlined text-primary bg-surface-container-lowest px-2 text-sm">flight</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black tracking-tight text-primary">{new Date(f.arrival_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                          <p className="text-xs font-bold text-secondary">{f.destination_code}</p>
                          <p className="text-xs text-slate-400">{f.destination}</p>
                        </div>
                      </div>

                      {/* Class breakdown — clickable, shows real seats */}
                      <div className="grid grid-cols-4 gap-2">
                        {getClassInfo(f).map(({ key, label, available, total, price }) => {
                          const booked = total - available;
                          const pct = total > 0 ? Math.round((booked / total) * 100) : 0;
                          const isSelected = filters.seat_type === key;
                          return (
                            <button key={key} type="button"
                              onClick={() => setFilters({ ...filters, seat_type: key })}
                              className={`rounded-xl p-3 text-center border-2 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent bg-surface-container-low hover:border-slate-300'}`}>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                              <p className={`text-sm font-extrabold ${!filters.date ? 'text-slate-300' : available === 0 ? 'text-red-500' : available < 5 ? 'text-amber-500' : 'text-primary'}`}>
                                {filters.date ? `${available}/${total}` : '—/—'}
                              </p>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${!filters.date ? 'bg-slate-200' : pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                  style={{ width: filters.date ? `${pct}%` : '0%' }} />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1.5 font-semibold">₹{parseFloat(price).toLocaleString()}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="md:w-px md:h-48 bg-surface-container mx-4 hidden md:block" />

                    {/* Price + Book */}
                    <div className="flex flex-col items-end gap-3 min-w-[160px]">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-outline uppercase mb-1">
                          {filters.seat_type ? filters.seat_type.replace('_', ' ') : 'Economy'} Price
                        </p>
                        <p className="text-4xl font-black text-primary">
                          ₹{parseFloat(
                            filters.seat_type === 'business' ? f.business_price :
                            filters.seat_type === 'first' ? f.first_price :
                            filters.seat_type === 'premium_economy' ? f.premium_economy_price :
                            f.economy_price || f.price
                          ).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">per seat</p>
                      </div>

                      {f.status === 'cancelled' || f.status === 'completed' ? (
                        <span className="w-full text-center px-6 py-3 rounded-lg font-bold text-sm bg-slate-100 text-slate-400">Unavailable</span>
                      ) : !filters.date ? (
                        <div className="w-full text-center px-4 py-3 rounded-lg font-bold text-xs bg-amber-50 text-amber-700 border border-amber-200">
                          📅 Pick a date first
                        </div>
                      ) : (
                        <Link
                          href={`/flights/${f.id}/reserve?date=${filters.date}${filters.seat_type ? `&seat_type=${filters.seat_type}` : ''}`}
                          className="w-full text-center px-6 py-3 rounded-lg font-bold text-sm bg-primary text-on-primary hover:opacity-90 transition-all">
                          {(() => {
                            const cls = getClassInfo(f).find(c => c.key === (filters.seat_type || 'economy'));
                            return cls && cls.available === 0 ? 'Join Waitlist' : 'Book Now';
                          })()}
                        </Link>
                      )}
                      <Link href={`/flights/${f.id}`} className="text-xs text-slate-400 hover:text-primary transition-colors">View Details</Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="bg-[#0f0c29] text-white px-8 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="font-bold text-lg mb-1">Shinjan Aero</p>
            <p className="text-slate-400 text-xs mt-2">© 2024 Shinjan Aero. Elevated Travel.</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">Platform</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">Support</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">Fleet Assistance</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">Network</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white">Global Destinations</a></li>
              <li><a href="#" className="hover:text-white">Partner Program</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-primary animate-pulse">flight</span>
      </div>
    }>
      <FlightsContent />
    </Suspense>
  );
}