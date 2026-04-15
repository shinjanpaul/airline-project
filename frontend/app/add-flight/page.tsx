'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api, getUser } from '@/lib/api';

export default function AddFlightPage() {
  const router = useRouter();
  const user = getUser();
  const [form, setForm] = useState({
    flight_number: '', flight_name: '', origin: '', origin_code: '',
    destination: '', destination_code: '', departure_time: '', arrival_time: '',
    status: 'scheduled', aircraft_type: 'Boeing 737',
    // Economy
    economy_seats: '50', economy_available: '50', economy_price: '3000',
    // Business
    business_seats: '20', business_available: '20', business_price: '8000',
    // First Class
    first_seats: '10', first_available: '10', first_price: '15000',
    // Premium Economy
    premium_economy_seats: '20', premium_economy_available: '20', premium_economy_price: '5000',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    const u = getUser();
    if (!u || (u.user_type !== 'flight_official' && u.user_type !== 'ministry_official')) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const payload = {
        flight_number: form.flight_number,
        flight_name: form.flight_name,
        origin: form.origin,
        origin_code: form.origin_code,
        destination: form.destination,
        destination_code: form.destination_code,
        departure_time: form.departure_time,
        arrival_time: form.arrival_time,
        status: form.status,
        aircraft_type: form.aircraft_type,
        // All seat class data
        economy_seats: parseInt(form.economy_seats),
        economy_available: parseInt(form.economy_available),
        economy_price: parseFloat(form.economy_price),
        business_seats: parseInt(form.business_seats),
        business_available: parseInt(form.business_available),
        business_price: parseFloat(form.business_price),
        first_seats: parseInt(form.first_seats),
        first_available: parseInt(form.first_available),
        first_price: parseFloat(form.first_price),
        premium_economy_seats: parseInt(form.premium_economy_seats),
        premium_economy_available: parseInt(form.premium_economy_available),
        premium_economy_price: parseFloat(form.premium_economy_price),
      };
      await api.createFlight(payload);
      setSuccess(`Flight ${form.flight_number} saved successfully!`);
      setTimeout(() => router.push('/flights'), 1500);
    } catch (err: unknown) {
      const e = err as { data?: Record<string, string[]> };
      const msgs = Object.values(e?.data || {}).flat().join(', ');
      setError(msgs || 'Failed to save flight.');
    } finally { setLoading(false); }
  };

  const Field = ({ label, name, type = 'text', placeholder = '', required = true }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) => (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">{label}</label>
      <input type={type} value={form[name as keyof typeof form]} placeholder={placeholder}
        onChange={e => setForm({ ...form, [name]: e.target.value })} required={required}
        className="w-full border-0 border-b-2 border-surface-container-high bg-transparent focus:border-primary focus:ring-0 py-2 text-sm text-on-surface placeholder:text-slate-300 outline-none transition-colors" />
    </div>
  );

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />
      <main className="pt-24 pb-32 px-6 md:px-12 max-w-4xl mx-auto">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-tertiary-container mb-3 block">Fleet Management</span>
          <h1 className="text-5xl font-extrabold tracking-tighter text-primary font-headline">Add / Update Flight</h1>
          <p className="text-secondary mt-2">Schedule a new flight or update an existing route by entering the same flight number.</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm">
          {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm">{error}</div>}
          {success && <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>{success}
          </div>}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Flight Identity */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-secondary mb-4 pb-2 border-b border-surface-container-low">Flight Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Flight Number" name="flight_number" placeholder="e.g. SJ-882" />
                <div className="md:col-span-2"><Field label="Flight Name" name="flight_name" placeholder="e.g. Dreamliner Express" /></div>
              </div>
              <div className="mt-4">
                <Field label="Aircraft Type" name="aircraft_type" placeholder="e.g. Boeing 787-9 Dreamliner" />
              </div>
            </div>

            {/* Route */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-secondary mb-4 pb-2 border-b border-surface-container-low">Route</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Origin City" name="origin" placeholder="e.g. Mumbai" />
                <Field label="Origin Code" name="origin_code" placeholder="e.g. BOM" />
                <Field label="Destination City" name="destination" placeholder="e.g. London" />
                <Field label="Destination Code" name="destination_code" placeholder="e.g. LHR" />
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-secondary mb-4 pb-2 border-b border-surface-container-low">Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Departure Date & Time" name="departure_time" type="datetime-local" />
                <Field label="Arrival Date & Time" name="arrival_time" type="datetime-local" />
              </div>
            </div>

            {/* Cabin Classes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Economy */}
              <div className="bg-surface-container-low p-4 rounded-lg">
                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Economy</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Total" name="economy_seats" type="number" />
                  <Field label="Available" name="economy_available" type="number" />
                  <Field label="Price (₹)" name="economy_price" type="number" />
                </div>
              </div>
              {/* Business */}
              <div className="bg-surface-container-low p-4 rounded-lg">
                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Business</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Total" name="business_seats" type="number" />
                  <Field label="Available" name="business_available" type="number" />
                  <Field label="Price (₹)" name="business_price" type="number" />
                </div>
              </div>
              {/* First Class */}
              <div className="bg-surface-container-low p-4 rounded-lg">
                <h4 className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-3">First Class</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Total" name="first_seats" type="number" />
                  <Field label="Available" name="first_available" type="number" />
                  <Field label="Price (₹)" name="first_price" type="number" />
                </div>
              </div>
              {/* Premium Economy */}
              <div className="bg-surface-container-low p-4 rounded-lg">
                <h4 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">Premium Economy</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Total" name="premium_economy_seats" type="number" />
                  <Field label="Available" name="premium_economy_available" type="number" />
                  <Field label="Price (₹)" name="premium_economy_price" type="number" />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Flight Status</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[['scheduled', 'Scheduled'], ['boarding', 'Boarding'], ['in_flight', 'In Flight'], ['delayed', 'Delayed'], ['cancelled', 'Cancelled'], ['completed', 'Completed']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setForm({ ...form, status: val })}
                    className={`p-3 rounded-lg text-xs font-bold text-center transition-all ${form.status === val ? 'bg-primary text-white' : 'bg-surface-container-low text-primary hover:bg-[#0006661a]'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-[0_10px_40px_rgba(0,6,102,0.2)] transition-all disabled:opacity-60 active:scale-[0.99]">
              {loading ? 'Saving Flight...' : 'Save Flight to Schedule'}
            </button>
          </form>
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
