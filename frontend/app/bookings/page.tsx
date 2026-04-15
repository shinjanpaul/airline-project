'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

interface Flight {
  id: number; flight_number: string; origin_code: string; destination_code: string;
  origin: string; destination: string; departure_time: string; arrival_time: string;
  seat_type: string; price: string; aircraft_type: string;
}
interface Reservation {
  id: number; ticket_number: string; status: string;
  flight: Flight; reservation_date: string; total_price: string;
  seats_booked: number; seat_number: string; travel_date: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.getReservations().then(setReservations).catch(() => router.push('/login')).finally(() => setLoading(false));
  }, [router]);

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

  const statusStyle = (s: string) => ({
    confirmed: { badge: 'bg-emerald-100 text-emerald-700', border: 'border-l-emerald-500' },
    waitlisted: { badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-500' },
    cancelled: { badge: 'bg-red-100 text-red-700', border: 'border-l-red-400' },
    completed: { badge: 'bg-slate-100 text-slate-500', border: 'border-l-slate-300' },
  }[s] || { badge: 'bg-slate-100 text-slate-500', border: 'border-l-slate-300' });

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <span className="material-symbols-outlined text-6xl text-primary animate-pulse">confirmation_number</span>
    </div>
  );

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />
      <main className="pt-24 pb-32 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-tertiary-container mb-3 block">Travel History</span>
          <h1 className="text-5xl font-extrabold tracking-tighter text-primary font-headline">My Bookings</h1>
          <p className="text-secondary mt-2">{reservations.length} total reservation{reservations.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[['all', 'All'], ['confirmed', 'Confirmed'], ['waitlisted', 'Waitlisted'], ['cancelled', 'Cancelled'], ['completed', 'Completed']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${filter === val ? 'bg-primary text-white' : 'bg-surface-container-high text-primary hover:bg-primary/10'}`}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">confirmation_number</span>
            <h3 className="text-xl font-bold text-primary font-headline mb-2">No Reservations Have Been Made</h3>
            <p className="text-slate-500 mb-6">Book your first flight to get started</p>
            <Link href="/flights" className="bg-primary text-white px-8 py-3 rounded-lg font-bold inline-block hover:opacity-90">
              Browse Flights
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => {
              const style = statusStyle(r.status);
              return (
                <div key={r.id} className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${style.border} transition-all hover:-translate-y-0.5 hover:shadow-md`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Route */}
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">flight_takeoff</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl font-black text-primary tracking-tight">{r.flight.origin_code}</span>
                          <span className="material-symbols-outlined text-slate-300">trending_flat</span>
                          <span className="text-2xl font-black text-primary tracking-tight">{r.flight.destination_code}</span>
                        </div>
                        <p className="text-sm text-slate-500">{r.flight.origin} → {r.flight.destination}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{r.flight.flight_number} • {r.flight.aircraft_type}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-8 flex-wrap">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Travel Date</p>
                        <p className="text-sm font-bold text-indigo-950">
                          {r.travel_date ? new Date(r.travel_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Ticket No.</p>
                        <p className="text-sm font-bold text-indigo-950 font-mono">{r.ticket_number}</p>
                        <p className="text-xs text-slate-500">{r.seats_booked} seat{r.seats_booked > 1 ? 's' : ''}{r.seat_number ? ` • ${r.seat_number}` : ''}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Total Paid</p>
                        <p className="text-sm font-bold text-primary">₹{parseFloat(r.total_price).toLocaleString()}</p>
                        <p className="text-xs text-slate-500 capitalize">{(r.seat_type || 'economy').replace('_', ' ')}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${style.badge}`}>{r.status}</span>
                        {r.status === 'confirmed' && (
                          <Link href="/cancel" className="text-xs text-red-400 hover:text-red-600 transition-colors">Cancel</Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Booking Date */}
                  <div className="mt-4 pt-4 border-t border-surface-container-low flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Booked on {new Date(r.reservation_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {r.status === 'confirmed' && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Booking Confirmed
                      </div>
                    )}
                    {r.status === 'waitlisted' && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        On Waitlist — You'll be notified when a seat opens
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">Support</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Fleet Assistance</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-3">Network</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-white transition-colors">Global Destinations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Partner Program</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
