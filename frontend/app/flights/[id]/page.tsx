'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

interface Flight {
  id: number; flight_number: string; flight_name: string;
  origin: string; origin_code: string; destination: string; destination_code: string;
  departure_time: string; arrival_time: string; seat_type: string;
  available_seats: number; total_seats: number; price: string; status: string;
  aircraft_type: string; duration_minutes: number; waitlisted_count: number;
}

export default function FlightDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    const id = Number(params.id as string);
    if (!id || isNaN(id)) { router.push('/flights'); return; }
    api.getFlight(id).then(setFlight).catch(() => router.push('/flights')).finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="material-symbols-outlined text-5xl text-primary animate-pulse">flight</span></div>;
  if (!flight) return null;

  const occupancy = Math.round(((flight.total_seats - flight.available_seats) / flight.total_seats) * 100);
  const fmt = (dt: string) => new Date(dt).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />
      <main className="pt-24 pb-32 px-6 md:px-12 max-w-5xl mx-auto">
        <Link href="/flights" className="flex items-center gap-1 text-sm text-primary mb-8 hover:underline">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Flights
        </Link>

        <div className="bg-gradient-to-br from-indigo-950 to-primary rounded-xl p-10 text-white mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">{flight.aircraft_type}</p>
              <h1 className="text-4xl font-extrabold tracking-tighter font-headline">{flight.flight_number}</h1>
              <p className="text-indigo-300 mt-1">{flight.flight_name}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider ${flight.status === 'scheduled' ? 'bg-emerald-500/20 text-emerald-300' : flight.status === 'delayed' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
              {flight.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-8 md:gap-16">
            <div>
              <p className="text-4xl font-black tracking-tight">{new Date(flight.departure_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
              <p className="text-lg font-bold">{flight.origin_code}</p>
              <p className="text-sm opacity-60">{flight.origin}</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full h-[1px] bg-white/20 relative">
                <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-indigo-950 px-3">flight</span>
              </div>
              <p className="text-xs opacity-60">{flight.duration_minutes ? `${Math.floor(flight.duration_minutes / 60)}h ${flight.duration_minutes % 60}m` : 'Duration N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black tracking-tight">{new Date(flight.arrival_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
              <p className="text-lg font-bold">{flight.destination_code}</p>
              <p className="text-sm opacity-60">{flight.destination}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Departure', value: fmt(flight.departure_time), icon: 'schedule' },
            { label: 'Arrival', value: fmt(flight.arrival_time), icon: 'schedule' },
            { label: 'Seat Class', value: flight.seat_type.replace('_', ' '), icon: 'airline_seat_recline_extra' },
            { label: 'Available Seats', value: `${flight.available_seats} / ${flight.total_seats}`, icon: 'event_seat' },
            { label: 'Waitlisted', value: `${flight.waitlisted_count} passengers`, icon: 'group' },
            { label: 'Price per Seat', value: `₹${parseFloat(flight.price).toLocaleString()}`, icon: 'payments' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-xl p-6 shadow-sm">
              <span className="material-symbols-outlined text-primary mb-3 block">{icon}</span>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">{label}</p>
              <p className="font-bold text-indigo-950 capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* Occupancy Bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex justify-between mb-2">
            <p className="text-sm font-bold text-indigo-950">Seat Occupancy</p>
            <p className="text-sm font-bold text-primary">{occupancy}% full</p>
          </div>
          <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${occupancy > 80 ? 'bg-red-500' : occupancy > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${occupancy}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">{flight.available_seats} of {flight.total_seats} seats remaining</p>
        </div>

        {flight.status !== 'cancelled' && flight.status !== 'completed' && (
          <Link href={`/flights/${flight.id}/reserve`}
            className="block w-full text-center bg-gradient-to-r from-primary to-primary-container text-white py-5 rounded-xl font-bold text-lg tracking-tight hover:shadow-xl hover:shadow-[0_10px_40px_rgba(0,6,102,0.2)] transition-all">
            {flight.available_seats === 0 ? 'Join Waitlist' : 'Book This Flight'}
          </Link>
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
