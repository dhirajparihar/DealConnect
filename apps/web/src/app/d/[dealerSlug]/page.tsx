'use client';

import { useState } from 'react';
import { ApiClient } from '@/lib/api-client';
import { Car, CheckCircle2, ShieldCheck, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export default function CustomerPortalPage({ params }: { params: { dealerSlug: string } }) {
  const { dealerSlug } = params;

  // Step States: 'LANDING' | 'OTP_REQUEST' | 'OTP_VERIFY' | 'PROFILE' | 'REQUIREMENT_WIZARD' | 'SUCCESS'
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
      setError(err.message);
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
        setCustomerName(res.customer.name || '');
        setStep('WIZARD');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await ApiClient.request('/public/customer/profile', {
        method: 'POST',
        body: JSON.stringify({ name: customerName, email: customerEmail || null }),
      });
      setStep('WIZARD');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl flex flex-col justify-between">
      {/* Top Brand Header */}
      <header className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-sky-500 rounded-2xl text-white">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold capitalize">{dealerSlug.replace('-', ' ')}</h1>
            <p className="text-xs text-slate-300">Verified Pre-Owned Dealership</p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 flex flex-col justify-center">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* STEP 1: Landing / Phone Entry */}
        {step === 'LANDING' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                Tell us what car you're looking for
              </h2>
              <p className="text-sm text-slate-600">
                You don't need to keep checking. We'll notify you automatically on WhatsApp when your car arrives.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none text-base"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2 transition"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Get OTP & Start</span>}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Your mobile is verified & 100% private to this dealer.</span>
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
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
              <p className="text-xs text-slate-600">So we know who to address when a car matches</p>
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue to Car Search'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Requirement Wizard */}
        {step === 'WIZARD' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">What car are you looking for?</h2>
              <p className="text-xs text-slate-500">Fill in your preferences below</p>
            </div>

            <form onSubmit={handleSubmitRequirement} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Make</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Hyundai / Toyota"
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Creta / Fortuner"
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
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
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Max Budget (₹)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
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
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fuel</label>
                  <select
                    value={fuel}
                    onChange={(e) => setFuel(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
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
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Max KM</label>
                  <input
                    type="number"
                    value={maxKm}
                    onChange={(e) => setMaxKm(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes / Special Preferences</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Prefer White color, sunroof required"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Car Requirement'}
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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Requirement Saved!</h2>
            <p className="text-sm text-slate-600 mb-6">
              We've registered your requirement for <strong>{make} {model}</strong>. As soon as a matching car arrives in our stock, we'll alert you on WhatsApp.
            </p>
            <button
              onClick={() => setStep('WIZARD')}
              className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow hover:bg-slate-800 transition"
            >
              Add Another Search
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
