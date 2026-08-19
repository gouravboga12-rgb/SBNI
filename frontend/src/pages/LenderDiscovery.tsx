import React, { useState, useEffect } from 'react';
import { Lender } from '../types';
import { fetchLenders } from '../services/api';
import { LenderCard } from '../components/LenderCard';
import { LoanRequestModal } from '../components/LoanRequestModal';
import { Search, MapPin, SlidersHorizontal, Building2, Zap, ShieldCheck } from 'lucide-react';

interface LenderDiscoveryProps {
  onOpenSubscription: () => void;
  hasActiveSubscription: boolean;
}

export const LenderDiscovery: React.FC<LenderDiscoveryProps> = ({
  onOpenSubscription,
  hasActiveSubscription,
}) => {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [radiusKm, setRadiusKm] = useState(100);

  const [selectedLenderForLoan, setSelectedLenderForLoan] = useState<Lender | null>(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);

  const handleRequestLoan = (lender: Lender) => {
    const isSubscribed = !!localStorage.getItem('sbni_token') || hasActiveSubscription;
    if (!isSubscribed) {
      onOpenSubscription();
      return;
    }
    setSelectedLenderForLoan(lender);
    setLoanModalOpen(true);
  };

  const loadLenders = () => {
    setLoading(true);
    fetchLenders({
      city: selectedCity || undefined,
    }).then((data) => {
      setLenders(data.lenders);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadLenders();
  }, [selectedCity, selectedCategory, radiusKm, hasActiveSubscription]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLenders();
  };

  return (
    <div className="py-10 bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              Find <span className="gradient-text">Verified Business Money Financers (Lenders)</span> Nearby
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Search nearby business money financers and lenders using distance radius and category filters.
            </p>
          </div>

          {!hasActiveSubscription && (
            <button
              onClick={onOpenSubscription}
              className="btn-primary py-2.5 px-5 text-xs font-extrabold flex-shrink-0"
            >
              <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Unlock All Phone Numbers & WhatsApp</span>
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Text Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Search Financer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass pl-10 py-2.5 text-xs"
            />
          </form>

          {/* City Filter */}
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="input-glass pl-10 py-2.5 text-xs bg-slate-900"
            >
              <option value="">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="New Delhi">New Delhi</option>
              <option value="Gurugram">Gurugram</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Pune">Pune</option>
              <option value="Ahmedabad">Ahmedabad</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-glass pl-10 py-2.5 text-xs bg-slate-900"
            >
              <option value="">All Categories</option>
              <option value="Business Loan">Business Loan</option>
              <option value="MSME Loan">MSME Loan</option>
              <option value="Machinery Loan">Machinery Loan</option>
              <option value="Commercial Loan">Commercial Credit</option>
            </select>
          </div>

          {/* Distance Radius Slider */}
          <div className="flex flex-col justify-center px-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" /> Max Radius:
              </span>
              <span className="text-cyan-400 font-bold">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="500"
              step="5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

        </div>

        {/* Lenders Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Loading verified lenders...
          </div>
        ) : lenders.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Lenders Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try expanding your search radius or changing category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lenders.map((lender) => (
              <LenderCard
                key={lender.id}
                lender={lender}
                onOpenSubscription={onOpenSubscription}
                onRequestLoan={handleRequestLoan}
              />
            ))}
          </div>
        )}

      </div>

      <LoanRequestModal
        isOpen={loanModalOpen}
        onClose={() => setLoanModalOpen(false)}
        lender={selectedLenderForLoan}
      />
    </div>
  );
};
