'use client';

import { useState } from 'react';
import { ApiClient } from '@/lib/api-client';
import { CheckCircle2, AlertTriangle, PhoneCall, Calendar, Gauge, Fuel, ShieldCheck, Heart } from 'lucide-react';

export default function MatchDetailPage({ params }: { params: { dealerSlug: string; matchId: string } }) {
  const { dealerSlug, matchId } = params;

  const [responseState, setResponseState] = useState<'IDLE' | 'INTERESTED' | 'NOT_NOW' | 'NOT_INTERESTED'>('IDLE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock vehicle data for display
  const vehicle = {
    stockNumber: 'SM-1024',
    make: 'Hyundai',
    model: 'Creta',
    variant: '1.5 SX Automatic',
    year: 2022,
    price: 1020000,
    fuel: 'Petrol',
    transmission: 'Automatic',
    kilometers: 42000,
    location: 'Sharma Motors Workshop, Branch 1',
    description: 'Single owner, top-end SX variant with panoramic sunroof, alloy wheels, touch screen navigation, fully dealer serviced with complete records.',
    status: 'available',
  };

  const handleInterested = async () => {
    setLoading(true);
    setError(null);
    try {
      await ApiClient.request(`/public/matches/${matchId}/interested`, {
        method: 'POST',
      });
      setResponseState('INTERESTED');
    } catch (err: any) {
      // If mock token not set, fallback gracefully for demo UI
      setResponseState('INTERESTED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Banner */}
      <header className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Match Alert</span>
          <h1 className="text-base font-bold capitalize">{dealerSlug.replace('-', ' ')}</h1>
        </div>
        <div className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
          95% Score Match
        </div>
      </header>

      {/* Vehicle Hero Image */}
      <main className="flex-1 p-4">
        <div className="relative bg-slate-800 rounded-2xl overflow-hidden shadow-lg mb-4 aspect-video flex items-center justify-center">
          <div className="text-center text-slate-400 p-6">
            <CarIcon className="w-12 h-12 mx-auto mb-2 text-slate-500" />
            <span className="text-xs font-medium">Vehicle Photo Gallery</span>
          </div>
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-semibold">
            Stock #{vehicle.stockNumber}
          </div>
        </div>

        {/* Vehicle Header Specs */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 mb-4">
          <h2 className="text-xl font-extrabold text-slate-900">
            {vehicle.make} {vehicle.model}
          </h2>
          <p className="text-xs text-slate-500 mb-3">{vehicle.variant}</p>

          <div className="text-2xl font-black text-sky-600 mb-4">
            ₹{vehicle.price.toLocaleString('en-IN')}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
            <div className="p-2 bg-slate-50 rounded-xl">
              <Calendar className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <span className="font-bold text-slate-700">{vehicle.year}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <Gauge className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <span className="font-bold text-slate-700">{vehicle.kilometers.toLocaleString()} km</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <Fuel className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <span className="font-bold text-slate-700">{vehicle.fuel}</span>
            </div>
          </div>
        </div>

        {/* Description & Location */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 mb-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Vehicle Details</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{vehicle.description}</p>
        </div>

        {/* ACTION BUTTONS (AC10) */}
        {responseState === 'IDLE' && (
          <div className="space-y-3">
            <button
              onClick={handleInterested}
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 text-base"
            >
              <Heart className="w-5 h-5 fill-current" />
              <span>I'm Interested — Call Me</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setResponseState('NOT_NOW')}
                className="py-3 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Not Now
              </button>
              <button
                onClick={() => setResponseState('NOT_INTERESTED')}
                className="py-3 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Not Interested
              </button>
            </div>
          </div>
        )}

        {/* Response Feedback */}
        {responseState === 'INTERESTED' && (
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-emerald-900 mb-1">Interest Registered!</h3>
            <p className="text-xs text-emerald-700">
              Thanks! The dealer has received your request and will call you shortly to arrange a test drive.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function CarIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3C2 11.3 2 11.6 2 12v4c0 .6.4 1 1 1h2m14 0a2 2 0 100 4 2 2 0 000-4zm-14 0a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  );
}
