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
  Wheat,
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

  // Role selector: 'KIRANA' | 'WHOLESALER'
  const [role, setRole] = useState<'KIRANA' | 'WHOLESALER'>('KIRANA');

  // Form fields
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');

  // Wholesaler selection with search (for Kirana)
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
    if (role !== 'KIRANA') return;

    const fetchWholesalers = async () => {
      setLoadingWholesalers(true);
      try {
        const res = await fetch(`/api/wholesalers?q=${encodeURIComponent(wholesalerSearch)}`);
        const data = await res.json();
        if (data.wholesalers) {
          setWholesalers(data.wholesalers);
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
  }, [wholesalerSearch, role, selectedWholesalerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !shopName || !phoneNumber || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (role === 'KIRANA' && wholesalers.length > 0 && !selectedWholesalerId) {
      setError('Please select a Mandi wholesaler for your store');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        shopName: shopName.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        address: address.trim(),
        role,
      };

      if (role === 'KIRANA' && selectedWholesalerId) {
        payload.wholesalerId = selectedWholesalerId;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete registration');
      }

      // If Wholesaler, account is instantly active -> redirect to Wholesaler Portal
      if (role === 'WHOLESALER') {
        router.push('/wholesaler');
        router.refresh();
        return;
      }

      // If Kirana, show confirmation screen
      setSuccessData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION SCREEN (FOR KIRANA)
  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/70 to-slate-100 flex flex-col justify-center px-4 py-8">
        <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
            Request Submitted
          </span>

          <h2 className="text-xl font-extrabold text-slate-900 mt-2 mb-2">
            Awaiting Wholesaler Approval
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            Your store request for <strong className="text-slate-900">{shopName}</strong> has been
            submitted to{' '}
            <strong className="text-emerald-700">{successData.wholesalerName || 'your Mandi wholesaler'}</strong>.
            <br />
            Once your merchant approves your store and sets your credit limit, you will be able to log
            in and place daily commodity orders!
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-left space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Registered Phone:</span>
              <span className="font-bold text-slate-800">{phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Selected Wholesaler:</span>
              <span className="font-bold text-emerald-800">{successData.wholesalerName || 'Pending'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Status:</span>
              <span className="font-bold text-amber-600">Pending Merchant Verification</span>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>Proceed to Login</span>
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
          <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white text-2xl shadow-lg shadow-emerald-600/30 mb-2">
            🌾
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Create MandiConnect Account
          </h1>
          <p className="text-xs text-slate-500">
            Join India&apos;s direct Mandi to Kirana wholesale trade network
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-7">
          {/* Persona / Role Selector Toggle */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setRole('KIRANA');
                setError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                role === 'KIRANA'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Kirana Retailer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('WHOLESALER');
                setError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                role === 'WHOLESALER'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Mandi Wholesaler</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Business / Firm Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'WHOLESALER' ? 'Wholesale Firm / Godown Name' : 'Kirana Store Name'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  {role === 'WHOLESALER' ? <Building2 className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={
                    role === 'WHOLESALER'
                      ? 'e.g. Balaji Grain Traders'
                      : 'e.g. Mahalaxmi Super Market'
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Owner / Contact Person Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'WHOLESALER' ? 'Proprietor / Manager Name' : 'Store Owner Name'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
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
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="10-digit mobile"
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
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'WHOLESALER'
                  ? 'APMC Mandi / Godown Address'
                  : 'Store Location / Delivery Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={
                    role === 'WHOLESALER'
                      ? 'e.g. Shop 42, Dana Bazar, APMC Mandi'
                      : 'e.g. Station Road, Near Shivaji Chowk'
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* WHOLESALER SELECTION (ONLY FOR KIRANA) */}
            {role === 'KIRANA' && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Select Your Mandi Wholesaler</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Verification Required
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Select the APMC stockist from whom you buy bulk commodities.
                </p>

                {wholesalers.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <p className="font-bold mb-1">No Mandi Wholesalers Found</p>
                    <p className="text-[11px] text-amber-800">
                      If you are a wholesale dealer, click the <strong>&quot;Mandi Wholesaler&quot;</strong> tab
                      above to register your godown first!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Search Bar */}
                    <div className="relative mb-2">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <Search className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={wholesalerSearch}
                        onChange={(e) => setWholesalerSearch(e.target.value)}
                        placeholder="Search wholesaler name or mandi..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Radio Cards */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {wholesalers.map((ws) => {
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
                              <span className="text-[10px] text-slate-500 block truncate max-w-[240px]">
                                {ws.address}
                              </span>
                            </div>

                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 mt-4"
            >
              {submitting
                ? 'Creating Account...'
                : role === 'WHOLESALER'
                ? 'Register Wholesale Firm & Enter Godown'
                : 'Submit Store Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Already have account */}
          <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-700 font-bold hover:underline">
              Sign In to Portal
            </Link>
          </div>
        </div>

        <div className="text-center mt-5 text-xs text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Secured • MandiConnect Business Network</span>
        </div>
      </div>
    </div>
  );
}
