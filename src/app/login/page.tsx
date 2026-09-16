'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Phone, Lock, Clock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const handleLogin = async (phone: string, pass: string) => {
    setError('');
    setPendingNotice(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, password: pass }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.pendingApproval) {
          setPendingNotice(data.error);
          return;
        }
        throw new Error(data.error || 'Failed to login');
      }

      // Route based on real database role
      if (data.user.role === 'WHOLESALER') {
        router.push('/wholesaler');
      } else {
        router.push('/retailer');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !password) {
      setError('Please fill in both phone and password');
      return;
    }
    handleLogin(phoneNumber, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-slate-100 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white text-3xl shadow-lg shadow-emerald-600/30 mb-3">
            🌾
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            MandiConnect B2B
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Direct Mandi Wholesaler to Kirana Store Order & Khata System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Sign In to Your Account</h2>
          <p className="text-xs text-slate-500 mb-5">Enter your registered mobile number and password</p>

          {/* Pending Approval Notice Banner */}
          {pendingNotice && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold block text-amber-950 mb-0.5">Approval Pending</strong>
                <span>{pendingNotice}</span>
              </div>
            </div>
          )}

          {error && !pendingNotice && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={submitForm} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* New Kirana Registration Link */}
          <div className="mt-5 text-center text-xs text-slate-600 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
            <span>New Kirana Store? </span>
            <Link href="/register" className="text-emerald-700 font-extrabold hover:underline">
              Register & Request Wholesaler Access ➔
            </Link>
          </div>

        </div>

        {/* Security / Info footer */}
        <div className="text-center mt-5 text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Connected to Live MySQL Database (mandi_db)</span>
        </div>
      </div>
    </div>
  );
}
