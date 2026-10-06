'use client';

import { useState, useEffect } from 'react';
import { Users, Car, Heart, Clock, Search, Sparkles, LogOut, ShieldCheck, Building2, KeyRound, Plus, X, PhoneCall, Calendar, CheckCircle, CheckCircle2, Tag, AlertCircle } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function DealerDashboardPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CUSTOMERS' | 'INVENTORY' | 'FOLLOWUPS'>('OVERVIEW');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dealerInfo, setDealerInfo] = useState<{ name: string; slug: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [customSlug, setCustomSlug] = useState('sharma-motors');
  const [loginEmail, setLoginEmail] = useState('owner@sharmamotors.com');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Modals & Action States
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // New Vehicle Form State
  const [stockNumber, setStockNumber] = useState('');
  const [make, setMake] = useState('Hyundai');
  const [model, setModel] = useState('Creta');
  const [variant, setVariant] = useState('SX Automatic');
  const [year, setYear] = useState(2022);
  const [price, setPrice] = useState(1050000);
  const [fuel, setFuel] = useState('petrol');
  const [transmission, setTransmission] = useState('automatic');
  const [kilometers, setKilometers] = useState(38000);
  const [description, setDescription] = useState('Single owner, complete dealer service history.');

  // Live/Sample Data lists
  const [inventory, setInventory] = useState<any[]>([]);

  const [customers, setCustomers] = useState<any[]>([]);

  const [followups, setFollowups] = useState<any[]>([]);

  const [metrics, setMetrics] = useState({
    activeCustomersCount: 0,
    activeRequirementsCount: 0,
    availableVehiclesCount: 0,
    newMatchesCount: 0,
    interestedLeadsCount: 0,
    pendingFollowupsCount: 0,
    overdueFollowupsCount: 0,
  });

  useEffect(() => {
    const savedDealer = localStorage.getItem('dealconnect_dealer');
    const savedUser = localStorage.getItem('dealconnect_user');
    const token = localStorage.getItem('dealconnect_token');

    if (token && savedDealer) {
      setIsLoggedIn(true);
      setDealerInfo(JSON.parse(savedDealer));
      if (savedUser) setUserInfo(JSON.parse(savedUser));
      fetchMetrics();
    }
  }, []);

  const fetchMetrics = async () => {
    try {
      const data = await ApiClient.request<any>('/dashboard/metrics');
      if (data) {
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customSlug || !loginEmail || !loginPassword) return;
    setLoading(true);
    try {
      const data = await ApiClient.request<{
        token: string;
        dealer: { name: string; slug: string };
        user: { name: string; email: string; role: string };
      }>('/public/dealer-auth/login', {
        method: 'POST',
        body: JSON.stringify({ dealerSlug: customSlug.toLowerCase().replace(/\s+/g, '-'), email: loginEmail, password: loginPassword }),
      });

      ApiClient.setToken(data.token);
      localStorage.setItem('dealconnect_dealer', JSON.stringify(data.dealer));
      localStorage.setItem('dealconnect_user', JSON.stringify(data.user));

      setDealerInfo(data.dealer);
      setUserInfo(data.user);
      setIsLoggedIn(true);
      fetchMetrics();
    } catch (err: any) {
      alert('Login failed. Please check your credentials or ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    ApiClient.clearToken();
    localStorage.removeItem('dealconnect_dealer');
    localStorage.removeItem('dealconnect_user');
    setIsLoggedIn(false);
    setDealerInfo(null);
    setUserInfo(null);
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newVehicle = {
      id: `v_${Date.now()}`,
      stockNumber: stockNumber || `SM-${Math.floor(1000 + Math.random() * 9000)}`,
      make,
      model,
      variant,
      year: Number(year),
      price: Number(price),
      fuel,
      transmission,
      km: Number(kilometers),
      status: 'AVAILABLE',
    };

    try {
      await ApiClient.request('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          stockNumber: newVehicle.stockNumber,
          make,
          model,
          variant,
          year: Number(year),
          price: Number(price),
          fuel,
          transmission,
          kilometers: Number(kilometers),
          description,
        }),
      });
      setInventory([newVehicle, ...inventory]);
      setMetrics((prev) => ({ ...prev, availableVehiclesCount: prev.availableVehiclesCount + 1 }));
      setIsAddVehicleOpen(false);
      setLoading(false);
      showToast(`Added ${make} ${model} (Stock #${newVehicle.stockNumber}) to Inventory!`);
    } catch (err) {
      console.error('Failed to add vehicle:', err);
      alert('Failed to add vehicle.');
      setLoading(false);
    }
  };

  const toggleVehicleStatus = (id: string) => {
    setInventory((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: v.status === 'AVAILABLE' ? 'RESERVED' : 'AVAILABLE' } : v))
    );
    showToast('Vehicle status updated!');
  };

  const completeFollowup = (id: string) => {
    setFollowups((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'COMPLETED' } : f)));
    showToast('Follow-up marked as completed!');
  };

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg shadow-sky-500/30">
              DC
            </div>
            <h2 className="text-2xl font-black text-slate-900">Dealer Portal Login</h2>
            <p className="text-xs text-slate-500">
              Sign in to access your dealership's private SaaS CRM & Matching Engine
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Dealer Slug</label>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition mt-2"
              >
                Sign In
              </button>
            </form>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Multi-tenant Isolation active via PostgreSQL Row Level Security (RLS).</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Toast Banner */}
      {actionSuccessMsg && (
        <div className="bg-emerald-600 text-white px-6 py-3 text-xs font-bold flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500 rounded-xl text-white font-bold text-lg">
            DC
          </div>
          <div>
            <h1 className="font-bold text-lg">{dealerInfo?.name || 'Sharma Motors'} — Dealer Dashboard</h1>
            <p className="text-xs text-slate-400">Private Dealer SaaS Platform • Tenant Slug: {dealerInfo?.slug}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg flex items-center space-x-1">
            <KeyRound className="w-3.5 h-3.5 text-emerald-400 mr-1" />
            <span>{userInfo?.name || 'Dealer Staff'} ({userInfo?.role || 'OWNER'})</span>
          </span>

          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 font-bold rounded-xl text-white transition flex items-center space-x-1 shadow-lg shadow-sky-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white font-semibold rounded-xl transition flex items-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            <span>Switch Account</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Customers</p>
              <h3 className="text-2xl font-black text-slate-900">{metrics.activeCustomersCount}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Searches</p>
              <h3 className="text-2xl font-black text-slate-900">{metrics.activeRequirementsCount}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Search className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Available Inventory</p>
              <h3 className="text-2xl font-black text-slate-900">{inventory.length}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Car className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Interested Leads</p>
              <h3 className="text-2xl font-black text-emerald-600">{metrics.interestedLeadsCount}</h3>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Heart className="w-6 h-6 fill-current" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 space-x-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === 'OVERVIEW' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Activity
          </button>
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === 'CUSTOMERS' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customers & Requirements ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === 'INVENTORY' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Vehicle Inventory ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('FOLLOWUPS')}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === 'FOLLOWUPS' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Follow-ups ({followups.filter((f) => f.status === 'PENDING').length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>Qualified Interested Leads — {dealerInfo?.name}</span>
                </h3>
                <span className="text-xs text-slate-400">100-Point Engine Scored</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Rahul Sharma (+91 98765 43210)</h4>
                    <p className="text-xs text-slate-600">Interested in <strong>2022 Hyundai Creta SX (Stock #SM-1024)</strong></p>
                    <span className="text-[10px] text-emerald-700 font-semibold">Matched 95% • Clicked Interested</span>
                  </div>
                  <a
                    href="tel:+919876543210"
                    onClick={() => showToast('Initiating call to Rahul Sharma (+91 98765 43210)...')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5 mr-1" />
                    <span>Call Customer</span>
                  </a>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Ankit Verma (+91 99887 76655)</h4>
                    <p className="text-xs text-slate-600">Interested in <strong>2021 Toyota Fortuner 4x4 (Stock #SM-1019)</strong></p>
                    <span className="text-[10px] text-slate-500 font-semibold">Matched 88% • Clicked Interested</span>
                  </div>
                  <a
                    href="tel:+919988776655"
                    onClick={() => showToast('Initiating call to Ankit Verma (+91 99887 76655)...')}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow flex items-center space-x-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5 mr-1" />
                    <span>Call Customer</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Today's Sales Tasks</span>
              </h3>

              <div className="space-y-3 text-xs">
                {followups.map((f) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded-xl border flex items-start justify-between ${
                      f.status === 'COMPLETED' ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{f.customer}</div>
                      <div className="text-slate-600">{f.action}</div>
                      <div className="mt-1 text-[10px] text-amber-700 font-mono">{f.due}</div>
                    </div>
                    {f.status === 'PENDING' && (
                      <button
                        onClick={() => completeFollowup(f.id)}
                        className="px-2 py-1 bg-amber-600 text-white text-[10px] font-bold rounded-md"
                      >
                        Done
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMERS & REQUIREMENTS */}
        {activeTab === 'CUSTOMERS' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Registered Buyer Requirements</h3>
              <span className="text-xs text-slate-400">Scoped to {dealerInfo?.name}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Mobile Number</th>
                    <th className="p-3">Car Preference / Search</th>
                    <th className="p-3">Target Budget</th>
                    <th className="p-3">Match Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3 font-mono text-slate-600">{c.phone}</td>
                      <td className="p-3 font-semibold text-sky-700">{c.search}</td>
                      <td className="p-3 text-slate-700">{c.budget}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                            c.status.includes('MATCHED') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <a
                          href={`tel:${c.phone}`}
                          onClick={() => showToast(`Calling ${c.name}...`)}
                          className="px-2.5 py-1 bg-sky-600 text-white rounded-lg text-[11px] font-bold"
                        >
                          Call
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY */}
        {activeTab === 'INVENTORY' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Vehicle Inventory Listing</h3>
              <button
                onClick={() => setIsAddVehicleOpen(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow"
              >
                + Add New Vehicle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.map((v) => (
                <div key={v.id} className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between hover:shadow-md transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded">
                        #{v.stockNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">{v.year} {v.make} {v.model}</h4>
                    </div>
                    <p className="text-xs text-slate-500">{v.variant} • {v.fuel.toUpperCase()} • {v.transmission.toUpperCase()} • {v.km.toLocaleString()} km</p>
                    <p className="text-sm font-black text-emerald-600">₹{(v.price / 100000).toFixed(2)} Lakhs</p>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        v.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {v.status}
                    </span>
                    <button
                      onClick={() => toggleVehicleStatus(v.id)}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline"
                    >
                      Mark {v.status === 'AVAILABLE' ? 'Reserved' : 'Available'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: FOLLOWUPS */}
        {activeTab === 'FOLLOWUPS' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Sales Follow-up Workflow</h3>
            <div className="space-y-3">
              {followups.map((f) => (
                <div key={f.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{f.customer} ({f.phone})</h4>
                    <p className="text-xs text-slate-600">{f.action}</p>
                    <span className="text-[10px] text-amber-700 font-mono">Due: {f.due}</span>
                  </div>
                  {f.status === 'PENDING' ? (
                    <button
                      onClick={() => completeFollowup(f.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow"
                    >
                      Mark Done
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" /> Completed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add Vehicle */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Add Vehicle to Inventory</h3>
              <button onClick={() => setIsAddVehicleOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Make *</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Hyundai / Honda"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Creta / City"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Variant</label>
                  <input
                    type="text"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    placeholder="SX / VX"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Stock Number</label>
                  <input
                    type="text"
                    value={stockNumber}
                    onChange={(e) => setStockNumber(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Manufacturing Year *</label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Fuel Type</label>
                  <select
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="cng">CNG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kilometers (KM)</label>
                  <input
                    type="number"
                    value={kilometers}
                    onChange={(e) => setKilometers(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description / Condition</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow transition"
              >
                + Add to Stock Inventory
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
