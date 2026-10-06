'use client';

import Link from 'next/link';
import { Car, Building2, ShieldCheck, Sparkles, ArrowRight, Zap, CheckCircle2, MessageSquare, KeyRound } from 'lucide-react';

export default function RootHomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <header className="px-8 py-5 border-b border-slate-800/80 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/30">
            DC
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight">DealConnect</h1>
            <p className="text-[10px] text-sky-400 font-medium">Multi-Tenant Used-Car SaaS Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-semibold">
          <Link
            href="/d/sharma-motors"
            className="px-4 py-2 text-slate-300 hover:text-white transition hidden md:block"
          >
            Customer Storefront →
          </Link>
          <Link
            href="/dashboard"
            className="px-4.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-600/30 font-bold transition flex items-center space-x-1"
          >
            <Building2 className="w-4 h-4 mr-1" />
            <span>Dealer Dashboard</span>
          </Link>
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl transition flex items-center space-x-1"
          >
            <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" />
            <span>Admin</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-16 flex-1 flex flex-col justify-center space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-sky-950/80 border border-sky-700/60 rounded-full text-sky-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Automated 100-Point Vehicle-to-Requirement Matching Engine</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Turn Used-Car Buyers Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">Automated WhatsApp Sales</span>
          </h2>

          <p className="text-slate-400 text-base leading-relaxed">
            DealConnect is a multi-tenant SaaS platform built for used-car dealerships. It matches buyer preferences against live inventory, dispatches WhatsApp alerts via outbox event pipelines, and protects tenant data with PostgreSQL Row Level Security (RLS).
          </p>

          {/* Quick Portal Switcher CTA Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 max-w-3xl mx-auto">
            <Link
              href="/dashboard"
              className="p-5 bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 hover:border-sky-500 rounded-3xl transition text-left group shadow-xl"
            >
              <div className="p-3 bg-sky-950 text-sky-400 rounded-2xl w-fit mb-3 group-hover:scale-110 transition">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-sky-400 transition">Dealer Dashboard</h3>
              <p className="text-xs text-slate-400 mt-1">Manage stock inventory, qualified leads, and sales tasks</p>
              <span className="inline-flex items-center text-xs text-sky-400 font-bold mt-4">Open Portal →</span>
            </Link>

            <Link
              href="/d/sharma-motors"
              className="p-5 bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 hover:border-emerald-500 rounded-3xl transition text-left group shadow-xl"
            >
              <div className="p-3 bg-emerald-950 text-emerald-400 rounded-2xl w-fit mb-3 group-hover:scale-110 transition">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition">Customer Portal</h3>
              <p className="text-xs text-slate-400 mt-1">Browse cars, OTP verification, submit preferences</p>
              <span className="inline-flex items-center text-xs text-emerald-400 font-bold mt-4">View Storefront →</span>
            </Link>

            <Link
              href="/admin"
              className="p-5 bg-gradient-to-b from-slate-900 to-slate-900/80 border border-slate-800 hover:border-indigo-500 rounded-3xl transition text-left group shadow-xl"
            >
              <div className="p-3 bg-indigo-950 text-indigo-400 rounded-2xl w-fit mb-3 group-hover:scale-110 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition">Platform Super Admin</h3>
              <p className="text-xs text-slate-400 mt-1">Onboard dealerships, platform analytics & governance</p>
              <span className="inline-flex items-center text-xs text-indigo-400 font-bold mt-4">Admin Control →</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-800/80">
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-2">
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
              <Zap className="w-4 h-4" />
              <span>100-Point Matching Engine</span>
            </div>
            <p className="text-xs text-slate-400">
              Scoring algorithms match buyer requirements across budget, make/model, year, fuel, transmission, and KM.
            </p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>Transactional Outbox Worker</span>
            </div>
            <p className="text-xs text-slate-400">
              Decoupled async event pipeline ensures 100% reliable WhatsApp match delivery with exponential retry backoff.
            </p>
          </div>

          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
              <KeyRound className="w-4 h-4" />
              <span>PostgreSQL Row Level Security</span>
            </div>
            <p className="text-xs text-slate-400">
              Enforces database-level tenant isolation (`app.current_tenant_id`). Zero risk of cross-dealer data leakage.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        DealConnect Monorepo • Multi-Tenant Used-Car Dealer SaaS Platform
      </footer>
    </div>
  );
}
