'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, saveAuth } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    password: '', phone: '', user_type: 'passenger'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.register(form);
      saveAuth(data.token, data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { data?: Record<string, string[]> };
      const msgs = Object.values(e?.data || {}).flat().join(', ');
      setError(msgs || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-[#1e1b4b] font-bold text-lg tracking-tight">Shinjan Aero</Link>
     <Link href="/login"
  className="bg-[#1e1b4b] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#312e81] transition-colors">
  Login
</Link>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ background: 'linear-gradient(135deg, #d4e9e2 0%, #c8dfe8 40%, #dde8d0 100%)' }}>

        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

            {/* Card header */}
            <div className="px-10 pt-10 pb-0">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#1e1b4b]">Create your account</h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#1e1b4b]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>

              {/* Step progress bars */}
           <div className="h-1 rounded-full bg-[#1e1b4b] mb-8" />
            </div>

            {/* Form body */}
            <div className="px-10 pb-10">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* First / Last name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-widest uppercase block mb-1">First Name</label>
                    <input
                      value={form.first_name}
                      onChange={e => setForm({ ...form, first_name: e.target.value })}
                      placeholder="Johnathan"
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-[#1e1b4b] focus:ring-1 focus:ring-[#1e1b4b] outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-widest uppercase block mb-1">Last Name</label>
                    <input
                      value={form.last_name}
                      onChange={e => setForm({ ...form, last_name: e.target.value })}
                      placeholder="Doe"
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-[#1e1b4b] focus:ring-1 focus:ring-[#1e1b4b] outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Username / Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-widest uppercase block mb-1">Username</label>
                    <input
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                      placeholder="jdoe_aero"
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-[#1e1b4b] focus:ring-1 focus:ring-[#1e1b4b] outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-widest uppercase block mb-1">Email Address</label>
                    <input
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="name@horizon.com"
                      type="email"
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-[#1e1b4b] focus:ring-1 focus:ring-[#1e1b4b] outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Phone / Password */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-widest uppercase block mb-1">Phone Number</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      type="tel"
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-[#1e1b4b] focus:ring-1 focus:ring-[#1e1b4b] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 tracking-widest uppercase block mb-1">Password</label>
                    <input
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      type="password"
                      className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-[#1e1b4b] focus:ring-1 focus:ring-[#1e1b4b] outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* I AM A... toggle buttons */}
                <div>
                  <label className="text-xs font-bold text-slate-500 tracking-widest uppercase block mb-3">I Am A...</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[['passenger', 'Passenger'], ['flight_official', 'Flight Official'], ['ministry_official', 'Ministry Official']].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm({ ...form, user_type: val })}
                        className={`py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                          form.user_type === val
                            ? 'border-[#1e1b4b] bg-[#1e1b4b]/5 text-[#1e1b4b]'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e1b4b] hover:bg-[#312e81] text-white font-bold py-4 rounded-xl shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 mt-2"
                >
                  {loading ? 'Creating Account...' : 'Join the Fleet'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="text-[#1e1b4b] font-bold hover:underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Bottom accent bar */}
            <div className="h-1 bg-gradient-to-r from-[#1e1b4b] via-[#3b82f6] to-[#06b6d4]" />
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-500 font-semibold tracking-widest uppercase">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secure Data
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Privacy First
            </span>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-100 px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-400">© 2024 Shinjan Aero. Member of the Horizon Alliance.</p>
        <div className="flex items-center gap-6 text-xs text-slate-500">
          {['Privacy Policy', 'Terms of Service', 'Cookies', 'Accessibility', 'Contact Us'].map(item => (
            <a key={item} href="#" className="hover:text-[#1e1b4b] transition-colors">{item}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}