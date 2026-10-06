'use client';

import { useState } from 'react';
import { ShieldCheck, Building2, Plus, Users, Car, CheckCircle2 } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

export default function PlatformAdminPage() {
  const [dealers, setDealers] = useState([
    { name: 'Sharma Motors', slug: 'sharma-motors', status: 'ACTIVE', inventoryCount: 19, leadsCount: 42 },
    { name: 'Apex Motors', slug: 'apex-motors', status: 'ACTIVE', inventoryCount: 14, leadsCount: 28 },
    { name: 'Royal Dealership', slug: 'royal-cars', status: 'PENDING', inventoryCount: 0, leadsCount: 0 },
  ]);

  const [newDealerName, setNewDealerName] = useState('');
  const [newDealerSlug, setNewDealerSlug] = useState('');
  const [message, setMessage] = useState('');

  const handleCreateDealer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealerName || !newDealerSlug) return;

    setDealers([
      ...dealers,
      {
        name: newDealerName,
        slug: newDealerSlug.toLowerCase().replace(/\s+/g, '-'),
        status: 'ACTIVE',
        inventoryCount: 0,
        leadsCount: 0,
      },
    ]);

    setMessage(`Successfully created dealership: ${newDealerName}`);
    setNewDealerName('');
    setNewDealerSlug('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">DealConnect Platform Super Admin</h1>
            <p className="text-xs text-slate-400">Manage all registered used-car dealerships, tenants, and global configurations</p>
          </div>
        </div>

        <span className="px-3.5 py-1.5 bg-indigo-950 border border-indigo-700/50 text-indigo-300 text-xs font-bold rounded-full">
          Super Admin Access
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Onboarded Dealers</p>
            <h3 className="text-3xl font-black text-white">{dealers.length}</h3>
          </div>
          <div className="p-3 bg-indigo-900/50 text-indigo-400 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Platform Inventory</p>
            <h3 className="text-3xl font-black text-emerald-400">33 Vehicles</h3>
          </div>
          <div className="p-3 bg-emerald-900/50 text-emerald-400 rounded-2xl">
            <Car className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Active Leads</p>
            <h3 className="text-3xl font-black text-sky-400">70 Leads</h3>
          </div>
          <div className="p-3 bg-sky-900/50 text-sky-400 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Onboard New Dealer & List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Onboard Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            <span>Onboard New Dealership</span>
          </h3>

          {message && (
            <div className="p-3 bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleCreateDealer} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Dealership Name</label>
              <input
                type="text"
                placeholder="e.g. Royal Motors"
                value={newDealerName}
                onChange={(e) => setNewDealerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Tenant Slug (URL Path)</label>
              <input
                type="text"
                placeholder="e.g. royal-motors"
                value={newDealerSlug}
                onChange={(e) => setNewDealerSlug(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              + Create Dealership Tenant
            </button>
          </form>
        </div>

        {/* Dealers Table */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-lg font-bold text-white">Registered Dealerships</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Dealership Name</th>
                  <th className="p-3">Tenant Slug</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Inventory</th>
                  <th className="p-3">Leads</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dealers.map((d) => (
                  <tr key={d.slug} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-white">{d.name}</td>
                    <td className="p-3 font-mono text-slate-400">/d/{d.slug}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold rounded-md">
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{d.inventoryCount} cars</td>
                    <td className="p-3 text-slate-300">{d.leadsCount} leads</td>
                    <td className="p-3 text-right">
                      <a
                        href={`/d/${d.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        Visit Storefront →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
