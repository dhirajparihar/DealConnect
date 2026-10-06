'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const dealerSlug = params.dealerSlug as string;
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    async function loadMatch() {
      try {
        const data = await ApiClient.request<any>(`/public/matches/${matchId}`, {
          headers: { 'X-Dealer-Slug': dealerSlug }
        });
        setMatch(data);
      } catch (err: any) {
        if (err.message.includes('401') || err.message.includes('Customer authentication')) {
          router.push(`/d/${dealerSlug}?redirect=/d/${dealerSlug}/match/${matchId}`);
        } else {
          setError(err.message || 'Failed to load match.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadMatch();
  }, [dealerSlug, matchId, router]);

  const handleInterested = async () => {
    setActing(true);
    try {
      await ApiClient.request<any>(`/public/matches/${matchId}/interested`, {
        method: 'POST',
        headers: { 'X-Dealer-Slug': dealerSlug }
      });
      alert("Great! The dealer has been notified and will contact you shortly.");
      setMatch({ ...match, status: 'interested' });
    } catch (err: any) {
      alert("Failed to express interest: " + err.message);
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-md w-full">
          {error}
        </div>
      </div>
    );
  }

  if (!match) return null;

  const v = match.vehicle;
  const image = v.media?.[0]?.url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header Image */}
        <div className="relative h-64 md:h-96">
          <img src={image} alt={`${v.year} ${v.make} ${v.model}`} className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-primary shadow-lg border border-white/20">
            ₹{Number(v.price).toLocaleString('en-IN')}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {v.year} {v.make} {v.model} {v.variant}
            </h1>
            <p className="text-gray-200">
              {match.dealer.name} • {v.fuel} • {v.transmission}
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          {/* Match Score */}
          <div className="flex items-center space-x-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
            <div className="flex-shrink-0 bg-primary text-white font-bold text-2xl h-16 w-16 rounded-full flex items-center justify-center shadow-md">
              {match.score}%
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Match Score</h3>
              <p className="text-gray-600 text-sm">Based on your requirement preferences.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Vehicle Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Vehicle Details</h3>
              <dl className="grid grid-cols-2 gap-y-4 text-sm">
                <dt className="text-gray-500">Make</dt>
                <dd className="font-medium text-gray-900">{v.make}</dd>
                <dt className="text-gray-500">Model</dt>
                <dd className="font-medium text-gray-900">{v.model}</dd>
                <dt className="text-gray-500">Year</dt>
                <dd className="font-medium text-gray-900">{v.year}</dd>
                <dt className="text-gray-500">Fuel</dt>
                <dd className="font-medium text-gray-900">{v.fuel || '-'}</dd>
                <dt className="text-gray-500">Transmission</dt>
                <dd className="font-medium text-gray-900">{v.transmission || '-'}</dd>
                <dt className="text-gray-500">Kilometers</dt>
                <dd className="font-medium text-gray-900">{v.kilometers ? v.kilometers.toLocaleString() + ' km' : '-'}</dd>
              </dl>
            </div>

            {/* Score Breakdown (T065) */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Why it matched</h3>
              <div className="space-y-3">
                {Object.entries(match.scoreBreakdown).map(([key, value]) => {
                  if (key === 'total') return null;
                  const maxScores: Record<string, number> = {
                    make_model: 30, budget: 25, year: 15, fuel: 10, transmission: 10, kilometers: 5, location: 5
                  };
                  const label = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const max = maxScores[key] || 0;
                  const pct = max > 0 ? ((value as number) / max) * 100 : 0;
                  
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{label}</span>
                        <span className="font-medium text-gray-900">{value as number}/{max}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="pt-6 border-t">
            {match.status === 'interested' ? (
              <div className="bg-green-50 text-green-800 p-6 rounded-xl border border-green-200 text-center">
                <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="font-bold text-lg">Interest Sent!</h3>
                <p>The dealer will contact you soon about this vehicle.</p>
              </div>
            ) : (
              <button
                onClick={handleInterested}
                disabled={acting}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all active:scale-[0.98] flex justify-center items-center text-lg disabled:opacity-70"
              >
                {acting ? 'Sending...' : 'I am Interested'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
