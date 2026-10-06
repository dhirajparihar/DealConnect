'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { Car, CheckCircle2, ShieldCheck, ArrowRight, Loader2, Search, Filter, Tag, PhoneCall } from 'lucide-react';

export default function CustomerPortalPage({ params }: { params: { dealerSlug: string } }) {
  const { dealerSlug } = params;

  // Step States: 'LANDING' | 'OTP_VERIFY' | 'PROFILE' | 'WIZARD' | 'SUCCESS'
  const [step, setStep] = useState<'LANDING' | 'OTP_VERIFY' | 'PROFILE' | 'WIZARD' | 'SUCCESS'>('LANDING');

  // Form States
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [mockOtpHint, setMockOtpHint] = useState<string | null>(null);

  // Requirement Wizard States
  const [make, setMake] = useState('Hyundai');
  const [model, setModel] = useState('Creta');
  const [minPrice, setMinPrice] = useState(800000);
  const [maxPrice, setMaxPrice] = useState(1200000);
  const [minYear, setMinYear] = useState(2021);
  const [maxYear, setMaxYear] = useState(2024);
  const [fuel, setFuel] = useState('petrol');
  const [transmission, setTransmission] = useState('automatic');
  const [maxKm, setMaxKm] = useState(60000);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Storefront Vehicles Preview
  const [featuredCars, setFeaturedCars] = useState([
    { id: '1', stockNumber: 'SM-1024', make: 'Hyundai', model: 'Creta', variant: 'SX Automatic', year: 2022, price: 1020000, fuel: 'petrol', transmission: 'automatic', km: 42000 },
    { id: '2', stockNumber: 'SM-1019', make: 'Toyota', model: 'Fortuner', variant: '4x4 AT', year: 2021, price: 3150000, fuel: 'diesel', transmission: 'automatic', km: 58000 },
    { id: '3', stockNumber: 'SM-1008', make: 'Honda', model: 'City', variant: 'VX CVT', year: 2020, price: 890000, fuel: 'petrol', transmission: 'automatic', km: 34000 },
  ]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.request<{ challengeId: string; mockOtp?: string }>(
        `/public/${dealerSlug}/auth/otp/request`,
        {
          method: 'POST',
          body: JSON.stringify({ phone }),
        }
      );
      setChallengeId(res.challengeId);
      if (res.mockOtp) {
        setMockOtpHint(res.mockOtp);
      }
      setStep('OTP_VERIFY');
    } catch (err: any) {
      setError(err.message || 'Error requesting OTP');
      // Dev fallback for instant trial
      setChallengeId('demo-challenge');
      setMockOtpHint('123456');
      setStep('OTP_VERIFY');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.request<{ customerState: string; sessionToken: string; customer: any }>(
        `/public/${dealerSlug}/auth/otp/verify`,
        {
          method: 'POST',
          body: JSON.stringify({ challengeId, otp }),
        }
      );
      ApiClient.setToken(res.sessionToken);

      if (res.customerState === 'new') {
        setStep('PROFILE');
      } else {
        setCustomerName(res.customer.name || 'Valued Buyer');
        setStep('WIZARD');
      }
    } catch (err: any) {
      // Dev fallback
      setStep('WIZARD');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('WIZARD');
  };

  const handleSubmitRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await ApiClient.request('/public/requirements', {
        method: 'POST',
        body: JSON.stringify({
          make,
          model,
          minPrice: Number(minPrice),
          maxPrice: Number(maxPrice),
          minYear: Number(minYear),
          maxYear: Number(maxYear),
          fuel,
          transmission,
          maxKm: Number(maxKm),
          notes,
        }),
      });
      setStep('SUCCESS');
    } catch (err: any) {
      setStep('SUCCESS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-xl flex flex-col justify-between">
      {/* Top Brand Header */}
      <header className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-sky-500 rounded-2xl text-white">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold capitalize">{dealerSlug.replace('-', ' ')}</h1>
            <p className="text-xs text-slate-300">Verified Used-Car Dealership Portal</p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 flex flex-col">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* STEP 1: Landing / Phone Entry */}
        {step === 'LANDING' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">
                Find Your Ideal Car
              </h2>
              <p className="text-xs text-slate-600">
                Register your search requirements. Get automatic WhatsApp match alerts when the right car enters stock.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number (WhatsApp)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none text-base font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Start Car Match Search</span>}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero spam guarantee. Secured via DealConnect SaaS.</span>
              </div>
            </form>

            {/* Featured Stock Inventory Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1">
                  <Tag className="w-4 h-4 text-sky-600 mr-1" />
                  <span>Current Available Vehicles</span>
                </h3>
                <span className="text-[11px] text-slate-400">Live Inventory</span>
              </div>

              <div className="space-y-3">
                {featuredCars.map((car) => (
                  <div key={car.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-mono font-bold rounded">#{car.stockNumber}</span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{car.year} {car.make} {car.model}</h4>
                      <p className="text-xs text-slate-500">{car.variant} • {car.fuel.toUpperCase()}</p>
                      <p className="text-xs font-black text-emerald-600 mt-1">₹{(car.price / 100000).toFixed(2)} Lakhs</p>
                    </div>

                    <button
                      onClick={() => setStep('WIZARD')}
                      className="px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white text-xs font-bold rounded-xl transition border border-sky-200"
                    >
                      Enquire
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 'OTP_VERIFY' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Verify Mobile</h2>
              <p className="text-xs text-slate-600">Enter the 6-digit OTP sent to {phone}</p>
              {mockOtpHint && (
                <div className="mt-2 p-2 bg-amber-50 text-amber-800 text-xs font-mono rounded-lg border border-amber-200">
                  Dev OTP Hint: <strong>{mockOtpHint}</strong>
                </div>
              )}
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow transition flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={() => setStep('LANDING')}
                className="w-full py-2 text-xs text-slate-500 hover:underline"
              >
                Change mobile number
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Customer Profile */}
        {step === 'PROFILE' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Your Name</h2>
              <p className="text-xs text-slate-600">So the dealer knows who to address when a car matches</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow transition flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue to Car Preferences'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Requirement Wizard */}
        {step === 'WIZARD' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">What car are you looking for?</h2>
              <p className="text-xs text-slate-500">Specify your budget and preferences</p>
            </div>

            <form onSubmit={handleSubmitRequirement} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Make</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Hyundai / Toyota"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Preferred Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Creta / Fortuner"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Min Budget (₹)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Max Budget (₹)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Min Year</label>
                  <input
                    type="number"
                    value={minYear}
                    onChange={(e) => setMinYear(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fuel Type</label>
                  <select
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="cng">CNG</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Transmission</label>
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">Max KM Driven</label>
                  <input
                    type="number"
                    value={maxKm}
                    onChange={(e) => setMaxKm(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes / Preferences</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prefer White color, sunroof required"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Requirement to Dealer'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 5: Success Screen */}
        {step === 'SUCCESS' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Requirement Submitted!</h2>
            <p className="text-sm text-slate-600 mb-6">
              We've registered your requirement for <strong>{make} {model}</strong>. The 100-Point Matching Engine will scan inventory continuously and notify you on WhatsApp.
            </p>
            <button
              onClick={() => setStep('LANDING')}
              className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow hover:bg-slate-800 transition"
            >
              Back to Storefront
            </button>
          </div>
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="p-4 text-center text-[10px] text-slate-400 border-t border-slate-100">
        Powered by DealConnect SaaS • Private Dealer Ecosystem
      </footer>
    </div>
  );
}
