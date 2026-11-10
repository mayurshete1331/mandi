import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Wheat, Store, ArrowRight, ShieldCheck, Truck, BookOpen, Layers, TrendingUp, UserPlus } from 'lucide-react';

export default async function HomePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('mandi_user_id')?.value;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'WHOLESALER') {
      redirect('/wholesaler');
    } else if (user?.role === 'KIRANA') {
      redirect('/retailer');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-600/30">
              🌾
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg block">
                MandiConnect
              </span>
              <span className="text-[11px] text-emerald-700 font-bold block">
                B2B Mandi to Kirana Network
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/register"
              className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Register</span>
            </Link>

            <Link
              href="/login"
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-bold mx-auto mb-5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          Direct Wholesale Mandi to Kirana Trading
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
          Wholesale Mandi Orders <br className="hidden sm:block" />
          <span className="text-emerald-700">Digitalized for Kirana Stores</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mb-8">
          Eliminate telephone ordering chaos. Experience the ultra-fast{' '}
          <strong>Mandi Matrix</strong> for staple commodities (Rice, Dal, Oil, Atta), live daily APMC rates,
          and automated Bahi-Khata ledger tracking.
        </p>

        {/* Action Cards for Both Personas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto w-full mb-12">
          <Link
            href="/login"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-105 transition-transform">
              🛒
            </div>
            <h2 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800">
              Kirana Retailer App
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              Mandi matrix quick order, live morning rates, 1-click repeat replenishment & bahi-khata.
            </p>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Enter Retailer Portal <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/login"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-lg mb-3 group-hover:scale-105 transition-transform">
              🏢
            </div>
            <h2 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800">
              Wholesaler Command Center
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              Fast stock inward, morning Mandi Bhav ticker, live dispatch pipeline & Kirana credit control.
            </p>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Enter Wholesaler Portal <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <Layers className="w-5 h-5 text-emerald-600 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 block">Mandi Matrix</span>
            <span className="text-[11px] text-slate-500">
              Rice & Dal types, cuts and bags in 1 tap
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <TrendingUp className="w-5 h-5 text-emerald-600 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 block">Daily Mandi Bhav</span>
            <span className="text-[11px] text-slate-500">Locked wholesale morning rates</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <BookOpen className="w-5 h-5 text-emerald-600 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 block">Bahi-Khata Ledger</span>
            <span className="text-[11px] text-slate-500">Real-time Udhaar limits & payments</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <Truck className="w-5 h-5 text-emerald-600 mb-1.5" />
            <span className="text-xs font-bold text-slate-900 block">Tempo Dispatch</span>
            <span className="text-[11px] text-slate-500">Live order & driver tracking</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-slate-200 text-xs text-slate-400">
        MandiConnect • B2B Wholesale Commodity Trading Network for Mandi Stockists & Kirana Stores
      </footer>
    </div>
  );
}
