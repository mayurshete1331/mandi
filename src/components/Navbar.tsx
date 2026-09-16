'use client';

import React from 'react';
import { Store, LogOut, Phone, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
            🌾
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
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
        </div>

        {user && (
          <div className="flex items-center gap-2">
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
