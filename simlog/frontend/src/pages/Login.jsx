import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) navigate('/dashboard');
  }

  return (
    <div className="min-h-screen flex bg-base-app">
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden border-r border-slate-200 bg-[#12232C] text-slate-200">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(31,111,95,0.28),transparent_60%,rgba(15,23,42,0.1))]" />
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-12">
          <div className="flex items-center gap-3">
            <img src="/logo-hw-unimus.png" alt="Logo HW UNIMUS" className="h-11 w-11 rounded-2xl border border-white/20 bg-white/5 object-cover p-1" />
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">HW UNIMUS</p>
              <p className="text-lg font-semibold text-white">Bidang Logistik</p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="text-3xl xl:text-4xl font-bold leading-tight text-white">
              Pengelolahan Sistem operasional logistik
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-400">
            <span>Bidang Logistik</span>
            <span>Hak akses terkelola</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white/90 p-7 shadow-card backdrop-blur-sm sm:p-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-7">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Radio size={18} />
            </div>
            <span className="font-bold text-slate-900">SIM Logistik HW UNIMUS</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Masuk ke sistem</h1>
          <p className="mt-1 text-sm text-slate-500">Gunakan akun yang diberikan oleh Admin Logistik.</p>

          {error && (
            <div className="mt-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-brand focus:bg-white focus:outline-none"
                placeholder="mis. admin"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-brand focus:bg-white focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.75 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
