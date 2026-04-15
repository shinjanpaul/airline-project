'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

export default function CancelPage() {
  const router = useRouter();
  const [form, setForm] = useState({ ticket_number: '', credit_card_number: '', bank_name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.cancelTicket(form);
      setSuccess(res.message || 'Ticket cancelled successfully.');
      setForm({ ticket_number: '', credit_card_number: '', bank_name: '' });
    } catch (err: unknown) {
      setError((err as { data?: { error?: string } })?.data?.error || 'Cancellation failed. Please check your details.');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />
      <main className="pt-24 pb-32 px-6 md:px-12 max-w-2xl mx-auto">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-on-tertiary-container mb-3 block">Booking Management</span>
          <h1 className="text-5xl font-extrabold tracking-tighter text-primary font-headline">Cancel Ticket</h1>
          <p className="text-secondary mt-2">Enter your booking details to cancel your reservation.</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
          {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">error</span>{error}
          </div>}
          {success && <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg text-emerald-700 text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-sm mt-0.5">check_circle</span>{success}
          </div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Ticket Number</label>
              <div className="flex items-center gap-3 border-b-2 border-surface-container-high focus-within:border-primary transition-colors pb-2">
                <span className="material-symbols-outlined text-slate-400 text-sm">confirmation_number</span>
                <input value={form.ticket_number} onChange={e => setForm({ ...form, ticket_number: e.target.value })}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-on-surface placeholder:text-slate-300 outline-none"
                  placeholder="e.g. TKT12345678" required />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Credit Card Number</label>
              <div className="flex items-center gap-3 border-b-2 border-surface-container-high focus-within:border-primary transition-colors pb-2">
                <span className="material-symbols-outlined text-slate-400 text-sm">credit_card</span>
                <input value={form.credit_card_number} onChange={e => setForm({ ...form, credit_card_number: e.target.value })}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-on-surface placeholder:text-slate-300 outline-none"
                  placeholder="XXXX-XXXX-XXXX-XXXX" required />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Bank Name</label>
              <div className="flex items-center gap-3 border-b-2 border-surface-container-high focus-within:border-primary transition-colors pb-2">
                <span className="material-symbols-outlined text-slate-400 text-sm">account_balance</span>
                <input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })}
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-on-surface placeholder:text-slate-300 outline-none"
                  placeholder="e.g. SBI, HDFC, ICICI" required />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-xl transition-all disabled:opacity-60 active:scale-95">
              {loading ? 'Processing...' : 'Cancel Reservation'}
            </button>
          </form>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-surface-container-low rounded-xl flex gap-3">
            <span className="material-symbols-outlined text-on-tertiary-container mt-0.5">info</span>
            <div>
              <p className="text-sm font-bold text-primary mb-1">Waitlist Promotion</p>
              <p className="text-xs text-slate-500">When you cancel a confirmed seat, the first person on the waitlist is automatically confirmed.</p>
            </div>
          </div>
          <div className="p-5 bg-surface-container-low rounded-xl flex gap-3">
            <span className="material-symbols-outlined text-amber-500 mt-0.5">schedule</span>
            <div>
              <p className="text-sm font-bold text-primary mb-1">Refund Policy</p>
              <p className="text-xs text-slate-500">Free cancellation within 24 hours. Standard refund processing takes 5–7 business days.</p>
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
