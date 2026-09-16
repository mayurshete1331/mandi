'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  Building2,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Phone,
  Lock,
  MapPin,
  User,
  ShieldCheck,
} from 'lucide-react';

interface Wholesaler {
  id: string;
  name: string;
  shopName: string;
  address: string;
  phoneNumber: string;
}

export default function RegisterPage() {
  const router = useRouter();

  // Form fields
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');

  // Wholesaler selection with search
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [wholesalerSearch, setWholesalerSearch] = useState('');
  const [selectedWholesalerId, setSelectedWholesalerId] = useState<string>('');
  const [loadingWholesalers, setLoadingWholesalers] = useState(false);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  // Fetch wholesalers with live search
  useEffect(() => {
    const fetchWholesalers = async () => {
      setLoadingWholesalers(true);
      try {
        const res = await fetch(`/api/wholesalers?q=${encodeURIComponent(wholesalerSearch)}`);
        const data = await res.json();
        if (data.wholesalers) {
          setWholesalers(data.wholesalers);
          // Pre-select first if none selected
          if (!selectedWholesalerId && data.wholesalers.length > 0) {
            setSelectedWholesalerId(data.wholesalers[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingWholesalers(false);
      }
    };

    const timer = setTimeout(fetchWholesalers, 200);
    return () => clearTimeout(timer);
  }, [wholesalerSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !shopName || !phoneNumber || !password || !selectedWholesalerId) {
      setError('Please fill all fields and select your primary wholesaler');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          shopName,
          phoneNumber,
          password,
          address,
          wholesalerId: selectedWholesalerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration request');
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/70 to-slate-100 flex flex-col justify-center px-4 py-8">
        <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
            Approval Request Sent
          </span>

          <h2 className="text-xl font-extrabold text-slate-900 mt-2 mb-2">
            Waiting for Wholesaler Activation
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            Your store request for <strong className="text-slate-900">{shopName}</strong> has been
            submitted to{' '}
            <strong className="text-emerald-700">{successData.wholesalerName}</strong>.
            <br className="hidden sm:block" />
            Once they verify your shop and set your purchasing credit limit, you will be able to log
            in and order commodities!
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-left space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Registered Phone:</span>
              <span className="font-bold text-slate-800">{phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Selected Wholesaler:</span>
              <span className="font-bold text-emerald-800">{successData.wholesalerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Status:</span>
              <span className="font-bold text-amber-600">PENDING APPROVAL</span>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>Back to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-slate-100 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white text-2xl shadow-lg shadow-emerald-600/30 mb-2">
            🌾
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Register Kirana Store
          </h1>
          <p className="text-xs text-slate-500">
            Request ordering & Mandi credit access from your wholesale dealer
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-7">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Shop Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kirana Shop Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Enter Kirana shop name"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter owner full name"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Mobile & Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Create Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Shop Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shop Location / Market Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter shop address / market location"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* SEARCHABLE WHOLESALER DIRECTORY (USER REQUIREMENT) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Select Your Primary Mandi Wholesaler</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  Approval Required
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Your request will be sent to this wholesaler for activation and credit limit.
              </p>

              {/* Search Bar for Wholesalers */}
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={wholesalerSearch}
                  onChange={(e) => setWholesalerSearch(e.target.value)}
                  placeholder="Search wholesaler by name or mandi..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Wholesalers Radio Cards List */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {wholesalers.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    {loadingWholesalers ? 'Searching wholesalers...' : 'No wholesalers match search.'}
                  </div>
                ) : (
                  wholesalers.map((ws) => {
                    const isSelected = selectedWholesalerId === ws.id;
                    return (
                      <div
                        key={ws.id}
                        onClick={() => setSelectedWholesalerId(ws.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{ws.shopName || ws.name}</span>
                            <span className="text-[10px] font-normal text-slate-500">
                              ({ws.name})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">{ws.address}</span>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 mt-4"
            >
              {submitting ? 'Submitting Request...' : 'Submit Request to Wholesaler'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Already have account */}
          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Already have an approved store?{' '}
            <Link href="/login" className="text-emerald-700 font-bold hover:underline">
              Sign In here
            </Link>
          </div>
        </div>

        <div className="text-center mt-5 text-xs text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Access gated by Wholesaler verification</span>
        </div>
      </div>
    </div>
  );
}
