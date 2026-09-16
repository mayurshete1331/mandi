'use client';

import React from 'react';
import { Store, LogOut, Phone, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NavbarProps {
  user: {
    id: string;
    name: string;
    role: 'WHOLESALER' | 'KIRANA';
    shopName?: string | null;
    phoneNumber: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    document.cookie = 'mandi_user_id=; path=/; max-age=0;';
    router.push('/login');
    router.refresh();
  };

  const dashboardHref = user ? (user.role === 'WHOLESALER' ? '/wholesaler' : '/retailer') : '/dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href={dashboardHref} className="flex items-center gap-3 group transition-transform active:scale-95">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg group-hover:text-emerald-800 transition-colors">
                MandiConnect
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                {user?.role === 'WHOLESALER' ? 'WHOLESALER' : 'KIRANA'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[190px] sm:max-w-xs">
              {user?.shopName || user?.name}
            </p>
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={dashboardHref}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">{user.name}</span>
              <span className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                {user.phoneNumber}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
