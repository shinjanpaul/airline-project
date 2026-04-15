'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

interface ReportRow {
  flight__flight_number: string; flight__flight_name: string;
  flight__origin: string; flight__destination: string;
  flight__departure_time: string; flight__origin_code: string;
  flight__destination_code: string; total_reservations: number;
}
interface FlightStat {
  id: number; flight_number: string; origin_code: string; destination_code: string;
  status: string; available_seats: number; total_seats: number; price: string;
  departure_time: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [report, setReport] = useState<ReportRow[]>([]);
  const [flights, setFlights] = useState<FlightStat[]>([]);
  const [summary, setSummary] = useState({ total_revenue: 0, total_passengers: 0, active_flights: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    api.getReports().then(data => {
      setReport(data.report);
      setFlights(data.flight_stats);
      setSummary({ total_revenue: data.total_revenue, total_passengers: data.total_passengers, active_flights: data.active_flights });
    }).catch(err => {
      if (err?.status === 403) router.push('/dashboard');
      else router.push('/login');
    }).finally(() => setLoading(false));
  }, [router]);

  const statusBadge = (s: string) => ({
    scheduled: 'bg-indigo-100 text-indigo-700', boarding: 'bg-emerald-100 text-emerald-700',
    in_flight: 'bg-blue-100 text-blue-700', delayed: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700', completed: 'bg-slate-100 text-slate-500',
  }[s] || 'bg-slate-100 text-slate-500');

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><span className="material-symbols-outlined text-6xl text-primary animate-pulse">analytics</span></div>;

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />
      <main className="pt-24 pb-32 px-6 md:px-12 max-w-screen-xl mx-auto">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-tertiary-container mb-3 block">Analytics</span>
          <h1 className="text-5xl font-extrabold tracking-tighter text-primary font-headline">Flight Reports</h1>
          <p className="text-secondary mt-2">Reservations and performance data across all departures.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: 'payments', label: 'Total Revenue', value: `₹${parseFloat(String(summary.total_revenue)).toLocaleString()}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: 'groups', label: 'Total Passengers', value: summary.total_passengers.toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: 'flight', label: 'Active Flights', value: summary.active_flights, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          ].map(({ icon, label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-8 flex items-center gap-6`}>
              <span className={`material-symbols-outlined text-4xl ${color}`}>{icon}</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{label}</p>
                <p className="text-3xl font-bold text-indigo-950">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reservations Per Flight */}
        <section className="bg-surface-container-low rounded-xl overflow-hidden mb-12">
          <div className="px-8 py-6 flex justify-between items-center border-b border-white">
            <div>
              <h4 className="text-lg font-bold text-indigo-950 font-headline">Reservations Per Departure Date / Flight</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">Number of confirmed & waitlisted bookings per flight</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {report.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-4xl block mb-2">analytics</span>
                <p>No reservation data available yet</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left">
                    {['Flight', 'Route', 'Flight Name', 'Departure', 'Reservations'].map(h => (
                      <th key={h} className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {report.map((row, i) => (
                    <tr key={i} className="group hover:bg-white transition-colors cursor-pointer">
                      <td className="px-8 py-5"><span className="font-bold text-indigo-950">{row.flight__flight_number}</span></td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-700">{row.flight__origin_code}</span>
                          <span className="material-symbols-outlined text-slate-300 text-sm">trending_flat</span>
                          <span className="font-bold text-slate-700">{row.flight__destination_code}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-600">{row.flight__flight_name}</td>
                      <td className="px-8 py-5 text-sm text-slate-600">
                        {new Date(row.flight__departure_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((row.total_reservations / 20) * 100, 100)}%` }} />
                          </div>
                          <span className="font-bold text-indigo-950 text-sm">{row.total_reservations}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* All Flight Status Table */}
        <section className="bg-surface-container-low rounded-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white">
            <h4 className="text-lg font-bold text-indigo-950 font-headline">Active Flight Manifest</h4>
            <p className="text-xs text-slate-500 font-medium mt-1">Complete status of all scheduled flights</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Flight ID', 'Route', 'Departure', 'Status', 'Occupancy', 'Price'].map(h => (
                    <th key={h} className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {flights.map(f => {
                  const occ = Math.round(((f.total_seats - f.available_seats) / f.total_seats) * 100);
                  return (
                    <tr key={f.id} className="group hover:bg-white transition-colors">
                      <td className="px-8 py-5"><span className="font-bold text-indigo-950">{f.flight_number}</span></td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{f.origin_code}</span>
                          <span className="material-symbols-outlined text-slate-300 text-sm">trending_flat</span>
                          <span className="font-bold text-slate-700">{f.destination_code}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-600">
                        {new Date(f.departure_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} &nbsp;
                        {new Date(f.departure_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${statusBadge(f.status)}`}>
                          {f.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${occ > 80 ? 'bg-red-500' : occ > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${occ}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{occ}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-primary text-sm">₹{parseFloat(f.price).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
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
