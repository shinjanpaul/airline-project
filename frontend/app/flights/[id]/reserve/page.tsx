'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api, getUser } from '@/lib/api';

interface Flight {
  id: number; flight_number: string; flight_name: string;
  origin: string; origin_code: string; destination: string; destination_code: string;
  departure_time: string; arrival_time: string; seat_type: string;
  available_seats: number; price: string; status: string; aircraft_type: string; duration_minutes: number;
  economy_seats: number; economy_available: number; economy_price: string;
  business_seats: number; business_available: number; business_price: string;
  first_seats: number; first_available: number; first_price: string;
  premium_economy_seats: number; premium_economy_available: number; premium_economy_price: string;
}

const SEAT_GRID = ['A', 'B', '', '', 'E', 'F'];

const loadRazorpay = () => {
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function ReservePageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const user = getUser();

  const dateFromUrl = searchParams.get('date') || '';
  const seatTypeFromUrl = searchParams.get('seat_type') || 'economy';

  const [flight, setFlight] = useState<Flight | null>(null);
  const [selectedSeat, setSelectedSeat] = useState('01E');
  const [travelDate, setTravelDate] = useState(dateFromUrl);
  const [form, setForm] = useState({
    seats_booked: 1,
    credit_card_number: '',
    bank_name: '',
    seat_type: seatTypeFromUrl,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    const id = Number(params.id);
    if (!id || isNaN(id)) { router.push('/flights'); return; }
    api.getFlight(id).then(setFlight).catch(() => router.push('/flights')).finally(() => setLoading(false));
  }, [params.id, router]);

  const getSeatPrice = () => {
    if (!flight) return 0;
    const map: Record<string, string> = {
      economy: flight.economy_price,
      business: flight.business_price,
      first: flight.first_price,
      premium_economy: flight.premium_economy_price,
    };
    return parseFloat(map[form.seat_type] || flight.price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flight) return;

    if (!travelDate) {
      setError('Please select a travel date before booking.');
      return;
    }

    console.log('DEBUG handleSubmit - travelDate:', travelDate);

    // Waitlist
    if (flight.available_seats === 0) {
      setSubmitting(true);
      try {
        const res = await api.createReservation({
          flight: flight.id,
          seats_booked: form.seats_booked,
          credit_card_number: form.credit_card_number || 'WAITLIST',
          bank_name: form.bank_name || 'N/A',
          seat_number: selectedSeat,
          seat_type: form.seat_type,
          travel_date: travelDate,
        });
        setSuccess(`Added to waitlist! Ticket: ${res.ticket_number}`);
        setTimeout(() => router.push('/bookings'), 2000);
      } catch (err: unknown) {
        setError((err as { data?: { error?: string } })?.data?.error || 'Failed. Please try again.');
      } finally { setSubmitting(false); }
      return;
    }

    setSubmitting(true);
    setError('');

    const loaded = await loadRazorpay();
    if (!loaded) {
      setError('Razorpay failed to load. Check your internet connection.');
      setSubmitting(false);
      return;
    }

    const options = {
      key: 'rzp_test_RWsJwBCLRZC5IN',
      amount: Math.round(getSeatPrice() * form.seats_booked * 100),
      currency: 'INR',
      name: 'Shinjan Aero',
      description: `Flight ${flight.flight_number} · ${flight.origin_code} → ${flight.destination_code} · ${travelDate}`,
      handler: async function () {
        try {
          const res = await api.createReservation({
            flight: flight.id,
            seats_booked: form.seats_booked,
            credit_card_number: form.credit_card_number || 'RAZORPAY',
            bank_name: form.bank_name || 'Razorpay',
            seat_number: selectedSeat,
            seat_type: form.seat_type,
            travel_date: travelDate,
          });
          setSuccess(`Payment successful! Ticket: ${res.ticket_number}`);
          setTimeout(() => router.push('/bookings'), 2000);
        } catch (err: unknown) {
          setError((err as { data?: { error?: string } })?.data?.error || 'Booking failed after payment.');
        }
        setSubmitting(false);
      },
      prefill: {
        name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || String(user?.username || ''),
        email: String(user?.email || ''),
      },
      theme: { color: '#1e1b4b' },
      modal: {
        ondismiss: function () {
          setError('Payment cancelled.');
          setSubmitting(false);
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const formatTime = (dt: string) => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDuration = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
  const totalPrice = flight ? getSeatPrice() * form.seats_booked : 0;

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <span className="material-symbols-outlined text-6xl text-primary animate-pulse">flight</span>
    </div>
  );
  if (!flight) return null;

  const seatRows = [
    { row: '01', booked: [false, true, false, false] },
    { row: '02', booked: [false, false, false, true] },
    { row: '14', booked: [false, false, false, false] },
    { row: '15', booked: [true, false, false, false] },
    { row: '16', booked: [false, false, true, false] },
  ];

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />
      <main className="pt-24 pb-32 px-6 md:px-12 max-w-[1440px] mx-auto">
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-3 block">Booking Flow</span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary leading-tight font-headline">
                Configure Your <br /> Sky Sanctuary
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm font-semibold flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg">
                <span className="material-symbols-outlined text-primary text-lg">flight_takeoff</span>
                <span>{flight.flight_number}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg">
                <span className="material-symbols-outlined text-primary text-lg">route</span>
                <span>{flight.origin_code} → {flight.destination_code}</span>
              </div>
              {travelDate && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">calendar_today</span>
                  <span className="text-emerald-700">{new Date(travelDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Seat Map */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-surface-container-low rounded-xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex justify-center overflow-hidden">
                <span className="material-symbols-outlined" style={{ fontSize: '500px' }}>flight</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold font-headline text-primary">{flight.aircraft_type}</h2>
                  <div className="flex gap-4">
                    {[['bg-primary', 'Selected'], ['bg-surface-container-highest', 'Available'], ['bg-[#c6c5d44d]', 'Booked']].map(([bg, label]) => (
                      <div key={label} className="flex items-center gap-2 text-xs">
                        <div className={`w-3 h-3 ${bg} rounded-sm`} />
                        <span className="text-on-surface-variant">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="grid grid-cols-8 gap-2 max-w-sm mx-auto">
                    <div />
                    {['A', 'B', '', '', 'E', 'F', ''].map((col, i) => (
                      <div key={i} className="text-center text-[10px] font-bold text-slate-400">{col}</div>
                    ))}
                    <div className="col-span-8 flex justify-center py-2">
                      <span className="text-[9px] uppercase tracking-widest text-on-tertiary-container font-bold">Business Class Gallery</span>
                    </div>
                    {seatRows.slice(0, 2).map(({ row, booked }) => (
                      <React.Fragment key={row}>
                        <div className="text-center self-center text-xs text-slate-400 font-bold">{row}</div>
                        {[0, 1].map(i => {
                          const seatId = `${row}${SEAT_GRID[i]}`;
                          const isSelected = (selectedSeat || '') === seatId;
                          const isBooked = booked[i];
                          return (
                            <button key={seatId} disabled={isBooked} onClick={() => !isBooked && setSelectedSeat(seatId)}
                              className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${isBooked ? 'bg-[#c6c5d433] cursor-not-allowed' : isSelected ? 'bg-primary shadow-lg scale-110 ring-2 ring-white ring-offset-1' : 'bg-surface-container-highest hover:bg-white'}`}>
                              <span className={`material-symbols-outlined text-sm ${isBooked ? 'text-slate-300' : isSelected ? 'text-white' : 'text-primary/40'}`}
                                style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}>
                                {isBooked ? 'close' : 'chair'}
                              </span>
                            </button>
                          );
                        })}
                        <div className="col-span-2 self-center"><div className="h-px w-full bg-slate-100" /></div>
                        {[2, 3].map(i => {
                          const cols = ['A', 'B', 'E', 'F'];
                          const seatId = `${row}${cols[i]}`;
                          const isSelected = selectedSeat === seatId;
                          const isBooked = booked[i];
                          return (
                            <button key={seatId} disabled={isBooked} onClick={() => !isBooked && setSelectedSeat(seatId)}
                              className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${isBooked ? 'bg-[#c6c5d433] cursor-not-allowed' : isSelected ? 'bg-primary shadow-lg scale-110 ring-2 ring-white ring-offset-1' : 'bg-surface-container-highest hover:bg-white'}`}>
                              <span className={`material-symbols-outlined text-sm ${isBooked ? 'text-slate-300' : isSelected ? 'text-white' : 'text-primary/40'}`}>
                                {isBooked ? 'close' : 'chair'}
                              </span>
                            </button>
                          );
                        })}
                        <div />
                      </React.Fragment>
                    ))}
                    <div className="col-span-8 h-6" />
                    <div className="col-span-8 flex justify-center py-2">
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Economy Class</span>
                    </div>
                    {seatRows.slice(2).map(({ row, booked }) => (
                      <React.Fragment key={row}>
                        <div className="text-center self-center text-xs text-slate-400 font-bold">{row}</div>
                        {[0, 1, 2, 3].map((i, idx) => {
                          if (idx === 2) return <div key="gap" className="col-span-2 self-center"><div className="h-px w-full bg-slate-100" /></div>;
                          const seatId = `${row}${['A', 'B', 'E', 'F'][i]}`;
                          const isSelected = selectedSeat === seatId;
                          const isBooked = booked[i];
                          return (
                            <button key={seatId} disabled={isBooked} onClick={() => !isBooked && setSelectedSeat(seatId)}
                              className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${isBooked ? 'bg-[#c6c5d433] cursor-not-allowed' : isSelected ? 'bg-primary shadow-lg scale-110 ring-2 ring-white' : 'bg-surface-container-highest hover:bg-white'}`}>
                              <span className={`material-symbols-outlined text-xs ${isBooked ? 'text-slate-300' : isSelected ? 'text-white' : 'text-primary/40'}`}>
                                {isBooked ? 'close' : 'chair_alt'}
                              </span>
                            </button>
                          );
                        })}
                        <div />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: 'restaurant', title: 'Artisan Dining', desc: 'Curated menus with multiple dietary options.' },
                { icon: 'wifi', title: 'Sky-Link WiFi', desc: 'High-speed connectivity throughout your flight.' },
              ].map(({ icon, title, desc }) => (
                <div key={icon} className="p-6 bg-surface-container rounded-xl">
                  <span className="material-symbols-outlined text-on-tertiary-container mb-4 block">{icon}</span>
                  <h4 className="font-bold text-primary mb-2">{title}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-5 sticky top-24 space-y-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-lg font-bold font-headline text-primary mb-6">Passenger Details</h3>
              {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm">{error}</div>}
              {success && <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-700 text-sm">{success}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">First Name</label>
                    <input defaultValue={String(user?.first_name || '')} className="w-full border-0 border-b-2 border-surface-container-high bg-transparent focus:ring-0 focus:border-primary text-sm py-2 outline-none" type="text" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Last Name</label>
                    <input defaultValue={String(user?.last_name || '')} className="w-full border-0 border-b-2 border-surface-container-high bg-transparent focus:ring-0 focus:border-primary text-sm py-2 outline-none" type="text" />
                  </div>
                </div>

                {/* Travel Date — required */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                    Travel Date <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={travelDate}
                    onChange={e => setTravelDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className={`w-full border-0 border-b-2 ${!travelDate ? 'border-red-300' : 'border-surface-container-high'} bg-transparent focus:ring-0 focus:border-primary text-sm py-2 outline-none`} />
                  {!travelDate && <p className="text-xs text-red-500 mt-1">⚠ Please select your travel date</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Number of Seats</label>
                  <input type="number" min={1} max={flight.available_seats || 1} value={form.seats_booked}
                    onChange={e => setForm({ ...form, seats_booked: parseInt(e.target.value) || 1 })}
                    className="w-full border-0 border-b-2 border-surface-container-high bg-transparent focus:ring-0 focus:border-primary text-sm py-2 outline-none" />
                </div>

                {/* Seat Class Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Seat Class</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['economy', 'Economy', flight.economy_available, flight.economy_price],
                      ['business', 'Business', flight.business_available, flight.business_price],
                      ['first', 'First Class', flight.first_available, flight.first_price],
                      ['premium_economy', 'Premium Eco', flight.premium_economy_available, flight.premium_economy_price],
                    ] as [string, string, number, string][]).map(([val, label, avail, price]) => (
                      <button key={val} type="button"
                        onClick={() => setForm({ ...form, seat_type: val })}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${form.seat_type === val ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                        <p className="text-xs font-bold text-primary">{label}</p>
                        <p className="text-[10px] text-slate-400">
                          {avail} left · ₹{parseFloat(price).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Credit Card (for cancellation)</label>
                  <input type="text" value={form.credit_card_number}
                    onChange={e => setForm({ ...form, credit_card_number: e.target.value })}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="w-full border-0 border-b-2 border-surface-container-high bg-transparent focus:ring-0 focus:border-primary text-sm py-2 outline-none placeholder:text-slate-300" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Bank Name (for cancellation)</label>
                  <input type="text" value={form.bank_name}
                    onChange={e => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="e.g. SBI, HDFC, ICICI"
                    className="w-full border-0 border-b-2 border-surface-container-high bg-transparent focus:ring-0 focus:border-primary text-sm py-2 outline-none placeholder:text-slate-300" />
                </div>

                {/* Boarding Pass Summary */}
                <div className="glass-boarding-pass rounded-xl p-6 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Seat</p>
                      <p className="text-3xl font-extrabold font-headline text-primary">{selectedSeat}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Class</p>
                      <p className="text-base font-bold text-on-tertiary-container capitalize">{form.seat_type.replace('_', ' ')}</p>
                      {travelDate && <p className="text-xs text-slate-500 mt-1">{new Date(travelDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-y border-[#c6c5d41a] mb-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500">{flight.origin_code}</p>
                      <p className="text-lg font-bold text-primary">{formatTime(flight.departure_time)}</p>
                    </div>
                    <div className="flex-1 px-4 flex flex-col items-center">
                      <div className="w-full h-[1px] bg-[#c6c5d44d] relative">
                        <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-primary">flight</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2">{flight.duration_minutes ? formatDuration(flight.duration_minutes) : '—'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500">{flight.destination_code}</p>
                      <p className="text-lg font-bold text-primary">{formatTime(flight.arrival_time)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">Base Fare × {form.seats_booked}</span>
                      <span className="font-bold text-primary">₹{(getSeatPrice() * form.seats_booked).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg pt-3 border-t border-[#c6c5d41a]">
                      <span className="font-bold text-primary">Total</span>
                      <span className="font-extrabold text-primary">₹{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <button type="submit" disabled={submitting || flight.status === 'cancelled' || !travelDate}
                    className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-lg font-bold uppercase tracking-widest text-xs hover:shadow-xl transition-all disabled:opacity-60 active:scale-95 flex items-center justify-center gap-2">
                    {submitting ? 'Processing...' :
                     !travelDate ? '📅 Select Travel Date First' :
                     flight.available_seats === 0 ? 'Join Waitlist' :
                     `Pay ₹${totalPrice.toLocaleString()} with Razorpay`}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Secured by Razorpay · Test Mode
                </div>
              </form>
            </div>
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

export default function ReservePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined text-6xl text-primary animate-pulse">flight</span>
      </div>
    }>
      <ReservePageContent />
    </Suspense>
  );
}
//
