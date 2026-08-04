import React, { useState } from 'react';
import { mockVerificationRequests } from '../services/api';
import { VendorVerificationRequest } from '../types';
import { BannerCarousel, BannerSlide } from '../components/BannerCarousel';
import {
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Search,
  FileText,
  Download,
  Eye,
  ArrowLeft,
  XCircle,
  AlertCircle,
  Plus,
  Home,
  User,
  LogOut,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

const LENDER_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'l-banner-1',
    image: '/banners/lender_banner_1.png',
    title: 'Finance Verified Small Businesses with High Portfolio Returns',
  },
  {
    id: 'l-banner-2',
    image: '/banners/lender_banner_2.png',
    title: 'Instant Capital Disbursement & Vendor Growth Tracking',
  },
  {
    id: 'l-banner-3',
    image: '/banners/lender_banner_3.png',
    title: 'Risk-Managed Credit Allocation & Automated Lead Routing',
  },
  {
    id: 'l-banner-4',
    image: '/banners/lender_banner_4.png',
    title: 'Expand Your Lending Footprint Across Local Markets',
  },
];

interface LenderDashboardProps {
  onOpenSubscription?: () => void;
  onLogout?: (roleTarget?: 'VENDOR' | 'LENDER') => void;
}

export const LenderDashboard: React.FC<LenderDashboardProps> = ({ onOpenSubscription, onLogout }) => {
  const [selectedVendor, setSelectedVendor] = useState<VendorVerificationRequest | null>(null);
  const [requests, setRequests] = useState<VendorVerificationRequest[]>(mockVerificationRequests);
  const [actionFeedback, setActionFeedback] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');

  React.useEffect(() => {
    const dynamicStr = localStorage.getItem('sbni_vendor_requests');
    if (dynamicStr) {
      try {
        const dynamicReqs: VendorVerificationRequest[] = JSON.parse(dynamicStr);
        setRequests((prev) => {
          const ids = new Set(prev.map(r => r.id));
          const uniqueNew = dynamicReqs.filter(r => !ids.has(r.id));
          return [...uniqueNew, ...prev];
        });
      } catch (e) {}
    }
  }, []);

  const checkLenderSubscribed = () => {
    const isSub = localStorage.getItem('sbni_lender_subscribed') === 'true';
    if (!isSub && onOpenSubscription) {
      onOpenSubscription();
      return false;
    }
    return true;
  };

  const handleVendorSelect = (req: VendorVerificationRequest) => {
    if (checkLenderSubscribed()) {
      setSelectedVendor(req);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleHomeClick = () => {
    setSelectedVendor(null);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileClick = () => {
    setSelectedVendor(null);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApprove = (id: string) => {
    if (!checkLenderSubscribed()) return;
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: 'Verified' as const } : r))
    );
    setActionFeedback('✅ Vendor Verification Approved Successfully!');
    setTimeout(() => {
      setActionFeedback('');
      setSelectedVendor(null);
    }, 1500);
  };

  const handleReject = (id: string) => {
    if (!checkLenderSubscribed()) return;
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: 'Rejected' as const } : r))
    );
    setActionFeedback('❌ Vendor Verification Rejected.');
    setTimeout(() => {
      setActionFeedback('');
      setSelectedVendor(null);
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
        
        {/* VIEW 1: LENDER HOME DASHBOARD */}
        {!selectedVendor && activeTab === 'home' && (
          <div className="space-y-6">
            {/* Top Auto-Scrolling Visual Banner Carousel with Manual Controls */}
            <BannerCarousel slides={LENDER_BANNER_SLIDES} autoScrollIntervalMs={4000} />

            {/* Top Cards Hero Banner: Responsive Grid (1 col Mobile, 3 col Desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              
              {/* Lender Welcome Royal Blue Card (2 cols on lg) */}
              <div className="card-blue-header p-5 md:p-6 shadow-lg relative overflow-hidden flex items-center justify-between lg:col-span-2 min-h-[160px]">
                <div className="space-y-2 z-10">
                  <div className="text-xs text-blue-200 font-medium">Welcome Back,</div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white font-heading">Rohit Sharma</h2>
                  <div className="inline-flex px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                    Lender
                  </div>

                  <div className="pt-2 flex items-center gap-6 text-xs">
                    <div>
                      <div className="text-blue-200 text-xs">Total Capital Disbursed</div>
                      <div className="font-bold text-white text-lg md:text-xl">₹ 24,50,000</div>
                    </div>
                    <div className="border-l border-blue-400/40 pl-6">
                      <div className="text-blue-200 text-xs">Active Accounts</div>
                      <div className="font-bold text-white text-lg md:text-xl">12</div>
                    </div>
                  </div>
                </div>

                {/* Institution Bank Icon */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 z-10 flex-shrink-0">
                  <Building2 className="w-9 h-9 md:w-11 md:h-11 text-white" />
                </div>
              </div>

              {/* Verify Vendor & Grow Safely Banner */}
              <div className="card-white p-5 md:p-6 space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 max-w-[220px]">
                    <h3 className="font-extrabold text-slate-900 text-base md:text-lg font-heading">
                      Verify Vendor & Grow Safely
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verify vendors properly before lending. Reduce risk, increase trust.
                    </p>
                  </div>

                  {/* Shield + Security Graphic */}
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVendor(requests[0])}
                  className="btn-sbni-green text-xs md:text-sm py-2.5 px-4 font-bold flex items-center gap-1.5 w-fit"
                >
                  <span>Verify Vendor Now</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Overview 4 Grid (2 col Mobile, 4 col Desktop) */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-base font-heading">Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                
                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Total Vendors</div>
                    <div className="text-2xl font-extrabold text-slate-900 font-heading mt-0.5">56</div>
                    <div className="text-xs text-blue-600 font-bold mt-1 cursor-pointer hover:underline">View All</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Verified Vendors</div>
                    <div className="text-2xl font-extrabold text-slate-900 font-heading mt-0.5">28</div>
                    <div className="text-xs text-blue-600 font-bold mt-1 cursor-pointer hover:underline">View All</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Pending Verification</div>
                    <div className="text-2xl font-extrabold text-slate-900 font-heading mt-0.5">18</div>
                    <div className="text-xs text-blue-600 font-bold mt-1 cursor-pointer hover:underline">View All</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Loans Disbursed</div>
                    <div className="text-lg font-extrabold text-slate-900 font-heading mt-0.5">₹ 24.5L</div>
                    <div className="text-xs text-blue-600 font-bold mt-1 cursor-pointer hover:underline">View All</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

              </div>
            </div>

            {/* Main Section Grid: Left (Verification Requests) & Right (Quick Actions) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (2 Cols on Desktop): Recent Verification Requests */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base font-heading">Recent Verification Requests</h3>
                  <span className="text-xs text-blue-600 font-bold cursor-pointer hover:underline">View All</span>
                </div>

                <div className="card-white divide-y divide-slate-100 overflow-hidden shadow-sm">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => handleVendorSelect(req)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex-shrink-0">
                          <img
                            src={`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100`}
                            alt={req.vendorName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm md:text-base">{req.vendorName}</div>
                          <div className="text-xs text-slate-500">Shop: {req.shopName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Requested on {req.requestedDate}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={req.status === 'Verified' ? 'badge-verified-green' : 'badge-pending-amber'}>
                          {req.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column (1 Col on Desktop): Quick Actions Grid */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-base font-heading">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="card-white p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Search className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Search Vendor</span>
                  </div>

                  <div className="card-white p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Verification</span>
                  </div>

                  <div className="card-white p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Disbursed Loans</span>
                  </div>

                  <div className="card-white p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Reports</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: VENDOR VERIFICATION REVIEW PAGE - Responsive Master-Detail Grid */}
        {selectedVendor && (
          <div className="space-y-6">
            
            {/* Header with Back Arrow */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedVendor(null)}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Vendor Verification</h2>
                <div className="text-xs text-slate-500">Review vendor details and documents for approval</div>
              </div>
            </div>

            {actionFeedback && (
              <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-sm font-bold text-center animate-bounce">
                {actionFeedback}
              </div>
            )}

            {/* Grid Layout: Left Column (Vendor Profile & Basic Info) + Right Column (Shop Details & Docs) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (5 cols on lg) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Vendor Profile Header Summary */}
                <div className="card-white p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200"
                        alt={selectedVendor.vendorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg font-heading">{selectedVendor.vendorName}</h3>
                      <div className="text-xs text-slate-600 font-medium">{selectedVendor.shopName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{selectedVendor.shopAddress}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Requested on {selectedVendor.requestedDate}, {selectedVendor.requestedTime}</div>
                    </div>
                  </div>

                  <span className={selectedVendor.status === 'Verified' ? 'badge-verified-green' : 'badge-pending-amber'}>
                    {selectedVendor.status}
                  </span>
                </div>

                {/* Required Amount & Monthly Income Card */}
                <div className="card-white p-5 bg-gradient-to-r from-[#003893] to-[#001f54] text-white rounded-2xl shadow-md space-y-2">
                  <div className="grid grid-cols-2 gap-2 border-b border-white/20 pb-2">
                    <div>
                      <div className="text-[10px] text-blue-200 uppercase font-extrabold tracking-wider">Required Amount</div>
                      <div className="text-xl sm:text-2xl font-extrabold text-white font-heading mt-0.5">
                        ₹ {selectedVendor.requiredAmount || '5,00,000'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-blue-200 uppercase font-extrabold tracking-wider">Monthly Income</div>
                      <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-heading mt-0.5">
                        ₹ {selectedVendor.monthlyIncome || '50,000'}
                      </div>
                    </div>
                  </div>
                  {selectedVendor.lenderName && (
                    <div className="text-xs text-blue-100 font-medium pt-0.5">
                      Submitted to: <span className="font-bold text-white">{selectedVendor.lenderName}</span>
                    </div>
                  )}
                  {selectedVendor.bankAccountDetails && (
                    <div className="mt-1 pt-1 border-t border-white/20 text-xs text-blue-100 flex items-center justify-between">
                      <span>Bank Account Details:</span>
                      <span className="font-mono font-bold text-white">{selectedVendor.bankAccountDetails}</span>
                    </div>
                  )}
                </div>

                {/* Personal Information */}
                <div className="card-white p-5 space-y-4">
                  <h4 className="font-bold text-slate-900 text-base font-heading">Personal Information</h4>
                  <div className="space-y-3 text-xs md:text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Full Name</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.vendorName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Mobile Number</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.mobileNumber}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Email ID</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.emailId}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Date of Birth</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.dateOfBirth}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Address</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.shopAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Identity Documents */}
                <div className="card-white p-5 space-y-4">
                  <h4 className="font-bold text-slate-900 text-base font-heading">Identity Documents</h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm">
                      <div>
                        <div className="font-bold text-slate-900">PAN Card</div>
                        <div className="text-slate-500 font-mono mt-0.5">{selectedVendor.panNumber}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge-verified-green">Verified</span>
                        <Eye className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-700" />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm">
                      <div>
                        <div className="font-bold text-slate-900">Aadhaar Card</div>
                        <div className="text-slate-500 font-mono mt-0.5">{selectedVendor.aadhaarNumber}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge-verified-green">Verified</span>
                        <Eye className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-700" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (7 cols on lg) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Horizontal Step Tracker */}
                <div className="card-white p-4 flex items-center justify-between text-xs font-semibold">
                  <div className="flex flex-col items-center text-emerald-600">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">✓</div>
                    <span className="mt-1 text-xs">Basic Info</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-emerald-500 mx-2" />
                  <div className="flex flex-col items-center text-emerald-600">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">✓</div>
                    <span className="mt-1 text-xs">Documents</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-emerald-500 mx-2" />
                  <div className="flex flex-col items-center text-emerald-600">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">✓</div>
                    <span className="mt-1 text-xs">Shop Details</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-blue-600 mx-2" />
                  <div className="flex flex-col items-center text-blue-600">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">4</div>
                    <span className="mt-1 text-xs">Review</span>
                  </div>
                </div>

                {/* Shop Information */}
                <div className="card-white p-5 space-y-4">
                  <h4 className="font-bold text-slate-900 text-base font-heading">Shop Information</h4>
                  <div className="space-y-3 text-xs md:text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Shop Name</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.shopName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Shop Address</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.shopAddress}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Shop Type</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.shopType}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Years in Business</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.yearsInBusiness}</span>
                    </div>
                  </div>
                </div>

                {/* Shop Images Grid */}
                <div className="card-white p-5 space-y-4">
                  <h4 className="font-bold text-slate-900 text-base font-heading">Shop Photos & Premises</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(selectedVendor.shopImages || []).map((imgUrl, i) => (
                      <img
                        key={i}
                        src={imgUrl}
                        alt="Shop premises"
                        className="w-full h-24 rounded-xl object-cover border border-slate-200 hover:scale-105 transition-transform cursor-pointer"
                      />
                    ))}
                  </div>
                </div>

                {/* Additional Documents */}
                <div className="card-white p-5 space-y-4">
                  <h4 className="font-bold text-slate-900 text-base font-heading">Additional Documents</h4>
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-bold text-slate-900">Shop & Establishment License</div>
                          <div className="text-xs text-slate-400 mt-0.5">{selectedVendor.shopLicensePdf}</div>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-slate-500 hover:text-slate-800 cursor-pointer" />
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-bold text-slate-900">GST Certificate</div>
                          <div className="text-xs text-slate-400 mt-0.5">{selectedVendor.gstCertificatePdf}</div>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-slate-500 hover:text-slate-800 cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Bottom 3 Action Buttons (Reject, Request More Info, Verify & Approve) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => handleReject(selectedVendor.id)}
                    className="py-3 px-4 rounded-xl border border-rose-500 text-rose-600 font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Verification</span>
                  </button>

                  <button
                    className="py-3 px-4 rounded-xl border border-amber-500 text-amber-600 font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Request Info</span>
                  </button>

                  <button
                    onClick={() => handleApprove(selectedVendor.id)}
                    className="btn-sbni-green py-3 px-4 text-xs md:text-sm justify-center font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Vendor Verification</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* VIEW 3: LENDER PROFILE VIEW */}
        {!selectedVendor && activeTab === 'profile' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Lender Profile & Security</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage institution credentials, credit officer contact details, and session status
              </p>
            </div>

            <div className="card-white p-6 sm:p-8 space-y-6 shadow-md border border-slate-200/90 rounded-3xl">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg border-4 border-white ring-2 ring-emerald-100">
                  NF
                </div>

                <div className="text-center sm:text-left space-y-1 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                    <h3 className="text-2xl font-extrabold text-slate-900 font-heading">Nishanth Finance</h3>
                    <span className="badge-verified-green w-fit mx-auto sm:mx-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Lender
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 flex items-center justify-center sm:justify-start gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Non-Banking Financial Company (NBFC)</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium pt-1">
                    Registration No: <span className="font-mono text-slate-700 font-bold">FIN-IND-2021-1001</span>
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm font-heading">Officer Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Chief Credit Officer</span>
                    <div className="font-extrabold text-slate-900 text-sm">Nishanth Kumar</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Mobile / WhatsApp</span>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+91 98200 11223</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Email Address</span>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>contact@nishanthfinance.com</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Head Office Location</span>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>BKC Commercial Hub, Mumbai</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Account Session & Logout */}
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm font-heading">Account Session & Security</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Log out of your active Just Paisa App session on this device
                    </p>
                  </div>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => onLogout('LENDER')}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Log Out Account</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 py-2 px-6 flex items-center justify-around w-full max-w-md mx-auto shadow-2xl lg:hidden rounded-t-2xl">
        <button
          onClick={handleHomeClick}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-extrabold py-1 px-3 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-[#059669] bg-emerald-50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 text-[#059669]" />
          <span>Home</span>
        </button>

        <button
          onClick={handleHomeClick}
          className="flex flex-col items-center gap-0.5 text-[11px] font-extrabold text-slate-500 hover:text-slate-800 py-1 px-3"
        >
          <Users className="w-5 h-5" />
          <span>Vendors</span>
        </button>

        {/* Floating Green Action Button */}
        <button
          onClick={handleHomeClick}
          className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all -mt-6 border-4 border-white"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>

        <button
          onClick={handleHomeClick}
          className="flex flex-col items-center gap-0.5 text-[11px] font-extrabold text-slate-500 hover:text-slate-800 py-1 px-3"
        >
          <FileText className="w-5 h-5" />
          <span>Reports</span>
        </button>

        <button
          onClick={handleProfileClick}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-extrabold py-1 px-3 rounded-xl transition-all ${
            activeTab === 'profile' ? 'text-[#059669] bg-emerald-50' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </div>

    </div>
  );
};
