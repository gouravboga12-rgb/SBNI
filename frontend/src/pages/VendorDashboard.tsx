import React, { useState, useEffect } from 'react';
import { Lender } from '../types';
import { LenderCard } from '../components/LenderCard';
import { LoanRequestModal } from '../components/LoanRequestModal';
import { BannerCarousel, BannerSlide } from '../components/BannerCarousel';
import { LocationPickerModal } from '../components/LocationPickerModal';
import {
  getGoogleMapsNavigationUrl,
  getBrowserLocation,
  reverseGeocodeMapbox,
} from '../services/mapboxService';
import { fetchLenders, updateVendorProfileApi } from '../services/api';
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
  LogOut,
  Navigation,
  Compass,
  Radio,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const VENDOR_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'v-banner-1',
    image: '/banners/vendor_banner_1.png',
    title: 'Grow Your Small Business with Direct Capital Access',
  },
  {
    id: 'v-banner-2',
    image: '/banners/vendor_banner_2.png',
    title: 'Connect Directly with Nearby Financers & NBFCs',
  },
  {
    id: 'v-banner-3',
    image: '/banners/vendor_banner_3.png',
    title: 'Fast Approval & Working Capital Loan Disbursement',
  },
  {
    id: 'v-banner-4',
    image: '/banners/vendor_banner_4.png',
    title: 'Expand Shop Inventory & Business Credit',
  },
];

