import React, { useState, useRef } from 'react';
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
  Camera,
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lenderAvatarUrl, setLenderAvatarUrl] = useState<string | null>(() => {
    return localStorage.getItem('sbni_lender_avatar') || null;
  });

  const handleLenderAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setLenderAvatarUrl(dataUrl);
          localStorage.setItem('sbni_lender_avatar', dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
    setActionFeedback('✅ Business Verification Approved Successfully!');
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
    setActionFeedback('❌ Business Verification Rejected.');
    setTimeout(() => {
      setActionFeedback('');
      setSelectedVendor(null);
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-28 md:pb-28">
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
                  <div className="inline-flex px-3.5 py-1 rounded-full bg-emerald-500/25 text-emerald-200 text-xs font-bold border border-emerald-400/40 shadow-sm backdrop-blur-md">
                    Business Money Financer Account
                  </div>
                </div>

                {/* Business Financer Profile Picture Avatar */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/80 shadow-2xl z-10 shrink-0 cursor-pointer transition-transform hover:scale-105 overflow-hidden group"
                  title="Click to upload or change Business Financer profile picture"
                >
                  <img
                    src={lenderAvatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200'}
                    alt="Rohit Sharma - Business Money Financer Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLenderAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Verify Shop Businesses & Grow Safely Banner - HIGHLIGHTED WITH SPLASH ANIMATION */}
              <div className="card-white splash-highlight-card p-5 md:p-6 space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[160px] bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 max-w-[220px]">
                    <h3 className="font-extrabold text-slate-900 text-base md:text-lg font-heading">
                      Verify Business & Grow Safely
                    </h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Verify shop or home businesses properly before providing money. Reduce risk, increase trust.
                    </p>
                  </div>

                  {/* Shield + Security Graphic with Pulse Glow */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse-subtle">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                </div>

                <button
                  onClick={() => setSelectedVendor(requests[0])}
                  className="btn-sbni-green splash-btn-effect text-xs md:text-sm py-2.5 px-4 font-extrabold flex items-center gap-1.5 w-fit shadow-lg"
                >
                  <span className="font-extrabold tracking-wide">Verify Business Now</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Overview 3 Grid (1 col Mobile, 3 col Desktop) */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-base font-heading">Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                
                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Total Shop Businesses</div>
                    <div className="text-2xl font-extrabold text-slate-900 font-heading mt-0.5">56</div>
                    <div className="text-xs text-blue-600 font-bold mt-1 cursor-pointer hover:underline">View All</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Verified Businesses</div>
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

              </div>
            </div>

            {/* Main Section Grid: Left (Verification Requests) & Right (Quick Actions) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (2 Cols on Desktop): Recent Verification Requests - HIGHLIGHTED WITH SPLASH ANIMATION */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base md:text-lg font-heading splash-text-effect">
                    Recent Verification Requests
                  </h3>
                  <span className="text-xs text-blue-600 font-bold cursor-pointer hover:underline">View All</span>
                </div>

                <div className="card-white splash-highlight-card divide-y divide-slate-100 overflow-hidden shadow-lg bg-white">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => handleVendorSelect(req)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50/40 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-emerald-300 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <img
                            src={`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100`}
                            alt={req.vendorName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm md:text-base group-hover:text-emerald-800 transition-colors">
                            {req.vendorName}
                          </div>
                          <div className="text-xs text-slate-600 font-medium">Shop: {req.shopName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Requested on {req.requestedDate}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={req.status === 'Verified' ? 'badge-verified-green' : 'badge-pending-amber'}>
                          {req.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
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
                    <span className="text-xs font-semibold text-slate-700">Search Business</span>
                  </div>

                  <div className="card-white p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Verification</span>
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
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Shop Business Verification</h2>
                <div className="text-xs text-slate-500">Review shop business details and documents for approval</div>
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

                {/* Monthly Income Card */}
                <div className="card-white p-5 bg-gradient-to-r from-[#003893] to-[#001f54] text-white rounded-2xl shadow-md space-y-2">
                  <div className="border-b border-white/20 pb-2">
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
                    <span>Approve Business Verification</span>
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
              <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Business Money Financer Profile & Security</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage institution credentials, credit officer contact details, and session status
              </p>
            </div>

            <div className="card-white p-6 sm:p-8 space-y-6 shadow-md border border-slate-200/90 rounded-3xl">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-lg border-4 border-white ring-2 ring-emerald-100 shrink-0">
                  <img
                    src={lenderAvatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200'}
                    alt="Business Financer Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-center sm:text-left space-y-1 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                    <h3 className="text-2xl font-extrabold text-slate-900 font-heading">Nishanth Money Finance</h3>
                    <span className="badge-verified-green w-fit mx-auto sm:mx-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Business Financer
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 flex items-center justify-center sm:justify-start gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Business Money Financer</span>
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
                      <span>contact@nishanthmoneyfinance.com</span>
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

      {/* Bottom Sticky Navigation Bar - Mobile & Desktop Responsive Floating Dock */}
      <div className="fixed bottom-0 sm:bottom-5 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t sm:border border-slate-200/90 py-1.5 sm:py-3.5 px-2 sm:px-10 flex items-center justify-between sm:justify-around w-full max-w-md sm:max-w-3xl lg:max-w-4xl mx-auto shadow-2xl rounded-t-2xl sm:rounded-3xl transition-all">
        <button
          onClick={handleHomeClick}
          className={`flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'home' ? 'text-[#059669] bg-emerald-50/90 shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6 text-[#059669]" />
          <span>Home</span>
        </button>

        <button
          onClick={handleHomeClick}
          className="flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold text-slate-500 hover:text-slate-800 hover:bg-slate-50 py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap"
        >
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          <span>Businesses</span>
        </button>

        {/* Floating Green Action Button */}
        <button
          onClick={handleHomeClick}
          className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all -mt-5 sm:-mt-9 border-3 sm:border-4 border-white shrink-0 mx-1"
        >
          <Plus className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </button>

        <button
          onClick={handleHomeClick}
          className="flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold text-slate-500 hover:text-slate-800 hover:bg-slate-50 py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap"
        >
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          <span>Reports</span>
        </button>

        <button
          onClick={handleProfileClick}
          className={`flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'profile' ? 'text-[#059669] bg-emerald-50/90 shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          <span>Profile</span>
        </button>
      </div>

    </div>
  );
};
