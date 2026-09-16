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
  FileSpreadsheet,
  Download,
  UploadCloud,
  FileUp,
  X,
  ChevronDown,
  Layers,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import * as XLSX from 'xlsx';

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
    subType?: string | null;
    category: {
      id: string;
      name: string;
    };
  };
}

export default function WholesalerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'inward' | 'bhav' | 'orders' | 'khata'>('dashboard');

  // Commodities & Inventory State
  const [commodities, setCommodities] = useState<any[]>([]);
  const [flatSkus, setFlatSkus] = useState<SKU[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Inward Mode: 'single' | 'excel'
  const [inwardMode, setInwardMode] = useState<'single' | 'excel'>('single');

  // Searchable Combobox State for Single Inward
  const [skuSearchText, setSkuSearchText] = useState('');
  const [isSkuDropdownOpen, setIsSkuDropdownOpen] = useState(false);

  // Fast Stock Inward Form State
  const [selectedSkuId, setSelectedSkuId] = useState<string>('');
  const [inwardBags, setInwardBags] = useState<number | ''>('');
  const [purchaseCost, setPurchaseCost] = useState<string>('');
  const [sellingBhav, setSellingBhav] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [inwardSubmitting, setInwardSubmitting] = useState(false);
  const [inwardSuccessMsg, setInwardSuccessMsg] = useState('');

  // Add New Commodity / SKU Modal State
  const [isNewSkuModalOpen, setIsNewSkuModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newVarietyName, setNewVarietyName] = useState('');
  const [newSubType, setNewSubType] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newPackagingType, setNewPackagingType] = useState('25kg Bag');
  const [newWeightKg, setNewWeightKg] = useState('25');
  const [newInitialStock, setNewInitialStock] = useState('100');
  const [newPurchaseCost, setNewPurchaseCost] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [creatingSku, setCreatingSku] = useState(false);
  const [newSkuError, setNewSkuError] = useState('');

  // Bulk Excel Inward State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedExcelRows, setParsedExcelRows] = useState<any[]>([]);
  const [excelProcessing, setExcelProcessing] = useState(false);
  const [excelSuccessMsg, setExcelSuccessMsg] = useState('');
  const [excelErrorMsg, setExcelErrorMsg] = useState('');

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

  // Filtered SKUs for Searchable Combobox
  const filteredComboboxSkus = useMemo(() => {
    if (!skuSearchText.trim()) return flatSkus;
    const q = skuSearchText.toLowerCase();
    return flatSkus.filter((sku) => {
      return (
        sku.brand.toLowerCase().includes(q) ||
        sku.packagingType.toLowerCase().includes(q) ||
        sku.variety.name.toLowerCase().includes(q) ||
        (sku.variety.subType && sku.variety.subType.toLowerCase().includes(q)) ||
        sku.variety.category.name.toLowerCase().includes(q)
      );
    });
  }, [flatSkus, skuSearchText]);

  const selectedSkuObject = useMemo(() => {
    return flatSkus.find((s) => s.id === selectedSkuId) || flatSkus[0] || null;
  }, [flatSkus, selectedSkuId]);

  const handleSelectComboboxSku = (sku: SKU) => {
    setSelectedSkuId(sku.id);
    setPurchaseCost(sku.purchaseCost.toString());
    setSellingBhav(sku.sellingPrice.toString());
    setSkuSearchText('');
    setIsSkuDropdownOpen(false);
  };

  // Create New Commodity / SKU Modal Submission
  const handleCreateNewSkuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !newVarietyName.trim() || !newBrand.trim() || !newPackagingType.trim()) {
      setNewSkuError('Please fill category, variety, brand, and packaging');
      return;
    }

    const cost = parseFloat(newPurchaseCost);
    const price = parseFloat(newSellingPrice);
    const weight = parseFloat(newWeightKg);
    const stock = parseInt(newInitialStock || '0', 10);

    if (isNaN(cost) || cost <= 0 || isNaN(price) || price <= 0 || isNaN(weight) || weight <= 0) {
      setNewSkuError('Valid purchase cost, selling rate, and weight are required');
      return;
    }

    setCreatingSku(true);
    setNewSkuError('');

    try {
      const res = await fetch('/api/inventory/new-sku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: newCategoryName.trim(),
          varietyName: newVarietyName.trim(),
          subType: newSubType.trim(),
          brand: newBrand.trim(),
          packagingType: newPackagingType.trim(),
          weightKg: weight,
          initialStock: stock,
          purchaseCost: cost,
          sellingPrice: price,
          supplier: newSupplier.trim(),
          wholesalerId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create new commodity SKU');
      }

      setIsNewSkuModalOpen(false);
      setInwardSuccessMsg(`New commodity "${data.sku.brand} (${data.sku.packagingType})" created and added to godown stock!`);
      // Reset modal fields
      setNewVarietyName('');
      setNewSubType('');
      setNewBrand('');
      setNewPurchaseCost('');
      setNewSellingPrice('');
      setNewSupplier('');

      // Refresh data and select new sku
      await refreshAllData(user?.id);
      setSelectedSkuId(data.sku.id);
      setPurchaseCost(data.sku.purchaseCost.toString());
      setSellingBhav(data.sku.sellingPrice.toString());
    } catch (err: any) {
      setNewSkuError(err.message);
    } finally {
      setCreatingSku(false);
    }
  };

  // Download Excel / CSV Template for Bulk Inward
  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const templateData = [
      {
        Category: 'Rice (Chawal)',
        Variety: 'Basmati Rice',
        SubType: '1121 Extra Long',
        Brand: 'Royal Crown Marka',
        PackagingType: '25kg Bag',
        WeightKg: 25,
        BagsAdded: 100,
        PurchaseCost: 2450,
        SellingPrice: 2600,
        Supplier: 'Laxmi Agro Rice Mill',
        Notes: 'Fresh Mandi lot',
      },
      {
        Category: 'Atta, Maida & Suji',
        Variety: 'Wheat Atta (Gehu Chawal)',
        SubType: 'MP Sharbati Chakki',
        Brand: 'Shree Chakki Fresh Atta',
        PackagingType: '50kg Bag',
        WeightKg: 50,
        BagsAdded: 150,
        PurchaseCost: 1550,
        SellingPrice: 1680,
        Supplier: 'MP Roller Flour Mills',
        Notes: 'Chakki ground',
      },
      {
        Category: 'Edible Oils & Ghee',
        Variety: 'Refined Sunflower Oil',
        SubType: 'Triple Filtered',
        Brand: 'Fortune Sunlite 15L',
        PackagingType: '15L Tin',
        WeightKg: 13.5,
        BagsAdded: 80,
        PurchaseCost: 1620,
        SellingPrice: 1710,
        Supplier: 'Adani Wilmar Depot',
        Notes: 'Factory sealed tins',
      },
      {
        Category: 'Pulses & Dal (Dalen)',
        Variety: 'Toor / Arhar Dal',
        SubType: 'Desi Fatka Unpolished',
        Brand: 'Kisan Fatka Toor Dal',
        PackagingType: '30kg Bag',
        WeightKg: 30,
        BagsAdded: 120,
        PurchaseCost: 4150,
        SellingPrice: 4400,
        Supplier: 'Latur Dal Mill Association',
        Notes: 'Unpolished bold grain',
      },
      {
        Category: 'Sugar & Jaggery (Shakkar)',
        Variety: 'Crystal White Sugar',
        SubType: 'M-30 Grade',
        Brand: 'Co-op Super Sugar',
        PackagingType: '50kg Bag',
        WeightKg: 50,
        BagsAdded: 200,
        PurchaseCost: 1890,
        SellingPrice: 1980,
        Supplier: 'Kolhapur Sugar Mill',
        Notes: 'Grade M30 crystal',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'StockInwardTemplate');

    if (format === 'csv') {
      XLSX.writeFile(workbook, 'mandi_stock_inward_template.csv', { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, 'mandi_stock_inward_template.xlsx', { bookType: 'xlsx' });
    }
  };

  // Handle Excel / CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setExcelErrorMsg('');
    setExcelSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rawJson || rawJson.length === 0) {
          setExcelErrorMsg('The uploaded file contains no data rows.');
          return;
        }

        // Normalize headers flexibly
        const parsed = rawJson.map((row) => {
          const findKey = (candidates: string[]) => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (candidates.some((c) => cleanKey === c.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
                return row[key];
              }
            }
            return '';
          };

          return {
            category: findKey(['Category', 'Commodity', 'CategoryName']),
            variety: findKey(['Variety', 'VarietyName', 'Item']),
            subType: findKey(['SubType', 'Sub-Type', 'Type', 'Cut']),
            brand: findKey(['Brand', 'BrandName', 'Marka']),
            packagingType: findKey(['PackagingType', 'Packaging', 'Packing']),
            weightKg: parseFloat(findKey(['WeightKg', 'Weight', 'Kg']) || '25'),
            bagsAdded: parseInt(findKey(['BagsAdded', 'Bags', 'Quantity', 'Qty']) || '0', 10),
            purchaseCost: parseFloat(findKey(['PurchaseCost', 'Cost', 'CostPrice', 'BuyingRate']) || '0'),
            sellingPrice: parseFloat(findKey(['SellingPrice', 'Price', 'SellingRate', 'MandiBhav', 'Bhav']) || '0'),
            supplier: findKey(['Supplier', 'Mill', 'Vendor']),
            notes: findKey(['Notes', 'Remarks']),
          };
        });

        const validRows = parsed.filter(
          (r) => r.category && r.variety && r.brand && r.packagingType && r.bagsAdded > 0
        );

        if (validRows.length === 0) {
          setExcelErrorMsg('No valid rows found. Please check column headers against the template.');
          return;
        }

        setParsedExcelRows(validRows);
      } catch (err: any) {
        setExcelErrorMsg(`Failed to parse file: ${err.message}`);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Submit Bulk Inward from Excel
  const handleConfirmBulkInward = async () => {
    if (parsedExcelRows.length === 0 || !user) return;

    setExcelProcessing(true);
    setExcelErrorMsg('');
    try {
      const res = await fetch('/api/inventory/bulk-inward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wholesalerId: user.id,
          items: parsedExcelRows,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process bulk inward');
      }

      setExcelSuccessMsg(data.message);
      setParsedExcelRows([]);
      setExcelFile(null);
      await refreshAllData(user.id);
    } catch (err: any) {
      setExcelErrorMsg(err.message);
    } finally {
      setExcelProcessing(false);
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
          {/* TAB 0: EXECUTIVE DASHBOARD */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[110px] py-2.5 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'dashboard'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

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

      {/* TAB 0: EXECUTIVE WHOLESALER DASHBOARD */}
      {activeTab === 'dashboard' && (
        <main className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 flex-1 space-y-6">
          {/* Urgent Attention Alert Center */}
          {(pendingRetailers.length > 0 ||
            ordersSummary.lowStockSkus.length > 0 ||
            orders.filter((o) => o.status === 'NEW').length > 0) && (
            <div className="space-y-2.5">
              {pendingRetailers.length > 0 && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-amber-950">
                        {pendingRetailers.length} Kirana Store(s) Waiting For Access
                      </h3>
                      <p className="text-[11px] sm:text-xs text-amber-800">
                        Approve their registration and assign credit limit so they can start ordering.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('approvals')}
                    className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                  >
                    Review & Set Credit Limits →
                  </button>
                </div>
              )}

              {orders.filter((o) => o.status === 'NEW').length > 0 && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-blue-950">
                        {orders.filter((o) => o.status === 'NEW').length} New Order(s) Awaiting Packing & Dispatch
                      </h3>
                      <p className="text-[11px] sm:text-xs text-blue-800">
                        Fresh orders received today from Kirana stores in your mandi zone.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                  >
                    Pack & Dispatch →
                  </button>
                </div>
              )}

              {ordersSummary.lowStockSkus.length > 0 && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-rose-950">
                        {ordersSummary.lowStockSkus.length} Godown SKU(s) Running Critically Low (&lt; 30 bags)
                      </h3>
                      <p className="text-[11px] sm:text-xs text-rose-800">
                        {ordersSummary.lowStockSkus
                          .slice(0, 3)
                          .map((s) => `${s.brand} (${s.currentStock} left)`)
                          .join(', ')}
                        {ordersSummary.lowStockSkus.length > 3
                          ? ` +${ordersSummary.lowStockSkus.length - 3} more`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInwardMode('single');
                      setActiveTab('inward');
                    }}
                    className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                  >
                    Restock Godown →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Operations Hub (6 Action Cards) */}
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
              Quick Operations & Fast Access
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                type="button"
                onClick={() => {
                  setInwardMode('single');
                  setActiveTab('inward');
                }}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                  <PackagePlus className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-800">
                  + Add Stock
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Single inward</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInwardMode('excel');
                  setActiveTab('inward');
                }}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                </div>
                <div className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-800">
                  Bulk Excel
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Upload template</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bhav')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4 text-blue-700" />
                </div>
                <div className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-800">
                  Mandi Bhav
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Update daily rates</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                  <Truck className="w-4 h-4 text-amber-700" />
                </div>
                <div className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-800">
                  Dispatch Orders
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{orders.length} orders total</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('approvals')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-4 h-4 text-purple-700" />
                </div>
                <div className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-800">
                  Store Approvals
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{activeRetailers.length} active stores</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('khata')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-800">
                  Kirana Khata
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ledger & Udhaar</div>
              </button>
            </div>
          </div>

          {/* Two-Column Analytics & Operational Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Live Orders Stream */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Live Kirana Orders Feed
                    </h3>
                    <p className="text-xs text-slate-500">
                      Latest incoming purchase orders from connected Kirana stores
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>View All ({orders.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">
                      No orders received yet today. Connected Kiranas can order using their Mandi Matrix.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.slice(0, 5).map((order) => {
                      const statusColors: Record<string, string> = {
                        NEW: 'bg-amber-100 text-amber-800 border-amber-200',
                        PACKED: 'bg-blue-100 text-blue-800 border-blue-200',
                        OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                        DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      };
                      return (
                        <div
                          key={order.id}
                          className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 rounded-xl px-2 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-extrabold text-slate-900">
                                #{order.orderNumber}
                              </span>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md border ${
                                  statusColors[order.status] || 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {order.status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 font-semibold truncate">
                              {order.user?.shopName || order.user?.name}
                              <span className="text-slate-400 font-normal">
                                {' '}• {order.items?.length || 0} items ({order.totalBags} bags)
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              ₹{order.totalAmount.toLocaleString('en-IN')}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('orders')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 text-xs font-bold transition-colors"
                            >
                              Manage →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Market Udhaar Exposure Snapshot */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Kirana Market Udhaar Snapshot
                    </h3>
                    <p className="text-xs text-slate-500">
                      Total Market Receivables:{' '}
                      <strong className="text-emerald-700">
                        ₹{totalMarketUdhaar.toLocaleString('en-IN')}
                      </strong>{' '}
                      across {khataSummary.length} stores
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('khata')}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Open Full Khata →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {khataSummary.slice(0, 3).map((item) => (
                    <div
                      key={item.user.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80"
                    >
                      <div className="text-xs font-bold text-slate-900 truncate mb-1">
                        {item.user.shopName}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Balance:</span>
                        <span className="font-extrabold text-rose-700">
                          ₹{item.balance.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Limit: ₹{item.user.creditLimit.toLocaleString('en-IN')}</span>
                        <span className="text-emerald-700 font-semibold">{item.user.phoneNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Godown Inventory & Low Stock */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Godown Inventory Health
                    </h3>
                    <p className="text-xs text-slate-500">
                      {flatSkus.length} SKUs • {flatSkus.reduce((sum, s) => sum + s.currentStock, 0)} Total Bags
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInwardMode('single');
                      setActiveTab('inward');
                    }}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    + Inward
                  </button>
                </div>

                <div className="space-y-3">
                  {ordersSummary.lowStockSkus.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider block mb-1">
                        🚨 Critical Low Stock Alert ({ordersSummary.lowStockSkus.length})
                      </span>
                      <div className="space-y-1.5">
                        {ordersSummary.lowStockSkus.slice(0, 3).map((sku) => (
                          <div
                            key={sku.id}
                            className="flex items-center justify-between text-xs font-semibold text-rose-900"
                          >
                            <span className="truncate max-w-[140px]">{sku.brand}</span>
                            <span className="font-black">{sku.currentStock} bags</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100">
                    {flatSkus.slice(0, 5).map((sku) => {
                      const pct = Math.min(100, Math.round((sku.currentStock / 150) * 100));
                      return (
                        <div key={sku.id} className="py-2.5">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-900 truncate max-w-[160px]">
                              {sku.brand} ({sku.packagingType})
                            </span>
                            <span className="font-extrabold text-emerald-700 shrink-0">
                              {sku.currentStock} bags
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                sku.currentStock < 30 ? 'bg-rose-500' : 'bg-emerald-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('bhav')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center transition-colors"
                  >
                    View All Commodities & Rates →
                  </button>
                </div>
              </div>

              {/* Connected Stores Quick Info */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-900">
                    Connected Kirana Stores
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {activeRetailers.length} Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Kirana stores authorized to purchase from your mandi depot.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('approvals')}
                  className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold text-center border border-purple-200 transition-colors"
                >
                  Manage Kirana Store Access →
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

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

      {/* TAB 1: FAST STOCK INWARD & BULK EXCEL */}
      {activeTab === 'inward' && (
        <main className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl mb-5 max-w-md">
            <button
              type="button"
              onClick={() => setInwardMode('single')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                inwardMode === 'single'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Single Commodity Inward</span>
            </button>
            <button
              type="button"
              onClick={() => setInwardMode('excel')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                inwardMode === 'excel'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bulk Excel / CSV Upload</span>
            </button>
          </div>

          {/* MODE 1: SINGLE COMMODITY INWARD */}
          {inwardMode === 'single' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                    Godown Inward Entry
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                    Fast Stock Inward & Landing Cost Updater
                  </h2>
                  <p className="text-xs text-slate-500">
                    Search existing godown commodity or quickly add a new one on the fly.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (skuSearchText.trim()) {
                      setNewBrand(skuSearchText.trim());
                      setNewVarietyName(skuSearchText.trim());
                    }
                    setIsNewSkuModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors shrink-0 shadow-xs"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>+ Add New Commodity / SKU</span>
                </button>
              </div>

              {inwardSuccessMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{inwardSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleStockInwardSubmit} className="space-y-4">
                {/* Searchable Combobox */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Search Commodity & Packaging
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {flatSkus.length} commodities available
                    </span>
                  </div>

                  {/* Search Input Box */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={skuSearchText}
                      onFocus={() => setIsSkuDropdownOpen(true)}
                      onChange={(e) => {
                        setSkuSearchText(e.target.value);
                        setIsSkuDropdownOpen(true);
                      }}
                      placeholder="Type to search (e.g. Basmati, Atta, Fortune, 25kg, Sugar)..."
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    {skuSearchText ? (
                      <button
                        type="button"
                        onClick={() => setSkuSearchText('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSkuDropdownOpen(!isSkuDropdownOpen)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Selected SKU Highlight Card */}
                  {selectedSkuObject && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                          {selectedSkuObject.variety.category.name}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {selectedSkuObject.brand} — {selectedSkuObject.variety.name}{' '}
                            <span className="text-slate-500 font-normal">
                              ({selectedSkuObject.packagingType})
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Current Godown Stock:{' '}
                            <span className="font-bold text-slate-800">
                              {selectedSkuObject.currentStock} bags
                            </span>{' '}
                            • Cost: ₹{selectedSkuObject.purchaseCost} • Bhav: ₹{selectedSkuObject.sellingPrice}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSkuDropdownOpen(true)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline px-2 py-1 shrink-0"
                      >
                        Change Commodity
                      </button>
                    </div>
                  )}

                  {/* Floating Combobox Dropdown */}
                  {isSkuDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsSkuDropdownOpen(false)}
                      />
                      <div className="absolute z-30 w-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-80 flex flex-col">
                        <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>
                            {filteredComboboxSkus.length} matching commodities
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsSkuDropdownOpen(false)}
                            className="text-slate-400 hover:text-slate-600 font-bold"
                          >
                            Close
                          </button>
                        </div>

                        <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                          {filteredComboboxSkus.length > 0 ? (
                            filteredComboboxSkus.map((sku) => {
                              const isSelected = sku.id === selectedSkuId;
                              return (
                                <button
                                  key={sku.id}
                                  type="button"
                                  onClick={() => handleSelectComboboxSku(sku)}
                                  className={`w-full p-2.5 text-left flex items-center justify-between gap-2 hover:bg-emerald-50 transition-colors ${
                                    isSelected ? 'bg-emerald-50/70' : ''
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                        {sku.variety.category.name}
                                      </span>
                                      <span className="text-xs font-bold text-slate-900 truncate">
                                        {sku.brand} — {sku.variety.name}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      Pack: <span className="font-semibold text-slate-700">{sku.packagingType}</span> ({sku.weightKg} kg)
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[10px] text-slate-400 block">Stock</span>
                                    <span className="text-xs font-extrabold text-emerald-700">
                                      {sku.currentStock} bags
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-xs font-semibold text-slate-600 mb-1">
                                No commodities matching &quot;{skuSearchText}&quot;
                              </p>
                              <p className="text-[11px] text-slate-400 mb-3">
                                You can add it as a new commodity to your godown right now.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Dropdown Footer: Always accessible + Add New Button */}
                        <div className="p-2 bg-slate-50 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              if (skuSearchText.trim()) {
                                setNewBrand(skuSearchText.trim());
                                setNewVarietyName(skuSearchText.trim());
                              }
                              setIsSkuDropdownOpen(false);
                              setIsNewSkuModalOpen(true);
                            }}
                            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add &quot;{skuSearchText || 'New Commodity'}&quot; to Godown</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Bags Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Quantity to Add (+ Bags)</label>
                    <div className="flex items-center gap-1.5">
                      {[25, 50, 100, 200, 500].map((quickVal) => (
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
                    onChange={(e) => setInwardBags(parseInt(e.target.value) || '')}
                    placeholder="Enter bags / units count"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                {/* Purchase Cost & Selling Price */}
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

                {/* Supplier / Mill Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supplier / Mill Name
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Laxmi Agro Mill, MP Depot, Wilmar"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Submit Stock Inward */}
                <button
                  type="submit"
                  disabled={inwardSubmitting || !selectedSkuId}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
                >
                  {inwardSubmitting ? (
                    <span>Recording Stock to Godown...</span>
                  ) : (
                    <>
                      <PackagePlus className="w-4 h-4" />
                      <span>
                        Confirm Stock Inward {inwardBags ? `(+${inwardBags} Bags)` : ''}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* MODE 2: BULK EXCEL / CSV UPLOAD */}
          {inwardMode === 'excel' && (
            <div className="space-y-6">
              {/* Template Download Card */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        1. Download Inward Excel / CSV Template
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                        Pre-formatted with sample APMC lots (Rice, Atta, Edible Oil, Toor Dal, Sugar). Fill in your truck delivery items and upload. New commodities are created automatically.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .XLSX</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('csv')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .CSV</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">
                  2. Upload Filled Spreadsheet
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Select your updated Excel (.xlsx, .xls) or CSV file. All rows will be parsed and validated before saving.
                </p>

                {excelErrorMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{excelErrorMsg}</span>
                  </div>
                )}

                {excelSuccessMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{excelSuccessMsg}</span>
                  </div>
                )}

                {/* Dropzone Area */}
                <label className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition-colors group">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                  <div className="p-3 rounded-2xl bg-white text-emerald-600 shadow-xs group-hover:scale-110 transition-transform mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 text-center">
                    {excelFile ? excelFile.name : 'Click to select or drag & drop Excel / CSV'}
                  </p>
                  <p className="text-[11px] text-slate-400 text-center mt-0.5">
                    Supports .xlsx, .xls, and .csv formats
                  </p>
                </label>

                {/* Parsed Rows Preview Table */}
                {parsedExcelRows.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          Parsed File Preview ({parsedExcelRows.length} commodities)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Total {parsedExcelRows.reduce((sum, r) => sum + (r.bagsAdded || 0), 0)} bags
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setParsedExcelRows([]);
                          setExcelFile(null);
                        }}
                        className="text-xs text-rose-600 hover:underline font-semibold self-start sm:self-auto"
                      >
                        Clear File
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Variety</th>
                            <th className="p-2.5">Brand & Packaging</th>
                            <th className="p-2.5 text-right">Bags Added</th>
                            <th className="p-2.5 text-right">Cost (₹)</th>
                            <th className="p-2.5 text-right">Bhav (₹)</th>
                            <th className="p-2.5">Supplier</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {parsedExcelRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap">
                                {row.category}
                              </td>
                              <td className="p-2.5 text-slate-700 whitespace-nowrap">
                                {row.variety} {row.subType ? `(${row.subType})` : ''}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span className="font-bold text-emerald-800">{row.brand}</span>{' '}
                                <span className="text-slate-500 font-medium">({row.packagingType})</span>
                              </td>
                              <td className="p-2.5 text-right font-extrabold text-slate-900">
                                +{row.bagsAdded}
                              </td>
                              <td className="p-2.5 text-right text-slate-700 font-semibold">
                                ₹{row.purchaseCost}
                              </td>
                              <td className="p-2.5 text-right text-emerald-700 font-bold">
                                ₹{row.sellingPrice}
                              </td>
                              <td className="p-2.5 text-slate-500 text-[11px] whitespace-nowrap">
                                {row.supplier || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Submit Bulk Inward Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmBulkInward}
                        disabled={excelProcessing}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
                      >
                        {excelProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing Bulk Inward to Godown...</span>
                          </>
                        ) : (
                          <>
                            <FileUp className="w-4 h-4" />
                            <span>
                              Confirm & Inward All {parsedExcelRows.length} Commodities (
                              {parsedExcelRows.reduce((sum, r) => sum + (r.bagsAdded || 0), 0)} Bags)
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* ADD NEW COMMODITY / SKU MODAL */}
      {isNewSkuModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    + Add New Commodity & Godown SKU
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Create a new APMC commodity and add initial stock to godown.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSkuModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newSkuError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{newSkuError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewSkuSubmit} className="space-y-3.5 mt-3.5">
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {[
                    'Rice (Chawal)',
                    'Atta, Maida & Suji',
                    'Pulses & Dal (Dalen)',
                    'Edible Oils & Ghee',
                    'Sugar & Jaggery (Shakkar)',
                    'Spices & Masala',
                  ].map((catPreset) => (
                    <button
                      type="button"
                      key={catPreset}
                      onClick={() => setNewCategoryName(catPreset)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                        newCategoryName === catPreset
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {catPreset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Rice (Chawal) or Spices"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  required
                />
              </div>

              {/* Variety & SubType */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Variety / Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newVarietyName}
                    onChange={(e) => setNewVarietyName(e.target.value)}
                    placeholder="e.g. Basmati Rice, Toor Dal, Chakki Atta"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Sub-Type / Cut / Grade
                  </label>
                  <input
                    type="text"
                    value={newSubType}
                    onChange={(e) => setNewSubType(e.target.value)}
                    placeholder="e.g. 1121 Extra Long, Fatka Unpolished"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Brand & Packaging */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Brand / Marka <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="e.g. Royal Crown, Fortune, Laxmi"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Packaging Type <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPackagingType}
                    onChange={(e) => setNewPackagingType(e.target.value)}
                    placeholder="e.g. 25kg Bag, 50kg Bag, 15L Tin"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Weight, Stock & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Net Weight (Kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newWeightKg}
                    onChange={(e) => setNewWeightKg(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Initial Godown Stock <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Supplier / Mill Name
                  </label>
                  <input
                    type="text"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    placeholder="e.g. Laxmi Agro Mill"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Purchase Cost & Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Purchase / Landing Cost (₹/bag) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newPurchaseCost}
                    onChange={(e) => setNewPurchaseCost(e.target.value)}
                    placeholder="e.g. 2450"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Your mill procurement price
                  </span>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Selling Mandi Bhav (₹/bag) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                    placeholder="e.g. 2600"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Rate Kiranas will see & order
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewSkuModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSku}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {creatingSku ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Commodity...</span>
                    </>
                  ) : (
                    <>
                      <PackagePlus className="w-4 h-4" />
                      <span>Save & Add to Godown</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
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
