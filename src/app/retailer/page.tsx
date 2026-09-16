'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Wheat,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  CreditCard,
  AlertCircle,
  X,
  ArrowRight,
  TrendingUp,
  Building2,
  Store,
  Phone,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';

interface SKU {
  id: string;
  brand: string;
  packagingType: string;
  weightKg: number;
  currentStock: number;
  purchaseCost: number;
  sellingPrice: number;
}

interface Variety {
  id: string;
  name: string;
  subType?: string | null;
  skus: SKU[];
}

interface Category {
  id: string;
  name: string;
  icon?: string | null;
  varieties: Variety[];
}

interface CartItem {
  sku: SKU;
  varietyName: string;
  quantity: number;
}

export default function RetailerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedWholesalerId, setSelectedWholesalerId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'order' | 'repeat' | 'tracking' | 'khata'>('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [expandedVarieties, setExpandedVarieties] = useState<Record<string, boolean>>({});

  // Cart state: skuId -> CartItem
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CREDIT' | 'COD' | 'UPI'>('CREDIT');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Orders & Khata state
  const [orders, setOrders] = useState<any[]>([]);
  const [khata, setKhata] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  // Active connected wholesaler details
  const activeConnection = useMemo(() => {
    if (!user?.wholesalerConnections) return null;
    return (
      user.wholesalerConnections.find(
        (c: any) => c.wholesaler?.id === selectedWholesalerId || c.wholesalerId === selectedWholesalerId
      ) || user.wholesalerConnections[0] || null
    );
  }, [user, selectedWholesalerId]);

  // Load User, Commodities, Orders, Khata for selected wholesaler
  const refreshAllData = async (userId: string, wsId?: string) => {
    try {
      const activeWsId = wsId || selectedWholesalerId;

      // 1. Commodities for chosen wholesaler
      const commUrl = activeWsId ? `/api/commodities?wholesalerId=${activeWsId}` : '/api/commodities';
      const commRes = await fetch(commUrl);
      const commData = await commRes.json();
      if (commData.categories) {
        setCategories(commData.categories);
        // Expand first category varieties by default
        const initExpanded: Record<string, boolean> = {};
        if (commData.categories[0]?.varieties) {
          commData.categories[0].varieties.forEach((v: Variety) => {
            initExpanded[v.id] = true;
          });
        }
        setExpandedVarieties(initExpanded);
      }

      // 2. Orders for chosen wholesaler
      const orderUrl = activeWsId
        ? `/api/orders?userId=${userId}&wholesalerId=${activeWsId}`
        : `/api/orders?userId=${userId}`;
      const orderRes = await fetch(orderUrl);
      const orderData = await orderRes.json();
      if (orderData.orders) {
        setOrders(orderData.orders);
      }

      // 3. Khata for chosen wholesaler
      const khataUrl = activeWsId
        ? `/api/khata?userId=${userId}&wholesalerId=${activeWsId}`
        : `/api/khata?userId=${userId}`;
      const khataRes = await fetch(khataUrl);
      const khataData = await khataRes.json();
      if (!khataData.error) {
        setKhata(khataData);
      }
    } catch (err) {
      console.error('Data load error:', err);
    }
  };

  const handleWholesalerChange = (newWholesalerId: string) => {
    if (Object.keys(cart).length > 0) {
      const confirmSwitch = window.confirm(
        'Switching Mandi suppliers will clear your current cart. Do you want to proceed?'
      );
      if (!confirmSwitch) return;
      setCart({});
    }
    setSelectedWholesalerId(newWholesalerId);
    if (user?.id) {
      refreshAllData(user.id, newWholesalerId);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.user.role === 'KIRANA') {
          setUser(data.user);
          const firstWs = data.user.wholesalerConnections?.[0]?.wholesaler?.id || '';
          setSelectedWholesalerId(firstWs);
          refreshAllData(data.user.id, firstWs);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  // Toggle variety accordion
  const toggleVariety = (varietyId: string) => {
    setExpandedVarieties((prev) => ({
      ...prev,
      [varietyId]: !prev[varietyId],
    }));
  };

  // Update item in cart
  const updateQuantity = (sku: SKU, varietyName: string, delta: number) => {
    setCart((prev) => {
      const currentQty = prev[sku.id]?.quantity || 0;
      const nextQty = Math.max(0, currentQty + delta);

      if (nextQty === 0) {
        const nextCart = { ...prev };
        delete nextCart[sku.id];
        return nextCart;
      }

      if (nextQty > sku.currentStock) {
        alert(`Only ${sku.currentStock} bags available in godown!`);
        return prev;
      }

      return {
        ...prev,
        [sku.id]: {
          sku,
          varietyName,
          quantity: nextQty,
        },
      };
    });
  };

  // Cart summary calculations
  const cartSummary = useMemo(() => {
    const items = Object.values(cart);
    const totalBags = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.sku.sellingPrice * item.quantity, 0);
    const totalWeightKg = items.reduce((sum, item) => sum + item.sku.weightKg * item.quantity, 0);
    return { items, totalBags, totalAmount, totalWeightKg };
  }, [cart]);

  // Filtered categories and varieties
  const filteredCategories = useMemo(() => {
    let result = categories;
    if (selectedCatId !== 'all') {
      result = result.filter((c) => c.id === selectedCatId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result
        .map((cat) => ({
          ...cat,
          varieties: cat.varieties.filter(
            (v) =>
              v.name.toLowerCase().includes(q) ||
              (v.subType && v.subType.toLowerCase().includes(q)) ||
              v.skus.some(
                (s) =>
                  s.brand.toLowerCase().includes(q) ||
                  s.packagingType.toLowerCase().includes(q)
              )
          ),
        }))
        .filter((cat) => cat.varieties.length > 0);
    }
    return result;
  }, [categories, selectedCatId, searchQuery]);

  // Place Order API Call
  const handlePlaceOrder = async () => {
    if (!user || cartSummary.items.length === 0) return;

    if (paymentMode === 'CREDIT' && khata) {
      if (cartSummary.totalAmount > khata.availableCredit) {
        alert(
          `Order total (₹${cartSummary.totalAmount}) exceeds your available credit (₹${khata.availableCredit}). Please select COD or settle outstanding udhaar.`
        );
        return;
      }
    }

    setOrderSubmitting(true);
    try {
      const payload = {
        userId: user.id,
        wholesalerId: selectedWholesalerId,
        paymentMode,
        items: cartSummary.items.map((i) => ({
          skuId: i.sku.id,
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Clear cart, close drawer, show success
      setCart({});
      setIsCartOpen(false);
      setOrderSuccess(data.order);
      // Refresh backend data in real time
      await refreshAllData(user.id, selectedWholesalerId);
      setActiveTab('tracking');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Settle / Pay Khata Balance API Call
  const handlePayKhata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0 || !user || !selectedWholesalerId) return;

    setPaying(true);
    try {
      const res = await fetch('/api/khata/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          wholesalerId: selectedWholesalerId,
          amount: parseFloat(payAmount),
          reference: `TXN-${Date.now().toString().slice(-6)}`,
          notes: `Retailer credit clearance to ${activeConnection?.wholesaler?.shopName || 'Wholesaler'}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setPayModalOpen(false);
      setPayAmount('');
      alert(`Payment of ₹${data.entry.amount} recorded! New outstanding with this wholesaler: ₹${data.newBalance}`);
      await refreshAllData(user.id, selectedWholesalerId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaying(false);
    }
  };

  // Reorder a past order
  const handleRepeatOrder = (pastOrder: any) => {
    const newCart: Record<string, CartItem> = {};
    pastOrder.items.forEach((item: any) => {
      newCart[item.skuId] = {
        sku: item.sku,
        varietyName: item.sku.variety?.name || 'Commodity',
        quantity: item.quantity,
      };
    });
    setCart(newCart);
    setActiveTab('order');
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-28">
      <Navbar user={user} />

      {/* RETAILER TOP CREDIT & MULTI-WHOLESALER SWITCHER */}
      <section className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-4 py-4 sm:py-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                  Kirana Store Portal
                </span>
                <span className="text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Verified Retailer
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {user?.shopName}
              </h1>
              <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5">
                <span>Proprietor: {user?.name}</span>
                <span>•</span>
                <span>{user?.phoneNumber}</span>
              </p>
            </div>

            {/* WHOLESALER SWITCHER (OPTION A) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-emerald-950/40 backdrop-blur border border-emerald-500/30 rounded-2xl p-2.5 sm:p-3 min-w-[240px] sm:min-w-[300px]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-400" />
                    <span>Ordering From Mandi Wholesaler:</span>
                  </span>
                  <span className="text-[10px] bg-emerald-700/60 px-2 py-0.2 rounded text-emerald-100 font-bold">
                    {user?.wholesalerConnections?.length || 0} Connected
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={selectedWholesalerId}
                    onChange={(e) => handleWholesalerChange(e.target.value)}
                    className="w-full bg-white text-slate-900 font-bold text-xs sm:text-sm py-2 px-3 pr-8 rounded-xl border border-emerald-400/40 focus:ring-2 focus:ring-amber-400 focus:outline-none appearance-none cursor-pointer shadow-xs"
                  >
                    {user?.wholesalerConnections?.map((conn: any) => (
                      <option key={conn.wholesaler.id} value={conn.wholesaler.id}>
                        {conn.wholesaler.shopName || conn.wholesaler.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-600">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {activeConnection && (
                  <div className="mt-1.5 pt-1.5 border-t border-emerald-600/30 flex items-center justify-between text-[10px] text-emerald-200">
                    <span className="truncate max-w-[170px]">
                      {activeConnection.wholesaler.address?.split(',')[2] || activeConnection.wholesaler.address || 'APMC Mandi'}
                    </span>
                    <span className="text-amber-300 font-bold">
                      Credit Limit: ₹{activeConnection.creditLimit.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Isolated Credit Cards for Selected Wholesaler */}
              <div className="flex items-center gap-2">
                <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl px-3 py-2 min-w-[115px]">
                  <div className="text-[10px] text-emerald-200 font-medium">Available Credit</div>
                  <div className="text-sm sm:text-base font-black text-white">
                    ₹{khata ? khata.availableCredit.toLocaleString('en-IN') : '...'}
                  </div>
                  <div className="text-[9px] text-emerald-300">
                    Limit: ₹{activeConnection ? activeConnection.creditLimit.toLocaleString('en-IN') : '...'}
                  </div>
                </div>

                <div className="bg-amber-500/20 backdrop-blur border border-amber-400/30 rounded-xl px-3 py-2 min-w-[115px]">
                  <div className="text-[10px] text-amber-200 font-medium">Wholesaler Udhaar</div>
                  <div className="text-sm sm:text-base font-black text-amber-300">
                    ₹{khata ? khata.currentBalance.toLocaleString('en-IN') : '...'}
                  </div>
                  <button
                    onClick={() => setPayModalOpen(true)}
                    className="mt-1 text-[9px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs"
                  >
                    <CreditCard className="w-2.5 h-2.5" /> Settle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE-FIRST TAB NAVIGATION */}
      <div className="sticky top-14 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-around px-2 py-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[100px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'dashboard'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('order')}
            className={`flex-1 min-w-[110px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'order'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wheat className="w-4 h-4" />
            <span>Mandi Order</span>
          </button>

          <button
            onClick={() => setActiveTab('repeat')}
            className={`flex-1 min-w-[110px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'repeat'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>1-Click Repeat</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 min-w-[100px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'tracking'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Live Orders</span>
            {orders.filter((o) => o.status !== 'DELIVERED').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('khata')}
            className={`flex-1 min-w-[100px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'khata'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bahi-Khata</span>
          </button>
        </div>
      </div>

      {/* TAB 0: KIRANA STORE OVERVIEW DASHBOARD */}
      {activeTab === 'dashboard' && (
        <main className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 flex-1 space-y-6">
          {/* Active Order Alert Card (If In-Flight) */}
          {orders.filter((o) => o.status !== 'DELIVERED').length > 0 ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur shrink-0">
                    <Truck className="w-6 h-6 text-white animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
                        In-Transit Mandi Delivery
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                        {orders.find((o) => o.status !== 'DELIVERED')?.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold">
                      Order #{orders.find((o) => o.status !== 'DELIVERED')?.orderNumber} (
                      {orders.find((o) => o.status !== 'DELIVERED')?.totalBags} Bags • ₹
                      {orders.find((o) => o.status !== 'DELIVERED')?.totalAmount.toLocaleString('en-IN')})
                    </h3>
                    {orders.find((o) => o.status !== 'DELIVERED')?.driverName && (
                      <p className="text-xs text-emerald-100 mt-0.5">
                        Assigned Tempo:{' '}
                        <strong>{orders.find((o) => o.status !== 'DELIVERED')?.vehicleNumber}</strong> • Driver:{' '}
                        <strong>{orders.find((o) => o.status !== 'DELIVERED')?.driverName}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('tracking')}
                  className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white text-emerald-800 text-xs font-extrabold shadow-sm hover:bg-emerald-50 transition-colors shrink-0"
                >
                  Live Delivery Status →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                    All Mandi Deliveries Complete!
                  </h3>
                  <p className="text-[11px] sm:text-xs text-emerald-700">
                    Your stock is refreshed. Morning Mandi Bhav rates are updated for today&apos;s orders.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('order')}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                Place New Order →
              </button>
            </div>
          )}

          {/* Quick Operations Hub (4 Action Cards) */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
              Kirana Store Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('order')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-2.5 group-hover:scale-110 transition-transform">
                  <Wheat className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-emerald-800">
                  Mandi Matrix
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Order Rice, Dal, Oil, Atta</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('repeat')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-2.5 group-hover:scale-110 transition-transform">
                  <RotateCcw className="w-5 h-5 text-blue-700" />
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-emerald-800">
                  1-Click Repeat
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Quick staple reorder</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tracking')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-2.5 group-hover:scale-110 transition-transform">
                  <Truck className="w-5 h-5 text-amber-700" />
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-emerald-800">
                  Live Tracking
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{orders.length} orders history</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('khata')}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold mb-2.5 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5 text-purple-700" />
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-emerald-800">
                  Bahi-Khata Ledger
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ₹{khata ? khata.currentBalance.toLocaleString('en-IN') : '0'} udhaar balance
                </div>
              </button>
            </div>
          </div>

          {/* Two-Column Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Morning Mandi Bhav Ticker Highlights */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Today&apos;s Mandi Bhav Ticker
                    </h3>
                    <p className="text-xs text-slate-500">
                      Current rates from{' '}
                      <strong>{activeConnection?.wholesaler?.shopName || 'Connected Wholesaler'}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('order')}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>Full Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.slice(0, 4).map((cat) => {
                    const sampleSku = cat.varieties[0]?.skus[0];
                    if (!sampleSku) return null;
                    return (
                      <div
                        key={cat.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-emerald-50/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            {cat.name}
                          </span>
                          <p className="text-xs font-extrabold text-slate-900 truncate mt-1">
                            {cat.varieties[0]?.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {sampleSku.brand} ({sampleSku.packagingType})
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block">Mandi Bhav</span>
                          <span className="text-xs sm:text-sm font-black text-emerald-800">
                            ₹{sampleSku.sellingPrice.toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCatId(cat.id);
                              setActiveTab('order');
                            }}
                            className="text-[10px] font-bold text-emerald-700 hover:underline block mt-0.5"
                          >
                            + Order
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Orders History */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Recent Mandi Orders</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tracking')}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center">
                    No past orders yet. Place your first mandi stock replenishment above!
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-extrabold text-slate-900">#{order.orderNumber}</span>
                          <span className="text-slate-400 ml-2">
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </span>
                          <p className="text-slate-500 text-[11px]">
                            {order.items?.length || 0} commodities • {order.totalBags} bags
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900 block">
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Bahi-Khata & Credit Balance Card */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                  Credit & Udhaar Ledger
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {activeConnection?.wholesaler?.shopName || 'Connected Wholesaler'}
                </p>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Total Credit Limit
                    </span>
                    <span className="text-base font-black text-slate-900">
                      ₹{activeConnection ? activeConnection.creditLimit.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-medium block">
                      Available Credit to Order
                    </span>
                    <span className="text-base font-black text-emerald-800">
                      ₹{khata ? khata.availableCredit.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] text-amber-700 font-medium block">
                      Outstanding Wholesaler Udhaar
                    </span>
                    <span className="text-base font-black text-amber-900">
                      ₹{khata ? khata.currentBalance.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPayModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Settle / Pay Udhaar Balance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('khata')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center transition-colors"
                  >
                    View Ledger Statement →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* TAB 1: MANDI QUICK-ORDER MATRIX (THE CORE FEATURE) */}
      {activeTab === 'order' && (
        <main className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">
          {/* Search & Category Filter */}
          <div className="mb-4 space-y-2.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commodities, varieties, cuts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm shadow-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Chips Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCatId('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCatId === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Commodities
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCatId(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCatId === c.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Morning Mandi Rate Notice */}
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Today&apos;s Mandi Bhav Locked: Rates reflect live wholesale market rates.</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">
              Live APMC
            </span>
          </div>

          {/* Commodities Matrix Accordion List */}
          <div className="space-y-4">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    {cat.name}
                  </h2>
                  <span className="text-[11px] font-medium text-slate-500">
                    {cat.varieties.length} varieties
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cat.varieties.map((v) => {
                    const isExpanded = expandedVarieties[v.id] !== false; // default open
                    return (
                      <div
                        key={v.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                      >
                        {/* Variety Header (Click to expand/collapse) */}
                        <div
                          onClick={() => toggleVariety(v.id)}
                          className="px-3.5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{v.name}</span>
                              {v.subType && (
                                <span className="text-[10px] font-normal text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded">
                                  {v.subType}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {v.skus.length} packaging options
                            </span>
                          </div>
                          <button className="text-slate-400 p-1 hover:text-slate-600">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Variety SKUs Matrix Rows */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-100">
                            {v.skus.map((sku) => {
                              const qtyInCart = cart[sku.id]?.quantity || 0;
                              const isOutOfStock = sku.currentStock <= 0;
                              const perKgRate = (sku.sellingPrice / sku.weightKg).toFixed(1);

                              return (
                                <div
                                  key={sku.id}
                                  className={`p-3 flex items-center justify-between gap-2 transition-colors ${
                                    qtyInCart > 0 ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'
                                  }`}
                                >
                                  {/* Left details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-slate-900">
                                        {sku.brand}
                                      </span>
                                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                                        {sku.packagingType}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-sm font-black text-slate-900">
                                        ₹{sku.sellingPrice.toLocaleString('en-IN')}
                                        <span className="text-[10px] font-normal text-slate-500">
                                          /bag
                                        </span>
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-400">
                                        (₹{perKgRate}/kg)
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'
                                        }`}
                                      ></span>
                                      <span>
                                        {isOutOfStock
                                          ? 'Out of Stock'
                                          : `${sku.currentStock} bags in godown`}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right: Stepper Counter */}
                                  <div>
                                    {isOutOfStock ? (
                                      <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                        Sold Out
                                      </span>
                                    ) : (
                                      <div className="flex items-center bg-slate-100 rounded-lg border border-slate-300 p-0.5">
                                        <button
                                          onClick={() => updateQuantity(sku, v.name, -1)}
                                          disabled={qtyInCart === 0}
                                          className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-all"
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-8 text-center text-xs font-black text-slate-900">
                                          {qtyInCart}
                                        </span>
                                        <button
                                          onClick={() => updateQuantity(sku, v.name, 1)}
                                          className="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs transition-all"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* TAB 2: 1-CLICK REPEAT ORDER */}
      {activeTab === 'repeat' && (
        <main className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-slate-900">1-Click Smart Replenishment</h2>
            <p className="text-xs text-slate-500">
              Quickly reorder your regular staples from past dispatches without browsing.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <RotateCcw className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No past orders yet to repeat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((pastOrder) => (
                <div
                  key={pastOrder.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Order #{pastOrder.orderNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {new Date(pastOrder.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">
                        ₹{pastOrder.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {pastOrder.totalBags} bags • {pastOrder.totalWeightKg} kg
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {pastOrder.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="text-xs text-slate-600 flex justify-between items-center"
                      >
                        <span>
                          {item.quantity}x {item.sku.brand} ({item.sku.packagingType})
                        </span>
                        <span className="font-semibold text-slate-800">
                          ₹{item.totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleRepeatOrder(pastOrder)}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reorder These Items
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* TAB 3: LIVE ORDERS TRACKING */}
      {activeTab === 'tracking' && (
        <main className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-slate-900">Live Delivery Tracker</h2>
            <p className="text-xs text-slate-500">Real-time status of your orders from the Mandi godown</p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No orders found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isDelivered = order.status === 'DELIVERED';
                const isOut = order.status === 'OUT_FOR_DELIVERY';
                const isPacked = order.status === 'PACKED';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Order #{order.orderNumber}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{order.wholesaler?.shopName || order.wholesaler?.name || 'Mandi Stockist'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          ,{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOut
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Stepper Pipeline */}
                    <div className="relative flex items-center justify-between mb-4 px-2">
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0"></div>
                      <div
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all -z-0"
                        style={{
                          width: isDelivered ? '100%' : isOut ? '66%' : isPacked ? '33%' : '0%',
                        }}
                      ></div>

                      {/* Step 1: Placed */}
                      <div className="flex flex-col items-center z-10">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                        <span className="text-[10px] font-semibold text-slate-700 mt-1">Placed</span>
                      </div>

                      {/* Step 2: Packed */}
                      <div className="flex flex-col items-center z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isPacked || isOut || isDelivered
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isPacked || isOut || isDelivered ? '✓' : '2'}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-700 mt-1">Packed</span>
                      </div>

                      {/* Step 3: Out for Delivery */}
                      <div className="flex flex-col items-center z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isOut || isDelivered
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isOut || isDelivered ? '✓' : '3'}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-700 mt-1">On Tempo</span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isDelivered ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDelivered ? '✓' : '4'}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-700 mt-1">Delivered</span>
                      </div>
                    </div>

                    {/* Driver & Tempo Details */}
                    {order.driverName && (
                      <div className="bg-slate-50 rounded-lg p-2.5 mb-3 text-xs flex items-center justify-between border border-slate-100">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Dispatched via</span>
                          <span className="font-bold text-slate-800">
                            {order.driverName} ({order.vehicleNumber || 'Tempo'})
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          En Route
                        </span>
                      </div>
                    )}

                    {/* Items preview */}
                    <div className="text-xs text-slate-600 border-t border-slate-100 pt-2 flex items-center justify-between">
                      <span>
                        {order.totalBags} bags • {order.totalWeightKg} kg ({order.items.length} items)
                      </span>
                      <span className="font-bold text-slate-900">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* TAB 4: BAHI-KHATA LEDGER */}
      {activeTab === 'khata' && (
        <main className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Digital Bahi-Khata</h2>
                {activeConnection && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {activeConnection.wholesaler.shopName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Isolated credit ledger with {activeConnection?.wholesaler?.shopName || 'selected supplier'}
              </p>
            </div>
            <button
              onClick={() => setPayModalOpen(true)}
              className="py-1.5 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" /> Settle Udhaar
            </button>
          </div>

          {khata?.entries?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No ledger entries yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
              {khata?.entries?.map((entry: any) => {
                const isDebit = entry.type === 'DEBIT';
                return (
                  <div key={entry.id} className="p-3 sm:p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isDebit ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {isDebit ? 'Invoice / Order' : 'Payment Received'}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {entry.reference || 'Mandi Transaction'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{entry.notes}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm font-black ${
                          isDebit ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {isDebit ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Balance: ₹{entry.balanceAfter.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* FLOATING CART BAR (MOBILE-FIRST) */}
      {cartSummary.totalBags > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-3 bg-white/95 backdrop-blur border-t border-slate-200 shadow-xl max-w-xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <span>{cartSummary.totalBags} Bags</span>
                <span>•</span>
                <span>{cartSummary.totalWeightKg} Kg</span>
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900">
                ₹{cartSummary.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Review & Place Order</span>
            </button>
          </div>
        </div>
      )}

      {/* ORDER REVIEW & CHECKOUT DRAWER / MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Order Summary</h3>
                <span className="text-xs text-slate-500">
                  {cartSummary.totalBags} Bags • Total Weight: {cartSummary.totalWeightKg} kg
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
              {cartSummary.items.map((item) => (
                <div key={item.sku.id} className="pt-2.5 first:pt-0 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {item.sku.brand} ({item.sku.packagingType})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ₹{item.sku.sellingPrice}/bag • {item.sku.weightKg * item.quantity} kg
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {item.quantity} bags = ₹
                      {(item.sku.sellingPrice * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Mode Selection */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CREDIT')}
                    className={`p-2 rounded-xl border text-left text-xs font-bold transition-all ${
                      paymentMode === 'CREDIT'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>🌾 Mandi Credit</div>
                    <span className="text-[10px] font-normal text-slate-500 block mt-0.5">
                      Bahi-Khata
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('COD')}
                    className={`p-2 rounded-xl border text-left text-xs font-bold transition-all ${
                      paymentMode === 'COD'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>💵 Cash on Delivery</div>
                    <span className="text-[10px] font-normal text-slate-500 block mt-0.5">
                      Pay on Arrival
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`p-2 rounded-xl border text-left text-xs font-bold transition-all ${
                      paymentMode === 'UPI'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>📱 UPI / QR</div>
                    <span className="text-[10px] font-normal text-slate-500 block mt-0.5">
                      Scan on Delivery
                    </span>
                  </button>
                </div>
              </div>

              {/* Final Total & Action */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500">Total Payable</span>
                  <div className="text-lg font-black text-slate-900">
                    ₹{cartSummary.totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={orderSubmitting}
                  className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 disabled:opacity-50 transition-all"
                >
                  {orderSubmitting ? 'Confirming Order...' : 'Confirm Order'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTLE UDHAAR MODAL */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Settle Kirana Udhaar</h3>
              <button
                onClick={() => setPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Current outstanding balance with{' '}
              <strong className="text-slate-800">
                {activeConnection?.wholesaler?.shopName || activeConnection?.wholesaler?.name || 'Mandi Wholesaler'}
              </strong>{' '}
              is{' '}
              <strong className="text-amber-700">
                ₹{khata?.currentBalance?.toLocaleString('en-IN')}
              </strong>
              .
            </p>

            <form onSubmit={handlePayKhata} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  max={khata?.currentBalance || undefined}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying || !payAmount}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {paying ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