interface VendorDashboardProps {
  lenders: Lender[];
  onOpenSubscription: () => void;
  activeTab?: 'home' | 'lenders' | 'requests' | 'profile';
  onTabChange?: (tab: 'home' | 'lenders' | 'requests' | 'profile') => void;
  onLogout?: (roleTarget?: 'VENDOR' | 'LENDER') => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  lenders,
  onOpenSubscription,
  activeTab: controlledActiveTab,
  onTabChange,
  onLogout,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<'home' | 'lenders' | 'requests' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLenderForLoan, setSelectedLenderForLoan] = useState<Lender | null>(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);

  // Search & Profile Location State (Mapbox Powered)
  const [searchLocation, setSearchLocation] = useState<{
    place: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  }>(() => {
    try {
      const vp = localStorage.getItem('sbni_vendor_profile');
      if (vp) {
        const parsed = JSON.parse(vp);
        return {
          place: parsed.place || 'Chaitanyapuri',
          city: parsed.city || 'Hyderabad',
          state: parsed.state || 'Telangana',
          country: parsed.country || 'India',
          latitude: parsed.latitude ? Number(parsed.latitude) : 17.3688,
          longitude: parsed.longitude ? Number(parsed.longitude) : 78.5247,
        };
      }
    } catch (e) {}
    return {
      place: 'Chaitanyapuri',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      latitude: 17.3688,
      longitude: 78.5247,
    };
  });

  const [liveLenders, setLiveLenders] = useState<Lender[]>(lenders);
  const [isLoadingLenders, setIsLoadingLenders] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationModalMode, setLocationModalMode] = useState<'VENDOR_SEARCH' | 'GENERAL_LOCATION'>('VENDOR_SEARCH');
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  // Applications List (Strictly Real User Applications - Zero Dummy Data)
  const [vendorApplications, setVendorApplications] = useState<any[]>(() => {
    try {
      const dynamicStr = localStorage.getItem('sbni_vendor_requests');
      if (dynamicStr) {
        const parsed = JSON.parse(dynamicStr);
        if (Array.isArray(parsed)) {
          // Filter out any legacy dummy requests
          return parsed.filter((r) => r && r.id !== 'REQ-9842' && r.id !== 'REQ-4410' && !r.lenderName?.includes('Nishanth Money Finance') && !r.lenderName?.includes('Sharma Financer & NBFC'));
        }
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    const handleRequestsSync = () => {
      try {
        const dynamicStr = localStorage.getItem('sbni_vendor_requests');
        if (dynamicStr) {
          const parsed = JSON.parse(dynamicStr);
          if (Array.isArray(parsed)) {
            setVendorApplications(parsed.filter((r) => r && r.id !== 'REQ-9842' && r.id !== 'REQ-4410' && !r.lenderName?.includes('Nishanth Money Finance') && !r.lenderName?.includes('Sharma Financer & NBFC')));
            return;
          }
        }
      } catch (e) {}
      setVendorApplications([]);
    };

    window.addEventListener('sbni_request_submitted', handleRequestsSync);
    window.addEventListener('storage', handleRequestsSync);
    return () => {
      window.removeEventListener('sbni_request_submitted', handleRequestsSync);
      window.removeEventListener('storage', handleRequestsSync);
    };
  }, []);

  // Load Lenders based on current Search Coordinates (strictly radius matched by backend)
  const loadNearbyLenders = async (lat = searchLocation.latitude, lng = searchLocation.longitude, place = searchLocation.place, city = searchLocation.city) => {
    setIsLoadingLenders(true);
    try {
      const res = await fetchLenders({
        userLat: lat,
        userLng: lng,
        place,
        city,
      });
      if (res.lenders) {
        setLiveLenders(res.lenders);
      }
    } catch (e) {
      console.error('loadNearbyLenders error:', e);
    } finally {
      setIsLoadingLenders(false);
    }
  };

  useEffect(() => {
    loadNearbyLenders();
  }, [searchLocation.latitude, searchLocation.longitude]);

  // Use My Location (Mapbox GPS) quick trigger
  const handleVendorQuickGPS = async () => {
    setIsLocatingGPS(true);
    try {
      const coords = await getBrowserLocation();
      const reverse = await reverseGeocodeMapbox(coords.latitude, coords.longitude);
      const newLoc = {
        place: reverse?.place || 'Current Area',
        city: reverse?.city || 'Hyderabad',
        state: reverse?.state || 'Telangana',
        country: reverse?.country || 'India',
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      setSearchLocation(newLoc);
      setLocationToast(`📍 Located at: ${newLoc.place}, ${newLoc.city}`);
      setTimeout(() => setLocationToast(null), 4000);
      loadNearbyLenders(coords.latitude, coords.longitude, newLoc.place, newLoc.city);
    } catch (err: any) {
      setLocationToast(`⚠️ ${err.message || 'GPS location could not be fetched.'}`);
      setTimeout(() => setLocationToast(null), 4500);
    } finally {
      setIsLocatingGPS(false);
    }
  };

  // Save selected search/shop location from Modal
  const handleSaveLocation = async (loc: {
    place: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => {
    const updated = {
      place: loc.place,
      city: loc.city,
      state: loc.state,
      country: loc.country,
      latitude: loc.latitude,
      longitude: loc.longitude,
    };

    setSearchLocation(updated);

    // Save to local storage profile
    try {
      const pStr = localStorage.getItem('sbni_vendor_profile') || '{}';
      const parsed = JSON.parse(pStr);
      const merged = { ...parsed, ...updated };
      localStorage.setItem('sbni_vendor_profile', JSON.stringify(merged));
    } catch (e) {}

    // Save to AWS Backend
    try {
      await updateVendorProfileApi(updated);
      setLocationToast(`✅ Search location updated to ${loc.place}, ${loc.city}`);
      setTimeout(() => setLocationToast(null), 4000);
    } catch (e) {
      console.error('Failed to sync vendor location to backend:', e);
    }

    loadNearbyLenders(loc.latitude, loc.longitude, loc.place, loc.city);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Profile Avatar & Password Visibility State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return localStorage.getItem('sbni_vendor_avatar') || null;
  });
  const [showPassword, setShowPassword] = useState(false);

  const currentVendorObj = (() => {
    try {
      const u = localStorage.getItem('sbni_user');
      const p = localStorage.getItem('sbni_vendor_profile');
      const user = u ? JSON.parse(u) : null;
      const profile = p ? JSON.parse(p) : null;

      let rawName = profile?.ownerName || profile?.fullName || user?.vendorProfile?.ownerName || user?.vendorProfile?.fullName || user?.name || user?.fullName;
      if (!rawName || rawName === 'Registered Vendor' || rawName === 'Business Owner' || rawName === 'Owner Name') {
        if (user?.email && user.email.includes('@')) {
          const prefix = user.email.split('@')[0];
          if (prefix.toLowerCase().includes('gourav')) rawName = 'Gourav';
          else rawName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        } else {
          rawName = 'Gourav';
        }
      }
      const name = rawName;
      const shopName = profile?.businessName || user?.vendorProfile?.businessName || (name ? `${name} Enterprise` : 'Business Enterprise');
      const phone = user?.phone || profile?.phone || 'Not provided';
      const email = user?.email || profile?.email || 'vendor@sbni.com';

      let addressParts = [];
      if (profile?.address) addressParts.push(profile.address);
      if (profile?.place) addressParts.push(profile.place);
      if (profile?.city) addressParts.push(profile.city);
      if (profile?.state) addressParts.push(profile.state);
      if (profile?.pincode) addressParts.push(profile.pincode);
      const address = addressParts.length > 0 ? addressParts.join(', ') : 'Registered Location';

      const panNumber = profile?.panNumber || user?.panNumber || null;
      const gstNumber = profile?.gstNumber || null;
      const aadhaarNumber = profile?.aadhaarNumber || null;
      const category = profile?.category || profile?.registrationType || 'Retail Shop Business';
      const shopId = profile?.id ? `SHOP-${String(profile.id).substring(0, 5).toUpperCase()}` : 'SHOP-1001';
      const isVerified = profile?.kycStatus === 'VERIFIED' || user?.isVerified || false;

      return {
        name,
        shopName,
        phone,
        email,
        address,
        panNumber,
        gstNumber,
        aadhaarNumber,
        category,
        shopId,
        isVerified,
      };
    } catch (e) {
      return {
        name: 'Registered Vendor',
        shopName: 'Business Enterprise',
        phone: 'Not provided',
        email: 'vendor@sbni.com',
        address: 'Registered Location',
        panNumber: null,
        gstNumber: null,
        aadhaarNumber: null,
        category: 'Retail Shop Business',
        shopId: 'SHOP-1001',
        isVerified: true,
      };
    }
  })();

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

  const currentLendersList = liveLenders.length > 0 ? liveLenders : lenders;
  const filteredLenders = currentLendersList.filter((l) =>
    l.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.institutionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.place && l.place.toLowerCase().includes(searchQuery.toLowerCase())) ||
    l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.loanCategories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-28 md:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
        
        {/* TAB 1: HOME VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Top Auto-Scrolling Visual Banner Carousel with Manual Controls */}
            <BannerCarousel slides={VENDOR_BANNER_SLIDES} autoScrollIntervalMs={4000} />

            {/* Top Cards Hero Banner: Responsive Grid (1 col Mobile, 2 col Tab, 3 col Desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              
              {/* Card 1: Welcome Royal Blue Card */}
              <div className="card-blue-header p-6 shadow-xl relative overflow-hidden flex items-center justify-between min-h-[170px] border border-blue-400/20 group">
                {/* Glow Overlay */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-400/30 transition-colors" />

                <div className="space-y-1.5 z-10">
                  <div className="text-xs text-blue-200 font-semibold tracking-wide uppercase">Welcome back,</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">{currentVendorObj.name}</h2>
                  <div className="pt-2">
                    <span className="badge-verified-green bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Shop Owner
                    </span>
                  </div>
                </div>

                {/* Clean Vendor Profile Picture */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/80 shadow-2xl z-10 shrink-0 cursor-pointer transition-transform hover:scale-105 overflow-hidden flex items-center justify-center bg-[#002669] text-white font-extrabold text-xl font-heading"
                  title="Click to change or upload profile picture"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={currentVendorObj.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentVendorObj.name.charAt(0).toUpperCase()}</span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Card 2: Find & Connect with Nearby Lenders (Unified Proximity Card - HIGHLIGHTED) */}
              <div className="card-white-hover splash-highlight-card p-6 flex flex-col justify-between min-h-[170px] relative group overflow-hidden bg-gradient-to-br from-emerald-50/60 via-white to-blue-50/30">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-extrabold text-white px-2.5 py-0.5 rounded-full splash-badge-pulse shadow-sm flex items-center gap-1">
                        ⚡ Nearby Money Financers
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                        10 KM Radius
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-xl font-heading pt-1">
                      Find Nearby Business Money Financers
                    </h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Discover verified business money financers (e.g., Santhosh Money Finance, Rohit Money Finance) within 10 KM radius for instant approval.
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#007a33] to-[#005724] text-white flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <Building2 className="w-7 h-7" />
                  </div>
                </div>

                <button
                  onClick={() => handleTabChange('lenders')}
                  className="btn-sbni-green mt-4 text-xs justify-center py-2.5 shadow-lg font-extrabold flex items-center gap-2"
                >
                  <span>Search Nearby Business Money Financers →</span>
                </button>
              </div>

              {/* Card 3: Subscription & Plan Status Card */}
              <div className="card-white-hover p-6 flex flex-col justify-between min-h-[170px] md:col-span-2 lg:col-span-1 relative group bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border-amber-200/70">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200 w-fit flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Plan Active
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg font-heading pt-1">Small Shop & Local Startup Business Membership</h3>
                    <p className="text-xs text-slate-500 font-medium font-medium">Direct financer contacts & priority application routing active.</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Headphones className="w-6 h-6" />
                  </div>
                </div>

                <button
                  onClick={onOpenSubscription}
                  className="btn-sbni-blue mt-4 text-xs justify-center py-2.5 shadow-md font-extrabold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
                >
                  <span>Manage Subscription</span>
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
                  className="card-white p-4 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer border-2 border-emerald-300 hover:border-emerald-600 hover:shadow-xl transition-all group rounded-2xl bg-gradient-to-br from-emerald-50/70 to-white shadow-md animate-pulse-subtle"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-md">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-extrabold text-emerald-900">Nearby Financers ⚡</span>
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
              
              {/* Left Column (2 Cols on Desktop): Business Money Financers (Lenders) Grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-lg font-heading">Recommended Business Money Financers (Lenders)</h3>
                    <span className="text-[10px] font-extrabold text-white bg-emerald-600 px-2 py-0.5 rounded-full shadow-xs animate-pulse">⚡ Nearby</span>
                  </div>
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
                    <div className="font-bold text-slate-900 mb-0.5">100% Verified Business Money Financers</div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      All registered business money financers & credit partners undergo strict compliance verification. Your data is encrypted & safe.
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
            
            {/* Mapbox Powered Location Search Bar & Switcher */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl border border-blue-900/60 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-black px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                      Mapbox Geographic Discovery
                    </span>
                    <span className="text-xs text-blue-200 font-medium">
                      Matched by Lender Service Radius
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-white pt-1">
                    Business Money Financers (Lenders) Near You
                  </h2>
                  <div className="text-xs text-slate-300 flex items-center gap-1.5 pt-0.5">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Searching area:</span>
                    <strong className="text-white font-bold underline decoration-blue-400 underline-offset-2">
                      {searchLocation.place}, {searchLocation.city}, {searchLocation.state}
                    </strong>
                  </div>
                </div>

                {/* Location Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleVendorQuickGPS}
                    disabled={isLocatingGPS}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-extrabold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    {isLocatingGPS ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4 text-emerald-400" />
                        <span>Use My Location</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationModalMode('VENDOR_SEARCH');
                      setIsLocationModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer border border-blue-400/40"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Change Search Location</span>
                  </button>
                </div>
              </div>

              {/* Toast Feedback */}
              {locationToast && (
                <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-100 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0" />
                  <span>{locationToast}</span>
                </div>
              )}

              {/* Search by Financer Name/Category */}
              <div className="pt-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by financer institution name, loan category, or place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-2xl pl-11 pr-4 py-3 text-xs font-semibold focus:outline-none focus:bg-white/20 focus:border-white transition-all backdrop-blur-md"
                  />
                  {isLoadingLenders && (
                    <Loader2 className="w-4 h-4 text-blue-300 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>
            </div>

            {/* Results Count Bar */}
            <div className="flex items-center justify-between px-1">
              <div className="text-xs text-slate-600 font-bold">
                Found <strong className="text-[#003893] font-black">{filteredLenders.length}</strong> eligible financers within service coverage of{' '}
                <strong className="text-slate-900">{searchLocation.place || searchLocation.city}</strong>
              </div>
              <button
                onClick={() => loadNearbyLenders()}
                className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLenders ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Lender Cards Grid */}
            {filteredLenders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                <Compass className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="font-extrabold text-slate-800 text-base">No Eligible Financers in This Area Radius</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  No registered financers currently cover <strong className="text-slate-700">{searchLocation.place}, {searchLocation.city}</strong> within their configured service radius.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationModalMode('VENDOR_SEARCH');
                      setIsLocationModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#003893] text-white font-extrabold text-xs hover:bg-[#002669] transition-all shadow-md cursor-pointer"
                  >
                    Try Searching a Different City (e.g. Hyderabad / Mumbai)
                  </button>
                </div>
              </div>
            ) : (
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
            )}

            {/* Data Protection Footer Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 flex items-center justify-center gap-2 font-medium">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>All business financers are verified & trusted by Just Paisa App. Your data is safe with us.</span>
            </div>

          </div>
        )}

        {/* TAB 3: APPLICATIONS & NAVIGATION VIEW */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading">My Applications & Financer Connections</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Track your loan submissions and navigate to financer offices once approved
                </p>
              </div>
            </div>

            {vendorApplications.length === 0 ? (
              <div className="card-white p-12 text-center rounded-3xl border border-slate-200/90 shadow-sm space-y-4 max-w-xl mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-heading">No Applications Submitted Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
                    You haven't submitted any capital applications yet. Explore verified financers and click <strong>Apply for Loan</strong> to connect with lenders.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('financers')}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Explore Verified Financers</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendorApplications.map((app, idx) => {
                  const isAccepted =
                    app.status === 'Verified' ||
                    app.status === 'Approved' ||
                    app.status === 'Accepted' ||
                    app.status === 'Completed';

                  return (
                    <div key={app.id || idx} className="card-white p-5 space-y-4 shadow-sm border border-slate-200/90 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className={isAccepted ? 'badge-verified-green' : 'badge-pending-amber'}>
                          {isAccepted ? '✓ Request Accepted' : app.status || 'Under Review'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">App #{app.id}</span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{app.title || app.lenderName || 'Capital Application'}</h3>
                        <p className="text-xs text-blue-900 font-bold mt-0.5">Financer: {app.lenderName}</p>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>Requested Amount: <span className="font-bold text-slate-900">{app.amount || '₹ 5,00,000'}</span></div>
                        <div>Application Date: <span className="font-medium">{app.date || app.requestedDate || 'Recent'}</span></div>
                      </div>

                      {/* Navigation Action: Enabled ONLY after acceptance as per requirement */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {isAccepted ? (
                          <a
                            href={getGoogleMapsNavigationUrl(
                              app.lenderLatitude || 17.3688,
                              app.lenderLongitude || 78.5247,
                              `Financer: ${app.lenderName}`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <Navigation className="w-4 h-4 text-white" />
                            <span>🧭 Navigate to Financer Office (Google Maps)</span>
                          </a>
                        ) : (
                          <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Navigation unlocks once Financer accepts application</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMPREHENSIVE SMALL SHOP BUSINESS PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Header Title */}
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Small Shop & Local Startup Business Profile</h2>
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
                      <img src={avatarUrl} alt="Shop Business Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentVendorObj.name.charAt(0).toUpperCase()}</span>
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
                    <h3 className="text-2xl font-extrabold text-slate-900 font-heading">{currentVendorObj.name}</h3>
                    <span className="badge-verified-green w-fit mx-auto sm:mx-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Shop Owner
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-700 flex items-center justify-center sm:justify-start gap-1.5">
                    <Store className="w-4 h-4 text-[#003893]" />
                    <span>{currentVendorObj.shopName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">{currentVendorObj.category}</span>
                  </div>

                  <p className="text-xs text-slate-400 font-medium pt-1">
                    Member since April 2024 • ID: <span className="font-mono text-slate-700">{currentVendorObj.shopId}</span>
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
                    <div className="font-extrabold text-slate-900 text-sm">{currentVendorObj.name}</div>
                  </div>

                  {/* Phone Number / Mobile */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Phone Number / Mobile</span>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{currentVendorObj.phone}</span>
                    </div>
                  </div>

                  {/* Gmail / Email ID */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Gmail / Email ID</span>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>{currentVendorObj.email}</span>
                    </div>
                  </div>

                  {/* Shop / Business Name */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Shop / Business Name</span>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-600" />
                      <span>{currentVendorObj.shopName}</span>
                    </div>
                  </div>

                  {/* Manual Address Text Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Full Shop / Business Address</span>
                    <div className="font-bold text-slate-800 text-xs flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{currentVendorObj.address}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Mapbox Registered Shop Location & Coordinates Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base font-heading">
                    <Compass className="w-4 h-4 text-[#003893]" />
                    <span>Registered Shop Business Location (Mapbox Verified)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationModalMode('GENERAL_LOCATION');
                      setIsLocationModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#003893] border border-blue-200 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Update Shop Coordinates</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {searchLocation.place}, {searchLocation.city}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {searchLocation.state}, {searchLocation.country}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      ✓ Active for Financer Radius Matching
                    </span>
                  </div>

                  <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-slate-600 font-mono flex-wrap gap-2">
                    <span>
                      Latitude: <strong className="text-slate-900">{Number(searchLocation.latitude).toFixed(4)}</strong>, Longitude:{' '}
                      <strong className="text-slate-900">{Number(searchLocation.longitude).toFixed(4)}</strong>
                    </span>
                    <a
                      href={getGoogleMapsNavigationUrl(searchLocation.latitude, searchLocation.longitude, currentVendorObj.shopName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 font-bold hover:underline flex items-center gap-1 font-sans"
                    >
                      <Navigation className="w-3 h-3 text-blue-600" />
                      <span>View on Google Maps</span>
                    </a>
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
                      {currentVendorObj.panNumber ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs bg-white p-2 rounded-xl border border-slate-200">
                      {currentVendorObj.panNumber || 'Pending Document Upload'}
                    </div>
                  </div>

                  {/* Aadhaar Card Document */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs">Aadhaar Card</span>
                      {currentVendorObj.aadhaarNumber ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs bg-white p-2 rounded-xl border border-slate-200">
                      {currentVendorObj.aadhaarNumber || 'Pending Document Upload'}
                    </div>
                  </div>

                  {/* Business License (Optional) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs">GST / Business License</span>
                      <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                        Optional
                      </span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 text-xs bg-white p-2 rounded-xl border border-slate-200">
                      {currentVendorObj.gstNumber || 'Pending GST Upload'}
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 3: Account Session & Logout */}
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
                      onClick={() => onLogout('VENDOR')}
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

      {/* Reusable Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSave={handleSaveLocation}
        initialLocation={searchLocation}
        mode={locationModalMode}
        title={locationModalMode === 'VENDOR_SEARCH' ? 'Change Search Location' : 'Update Registered Shop Location'}
        subtitle={locationModalMode === 'VENDOR_SEARCH' ? 'Select place/city to discover eligible nearby financers' : 'Set exact coordinates for your shop premises'}
      />

      {/* Bottom Sticky Navigation Bar - Mobile & Desktop Responsive Floating Dock */}
      <div className="fixed bottom-0 sm:bottom-5 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t sm:border border-slate-200/90 py-1.5 sm:py-3.5 px-2 sm:px-10 flex items-center justify-between sm:justify-around w-full max-w-md sm:max-w-3xl lg:max-w-4xl mx-auto shadow-2xl rounded-t-2xl sm:rounded-3xl transition-all">
        <button
          onClick={() => handleTabChange('home')}
          className={`flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'home' ? 'text-[#003893] bg-blue-50/90 shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6 text-[#003893]" />
          <span>Home</span>
        </button>

        <button
          onClick={() => handleTabChange('lenders')}
          className={`flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'lenders' ? 'text-[#003893] bg-blue-50/90 shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          <span>Financers</span>
        </button>

        {/* Floating Action Button */}
        <button
          onClick={onOpenSubscription}
          title="Pay Subscription"
          className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all -mt-5 sm:-mt-9 border-3 sm:border-4 border-white shrink-0 mx-1"
        >
          <Phone className="w-5 h-5 sm:w-7 sm:h-7 fill-white" />
        </button>

        <button
          onClick={() => handleTabChange('requests')}
          className={`flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'requests' ? 'text-[#003893] bg-blue-50/90 shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          <span>Requests</span>
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          className={`flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap ${
            activeTab === 'profile' ? 'text-[#003893] bg-blue-50/90 shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
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
