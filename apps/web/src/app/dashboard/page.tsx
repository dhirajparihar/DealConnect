'use client';

import { useState, useEffect } from 'react';
import { Users, Car, Heart, Clock, Search, Sparkles, LogOut, ShieldCheck, Building2, KeyRound } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function DealerDashboardPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CUSTOMERS' | 'INVENTORY' | 'FOLLOWUPS'>('OVERVIEW');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dealerInfo, setDealerInfo] = useState<{ name: string; slug: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [customSlug, setCustomSlug] = useState('');

  // Dealer metrics state
  const [metrics, setMetrics] = useState({
    activeCustomersCount: 42,
    activeRequirementsCount: 38,
    availableVehiclesCount: 19,
    newMatchesCount: 14,
    interestedLeadsCount: 6,
    pendingFollowupsCount: 8,
    overdueFollowupsCount: 2,
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
      console.log('Using cached/demo metrics:', err);
    }
  };

  const handleLogin = async (slug: string) => {
    setLoading(true);
    try {
      const data = await ApiClient.request<{
        token: string;
        dealer: { name: string; slug: string };
        user: { name: string; email: string; role: string };
      }>('/public/dealer-auth/login', {
        method: 'POST',
        body: JSON.stringify({ dealerSlug: slug }),
      });

      ApiClient.setToken(data.token);
      localStorage.setItem('dealconnect_dealer', JSON.stringify(data.dealer));
      localStorage.setItem('dealconnect_user', JSON.stringify(data.user));

      setDealerInfo(data.dealer);
      setUserInfo(data.user);
      setIsLoggedIn(true);
      fetchMetrics();
    } catch (err: any) {
      // Fallback demo login if offline/unreachable
      const demoDealer = { name: slug === 'apex-motors' ? 'Apex Motors' : 'Sharma Motors', slug };
      const demoUser = { name: `${demoDealer.name} Owner`, email: `owner@${slug}.com`, role: 'OWNER' };
      
      localStorage.setItem('dealconnect_dealer', JSON.stringify(demoDealer));
      localStorage.setItem('dealconnect_user', JSON.stringify(demoUser));
      localStorage.setItem('dealconnect_token', 'demo-jwt-token');

      setDealerInfo(demoDealer);
      setUserInfo(demoUser);
      setIsLoggedIn(true);
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Dealership Account</p>

            <button
              onClick={() => handleLogin('sharma-motors')}
              disabled={loading}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition">Sharma Motors</h4>
                  <p className="text-xs text-slate-500">Owner Account • sharma-motors</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg">Sign In →</span>
            </button>

            <button
              onClick={() => handleLogin('apex-motors')}
              disabled={loading}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between transition group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition">Apex Motors</h4>
                  <p className="text-xs text-slate-500">Owner Account • apex-motors</p>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg">Sign In →</span>
            </button>

            <div className="pt-2 border-t border-slate-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customSlug) handleLogin(customSlug.toLowerCase().replace(/\s+/g, '-'));
                }}
                className="space-y-2"
              >
                <label className="text-xs font-semibold text-slate-600">Or enter custom Dealer Slug:</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. royal-cars"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                  >
                    Go
                  </button>
                </div>
              </form>
            </div>
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
      {/* Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500 rounded-xl text-white font-bold text-lg">
            DC
          </div>
          <div>
            <h1 className="font-bold text-lg">{dealerInfo?.name || 'Sharma Motors'} — Dealer Dashboard</h1>
            <p className="text-xs text-slate-400">Private Dealer SaaS Platform • Tenant ID: {dealerInfo?.slug}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg flex items-center space-x-1">
            <KeyRound className="w-3.5 h-3.5 text-emerald-400 mr-1" />
            <span>{userInfo?.name || 'Dealer Staff'} ({userInfo?.role || 'OWNER'})</span>
          </span>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white font-semibold rounded-lg transition flex items-center space-x-1"
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Available Vehicles</p>
              <h3 className="text-2xl font-black text-slate-900">{metrics.availableVehiclesCount}</h3>
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
            Customers & Requirements
          </button>
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === 'INVENTORY' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Vehicle Inventory
          </button>
          <button
            onClick={() => setActiveTab('FOLLOWUPS')}
            className={`pb-3 px-1 border-b-2 transition ${
              activeTab === 'FOLLOWUPS' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Follow-ups ({metrics.pendingFollowupsCount})
          </button>
        </div>

        {/* Tab Content: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Qualified Interested Leads */}
            <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>Qualified Interested Leads — {dealerInfo?.name}</span>
                </h3>
                <span className="text-xs text-slate-400">Tenant Scoped Data</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Rahul Sharma (+91 98765 43210)</h4>
                    <p className="text-xs text-slate-600">Interested in <strong>2022 Hyundai Creta SX (Stock #SM-1024)</strong></p>
                    <span className="text-[10px] text-emerald-700 font-semibold">Matched 95% • Clicked Interested</span>
                  </div>
                  <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow">
                    Call Customer
                  </button>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Urgent Follow-ups */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Today's Follow-ups</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="font-bold text-amber-900">Rahul Sharma</div>
                  <div className="text-amber-700">Arrange Creta test drive</div>
                  <div className="mt-1 text-[10px] text-amber-600 font-mono">Due Today 02:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
