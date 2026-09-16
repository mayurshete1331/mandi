'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  PackagePlus,
  TrendingUp,
  Truck,
  BookOpen,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  Search,
  ArrowRight,
  AlertTriangle,
  Building2,
  Phone,
  RefreshCw,
  UserCheck,
  Users,
  XCircle,
  ShieldAlert,
} from 'lucide-react';

interface SKU {
  id: string;
  brand: string;
  packagingType: string;
  weightKg: number;
  currentStock: number;
  purchaseCost: number;
  sellingPrice: number;
  variety: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
}

export default function WholesalerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'approvals' | 'inward' | 'bhav' | 'orders' | 'khata'>('approvals');

  // Commodities & Inventory State
  const [commodities, setCommodities] = useState<any[]>([]);
  const [flatSkus, setFlatSkus] = useState<SKU[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fast Stock Inward Form State
  const [selectedSkuId, setSelectedSkuId] = useState<string>('');
  const [inwardBags, setInwardBags] = useState<number | ''>('');
  const [purchaseCost, setPurchaseCost] = useState<string>('');
  const [sellingBhav, setSellingBhav] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [inwardSubmitting, setInwardSubmitting] = useState(false);
  const [inwardSuccessMsg, setInwardSuccessMsg] = useState('');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [driverModalOrder, setDriverModalOrder] = useState<any>(null);
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Khata Summary State
  const [khataSummary, setKhataSummary] = useState<any[]>([]);
  const [totalMarketUdhaar, setTotalMarketUdhaar] = useState(0);

  // Retailer Approvals State (User Requirement)
  const [pendingRetailers, setPendingRetailers] = useState<any[]>([]);
  const [activeRetailers, setActiveRetailers] = useState<any[]>([]);
  const [creditLimitInputs, setCreditLimitInputs] = useState<Record<string, number>>({});
  const [approvalActionLoading, setApprovalActionLoading] = useState(false);

  // Load all data from real APIs
  const refreshAllData = async (wholesalerId?: string) => {
    try {
      const activeWsId = wholesalerId || user?.id;
      // 1. Fetch Commodities
      const commUrl = activeWsId ? `/api/commodities?wholesalerId=${activeWsId}` : '/api/commodities';
      const commRes = await fetch(commUrl);
      const commData = await commRes.json();
      if (commData.categories) {
        setCommodities(commData.categories);
        const skusList: SKU[] = [];
        commData.categories.forEach((cat: any) => {
          cat.varieties.forEach((v: any) => {
            v.skus.forEach((s: any) => {
              skusList.push({
                ...s,
                variety: {
                  id: v.id,
                  name: v.name,
                  category: { id: cat.id, name: cat.name },
                },
              });
            });
          });
        });
        setFlatSkus(skusList);
        if (skusList.length > 0 && !selectedSkuId) {
          setSelectedSkuId(skusList[0].id);
          setPurchaseCost(skusList[0].purchaseCost.toString());
          setSellingBhav(skusList[0].sellingPrice.toString());
        }
      }

      // 2. Fetch Orders
      const orderRes = await fetch('/api/orders');
      const orderData = await orderRes.json();
      if (orderData.orders) {
        setOrders(orderData.orders);
      }

      // 3. Fetch Khata Market Summary
      const khataRes = await fetch('/api/khata?all=true');
      const khataData = await khataRes.json();
      if (khataData.summary) {
        setKhataSummary(khataData.summary);
        setTotalMarketUdhaar(khataData.totalMarketReceivables);
      }

      // 4. Fetch Retailer Requests & Approvals
      const reqRes = await fetch('/api/wholesaler/retailer-requests');
      const reqData = await reqRes.json();
      if (reqData.pending) {
        setPendingRetailers(reqData.pending);
        setActiveRetailers(reqData.active);
      }
    } catch (err) {
      console.error('Wholesaler data refresh error:', err);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.user.role === 'WHOLESALER') {
          setUser(data.user);
          refreshAllData(data.user.id);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleSkuSelectionChange = (skuId: string) => {
    setSelectedSkuId(skuId);
    const sku = flatSkus.find((s) => s.id === skuId);
    if (sku) {
      setPurchaseCost(sku.purchaseCost.toString());
      setSellingBhav(sku.sellingPrice.toString());
    }
  };

  // Submit Fast Stock Inward
  const handleStockInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkuId || !inwardBags || Number(inwardBags) <= 0) return;

    setInwardSubmitting(true);
    setInwardSuccessMsg('');

    try {
      const res = await fetch('/api/inventory/inward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skuId: selectedSkuId,
          bagsAdded: inwardBags,
          costPerBag: parseFloat(purchaseCost) || 0,
          sellingPrice: parseFloat(sellingBhav) || 0,
          supplier: supplierName,
          notes: 'Truck Delivery Stock Inward',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add stock');
      }

      setInwardSuccessMsg(
        `Added +${inwardBags} bags! New Godown Stock: ${data.data.updatedSku.currentStock} bags.`
      );
      await refreshAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInwardSubmitting(false);
    }
  };

  // Update Mandi Bhav Selling Price
  const handleUpdatePrice = async (skuId: string, newRate: number) => {
    try {
      const res = await fetch('/api/rates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skuId, sellingPrice: newRate }),
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Transition Order Status
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string,
    driver?: string,
    vehicle?: string
  ) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          driverName: driver,
          vehicleNumber: vehicle,
        }),
      });
      if (res.ok) {
        setDriverModalOrder(null);
        await refreshAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Approve or Reject Kirana Account Request
  const handleApprovalAction = async (kiranaId: string, action: 'APPROVE' | 'REJECT') => {
    const limit = creditLimitInputs[kiranaId];
    if (action === 'APPROVE' && (!limit || limit <= 0)) {
      alert('Please enter a valid initial credit limit');
      return;
    }
    setApprovalActionLoading(true);
    try {
      const res = await fetch(`/api/wholesaler/retailer-requests/${kiranaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, creditLimit: limit }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process approval');
      }

      alert(data.message);
      await refreshAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setApprovalActionLoading(false);
    }
  };

  // Filtered SKUs for Bhav Table
  const filteredSkus = useMemo(() => {
    if (!searchQuery.trim()) return flatSkus;
    const q = searchQuery.toLowerCase();
    return flatSkus.filter(
      (s) =>
        s.brand.toLowerCase().includes(q) ||
        s.variety.name.toLowerCase().includes(q) ||
        s.variety.category.name.toLowerCase().includes(q) ||
        s.packagingType.toLowerCase().includes(q)
    );
  }, [flatSkus, searchQuery]);

  // Orders summary
  const ordersSummary = useMemo(() => {
    const totalTodayAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingDispatchBags = orders
      .filter((o) => o.status !== 'DELIVERED')
      .reduce((sum, o) => sum + o.totalBags, 0);
    const lowStockSkus = flatSkus.filter((s) => s.currentStock < 30);
    return { totalTodayAmount, pendingDispatchBags, lowStockSkus };
  }, [orders, flatSkus]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <Navbar user={user} />

      {/* WHOLESALER KPI COMMAND BAR */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white px-4 py-4 sm:py-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Mandi Wholesaler Command Center
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {user?.shopName}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                APMC Mandi • Live Godown Stock, Approvals & Dispatches
              </p>
            </div>

            <button
              onClick={() => refreshAllData()}
              className="self-start sm:self-auto py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Live Data</span>
            </button>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3">
              <span className="text-[11px] text-slate-300 font-medium block">Today&apos;s Orders</span>
              <span className="text-base sm:text-xl font-black text-white block mt-0.5">
                ₹{ordersSummary.totalTodayAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-400">
                {orders.length} Kirana orders received
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3">
              <span className="text-[11px] text-slate-300 font-medium block">Pending Requests</span>
              <span className="text-base sm:text-xl font-black text-amber-300 block mt-0.5">
                {pendingRetailers.length} Kirana Stores
              </span>
              <span className="text-[10px] text-amber-200">Awaiting your approval</span>
            </div>

            <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3">
              <span className="text-[11px] text-slate-300 font-medium block">
                Total Market Udhaar
              </span>
              <span className="text-base sm:text-xl font-black text-emerald-300 block mt-0.5">
                ₹{totalMarketUdhaar.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-200">
                Across {khataSummary.length} Kirana stores
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3">
              <span className="text-[11px] text-slate-300 font-medium block">Low Stock Alerts</span>
              <span className="text-base sm:text-xl font-black text-rose-300 block mt-0.5">
                {ordersSummary.lowStockSkus.length} Items
              </span>
              <span className="text-[10px] text-rose-200">&lt; 30 bags in godown</span>
            </div>
          </div>
        </div>
      </section>

      {/* WHOLESALER NAVIGATION TABS */}
      <div className="sticky top-14 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-around px-2 py-1 overflow-x-auto no-scrollbar">
          {/* TAB: RETAILER APPROVALS */}
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex-1 min-w-[120px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'approvals'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Store Approvals</span>
            {pendingRetailers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
                {pendingRetailers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inward')}
            className={`flex-1 min-w-[110px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'inward'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Add Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('bhav')}
            className={`flex-1 min-w-[120px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'bhav'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Mandi Bhav</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 min-w-[110px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Orders</span>
            {orders.filter((o) => o.status === 'NEW').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('khata')}
            className={`flex-1 min-w-[110px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'khata'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kirana Khata</span>
          </button>
        </div>
      </div>

      {/* TAB: RETAILER APPROVALS & ACCESS CONTROL (USER REQUIREMENT) */}
      {activeTab === 'approvals' && (
        <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">
          {/* Pending Requests Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Pending Kirana Store Requests</span>
                  {pendingRetailers.length > 0 && (
                    <span className="text-[11px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {pendingRetailers.length} New
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Kirana stores who selected you as their distributor and are waiting for account activation.
                </p>
              </div>
            </div>

            {pendingRetailers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">All caught up!</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  No pending store activation requests right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRetailers.map((kirana) => (
                  <div
                    key={kirana.id}
                    className="bg-white rounded-2xl border-2 border-amber-200/80 p-4 sm:p-5 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            {kirana.shopName}
                          </span>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase">
                            Approval Needed
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Owner: <strong>{kirana.name}</strong> • Phone: {kirana.phoneNumber}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Location: {kirana.address} • Requested:{' '}
                          {new Date(kirana.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* Credit Limit Input & Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Set Initial Credit Limit (₹)
                          </label>
                          <input
                            type="number"
                            value={creditLimitInputs[kirana.id] ?? ''}
                            onChange={(e) =>
                              setCreditLimitInputs({
                                ...creditLimitInputs,
                                [kirana.id]: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Enter credit limit"
                            className="w-32 p-1.5 rounded-lg border border-slate-300 text-xs font-black text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprovalAction(kirana.id, 'REJECT')}
                            disabled={approvalActionLoading}
                            className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-bold transition-all"
                          >
                            Decline
                          </button>

                          <button
                            onClick={() => handleApprovalAction(kirana.id, 'APPROVE')}
                            disabled={approvalActionLoading}
                            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Approve & Activate Shop</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active / Approved Retailers Network */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Approved & Active Retailers Network ({activeRetailers.length})</span>
            </h3>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
              {activeRetailers.map((kirana) => (
                <div key={kirana.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {kirana.shopName}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {kirana.name} ({kirana.phoneNumber}) • {kirana.address}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Credit Limit</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-700">
                      ₹{kirana.creditLimit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* TAB 1: FAST STOCK INWARD */}
      {activeTab === 'inward' && (
        <main className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs mb-6">
            <div className="mb-4">
              <span className="text-[11px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                Godown Inward Entry
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                Fast Stock Inward & Landing Cost Updater
              </h2>
              <p className="text-xs text-slate-500">
                Quickly record incoming bags/tins from trucks or mills. Saves immediately to MySQL.
              </p>
            </div>

            {inwardSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{inwardSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleStockInwardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Commodity & Packaging
                </label>
                <select
                  value={selectedSkuId}
                  onChange={(e) => handleSkuSelectionChange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {flatSkus.map((sku) => (
                    <option key={sku.id} value={sku.id}>
                      {sku.variety.category.name} › {sku.variety.name} — {sku.brand} (
                      {sku.packagingType}) [Godown Stock: {sku.currentStock} bags]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Quantity to Add (+ Bags)</label>
                  <div className="flex items-center gap-1.5">
                    {[25, 50, 100, 200].map((quickVal) => (
                      <button
                        type="button"
                        key={quickVal}
                        onClick={() => setInwardBags(quickVal)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 transition-colors"
                      >
                        +{quickVal}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  value={inwardBags}
                  onChange={(e) => setInwardBags(parseInt(e.target.value) || 0)}
                  placeholder="Enter bags count"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Purchase / Landing Cost (₹/bag)
                  </label>
                  <input
                    type="number"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    placeholder="Enter purchase cost"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Wholesaler mill buying price
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Mandi Bhav (₹/bag)
                  </label>
                  <input
                    type="number"
                    value={sellingBhav}
                    onChange={(e) => setSellingBhav(e.target.value)}
                    placeholder="Enter selling rate"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Rate Kiranas will see & order at
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supplier / Mill Name
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Enter supplier / mill name"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={inwardSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                {inwardSubmitting ? (
                  <span>Recording Stock to Godown...</span>
                ) : (
                  <>
                    <PackagePlus className="w-4 h-4" />
                    <span>Confirm Stock Inward (+{inwardBags} Bags)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* TAB 2: MORNING MANDI BHAV TICKER */}
      {activeTab === 'bhav' && (
        <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Morning Mandi Bhav Ticker (Daily Selling Rates)
              </h2>
              <p className="text-xs text-slate-500">
                Update market rates here. Changes immediately reflect on all Kirana store screens.
              </p>
            </div>

            <div className="relative min-w-[220px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter commodities..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredSkus.map((sku) => (
                <div
                  key={sku.id}
                  className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        {sku.variety.name} — {sku.brand}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {sku.packagingType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Purchase Cost: ₹{sku.purchaseCost} • Godown Stock: {sku.currentStock} bags
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <span className="text-xs font-bold text-slate-400 mr-1.5">₹</span>
                      <input
                        type="number"
                        defaultValue={sku.sellingPrice}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val !== sku.sellingPrice) {
                            handleUpdatePrice(sku.id, val);
                          }
                        }}
                        className="w-24 p-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-black text-slate-900 text-right focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 ml-1">/bag</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdatePrice(sku.id, sku.sellingPrice - 10)}
                        title="Reduce ₹10"
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleUpdatePrice(sku.id, sku.sellingPrice + 10)}
                        title="Increase ₹10"
                        className="w-7 h-7 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center transition-colors"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* TAB 3: ORDERS DISPATCH PIPELINE */}
      {activeTab === 'orders' && (
        <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-slate-900">Live Orders Pipeline</h2>
            <p className="text-xs text-slate-500">
              Manage incoming Kirana orders, pack in godown, and assign to delivery tempos.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No orders in pipeline.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isNew = order.status === 'NEW';
                const isPacked = order.status === 'PACKED';
                const isOut = order.status === 'OUT_FOR_DELIVERY';
                const isDelivered = order.status === 'DELIVERED';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900">
                            Order #{order.orderNumber}
                          </span>
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {order.user.shopName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          Contact: {order.user.name} ({order.user.phoneNumber}) •{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-sm sm:text-base font-black text-slate-900 block">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {order.totalBags} Bags • {order.totalWeightKg} kg
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      {order.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="text-xs text-slate-600 flex justify-between items-center bg-slate-50/60 px-2.5 py-1.5 rounded-lg"
                        >
                          <span className="font-semibold text-slate-800">
                            {item.quantity} bags × {item.sku.brand} ({item.sku.packagingType})
                          </span>
                          <span>₹{item.totalPrice.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500">Status:</span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOut
                              ? 'bg-amber-100 text-amber-900 animate-pulse'
                              : isPacked
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isNew && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'PACKED')}
                            className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
                          >
                            Mark as Packed in Godown
                          </button>
                        )}

                        {isPacked && (
                          <button
                            onClick={() => setDriverModalOrder(order)}
                            className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Assign Tempo & Dispatch</span>
                          </button>
                        )}

                        {isOut && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                            className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        {isDelivered && (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* TAB 4: KIRANA UDHAAR & BAHI-KHATA */}
      {activeTab === 'khata' && (
        <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">
          <div className="mb-4">
            <h2 className="text-base font-extrabold text-slate-900">Kirana Udhaar & Credit Watch</h2>
            <p className="text-xs text-slate-500">
              Real-time outstanding balances across all Kirana stores in your network.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {khataSummary.map((kirana) => {
              const overdueMsg = encodeURIComponent(
                `Namaste ${kirana.name} ji (${kirana.shopName}), aapka ${user?.shopName || 'Mandi Wholesaler'} me baki udhaar balance ₹${kirana.outstandingBalance.toLocaleString(
                  'en-IN'
                )} hai. Kripya UPI ya cash dwara bhugtan karein. Dhanyawad!`
              );

              return (
                <div
                  key={kirana.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {kirana.shopName}
                      </span>
                      <span className="text-xs text-slate-500">({kirana.name})</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Phone: {kirana.phoneNumber}</span>
                      <span>•</span>
                      <span>Credit Limit: ₹{kirana.creditLimit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Outstanding Balance</span>
                      <span className="text-base font-black text-amber-700">
                        ₹{kirana.outstandingBalance.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <a
                      href={`https://wa.me/91${kirana.phoneNumber}?text=${overdueMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Bill</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ASSIGN TEMPO & DRIVER MODAL */}
      {driverModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">Dispatch via Tempo</h3>
            <p className="text-xs text-slate-500 mb-4">
              Assign driver and vehicle for Order #{driverModalOrder.orderNumber} (
              {driverModalOrder.totalBags} bags).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter driver name"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Vehicle / Tempo Number
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="Enter vehicle number"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDriverModalOrder(null)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() =>
                    handleUpdateOrderStatus(
                      driverModalOrder.id,
                      'OUT_FOR_DELIVERY',
                      driverName,
                      vehicleNumber
                    )
                  }
                  className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {statusUpdating ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
