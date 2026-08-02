import React, { useState } from 'react';
import { Lender } from '../types';
import { LenderCard } from '../components/LenderCard';
import {
  Store,
  Building2,
  Search,
  SlidersHorizontal,
  User,
  FileText,
  Users,
  Headphones,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Home,
  Phone,
} from 'lucide-react';

interface VendorDashboardProps {
  lenders: Lender[];
  onOpenSubscription: () => void;
  activeTab?: 'home' | 'lenders' | 'requests' | 'profile';
  onTabChange?: (tab: 'home' | 'lenders' | 'requests' | 'profile') => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  lenders,
  onOpenSubscription,
  activeTab: controlledActiveTab,
  onTabChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'home' | 'lenders' | 'requests' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabChange = (tab: 'home' | 'lenders' | 'requests' | 'profile') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredLenders = lenders.filter((l) =>
    l.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.institutionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.loanCategories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
        
        {/* TAB 1: HOME VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Top Cards Hero Banner: Responsive Grid (1 col Mobile, 2 col Tab, 3 col Desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              
              {/* Card 1: Welcome Royal Blue Card */}
              <div className="card-blue-header p-5 md:p-6 shadow-lg relative overflow-hidden flex items-center justify-between min-h-[160px]">
                <div className="space-y-1 z-10">
                  <div className="text-xs text-blue-200 font-medium">Welcome,</div>
                  <h2 className="text-2xl font-extrabold text-white font-heading">Ramesh Kumar</h2>
                  <div className="pt-2">
                    <span className="badge-verified-green bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Vendor
                    </span>
                  </div>
                </div>

                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner z-10">
                  <Store className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Card 2: Find & Connect with Lenders Card */}
              <div className="card-white p-5 md:p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg font-heading">Find & Connect with Lenders</h3>
                    <p className="text-xs text-slate-500 mt-1">Get the best funding options from trusted lenders near you.</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>

                <button
                  onClick={() => handleTabChange('lenders')}
                  className="btn-sbni-green mt-4 text-xs justify-center py-2.5 shadow-sm"
                >
                  <span>Find Lenders Near You</span>
                </button>
              </div>

              {/* Card 3: Lenders Around You Card */}
              <div className="card-white p-5 md:p-6 flex flex-col justify-between hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg font-heading">Lenders Around You</h3>
                    <p className="text-xs text-slate-500 mt-1">Find trusted lenders within 10 KM radius and get quick support.</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-100/70 border border-emerald-200 flex flex-col items-center justify-center text-emerald-700 flex-shrink-0 font-bold text-[10px]">
                    <MapPin className="w-4 h-4 text-emerald-600 mb-0.5" />
                    <span>10 KM</span>
                  </div>
                </div>

                <button
                  onClick={() => handleTabChange('lenders')}
                  className="btn-sbni-green mt-4 text-xs justify-center py-2.5 shadow-sm"
                >
                  <span>Search Lenders →</span>
                </button>
              </div>

            </div>

