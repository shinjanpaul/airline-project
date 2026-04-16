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

// ✅ FIX 1: SAFE PARAM HANDLING
const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
const id = Number(rawId);

const dateFromUrl = searchParams.get('date') || '';
const seatTypeFromUrl = searchParams.get('seat_type') || 'economy';

const [flight, setFlight] = useState<Flight | null>(null);
const [selectedSeat, setSelectedSeat] = useState('01A'); // safer default
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
console.log("PARAM ID:", params.id);


// ✅ FIX 2: TOKEN CHECK
if (!localStorage.getItem('token')) {
  router.push('/login');
  return;
}

// ✅ FIX 3: VALID ID CHECK
if (!id || isNaN(id)) {
  console.error("Invalid ID:", rawId);
  setError("Invalid flight ID");
  setLoading(false);
  return;
}

// ✅ FIX 4: SAFE API CALL
api.getFlight(id)
  .then((data) => {
    console.log("FLIGHT DATA:", data);
    setFlight(data);
  })
  .catch((err) => {
    console.error("API ERROR:", err);
    setError("Failed to load flight");
  })
  .finally(() => setLoading(false));


}, [params.id]);

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
  setError('Please select a travel date');
  return;
}

setSubmitting(true);
setError('');

const loaded = await loadRazorpay();
if (!loaded) {
  setError('Razorpay failed to load');
  setSubmitting(false);
  return;
}

const options = {
  key: 'rzp_test_RWsJwBCLRZC5IN',
  amount: Math.round(getSeatPrice() * form.seats_booked * 100),
  currency: 'INR',
  name: 'Shinjan Aero',
  description: `Flight ${flight.flight_number}`,
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
      setSuccess(`Ticket: ${res.ticket_number}`);
      setTimeout(() => router.push('/bookings'), 2000);
    } catch (err: any) {
      setError(err?.data?.error || 'Booking failed');
    }
    setSubmitting(false);
  }
};

const rzp = new (window as any).Razorpay(options);
rzp.open();


};

if (loading) {
return ( <div className="min-h-screen flex items-center justify-center">
Loading flight... </div>
);
}

if (error) {
return ( <div className="min-h-screen flex items-center justify-center text-red-500">
{error} </div>
);
}

if (!flight) return null;

return ( <div className="bg-surface min-h-screen"> <Navbar />


  <main className="pt-24 px-6 max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold mb-6">
      {flight.flight_number} ({flight.origin_code} → {flight.destination_code})
    </h1>

    <p className="mb-2"><b>Date:</b> {travelDate || 'Not selected'}</p>
    <p className="mb-2"><b>Seat:</b> {selectedSeat}</p>

    <button
      onClick={() => setSelectedSeat('01B')}
      className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
    >
      Select Seat
    </button>

    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <input
        type="date"
        value={travelDate}
        onChange={e => setTravelDate(e.target.value)}
        className="border p-2 w-full"
      />

      <input
        type="number"
        value={form.seats_booked}
        min={1}
        onChange={e => setForm({ ...form, seats_booked: Number(e.target.value) })}
        className="border p-2 w-full"
      />

      <button
        type="submit"
        disabled={submitting}
        className="bg-green-600 text-white px-6 py-3 rounded w-full"
      >
        {submitting ? 'Processing...' : 'Book Now'}
      </button>
    </form>
  </main>
</div>


);
}

export default function ReservePage() {
return (
<Suspense fallback={<div>Loading...</div>}> <ReservePageContent /> </Suspense>
);
}
