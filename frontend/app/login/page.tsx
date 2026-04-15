'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, saveAuth } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stayLogged, setStayLogged] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(form.username, form.password);
      saveAuth(data.token, data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as { data?: { error?: string } })?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero section ── */}
      <main
        className="relative flex-1 flex items-center justify-center px-6 py-20 overflow-hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1800&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-[#1e1b4b]/50 to-[#1e3a8a]/40 z-0" />

        <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row items-center gap-12">
          {/* Left copy */}
          <div className="w-full md:w-1/2 text-white space-y-6 md:pr-12">
            <span className="inline-block bg-white/10 backdrop-blur-md text-white px-5 py-2 rounded-full tracking-[0.4em] font-semibold text-sm uppercase border border-white/20">
              Shinjan Aero
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none">
              Elevated <br /> Perspective.
            </h1>
            <p className="text-slate-200 max-w-md leading-relaxed">
              Access your curated travel dashboard and manage your fleet with the precision of a professional.
            </p>
          </div>

          {/* Right card */}
          <div className="w-full md:w-1/2 max-w-md">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-10 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-[#1e1b4b]">Sign In</h2>
                <p className="text-slate-500 text-sm mt-1">Welcome back to the Aerial Gallery.</p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1e1b4b] tracking-wider uppercase">Username</label>
                  <input
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg focus:border-[#1e1b4b] focus:ring-1 focus:ring-[#1e1b4b] py-3 px-4 text-slate-800 placeholder:text-slate-400 transition-colors outline-none"
                    placeholder="e.g. pilot.skywalker"
                    type="text"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1e1b4b] tracking-wider uppercase">Password</label>
                  <input
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg focus:border-[#1e1b4b] focus:ring-1 focus:ring-[#1e1b4b] py-3 px-4 text-slate-800 placeholder:text-slate-400 transition-colors outline-none"
                    placeholder="••••••••"
                    type="password"
                    required
                  />
                </div>

                {/* Stay logged in / Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={stayLogged}
                      onChange={e => setStayLogged(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 accent-[#1e1b4b]"
                    />
                    Stay logged in
                  </label>
                  <button type="button" className="text-[#1e1b4b] font-semibold hover:underline underline-offset-4">
                    Forgot access?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e1b4b] hover:bg-[#312e81] text-white font-bold py-4 rounded-xl shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Continue to Fleet'}
                </button>
              </form>

              {/* OR AUTHORIZE VIA */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-semibold tracking-widest uppercase">Or Authorize Via</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Enterprise
                </button>
                <button className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                  </svg>
                  Passport
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-slate-500">
                New to the fleet?{' '}
                <Link href="/register" className="text-[#1e1b4b] font-bold hover:underline underline-offset-4">
                  Request Credentials
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
     
    </div>
  );
}