            {/* Quick Actions Bar */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-base font-heading">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <div 
                  onClick={() => handleTabChange('profile')}
                  className="card-white p-4 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-blue-600 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">My Profile</span>
                </div>

                <div 
                  onClick={() => handleTabChange('requests')}
                  className="card-white p-4 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-blue-600 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Loan Requests</span>
                </div>

                <div 
                  onClick={() => handleTabChange('lenders')}
                  className="card-white p-4 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-blue-600 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">My Connections</span>
                </div>

                <div 
                  onClick={onOpenSubscription}
                  className="card-white p-4 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Support & Subscription</span>
                </div>
              </div>
            </div>

            {/* Main Content Area: Left (Featured Lenders Grid) & Right (Recent Activity Sidebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (2 Cols on Desktop): Nearby Lenders Grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-lg font-heading">Recommended Lenders Nearby</h3>
                  <button
                    onClick={() => handleTabChange('lenders')}
                    className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View All ({lenders.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {lenders.slice(0, 3).map((lender) => (
                    <LenderCard
                      key={lender.id}
                      lender={lender}
                      onOpenSubscription={onOpenSubscription}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column (1 Col on Desktop): Recent Activity & Protection Banner */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-lg font-heading">Recent Activity</h3>

                <div className="card-white p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Loan request submitted</div>
                      <div className="text-slate-500 text-xs mt-0.5">Business Loan • 02 May 2024</div>
                    </div>
                    <span className="badge-pending-amber">Pending</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Profile verified successfully</div>
                      <div className="text-slate-500 text-xs mt-0.5">Vendor Verification • 30 Apr 2024</div>
                    </div>
                    <span className="badge-verified-green">Completed</span>
                  </div>
                </div>

                {/* Protection Guarantee Banner */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3 font-medium shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 mb-0.5">100% Verified Lenders</div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      All registered banks, NBFCs, and financial partners undergo strict compliance verification. Your data is encrypted & safe.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: LENDERS DISCOVERY VIEW */}
        {activeTab === 'lenders' && (
          <div className="space-y-6">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Lenders Near You</h2>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Showing verified lenders within <span className="text-emerald-600 font-bold">10 KM Radius</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search lenders by name or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-sbni pl-10 text-xs py-2.5"
                  />
                </div>

                <button className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                </button>
              </div>
            </div>

            {/* Lender Cards Grid (1 col Mobile, 2 col Tablet, 3 col Desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredLenders.map((lender) => (
                <LenderCard
                  key={lender.id}
                  lender={lender}
                  onOpenSubscription={onOpenSubscription}
                />
              ))}
            </div>

            {/* Data Protection Footer Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 flex items-center justify-center gap-2 font-medium">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>All lenders are verified & trusted by SBNI Money App. Your data is safe with us.</span>
            </div>

          </div>
        )}

        {/* TAB 3: LOAN REQUESTS VIEW */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading">My Loan Applications & Requests</h2>
                <p className="text-xs text-slate-500 font-medium">Track your active loan applications and lender connections</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="badge-pending-amber">Under Review</span>
                  <span className="text-xs text-slate-400">Application #REQ-9842</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Business Working Capital Loan</h3>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Requested Amount: <span className="font-bold text-slate-900">₹5,00,000</span></div>
                  <div>Submitted to: <span className="font-bold text-blue-900">State Bank of India & HDFC Bank</span></div>
                  <div>Date: <span className="font-medium">02 May 2024</span></div>
                </div>
              </div>

              <div className="card-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="badge-verified-green">KYC Verified</span>
                  <span className="text-xs text-slate-400">Doc #KYC-4410</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Vendor Entity KYC Verification</h3>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Status: <span className="font-bold text-emerald-700">Verified & Active</span></div>
                  <div>GST / License: <span className="font-bold text-slate-900">27AAPFU0939L1ZV</span></div>
                  <div>Verified on: <span className="font-medium">30 Apr 2024</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VENDOR PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Vendor Business Profile</h2>
              <p className="text-xs text-slate-500 font-medium">Manage business details and contact preferences</p>
            </div>

            <div className="card-white p-6 space-y-4 max-w-2xl">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-extrabold text-xl">
                  RK
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Ramesh Kumar</h3>
                  <p className="text-xs text-slate-500 font-medium">Kumar General Store • Retail Vendor</p>
                  <span className="badge-verified-green mt-1">✓ Verified Vendor</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold">Mobile Number</label>
                  <div className="font-bold text-slate-800 mt-0.5">+91 98765 43210</div>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Email ID</label>
                  <div className="font-bold text-slate-800 mt-0.5">vendor@sbnimoney.com</div>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Shop Address</label>
                  <div className="font-bold text-slate-800 mt-0.5">Shop 12, Main Market, BKC, Mumbai</div>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">GSTIN / Udyam Registration</label>
                  <div className="font-bold text-slate-800 mt-0.5">27AAPFU0939L1ZV</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Sticky Navigation Bar - Responsive for Mobile & Tablet (lg:hidden) */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 py-2 px-4 flex items-center justify-around w-full max-w-md mx-auto shadow-2xl lg:hidden rounded-t-2xl">
        <button
          onClick={() => handleTabChange('home')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-extrabold py-1 px-3 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-[#003893] bg-blue-50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => handleTabChange('lenders')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-extrabold py-1 px-3 rounded-xl transition-all ${
            activeTab === 'lenders' ? 'text-[#003893] bg-blue-50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span>Lenders</span>
        </button>

        {/* Floating Action Button */}
        <button
          onClick={onOpenSubscription}
          title="Pay Subscription"
          className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all -mt-6 border-4 border-white"
        >
          <Phone className="w-6 h-6 fill-white" />
        </button>

        <button
          onClick={() => handleTabChange('requests')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-extrabold py-1 px-3 rounded-xl transition-all ${
            activeTab === 'requests' ? 'text-[#003893] bg-blue-50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Requests</span>
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-extrabold py-1 px-3 rounded-xl transition-all ${
            activeTab === 'profile' ? 'text-[#003893] bg-blue-50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </div>

    </div>
  );
};
