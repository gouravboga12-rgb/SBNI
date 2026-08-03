import React, { useState } from 'react';
import { Lender } from '../types';
import { LenderCard } from '../components/LenderCard';
import { LoanRequestModal } from '../components/LoanRequestModal';
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
  Camera,
  Eye,
  EyeOff,
  Lock,
  FileCheck,
  ExternalLink,
  Mail,
  ShieldAlert,
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
  const [selectedLenderForLoan, setSelectedLenderForLoan] = useState<Lender | null>(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);

  // Profile Avatar & Password Visibility State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return localStorage.getItem('sbni_vendor_avatar') || null;
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setAvatarUrl(dataUrl);
          localStorage.setItem('sbni_vendor_avatar', dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRequestLoan = (lender: Lender) => {
    const isSubscribed =
      localStorage.getItem('sbni_vendor_subscribed') === 'true' ||
      localStorage.getItem('sbni_subscribed') === 'true';

    if (!isSubscribed) {
      onOpenSubscription();
      return;
    }

    setSelectedLenderForLoan(lender);
    setLoanModalOpen(true);
  };

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
              <div className="card-blue-header p-6 shadow-xl relative overflow-hidden flex items-center justify-between min-h-[170px] border border-blue-400/20 group">
                {/* Glow Overlay */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-400/30 transition-colors" />

                <div className="space-y-1.5 z-10">
                  <div className="text-xs text-blue-200 font-semibold tracking-wide uppercase">Welcome back,</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">Ramesh Kumar</h2>
                  <div className="pt-2">
                    <span className="badge-verified-green bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Business Vendor
                    </span>
                  </div>
                </div>

                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl z-10 shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Vendor Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  )}
                </div>
              </div>

              {/* Card 2: Find & Connect with Lenders Card */}
              <div className="card-white-hover p-6 flex flex-col justify-between min-h-[170px] relative group overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 w-fit">
                      100% Verified Partners
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg font-heading pt-0.5">Find & Connect with Lenders</h3>
                    <p className="text-xs text-slate-500 font-medium">Get competitive finance options from top banks & NBFCs near you.</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>

                <button
                  onClick={() => handleTabChange('lenders')}
                  className="btn-sbni-green mt-4 text-xs justify-center py-2.5 shadow-md font-extrabold"
                >
                  <span>Find Nearby Lenders</span>
                </button>
              </div>

              {/* Card 3: Lenders Around You Card */}
              <div className="card-white-hover p-6 flex flex-col justify-between min-h-[170px] md:col-span-2 lg:col-span-1 relative group">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 w-fit">
                      Proximity Match
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg font-heading pt-0.5">Lenders Around You</h3>
                    <p className="text-xs text-slate-500 font-medium">Discover financial partners within 10 KM radius for instant approval.</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 flex flex-col items-center justify-center text-emerald-700 flex-shrink-0 font-extrabold text-[10px] shadow-sm">
                    <MapPin className="w-4 h-4 text-emerald-600 mb-0.5" />
                    <span>10 KM</span>
                  </div>
                </div>

                <button
                  onClick={() => handleTabChange('lenders')}
                  className="btn-sbni-green mt-4 text-xs justify-center py-2.5 shadow-md font-extrabold"
                >
                  <span>Search Lenders Radius →</span>
                </button>
              </div>

            </div>

            {/* Quick Actions Bar */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base font-heading">Quick Actions</h3>
                <span className="text-xs text-slate-400 font-medium">Shortcuts</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <div 
                  onClick={() => handleTabChange('profile')}
                  className="card-white p-4.5 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer border border-slate-200/80 hover:border-blue-600 hover:shadow-lg transition-all group rounded-2xl bg-white"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#003893] group-hover:scale-110 group-hover:bg-[#003893] group-hover:text-white transition-all duration-300 shadow-sm">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">My Business Profile</span>
                </div>

                <div 
                  onClick={() => handleTabChange('requests')}
                  className="card-white p-4.5 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer border border-slate-200/80 hover:border-blue-600 hover:shadow-lg transition-all group rounded-2xl bg-white"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#003893] group-hover:scale-110 group-hover:bg-[#003893] group-hover:text-white transition-all duration-300 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">Applications</span>
                </div>

                <div 
                  onClick={() => handleTabChange('lenders')}
                  className="card-white p-4.5 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer border border-slate-200/80 hover:border-blue-600 hover:shadow-lg transition-all group rounded-2xl bg-white"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#003893] group-hover:scale-110 group-hover:bg-[#003893] group-hover:text-white transition-all duration-300 shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">Partner Network</span>
                </div>

                <div 
                  onClick={onOpenSubscription}
                  className="card-white p-4.5 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer border border-slate-200/80 hover:border-amber-500 hover:shadow-lg transition-all group rounded-2xl bg-white"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">Subscription & Support</span>
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
                      onRequestLoan={handleRequestLoan}
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
                      <div className="font-bold text-slate-900 text-sm">Enquiry request submitted</div>
                      <div className="text-slate-500 text-xs mt-0.5">Working Capital • 02 May 2024</div>
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
                  onRequestLoan={handleRequestLoan}
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

        {/* TAB 3: APPLICATIONS VIEW */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading">My Applications & Requests</h2>
                <p className="text-xs text-slate-500 font-medium">Track your active applications and lender connections</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="badge-pending-amber">Under Review</span>
                  <span className="text-xs text-slate-400">Application #REQ-9842</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Working Capital Application</h3>
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

        {/* TAB 4: COMPREHENSIVE VENDOR PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Header Title */}
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Vendor Business Profile</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage your registration details, verification documents, and profile photo
              </p>
            </div>

            {/* Profile Main Card */}
            <div className="card-white p-6 sm:p-8 space-y-6 shadow-md border border-slate-200/90 rounded-3xl">
              
              {/* Header Box with Profile Avatar Upload */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100 relative">
                
                {/* User Profile Avatar with Interactive Camera Overlay */}
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#003893] to-[#001f54] text-white flex items-center justify-center font-extrabold text-3xl shadow-lg overflow-hidden border-4 border-white ring-2 ring-blue-100">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Vendor Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>RK</span>
                    )}
                  </div>

                  {/* Camera Upload Button */}
                  <label 
                    title="Upload Profile Picture"
                    className="absolute -bottom-2 -right-2 bg-[#003893] hover:bg-[#002366] text-white p-2.5 rounded-full shadow-xl border-2 border-white cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Vendor Identity Details */}
                <div className="text-center sm:text-left space-y-1 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                    <h3 className="text-2xl font-extrabold text-slate-900 font-heading">Ramesh Kumar</h3>
                    <span className="badge-verified-green w-fit mx-auto sm:mx-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Vendor
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-700 flex items-center justify-center sm:justify-start gap-1.5">
                    <Store className="w-4 h-4 text-[#003893]" />
                    <span>Kumar General Store</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">Retail Vendor</span>
                  </div>

                  <p className="text-xs text-slate-400 font-medium pt-1">
                    Member since April 2024 • ID: <span className="font-mono text-slate-700">VEND-99482</span>
                  </p>

                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                    <label className="text-xs font-bold text-[#003893] hover:text-blue-900 cursor-pointer flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{avatarUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* SECTION 1: Personal & Business Registration Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base font-heading pb-1 border-b border-slate-100">
                  <User className="w-4 h-4 text-[#003893]" />
                  <span>Personal & Business Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Full Name */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Full Name</span>
                    <div className="font-extrabold text-slate-900 text-sm">Ramesh Kumar</div>
                  </div>

                  {/* Phone Number / Mobile */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Phone Number / Mobile</span>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+91 98765 43210</span>
                    </div>
                  </div>

                  {/* Gmail / Email ID */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Gmail / Email ID</span>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>vendor@sbnimoney.com</span>
                    </div>
                  </div>

                  {/* Shop / Business Name */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Shop / Business Name</span>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kumar General Store</span>
                    </div>
                  </div>

                  {/* Manual Address Text Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Full Shop / Business Address</span>
                    <div className="font-bold text-slate-800 text-xs flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Shop No. 12, Commercial Main Market, Bandra Kurla Complex (BKC), Mumbai, Maharashtra - 400051</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 2: Registration Verification Documents */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base font-heading pb-1 border-b border-slate-100">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>KYC & Registration Documents</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  
                  {/* PAN Card Document */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs">PAN Card</span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs bg-white p-2 rounded-xl border border-slate-200">
                      ABCDE1234F
                    </div>
                    <button 
                      type="button"
                      className="w-full text-[11px] font-bold text-[#003893] hover:text-blue-900 flex items-center justify-center gap-1 py-1"
                    >
                      <ExternalLink className="w-3 h-3" /> View Uploaded PAN
                    </button>
                  </div>

                  {/* Aadhaar Card Document */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs">Aadhaar Card</span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs bg-white p-2 rounded-xl border border-slate-200">
                      XXXX-XXXX-8921
                    </div>
                    <button 
                      type="button"
                      className="w-full text-[11px] font-bold text-[#003893] hover:text-blue-900 flex items-center justify-center gap-1 py-1"
                    >
                      <ExternalLink className="w-3 h-3" /> View Uploaded Aadhaar
                    </button>
                  </div>

                  {/* Business License (Optional) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs">Business License</span>
                      <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                        Optional
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs bg-white p-2 rounded-xl border border-slate-200">
                      27AAPFU0939L1ZV
                    </div>
                    <button 
                      type="button"
                      className="w-full text-[11px] font-bold text-[#003893] hover:text-blue-900 flex items-center justify-center gap-1 py-1"
                    >
                      <ExternalLink className="w-3 h-3" /> View License Doc
                    </button>
                  </div>

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

      {/* Loan Request Application Modal */}
      <LoanRequestModal
        isOpen={loanModalOpen}
        onClose={() => setLoanModalOpen(false)}
        lender={selectedLenderForLoan}
      />

    </div>
  );
};
