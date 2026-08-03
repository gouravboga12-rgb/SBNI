import React, { useState } from 'react';
import { Search, MapPin, Building2, ShieldCheck } from 'lucide-react';

interface HeroBannerProps {
  onSearch: (city: string, category: string) => void;
  onOpenSubscription: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onSearch, onOpenSubscription }) => {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(city, category);
  };

  return (
    <div className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-indigo-500/10 to-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Tagline */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-slate-300">
              India's B2B FinTech Loan Discovery Marketplace
            </span>
          </div>
        </div>

        {/* Hero Heading & Subtitle */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] font-heading">
            Discover Nearby <span className="gradient-text">Verified Lenders</span>. <br />
            Connect & Grow <span className="gradient-emerald-text">Without Middlemen</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Just Paisa App connects Business Owners directly with verified Banks, NBFCs, and Lenders. Search location-based lending partners, review verified credentials, and unlock contact access with a single transparent subscription.
          </p>

          {/* Compliance Marketplace Disclaimer */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium max-w-2xl mx-auto">
            <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Marketplace Model: Just Paisa App does not approve, disburse, or track credit. All financial discussions occur directly between vendor and verified lender.
            </span>
          </div>
        </div>

        {/* Quick Search & Filter Panel */}
        <div className="mt-10 max-w-4xl mx-auto">
          <form
            onSubmit={handleSearchSubmit}
            className="glass-panel-glow p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4"
          >
            <div className="relative w-full md:flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 z-10" />
              <input
                type="text"
                placeholder="Enter City or Pin Code (e.g. Mumbai, Delhi)..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-glass pl-11 py-3 text-xs sm:text-sm text-white"
              />
            </div>

            <div className="relative w-full md:flex-1">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 z-10" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-glass pl-11 py-3 text-xs sm:text-sm text-white appearance-none bg-slate-900 cursor-pointer"
              >
                <option value="">All Loan Categories</option>
                <option value="Business Loan">Unsecured Business Loan</option>
                <option value="MSME Loan">MSME Working Capital</option>
                <option value="Machinery Loan">Machinery & Equipment Finance</option>
                <option value="Commercial Loan">Commercial Credit & Overdraft</option>
                <option value="Letter of Credit">Letter of Credit & Trade Finance</option>
              </select>
            </div>

            <button type="submit" className="btn-primary w-full md:w-auto py-3 px-8 text-xs sm:text-sm font-bold justify-center whitespace-nowrap">
              <Search className="w-4 h-4" />
              <span>Search Lenders</span>
            </button>
          </form>
        </div>

        {/* Live Marketplace Statistics Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="glass-panel p-6 text-center border-slate-800">
            <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-heading">1,250+</div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium mt-1">Verified Banks & NBFCs</div>
          </div>
          <div className="glass-panel p-6 text-center border-slate-800">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-heading">50,000+</div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium mt-1">Subscribed Vendors</div>
          </div>
          <div className="glass-panel p-6 text-center border-slate-800">
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400 font-heading">28 States</div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium mt-1">Pan-India Coverage</div>
          </div>
          <div className="glass-panel p-6 text-center border-slate-800">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-heading">100%</div>
            <div className="text-xs sm:text-sm text-slate-400 font-medium mt-1">Direct Communication</div>
          </div>
        </div>

      </div>
    </div>
  );
};
