'use client';

import { useState } from 'react';
import { Users, Car, Heart, Clock, Search, AlertCircle, CheckCircle, Plus, Sparkles } from 'lucide-react';

export default function DealerDashboardPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CUSTOMERS' | 'INVENTORY' | 'FOLLOWUPS'>('OVERVIEW');

  // Sample dealer metrics
  const metrics = {
    activeCustomersCount: 42,
    activeRequirementsCount: 38,
    availableVehiclesCount: 19,
    newMatchesCount: 14,
    interestedLeadsCount: 6,
    pendingFollowupsCount: 8,
    overdueFollowupsCount: 2,
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500 rounded-xl text-white font-bold text-lg">
            DC
          </div>
          <div>
            <h1 className="font-bold text-lg">Sharma Motors — Dealer Dashboard</h1>
            <p className="text-xs text-slate-400">Private Dealer SaaS Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg">Owner Access</span>
          <button className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 font-semibold rounded-lg text-white transition">
            + Add Vehicle
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
                  <span>Qualified Interested Leads</span>
                </h3>
                <span className="text-xs text-slate-400">Action Required</span>
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

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Ankit Verma (+91 99887 76655)</h4>
                    <p className="text-xs text-slate-600">Interested in <strong>2021 Toyota Fortuner (Stock #SM-1019)</strong></p>
                    <span className="text-[10px] text-slate-500 font-semibold">Matched 88% • Clicked Interested</span>
                  </div>
                  <button className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow">
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

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-800">Priya Singh</div>
                  <div className="text-slate-600">Follow up on Honda City valuation</div>
                  <div className="mt-1 text-[10px] text-slate-400 font-mono">Due Tomorrow</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
