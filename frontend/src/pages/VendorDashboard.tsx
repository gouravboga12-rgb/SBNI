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
import {
  fetchLenders,
  updateVendorProfileApi,
  getMyProfileApi,
  fetchVendorMyLeadsApi,
  safeSetLocalStorage,
  uploadFileToEc2Api,
  checkSubscriptionStatus,
  cancelAutoPayApi,
} from '../services/api';
import {
  downloadDocumentFile,
  resolveDocumentUrl,
  isPdfDocument,
} from '../utils/documentGenerators';
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
  Edit3,
  Save,
  X,
  Plus,
  XCircle,
  Download,
  AlertCircle,
  Repeat,
  Sparkles,
  Zap,
  CalendarCheck,
  Clock,
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
  hasActiveSubscription?: boolean;
  activeTab?: 'home' | 'lenders' | 'requests' | 'profile';
  onTabChange?: (tab: 'home' | 'lenders' | 'requests' | 'profile') => void;
  onLogout?: (roleTarget?: 'VENDOR' | 'LENDER') => void;
  currentUser?: any | null;
  onOpenAuth?: () => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  lenders,
  onOpenSubscription,
  hasActiveSubscription = false,
  activeTab: controlledActiveTab,
  onTabChange,
  onLogout,
  currentUser,
  onOpenAuth,
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
    const vpObj = currentUser?.vendorProfile;
    if (vpObj && vpObj.latitude && vpObj.longitude) {
      return {
        place: vpObj.place || vpObj.city || 'Shop Location',
        city: vpObj.city || 'Hyderabad',
        state: vpObj.state || 'Telangana',
        country: vpObj.country || 'India',
        latitude: Number(vpObj.latitude),
        longitude: Number(vpObj.longitude),
      };
    }
    try {
      const vp = localStorage.getItem('sbni_vendor_profile');
      if (vp) {
        const parsed = JSON.parse(vp);
        if (parsed.latitude && parsed.longitude) {
          return {
            place: parsed.place || parsed.city || 'Shop Location',
            city: parsed.city || 'Hyderabad',
            state: parsed.state || 'Telangana',
            country: parsed.country || 'India',
            latitude: Number(parsed.latitude),
            longitude: Number(parsed.longitude),
          };
        }
      }
    } catch (e) {}
    return {
      place: 'Shop Location',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      latitude: 17.3850,
      longitude: 78.4867,
    };
  });

  const [liveLenders, setLiveLenders] = useState<Lender[]>(lenders);
  const [isLoadingLenders, setIsLoadingLenders] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationModalMode, setLocationModalMode] = useState<'VENDOR_SEARCH' | 'GENERAL_LOCATION'>('VENDOR_SEARCH');
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  // Applications List (Strictly Real User Applications from AWS RDS Database)
  const [vendorApplications, setVendorApplications] = useState<any[]>(() => {
    try {
      const dynamicStr = localStorage.getItem('sbni_vendor_requests');
      if (dynamicStr) {
        const parsed = JSON.parse(dynamicStr);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((r) => r && r.id !== 'REQ-9842' && r.id !== 'REQ-4410' && !r.lenderName?.includes('Nishanth Money Finance') && !r.lenderName?.includes('Sharma Financer & NBFC'))
            .map((r: any) => ({
              ...r,
              isAccepted: r.status === 'Accepted' || r.status === 'Verified' || r.status === 'Approved' || r.status === 'Completed',
              isRejected: r.status === 'Rejected' || r.status === 'REJECTED',
            }));
        }
      }
    } catch (e) {}
    return [];
  });

  const loadVendorApplications = async () => {
    try {
      // 1. Fetch live leads directly from AWS RDS
      const apiRes = await fetchVendorMyLeadsApi();
      if (apiRes.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
        const mapped = apiRes.data.map((lead: any) => {
          let snap: any = {};
          try {
            if (lead.vendorSnapshot) {
              snap = typeof lead.vendorSnapshot === 'string' ? JSON.parse(lead.vendorSnapshot) : lead.vendorSnapshot;
            }
          } catch {}

          const status = lead.status || 'Pending';
          const isAccepted = status === 'Accepted' || status === 'Verified' || status === 'Approved' || status === 'Completed';
          const isRejected = status === 'Rejected' || status === 'REJECTED';

          const matchedLender = lenders.find(
            (l) =>
              (l.id && lead.lenderId && l.id === lead.lenderId) ||
              (l.institutionName && lead.lender?.institutionName && l.institutionName.toLowerCase() === lead.lender.institutionName.toLowerCase()) ||
              (l.institutionName && snap.lenderName && l.institutionName.toLowerCase() === snap.lenderName.toLowerCase())
          );

          const lenderPhone =
            lead.lender?.phone ||
            lead.lender?.user?.phone ||
            matchedLender?.phone ||
            snap.lenderPhone ||
            '';

          return {
            id: lead.id,
            vendorName: snap.vendorName || lead.vendor?.ownerName || 'Applicant Vendor',
            shopName: snap.shopName || lead.vendor?.businessName || 'Business Enterprise',
            shopAddress: snap.shopAddress || lead.vendor?.address || 'Registered Location',
            city: snap.city || lead.vendor?.city || 'Hyderabad',
            state: snap.state || lead.vendor?.state || 'Telangana',
            title: snap.shopName || (lead.lender?.institutionName ? `Application to ${lead.lender.institutionName}` : 'Financing Application'),
            lenderName: lead.lender?.institutionName || snap.lenderName || matchedLender?.institutionName || 'Verified Financer Partner',
            lenderId: lead.lenderId || matchedLender?.id,
            lenderPhone: lenderPhone || matchedLender?.phone,
            lenderLatitude: lead.lender?.latitude || snap.lenderLatitude || matchedLender?.latitude || 17.3713,
            lenderLongitude: lead.lender?.longitude || snap.lenderLongitude || matchedLender?.longitude || 78.5320,
            amount: lead.amount ? `₹ ${lead.amount.toLocaleString('en-IN')}` : snap.requiredAmount || '₹ 5,00,000',
            date: new Date(lead.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            status,
            isAccepted,
            isRejected,
            inquiryType: lead.type || 'LOAN_APPLICATION',
            inquiryMessage: lead.notes || (lead.type === 'PHONE_CALL' ? '📞 Vendor initiated a Phone Call inquiry' : lead.type === 'WHATSAPP' ? '💬 Vendor sent a WhatsApp inquiry' : '📝 Loan Application submitted'),
            mobileNumber: snap.mobileNumber || lead.vendor?.user?.phone || '',
            emailId: snap.emailId || lead.vendor?.user?.email || '',
            avatarUrl: snap.avatarUrl || lead.vendor?.avatarUrl || null,
            liveSelfieUrl: snap.liveSelfieUrl || snap.avatarUrl || null,
            panFileUrl: snap.panFileUrl || null,
            aadhaarFileUrl: snap.aadhaarFileUrl || null,
            shopLicensePdf: snap.shopLicensePdf || null,
            gstCertificatePdf: snap.gstCertificatePdf || null,
            shopPhotoUrl: snap.shopPhotoUrl || null,
            annualIncome: snap.annualIncome || lead.vendor?.annualTurnover || 'Under 2 Lakhs',
            annualTurnover: snap.annualTurnover || lead.vendor?.annualTurnover || 'Under 2 Lakhs',
          };
        });

        setVendorApplications(mapped);
        safeSetLocalStorage('sbni_vendor_requests', JSON.stringify(mapped));
        return;
      }
    } catch (e) {
      console.warn('Notice: loading local applications fallback:', e);
    }

    // 2. Fallback to localStorage if offline / local mock
    try {
      const dynamicStr = localStorage.getItem('sbni_vendor_requests');
      if (dynamicStr) {
        const parsed = JSON.parse(dynamicStr);
        if (Array.isArray(parsed)) {
          const valid = parsed
            .filter((r) => r && r.id !== 'REQ-9842' && r.id !== 'REQ-4410' && !r.lenderName?.includes('Nishanth Money Finance') && !r.lenderName?.includes('Sharma Financer & NBFC'))
            .map((r: any) => ({
              ...r,
              isAccepted: r.status === 'Accepted' || r.status === 'Verified' || r.status === 'Approved' || r.status === 'Completed',
              isRejected: r.status === 'Rejected' || r.status === 'REJECTED',
            }));
          setVendorApplications(valid);
          return;
        }
      }
    } catch (e) {}

    setVendorApplications([]);
  };

  useEffect(() => {
    loadVendorApplications();

    window.addEventListener('sbni_request_submitted', loadVendorApplications);
    window.addEventListener('storage', loadVendorApplications);
    return () => {
      window.removeEventListener('sbni_request_submitted', loadVendorApplications);
      window.removeEventListener('storage', loadVendorApplications);
    };
  }, []);

  const [liveVendorProfile, setLiveVendorProfile] = useState<any>(() => {
    try {
      const pStr = localStorage.getItem('sbni_vendor_profile');
      return pStr ? JSON.parse(pStr) : null;
    } catch {
      return null;
    }
  });

  // Fetch live vendor profile from backend on mount and via continuous interval
  useEffect(() => {
    async function loadFreshVendorProfile() {
      try {
        const res = await getMyProfileApi();
        if (res?.success && res?.data) {
          const u = res.data;
          const vp = u.vendorProfile;
          if (vp) {
            setLiveVendorProfile(vp);
            safeSetLocalStorage('sbni_vendor_profile', JSON.stringify(vp));
            safeSetLocalStorage('sbni_user', JSON.stringify(u));

            // Synchronize client-side fraud registry with the authoritative RDS status
            try {
              const sf = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');
              const vId = vp.id || u.id;
              const vEmail = (u.email || vp.email || '').toLowerCase().trim();

              if (vp.isFraud) {
                if (vId) sf[vId] = true;
                if (vp.id) sf[vp.id] = true;
                if (u.id) sf[u.id] = true;
                if (vEmail) sf[vEmail] = true;
              } else {
                if (vId) delete sf[vId];
                if (vp.id) delete sf[vp.id];
                if (u.id) delete sf[u.id];
                if (vEmail) delete sf[vEmail];
              }
              safeSetLocalStorage('sbni_fraud_vendors', JSON.stringify(sf));
            } catch {}

            if (vp.avatarUrl || vp.logoUrl) {
              setAvatarUrl(vp.avatarUrl || vp.logoUrl);
            }
            if (vp.latitude && vp.longitude) {
              setSearchLocation({
                place: vp.place || vp.city || 'Shop Location',
                city: vp.city || 'Hyderabad',
                state: vp.state || 'Telangana',
                country: vp.country || 'India',
                latitude: Number(vp.latitude),
                longitude: Number(vp.longitude),
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to load fresh vendor profile:', e);
      }
    }

    loadFreshVendorProfile();
    const interval = setInterval(loadFreshVendorProfile, 4000);

    const handleLenderSync = () => {
      loadFreshVendorProfile();
      loadNearbyLenders();
    };
    window.addEventListener('sbni_lender_profile_updated', handleLenderSync);
    window.addEventListener('sbni_vendor_profile_updated', handleLenderSync);
    window.addEventListener('sbni_fraud_updated', handleLenderSync);
    window.addEventListener('storage', handleLenderSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('sbni_lender_profile_updated', handleLenderSync);
      window.removeEventListener('sbni_vendor_profile_updated', handleLenderSync);
      window.removeEventListener('sbni_fraud_updated', handleLenderSync);
      window.removeEventListener('storage', handleLenderSync);
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

  // Subscription & AutoPay Management State
  const [vendorActiveSub, setVendorActiveSub] = useState<any>(null);
  const [loadingVendorSub, setLoadingVendorSub] = useState(false);
  const [cancellingVendorAutoPay, setCancellingVendorAutoPay] = useState(false);
  const [showVendorCancelModal, setShowVendorCancelModal] = useState(false);
  const [vendorSubFeedback, setVendorSubFeedback] = useState('');

  const loadVendorSubscription = async () => {
    setLoadingVendorSub(true);
    try {
      const res = await checkSubscriptionStatus();
      if (res.isActive && res.subscription) {
        setVendorActiveSub(res.subscription);
      } else {
        setVendorActiveSub(null);
      }
    } catch {
      setVendorActiveSub(null);
    } finally {
      setLoadingVendorSub(false);
    }
  };

  useEffect(() => {
    loadVendorSubscription();
    const handleSubSync = () => loadVendorSubscription();
    window.addEventListener('sbni_subscription_updated', handleSubSync);
    window.addEventListener('storage', handleSubSync);
    return () => {
      window.removeEventListener('sbni_subscription_updated', handleSubSync);
      window.removeEventListener('storage', handleSubSync);
    };
  }, []);

  const handleCancelVendorAutoPay = async () => {
    setCancellingVendorAutoPay(true);
    try {
      const res = await cancelAutoPayApi();
      if (res.success) {
        setVendorSubFeedback(res.message || 'AutoPay cancelled. Your plan remains active until expiration.');
        setVendorActiveSub((prev: any) => (prev ? { ...prev, isAutoPay: false } : prev));
        setShowVendorCancelModal(false);
        setTimeout(() => setVendorSubFeedback(''), 4500);
      } else {
        setVendorSubFeedback(res.message || 'Failed to cancel AutoPay.');
        setTimeout(() => setVendorSubFeedback(''), 4500);
      }
    } catch (err: any) {
      setVendorSubFeedback(err.message || 'Error cancelling AutoPay.');
      setTimeout(() => setVendorSubFeedback(''), 4500);
    } finally {
      setCancellingVendorAutoPay(false);
    }
  };

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
      safeSetLocalStorage('sbni_vendor_profile', JSON.stringify(merged));
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

  // Profile Avatar & Password Visibility State (scoped per authenticated user email)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    // Purge legacy unscoped global key if present
    try { localStorage.removeItem('sbni_vendor_avatar'); } catch (e) {}

    const direct = currentUser?.vendorProfile?.avatarUrl || currentUser?.vendorProfile?.logoUrl;
    if (direct) return direct;
    if (currentUser?.email) {
      return localStorage.getItem(`sbni_vendor_avatar_${currentUser.email}`) || null;
    }
    return null;
  });

  useEffect(() => {
    const direct = currentUser?.vendorProfile?.avatarUrl || currentUser?.vendorProfile?.logoUrl;
    const userKey = currentUser?.email ? `sbni_vendor_avatar_${currentUser.email}` : null;
    const saved = userKey ? localStorage.getItem(userKey) : null;
    setAvatarUrl(direct || saved || null);
  }, [currentUser]);

  const [showPassword, setShowPassword] = useState(false);

  const currentVendorObj = (() => {
    try {
      const uStr = localStorage.getItem('sbni_user');
      const pStr = localStorage.getItem('sbni_vendor_profile');
      const u = uStr ? JSON.parse(uStr) : currentUser;
      const profile = liveVendorProfile || (pStr ? JSON.parse(pStr) : (u?.vendorProfile || null));

      if (!u && !profile) return null;

      let rawName = profile?.ownerName || profile?.fullName || u?.vendorProfile?.ownerName || u?.name || u?.fullName;
      if (!rawName || rawName === 'Registered Vendor' || rawName === 'Business Owner' || rawName === 'Owner Name') {
        if (u?.email && u.email.includes('@')) {
          const prefix = u.email.split('@')[0];
          rawName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        } else {
          rawName = 'Business Owner';
        }
      }
      const name = rawName;
      const shopName = profile?.businessName || u?.vendorProfile?.businessName || (name ? `${name} Enterprise` : 'Business Enterprise');
      const phone = profile?.phone || u?.phone || 'Not provided';
      const email = profile?.email || u?.email || 'vendor@sbni.com';

      // Clean address resolution without duplicate concatenation
      const address = profile?.address || [profile?.place, profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(', ') || 'Registered Location';
      const annualTurnover = profile?.annualTurnover || profile?.annualIncome || 'Under 2 Lakhs';

      const panNumber = profile?.panNumber || u?.panNumber || null;
      const gstNumber = profile?.gstNumber || null;
      const aadhaarNumber = profile?.aadhaarNumber || null;
      const category = profile?.category || profile?.registrationType || 'Retail Shop Business';
      const shopId = profile?.id ? `SHOP-${String(profile.id).substring(0, 5).toUpperCase()}` : (u?.id ? `SHOP-${String(u.id).substring(0, 5).toUpperCase()}` : 'SHOP-1001');
      const isVerified = profile?.kycStatus === 'VERIFIED' || u?.isVerified || false;
      const panFileUrl = profile?.panFileUrl || null;
      const aadhaarFileUrl = profile?.aadhaarFileUrl || null;
      const businessLicenseUrl = profile?.businessLicenseUrl || profile?.shopLicensePdf || null;
      const gstFileUrl = profile?.gstFileUrl || profile?.gstCertificatePdf || null;
      let shopPhotos: string[] = [];
      try {
        if (profile?.shopPhotos) {
          shopPhotos = typeof profile.shopPhotos === 'string' ? JSON.parse(profile.shopPhotos) : profile.shopPhotos;
        }
      } catch (e) {}

      // Authoritative fraud status directly from PostgreSQL RDS
      const isFraud = typeof profile?.isFraud === 'boolean'
        ? profile.isFraud
        : (typeof u?.isFraud === 'boolean' ? u.isFraud : false);

      return {
        name,
        shopName,
        phone,
        email,
        address,
        annualTurnover,
        panNumber,
        gstNumber,
        aadhaarNumber,
        category,
        shopId,
        isVerified,
        isFraud,
        panFileUrl,
        aadhaarFileUrl,
        businessLicenseUrl,
        gstFileUrl,
        shopPhotos,
      };
    } catch (e) {
      return null;
    }
  })();

  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; url: string; type: 'image' | 'doc' } | null>(null);
  const [isEditingVendorProfile, setIsEditingVendorProfile] = useState(false);
  const [vendorEditForm, setVendorEditForm] = useState({
    name: '',
    shopName: '',
    phone: '',
    email: '',
    address: '',
    category: '',
    annualTurnover: 'Under 2 Lakhs',
    panNumber: '',
    aadhaarNumber: '',
    gstNumber: '',
    panFileUrl: '',
    aadhaarFileUrl: '',
    businessLicenseUrl: '',
    gstFileUrl: '',
    shopPhotos: [] as string[],
  });
  const [isSavingVendorProfile, setIsSavingVendorProfile] = useState(false);
  const [vendorSaveSuccess, setVendorSaveSuccess] = useState<string | null>(null);
  const [uploadingDocField, setUploadingDocField] = useState<string | null>(null);
  const [uploadedDocNames, setUploadedDocNames] = useState<Record<string, string>>({});

  const startEditingVendor = () => {
    if (!currentVendorObj) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setVendorEditForm({
      name: currentVendorObj.name || '',
      shopName: currentVendorObj.shopName || '',
      phone: currentVendorObj.phone || '',
      email: currentVendorObj.email || '',
      address: currentVendorObj.address || '',
      category: currentVendorObj.category || 'Retail Shop Business',
      annualTurnover: currentVendorObj.annualTurnover || 'Under 2 Lakhs',
      panNumber: currentVendorObj.panNumber || '',
      aadhaarNumber: currentVendorObj.aadhaarNumber || '',
      gstNumber: currentVendorObj.gstNumber || '',
      panFileUrl: currentVendorObj.panFileUrl || '',
      aadhaarFileUrl: currentVendorObj.aadhaarFileUrl || '',
      businessLicenseUrl: currentVendorObj.businessLicenseUrl || '',
      gstFileUrl: currentVendorObj.gstFileUrl || '',
      shopPhotos: currentVendorObj.shopPhotos || [],
    });
    setIsEditingVendorProfile(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size must be under 5MB.');
      return;
    }
    setUploadingDocField('avatar');
    try {
      const res = await uploadFileToEc2Api(file, 'avatars', file.name, 'AVATAR');
      const fileUrl = res.fileUrl || res.fullUrl;
      if (fileUrl) {
        setAvatarUrl(fileUrl);
        if (currentUser?.email) {
          localStorage.setItem(`sbni_vendor_avatar_${currentUser.email}`, fileUrl);
        }
        await updateVendorProfileApi({
          avatarUrl: fileUrl,
          logoUrl: fileUrl,
        });
        window.dispatchEvent(new CustomEvent('sbni_vendor_profile_updated'));
        setVendorSaveSuccess('✅ Profile photo updated & saved on AWS!');
        setTimeout(() => setVendorSaveSuccess(null), 4000);
      } else {
        alert(res.message || 'Failed to upload photo.');
      }
    } catch (err: any) {
      console.error('Failed to upload avatar to AWS EC2:', err);
      alert('Failed to upload profile photo. Please try again.');
    } finally {
      setUploadingDocField(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleDocFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'panFileUrl' | 'aadhaarFileUrl' | 'businessLicenseUrl' | 'gstFileUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.');
      return;
    }
    const fileName = file.name;
    setUploadingDocField(field);
    try {
      const folder = 'documents';
      const docType = field === 'panFileUrl' ? 'PAN' : field === 'aadhaarFileUrl' ? 'AADHAAR' : field === 'gstFileUrl' ? 'GST_CERTIFICATE' : 'BUSINESS_PROOF';
      const res = await uploadFileToEc2Api(file, folder, fileName, docType);
      const fileUrl = res.fileUrl || res.fullUrl;
      if (fileUrl) {
        setVendorEditForm((prev) => ({ ...prev, [field]: fileUrl }));
        setUploadedDocNames((prev) => ({ ...prev, [field]: fileName }));
        setVendorSaveSuccess(`✅ Uploaded "${fileName}" to AWS! Click "Save & Apply" at the bottom to apply changes.`);
        setTimeout(() => setVendorSaveSuccess(null), 6000);
      } else {
        alert(res.message || 'Failed to upload file to AWS server.');
      }
    } catch (err) {
      console.error('Failed to upload document to AWS EC2:', err);
      alert('Failed to upload file to AWS server.');
    } finally {
      setUploadingDocField(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleAddShopPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Photo size must be under 10MB.');
      return;
    }
    const fileName = file.name;
    setUploadingDocField('shopPhotos');
    try {
      const res = await uploadFileToEc2Api(file, 'shops', fileName, 'SHOP_PREMISES');
      const fileUrl = res.fileUrl || res.fullUrl;
      if (fileUrl) {
        setVendorEditForm((prev) => ({
          ...prev,
          shopPhotos: [...(prev.shopPhotos || []), fileUrl],
        }));
        setVendorSaveSuccess(`✅ Added shop photo "${fileName}". Click "Save & Apply" to apply.`);
        setTimeout(() => setVendorSaveSuccess(null), 5000);
      } else {
        alert(res.message || 'Failed to upload shop photo.');
      }
    } catch (err) {
      console.error('Failed to upload shop photo to AWS EC2:', err);
      alert('Failed to upload shop photo.');
    } finally {
      setUploadingDocField(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveVendorProfile = async () => {
    setIsSavingVendorProfile(true);
    try {
      // 1. Update local storage
      const uStr = localStorage.getItem('sbni_user') || '{}';
      const pStr = localStorage.getItem('sbni_vendor_profile') || '{}';
      const u = JSON.parse(uStr);
      const p = JSON.parse(pStr);

      const mergedProfile = {
        ...p,
        ownerName: vendorEditForm.name,
        businessName: vendorEditForm.shopName,
        phone: vendorEditForm.phone,
        email: vendorEditForm.email,
        address: vendorEditForm.address,
        category: vendorEditForm.category,
        annualTurnover: vendorEditForm.annualTurnover,
        panNumber: vendorEditForm.panNumber,
        aadhaarNumber: vendorEditForm.aadhaarNumber,
        gstNumber: vendorEditForm.gstNumber,
        avatarUrl: avatarUrl || p.avatarUrl || undefined,
        panFileUrl: vendorEditForm.panFileUrl || p.panFileUrl || undefined,
        aadhaarFileUrl: vendorEditForm.aadhaarFileUrl || p.aadhaarFileUrl || undefined,
        businessLicenseUrl: vendorEditForm.businessLicenseUrl || p.businessLicenseUrl || undefined,
        gstFileUrl: vendorEditForm.gstFileUrl || p.gstFileUrl || undefined,
        shopPhotos: vendorEditForm.shopPhotos.length > 0 ? JSON.stringify(vendorEditForm.shopPhotos) : p.shopPhotos || undefined,
      };

      const mergedUser = {
        ...u,
        name: vendorEditForm.name,
        fullName: vendorEditForm.name,
        phone: vendorEditForm.phone,
        email: vendorEditForm.email,
        vendorProfile: mergedProfile,
      };

      safeSetLocalStorage('sbni_user', JSON.stringify(mergedUser));
      safeSetLocalStorage('sbni_vendor_profile', JSON.stringify(mergedProfile));

      // 2. Call backend API
      const apiRes = await updateVendorProfileApi({
        ownerName: vendorEditForm.name,
        businessName: vendorEditForm.shopName,
        phone: vendorEditForm.phone,
        email: vendorEditForm.email,
        address: vendorEditForm.address,
        category: vendorEditForm.category,
        annualTurnover: vendorEditForm.annualTurnover,
        panNumber: vendorEditForm.panNumber,
        aadhaarNumber: vendorEditForm.aadhaarNumber,
        gstNumber: vendorEditForm.gstNumber,
        avatarUrl: avatarUrl || undefined,
        panFileUrl: vendorEditForm.panFileUrl || undefined,
        aadhaarFileUrl: vendorEditForm.aadhaarFileUrl || undefined,
        businessLicenseUrl: vendorEditForm.businessLicenseUrl || undefined,
        gstFileUrl: vendorEditForm.gstFileUrl || undefined,
        shopPhotos: vendorEditForm.shopPhotos,
      });

      if (!apiRes.success) {
        alert(apiRes.message || 'Failed to save profile changes on server.');
        return;
      }

      window.dispatchEvent(new CustomEvent('sbni_vendor_profile_updated'));

      setVendorSaveSuccess('✅ Business profile and documents updated & synced globally!');
      setTimeout(() => setVendorSaveSuccess(null), 4000);
      setIsEditingVendorProfile(false);
    } catch (err: any) {
      console.error('Failed to save vendor profile:', err);
      alert('Failed to save profile changes. Please try again.');
    } finally {
      setIsSavingVendorProfile(false);
    }
  };



  const handleRequestLoan = (lender: Lender) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (currentVendorObj?.isFraud) {
      alert('🚨 Account Restricted: Your shop account has been flagged as Fraud / Blacklisted by Admin. Loan applications and financing requests are currently restricted. Please contact JustPaisa support.');
      return;
    }

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

  useEffect(() => {
    if (activeTab === 'requests') {
      loadVendorApplications();
    }
  }, [activeTab]);

  const handleTabChange = (tab: 'home' | 'lenders' | 'requests' | 'profile') => {
    // Gate: Financers tab requires login
    if (tab === 'lenders' && !currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    // Gate: Financers tab requires active subscription
    if (tab === 'lenders' && currentUser && !hasActiveSubscription) {
      if (onOpenSubscription) onOpenSubscription();
      return;
    }
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentLendersList = liveLenders;
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
        
        {/* Fraud / Blacklist Warning Banner */}
        {currentVendorObj?.isFraud && (
          <div className="mb-6 p-5 rounded-3xl bg-rose-50 border-2 border-rose-400 text-rose-950 flex items-start gap-3.5 shadow-lg animate-fade-in">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
              <AlertCircle className="w-6 h-6 text-rose-600 animate-pulse" />
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="font-black text-sm text-rose-900 flex items-center gap-2">
                <span>🚨 FRAUD / BLACKLIST ACCOUNT NOTICE</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-extrabold border border-rose-300">
                  Working Restricted
                </span>
              </div>
              <p className="font-semibold text-rose-800 leading-relaxed">
                Your shop account has been flagged and confirmed as a <strong>Fraud Account</strong> by Super Admin. Applying for new financing, requesting loans from lenders, and initiating lender contacts are currently restricted. Please contact JustPaisa support if you believe this is in error.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: HOME VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Top Auto-Scrolling Visual Banner Carousel with Manual Controls */}
            <BannerCarousel slides={VENDOR_BANNER_SLIDES} autoScrollIntervalMs={4000} />

            {/* Top Cards Hero Banner: Responsive Grid (1 col Mobile, 2 col Tab, 3 col Desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              
              {/* Card 1: Welcome Royal Blue Card (Only when Logged In) OR Public Portal CTA (When Logged Out) */}
              {currentVendorObj ? (
                <div className="card-blue-header p-6 shadow-xl relative overflow-hidden flex items-center justify-between min-h-[170px] border border-blue-400/20 group">
                  {/* Glow Overlay */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-400/30 transition-colors" />

                  <div className="space-y-1.5 z-10">
                    <div className="text-xs text-blue-200 font-semibold tracking-wide uppercase">Welcome back,</div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">{currentVendorObj.name}</h2>
                    <div className="pt-2">
                      {currentVendorObj.isFraud ? (
                        <span className="badge-pending-amber bg-rose-600/40 text-rose-200 border border-rose-400/50 shadow-sm backdrop-blur-md font-extrabold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-300" /> Account Flagged as Fraud (Restricted)
                        </span>
                      ) : (
                        <span className="badge-verified-green bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm backdrop-blur-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Shop Owner
                        </span>
                      )}
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
              ) : (
                <div className="card-blue-header p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[170px] border border-blue-400/20 group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-400/30 transition-colors" />
                  <div className="space-y-1.5 z-10">
                    <div className="text-xs text-blue-200 font-semibold tracking-wide uppercase">Small Business Marketplace</div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">Direct Capital for Local Shops</h2>
                    <p className="text-xs text-blue-100/90 leading-relaxed max-w-sm">
                      Connect directly with verified local money financers & NBFCs within 10 KM for fast working capital.
                    </p>
                  </div>
                  <div className="pt-3 z-10">
                    <button
                      onClick={onOpenAuth}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-[#003893] hover:bg-blue-50 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In / Register Shop Account</span>
                    </button>
                  </div>
                </div>
              )}

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
                    <div className="text-[11px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-200 w-fit flex items-center gap-1">
                      {currentVendorObj ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Plan Active
                        </>
                      ) : (
                        <span>⚡ JustPaisa Marketplace</span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg font-heading pt-1">Small Shop & Local Startup Business Membership</h3>
                    <p className="text-xs text-slate-500 font-medium">Direct financer contacts & priority application routing active.</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Headphones className="w-6 h-6" />
                  </div>
                </div>

                <button
                  onClick={onOpenSubscription}
                  className="btn-sbni-blue mt-4 text-xs justify-center py-2.5 shadow-md font-extrabold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
                >
                  <span>{currentVendorObj ? 'Manage Subscription' : 'View Membership Plans'}</span>
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
                    className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All ({currentLendersList.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {isLoadingLenders ? (
                    <div className="card-white p-8 text-center text-xs text-slate-500 font-medium space-y-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      <div>Discovering nearby verified financers with Mapbox GPS...</div>
                    </div>
                  ) : currentLendersList.filter((l) => Number(l.distanceKm) <= (Number(l.lendingRadiusKm) || 50)).length === 0 ? (
                    <div className="card-white p-8 text-center rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm">No Financers Located within Service Radius</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        No active financers found within their service radius of {searchLocation.place}, {searchLocation.city}. Expand your location search or explore all financers.
                      </p>
                      <button
                        onClick={() => handleTabChange('lenders')}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                      >
                        Explore All Financers ({currentLendersList.length})
                      </button>
                    </div>
                  ) : (
                    currentLendersList
                      .filter((l) => Number(l.distanceKm) <= (Number(l.lendingRadiusKm) || 50))
                      .slice(0, 3)
                      .map((lender) => (
                        <LenderCard
                          key={lender.id}
                          lender={lender}
                          onOpenSubscription={onOpenSubscription}
                          onRequestLoan={handleRequestLoan}
                        />
                      ))
                  )}
                </div>
              </div>

              {/* Right Column (1 Col on Desktop): Recent Activity & Protection Banner */}
              <div className="space-y-4">
                {/* Recent Activity: Hidden on mobile view as requested */}
                <div className="hidden md:block space-y-4">
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
                Found <strong className="text-[#003893] font-black">{filteredLenders.length}</strong> eligible financer{filteredLenders.length === 1 ? '' : 's'} within service coverage of{' '}
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
              <div className="card-white p-8 sm:p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-xl mx-auto my-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-[#003893] shadow-inner">
                  <Compass className="w-8 h-8" />
                </div>
                
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-[#003893] text-[11px] font-extrabold uppercase tracking-wider mb-1">
                    <span>🚀 Coverage Expanding Soon</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl font-heading">
                    No Registered Financers in This Area Yet
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Currently, there are no registered business money financers covering <strong className="text-slate-900">{searchLocation.place || searchLocation.city}</strong> within their active radius.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed pt-1">
                    New verified financers and NBFC partners are onboarding and will be available in your location soon. For now, please explore adjacent business hubs or try searching a nearby city.
                  </p>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationModalMode('VENDOR_SEARCH');
                      setIsLocationModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#003893] to-[#001f54] hover:from-[#002669] hover:to-[#001438] text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Alternative Places / Nearby Cities</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchLocation({
                        place: searchLocation.city || 'Hyderabad',
                        city: searchLocation.city || 'Hyderabad',
                        state: searchLocation.state || 'Telangana',
                        country: 'India',
                        latitude: searchLocation.latitude || 17.3850,
                        longitude: searchLocation.longitude || 78.4867,
                      });
                      loadNearbyLenders(searchLocation.latitude || 17.3850, searchLocation.longitude || 78.4867);
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <span>View Entire City</span>
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
        {/* TAB 3: APPLICATIONS & NAVIGATION VIEW */}
        {activeTab === 'requests' && (
          !currentVendorObj ? (
            <div className="card-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-5 max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#003893] shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 font-heading">Log In to View Applications</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Sign in to track your loan verification requests, application status, and financer approvals in real-time.
                </p>
              </div>
              <button
                onClick={onOpenAuth}
                className="btn-sbni-blue py-3 px-8 text-xs font-extrabold shadow-lg mx-auto flex items-center gap-2 cursor-pointer"
              >
                <span>Log In to View Applications</span>
              </button>
            </div>
          ) : (
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
                      onClick={() => handleTabChange('lenders')}
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
                      app.isAccepted ||
                      app.status === 'Verified' ||
                      app.status === 'Approved' ||
                      app.status === 'Accepted' ||
                      app.status === 'Completed';

                    const isRejected =
                      app.isRejected ||
                      app.status === 'Rejected' ||
                      app.status === 'REJECTED';

                    const matchedLender = lenders.find(
                      (l) =>
                        (l.id && app.lenderId && l.id === app.lenderId) ||
                        (l.institutionName && app.lenderName && l.institutionName.toLowerCase() === app.lenderName.toLowerCase())
                    );
                    const rawLenderPhone = app.lenderPhone || matchedLender?.phone || '9553921237';
                    const cleanPhone = (rawLenderPhone || '').replace(/\D/g, '') || '9553921237';
                    const effectivePhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
                    const whatsAppMsg = encodeURIComponent(
                      `Hello ${app.lenderName || 'Financer'}, I am contacting you regarding my loan application #${(app.id || '').substring(0, 8)} (${app.title || app.shopName || 'Business Application'}) on Just Paisa App.`
                    );
                    const whatsAppUrl = `https://wa.me/91${effectivePhone}?text=${whatsAppMsg}`;
                    const callUrl = `tel:${effectivePhone}`;

                    return (
                      <div key={app.id || idx} className="card-white p-5 space-y-4 shadow-sm border border-slate-200/90 rounded-2xl relative overflow-hidden group hover:border-blue-300 transition-all">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className={
                            isAccepted
                              ? 'badge-verified-green'
                              : isRejected
                              ? 'px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold border border-rose-200 flex items-center gap-1'
                              : 'badge-pending-amber'
                          }>
                            {isAccepted ? '✓ Request Accepted' : isRejected ? '✕ Application Rejected' : '⏳ Under Review'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">App #{app.id ? app.id.substring(0, 18) : idx}</span>
                        </div>

                        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-base">{app.title || app.shopName || 'Men\'s Store'}</h3>
                            <p className="text-xs text-blue-900 font-bold mt-0.5">Financer: {app.lenderName}</p>
                          </div>

                          {/* Direct Financer Call & WhatsApp Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={callUrl}
                              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer hover:border-emerald-400"
                              title={`Call Financer (${effectivePhone})`}
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Call</span>
                            </a>
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer hover:border-[#25D366]/60"
                              title={`WhatsApp Financer (${effectivePhone})`}
                            >
                              <svg className="w-3.5 h-3.5 fill-current text-[#25D366]" viewBox="0 0 24 24">
                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.983.538 1.895.82 2.79.82h.001c3.181 0 5.768-2.586 5.769-5.766.001-3.182-2.585-5.768-5.77-5.768zm3.376 8.163c-.141.396-.708.76-1.029.805-.302.043-.687.067-2.222-.568-1.964-.813-3.232-2.816-3.33-2.946-.098-.13-1.066-1.418-1.066-2.705 0-1.286.674-1.921.914-2.179.24-.257.525-.322.701-.322.176 0 .351.002.504.01.162.008.38-.061.595.454.22.528.751 1.831.816 1.964.065.133.109.288.022.46-.087.172-.131.28-.261.432-.131.152-.275.339-.393.455-.13.13-.267.271-.115.531.152.261.677 1.115 1.455 1.808 1.001.892 1.846 1.168 2.107 1.298.261.13.414.109.567-.065.152-.175.654-.76.828-1.02.175-.261.349-.218.589-.13.24.087 1.527.72 1.789.851.261.131.436.196.501.305.066.109.066.632-.075 1.028z"/>
                              </svg>
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div>Requested Amount: <span className="font-bold text-slate-900">{app.amount || '₹ 5,00,000'}</span></div>
                          <div>Application Date: <span className="font-medium">{app.date || app.requestedDate || 'Recent'}</span></div>
                        </div>

                        {/* Action / Information based on status */}
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
                          ) : isRejected ? (
                            <div className="w-full space-y-2">
                              <p className="text-[11px] text-rose-700 font-medium text-center">
                                Financer was unable to approve this financing request at this time.
                              </p>
                              <button
                                onClick={() => handleTabChange('lenders')}
                                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>Explore Other Financers in Area</span>
                              </button>
                            </div>
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
          )
        )}

        {/* TAB 4: COMPREHENSIVE SMALL SHOP BUSINESS PROFILE VIEW */}
        {activeTab === 'profile' && (
          !currentVendorObj ? (
            <div className="card-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-5 max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#003893] shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 font-heading">Authentication Required</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Please log in to your Small Shop Business account to view your business profile, edit KYC documents, and inspect store credentials.
                </p>
              </div>
              <button
                onClick={onOpenAuth}
                className="btn-sbni-blue py-3 px-8 text-xs font-extrabold shadow-lg mx-auto flex items-center gap-2 cursor-pointer"
              >
                <span>Log In / Sign Up to View Profile</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
              
              {/* Header Title & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">Small Shop & Local Startup Business Profile</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Manage your registration details, verification documents, and profile photo
                  </p>
                </div>
                
                {!isEditingVendorProfile ? (
                  <button
                    type="button"
                    onClick={startEditingVendor}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#003893] border border-blue-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-[#003893]" />
                    <span>Edit Profile Details</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditingVendorProfile(false)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveVendorProfile}
                      disabled={isSavingVendorProfile}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#003893] hover:bg-[#002366] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      {isSavingVendorProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-emerald-400" />
                          <span>Save Profile Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

            {/* Save Success Banner */}
            {vendorSaveSuccess && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{vendorSaveSuccess}</span>
              </div>
            )}

            {/* Profile Main Card */}
            <div className="card-white p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-md border border-slate-200/90 rounded-2xl sm:rounded-3xl">
              
              {/* Header Box with Profile Avatar Upload */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pb-5 sm:pb-6 border-b border-slate-100 relative">
                
                {/* User Profile Avatar with Interactive Camera Overlay */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#003893] to-[#001f54] text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-lg overflow-hidden border-4 border-white ring-2 ring-blue-100">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Shop Business Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentVendorObj.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Camera Upload Button */}
                  <label 
                    title="Upload Profile Picture"
                    className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-[#003893] hover:bg-[#002366] text-white p-2 sm:p-2.5 rounded-full shadow-xl border-2 border-white cursor-pointer transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                  >
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Vendor Identity Details */}
                <div className="text-center sm:text-left space-y-1 flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading break-words">
                      {isEditingVendorProfile ? vendorEditForm.name || currentVendorObj.name : currentVendorObj.name}
                    </h3>
                    <span className="badge-verified-green w-fit mx-auto sm:mx-0 text-[10px] sm:text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Shop Owner
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm font-semibold text-slate-700 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    <Store className="w-4 h-4 text-[#003893] shrink-0" />
                    <span className="break-words">{isEditingVendorProfile ? vendorEditForm.shopName || currentVendorObj.shopName : currentVendorObj.shopName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {isEditingVendorProfile ? vendorEditForm.category || currentVendorObj.category : currentVendorObj.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 font-medium pt-0.5">
                    Registration ID: <span className="font-mono text-slate-700 font-bold">{currentVendorObj.shopId}</span>
                  </p>

                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                    <label className="text-xs font-bold text-[#003893] hover:text-blue-900 cursor-pointer flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors active:scale-95">
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

              {/* ── MEMBERSHIP & AUTOPAY BILLING SECTION ────────────────── */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-200/90 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#003893] flex items-center justify-center font-extrabold shrink-0 shadow-xs">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-700">
                        Membership & Billing
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 font-heading flex items-center gap-2">
                        <span>{vendorActiveSub?.plan?.name || (vendorActiveSub ? 'Active Vendor Plan' : 'No Active Membership')}</span>
                        {vendorActiveSub?.isAutoPay && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Repeat className="w-3 h-3 text-emerald-600" /> AutoPay: Active
                          </span>
                        )}
                        {!vendorActiveSub?.isAutoPay && vendorActiveSub?.endDate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                            AutoPay: Off
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {vendorActiveSub?.isAutoPay && (
                      <button
                        type="button"
                        onClick={() => setShowVendorCancelModal(true)}
                        disabled={cancellingVendorAutoPay}
                        className="px-3.5 py-2 text-xs font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-xs active:scale-95"
                      >
                        {cancellingVendorAutoPay ? 'Cancelling...' : 'Cancel AutoPay'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={onOpenSubscription}
                      className="btn-sbni-blue px-4 py-2 text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{vendorActiveSub ? 'Upgrade Plan' : 'Activate Plan'}</span>
                    </button>
                  </div>
                </div>

                {vendorSubFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs text-center animate-bounce">
                    {vendorSubFeedback}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Plan Status</span>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{vendorActiveSub ? 'Active & Verified' : 'Free Discovery Mode'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Valid Until</span>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{vendorActiveSub?.endDate ? new Date(vendorActiveSub.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Auto-Renewal</span>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Repeat className={`w-4 h-4 ${vendorActiveSub?.isAutoPay ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{vendorActiveSub?.isAutoPay ? 'Continuous Auto-Renewal (UPI/Card)' : 'Manual Renewal'}</span>
                    </div>
                  </div>
                </div>

                {/* Cancel AutoPay Confirmation Modal for Vendor */}
                {showVendorCancelModal && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                          Turn Off AutoPay?
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                          Your subscription will not be charged again. You will continue to have full, uninterrupted platform access until{' '}
                          <span className="font-extrabold text-slate-900">
                            {vendorActiveSub?.endDate ? new Date(vendorActiveSub.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'the end of your current cycle'}
                          </span>
                          .
                        </p>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowVendorCancelModal(false)}
                          disabled={cancellingVendorAutoPay}
                          className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Keep AutoPay
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelVendorAutoPay}
                          disabled={cancellingVendorAutoPay}
                          className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                        >
                          {cancellingVendorAutoPay ? 'Cancelling...' : 'Yes, Turn Off'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 1: Personal & Business Registration Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base font-heading">
                    <User className="w-4 h-4 text-[#003893]" />
                    <span>Personal & Business Information</span>
                  </div>
                  {isEditingVendorProfile && (
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      ✏️ Edit Active
                    </span>
                  )}
                </div>

                {!isEditingVendorProfile ? (
                  /* View Mode */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                    
                    {/* Full Name */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Owner / Full Name</span>
                      <div className="font-extrabold text-slate-900 text-sm break-words">{currentVendorObj.name}</div>
                    </div>

                    {/* Phone Number / Mobile */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Phone Number / Mobile</span>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{currentVendorObj.phone}</span>
                      </div>
                    </div>

                    {/* Gmail / Email ID */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Gmail / Email ID</span>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 break-all">
                        <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{currentVendorObj.email}</span>
                      </div>
                    </div>

                    {/* Shop / Business Name */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Shop / Business Name</span>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 break-words">
                        <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{currentVendorObj.shopName}</span>
                      </div>
                    </div>

                    {/* Category & Annual Income */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Business Category</span>
                      <div className="font-extrabold text-slate-900 text-sm">{currentVendorObj.category}</div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Annual Income</span>
                      <div className="font-extrabold text-slate-900 text-sm">{currentVendorObj.annualTurnover || 'Under 2 Lakhs'}</div>
                    </div>

                    {/* Full Address */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Full Shop / Business Address</span>
                      <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-start gap-1.5 break-words">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{currentVendorObj.address}</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Edit Mode Inputs */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    
                    {/* Full Name */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Owner / Full Name *</label>
                      <input
                        type="text"
                        value={vendorEditForm.name}
                        onChange={(e) => setVendorEditForm({ ...vendorEditForm, name: e.target.value })}
                        placeholder="e.g. Gourav Boga"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Phone Number / Mobile *</label>
                      <input
                        type="tel"
                        value={vendorEditForm.phone}
                        onChange={(e) => setVendorEditForm({ ...vendorEditForm, phone: e.target.value })}
                        placeholder="e.g. 7337401590"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      />
                    </div>

                    {/* Email */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Gmail / Email ID *</label>
                      <input
                        type="email"
                        value={vendorEditForm.email}
                        onChange={(e) => setVendorEditForm({ ...vendorEditForm, email: e.target.value })}
                        placeholder="e.g. vendor@example.com"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Shop Name */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Shop / Business Name *</label>
                      <input
                        type="text"
                        value={vendorEditForm.shopName}
                        onChange={(e) => setVendorEditForm({ ...vendorEditForm, shopName: e.target.value })}
                        placeholder="e.g. Gourav Electronics & Enterprises"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Business Category */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Business Category *</label>
                      <select
                        value={vendorEditForm.category}
                        onChange={(e) => setVendorEditForm({ ...vendorEditForm, category: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Retail Shop Business">Retail Shop Business</option>
                        <option value="Wholesale & Distribution">Wholesale & Distribution</option>
                        <option value="Food & Grocery">Food & Grocery</option>
                        <option value="Electronics & Mobile">Electronics & Mobile</option>
                        <option value="Textiles & Garments">Textiles & Garments</option>
                        <option value="Manufacturing & Workshop">Manufacturing & Workshop</option>
                        <option value="Services & Consulting">Services & Consulting</option>
                        <option value="Local Startup Enterprise">Local Startup Enterprise</option>
                      </select>
                    </div>

                    {/* Annual Income */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Annual Income</label>
                      <select
                        value={vendorEditForm.annualTurnover}
                        onChange={(e) => setVendorEditForm({ ...vendorEditForm, annualTurnover: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Under 2 Lakhs">Under 2 Lakhs / year</option>
                        <option value="2-5 Lakhs">2 - 5 Lakhs / year</option>
                        <option value="5-10 Lakhs">5 - 10 Lakhs / year</option>
                        <option value="10-25 Lakhs">10 - 25 Lakhs / year</option>
                        <option value="25 Lakhs+">25 Lakhs+ / year</option>
                      </select>
                    </div>

                    {/* Full Address */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5 sm:col-span-2">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Full Shop / Business Address *</label>
                      <textarea
                        rows={2}
                        value={vendorEditForm.address}
                        onChange={(e) => setVendorEditForm({ ...vendorEditForm, address: e.target.value })}
                        placeholder="e.g. Shop #12, Chaitanya Puri Main Road, Dilsukhnagar, Hyderabad, Telangana - 500060"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      />
                    </div>

                  </div>
                )}

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
                  <span>KYC & Identity Verification Documents</span>
                </div>

                {!isEditingVendorProfile ? (
                  /* View Mode Documents */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    
                    {/* PAN Card Document */}
                    {(() => {
                      const hasPan = Boolean(currentVendorObj.panFileUrl && currentVendorObj.panFileUrl.trim().length > 10);
                      return (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              PAN Card
                            </span>
                            {hasPan ? (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Uploaded
                              </span>
                            ) : currentVendorObj.panNumber ? (
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                                Number Added
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                                Not Uploaded
                              </span>
                            )}
                          </div>
                          <div className="font-mono font-bold text-slate-900 text-xs bg-white p-2 rounded-xl border border-slate-200 truncate">
                            {currentVendorObj.panNumber || 'No PAN Provided'}
                          </div>
                          {hasPan ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: `PAN Card (${currentVendorObj.panNumber || currentVendorObj.name})`, url: currentVendorObj.panFileUrl!, type: 'doc' })}
                              className="w-full py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                            >
                              <Eye className="w-3.5 h-3.5" /> View PAN Document
                            </button>
                          ) : (
                            <div className="text-[11px] text-slate-400 text-center py-1">No File Attached</div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Aadhaar Card Document */}
                    {(() => {
                      const hasAadhaar = Boolean(currentVendorObj.aadhaarFileUrl && currentVendorObj.aadhaarFileUrl.trim().length > 10);
                      return (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              Aadhaar Card
                            </span>
                            {hasAadhaar ? (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Uploaded
                              </span>
                            ) : currentVendorObj.aadhaarNumber ? (
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                                Number Added
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                                Not Uploaded
                              </span>
                            )}
                          </div>
                          <div className="font-mono font-bold text-slate-900 text-xs bg-white p-2 rounded-xl border border-slate-200 truncate">
                            {currentVendorObj.aadhaarNumber || 'No Aadhaar Provided'}
                          </div>
                          {hasAadhaar ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: `Aadhaar Card (${currentVendorObj.aadhaarNumber || currentVendorObj.name})`, url: currentVendorObj.aadhaarFileUrl!, type: 'doc' })}
                              className="w-full py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Aadhaar Card
                            </button>
                          ) : (
                            <div className="text-[11px] text-slate-400 text-center py-1">No File Attached</div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Business License / Shop Proof */}
                    {(() => {
                      const hasLicense = Boolean(currentVendorObj.businessLicenseUrl && currentVendorObj.businessLicenseUrl.trim().length > 10);
                      return (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              Business License
                            </span>
                            {hasLicense ? (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Uploaded
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                                Optional
                              </span>
                            )}
                          </div>
                          <div className="font-mono font-bold text-slate-700 text-xs bg-white p-2 rounded-xl border border-slate-200 truncate">
                            {hasLicense ? 'Shop & Establishment Proof' : 'Not Uploaded'}
                          </div>
                          {hasLicense ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: `Business License (${currentVendorObj.shopName})`, url: currentVendorObj.businessLicenseUrl!, type: 'doc' })}
                              className="w-full py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                            >
                              <Eye className="w-3.5 h-3.5" /> View License Document
                            </button>
                          ) : (
                            <div className="text-[11px] text-slate-400 text-center py-1">No File Attached</div>
                          )}
                        </div>
                      );
                    })()}

                    {/* GST Certificate */}
                    {(() => {
                      const hasGst = Boolean(currentVendorObj.gstFileUrl && currentVendorObj.gstFileUrl.trim().length > 10);
                      return (
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              GST Certificate
                            </span>
                            {hasGst ? (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Uploaded
                              </span>
                            ) : currentVendorObj.gstNumber ? (
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                                GSTIN Added
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                                Optional
                              </span>
                            )}
                          </div>
                          <div className="font-mono font-bold text-slate-900 text-xs bg-white p-2 rounded-xl border border-slate-200 truncate">
                            {currentVendorObj.gstNumber || 'Optional GST'}
                          </div>
                          {hasGst ? (
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: `GST Certificate (${currentVendorObj.shopName})`, url: currentVendorObj.gstFileUrl!, type: 'doc' })}
                              className="w-full py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                            >
                              <Eye className="w-3.5 h-3.5" /> View GST Certificate
                            </button>
                          ) : (
                            <div className="text-[11px] text-slate-400 text-center py-1">No File Attached</div>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                ) : (
                  /* Edit Mode Documents */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    
                    {/* PAN Card Input & File Upload */}
                    <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-slate-800 text-xs block">1. PAN Card Details *</label>
                        {vendorEditForm.panFileUrl ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {uploadedDocNames.panFileUrl ? `✓ Attached: ${uploadedDocNames.panFileUrl}` : '✓ Document Attached'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Required
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={vendorEditForm.panNumber}
                        onChange={(e) => setVendorEditForm({ ...vendorEditForm, panNumber: e.target.value.toUpperCase() })}
                        placeholder="Enter PAN Number (e.g. ABCDE1234F)"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                      />
                      
                      {uploadingDocField === 'panFileUrl' ? (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-blue-100/80 border border-blue-300 text-[#003893] font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin text-[#003893]" />
                          <span>Uploading PAN to AWS EC2...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <label className="flex-1 py-2 px-3 rounded-xl bg-white border border-dashed border-blue-400 hover:bg-blue-50/80 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                            <Camera className="w-4 h-4 text-blue-600" />
                            <span>{vendorEditForm.panFileUrl ? 'Change PAN Card' : 'Upload PAN Card Photo / PDF'}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                              onChange={(e) => handleDocFileUpload(e, 'panFileUrl')}
                              className="hidden"
                            />
                          </label>
                          {vendorEditForm.panFileUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: `PAN Card (${vendorEditForm.panNumber || 'Verified'})`, url: vendorEditForm.panFileUrl, type: 'doc' })}
                              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                              title="Preview PAN Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Aadhaar Card Input & File Upload */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-slate-800 text-xs block">2. Aadhaar Card Details *</label>
                        {vendorEditForm.aadhaarFileUrl ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {uploadedDocNames.aadhaarFileUrl ? `✓ Attached: ${uploadedDocNames.aadhaarFileUrl}` : '✓ Document Attached'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Required
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={vendorEditForm.aadhaarNumber}
                        onChange={(e) => setVendorEditForm({ ...vendorEditForm, aadhaarNumber: e.target.value })}
                        placeholder="Enter 12-Digit Aadhaar (e.g. 1234 5678 9012)"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />

                      {uploadingDocField === 'aadhaarFileUrl' ? (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-blue-100/80 border border-blue-300 text-[#003893] font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin text-[#003893]" />
                          <span>Uploading Aadhaar to AWS EC2...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <label className="flex-1 py-2 px-3 rounded-xl bg-white border border-dashed border-blue-400 hover:bg-blue-50/80 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                            <Camera className="w-4 h-4 text-blue-600" />
                            <span>{vendorEditForm.aadhaarFileUrl ? 'Change Aadhaar Card' : 'Upload Aadhaar Card Photo / PDF'}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                              onChange={(e) => handleDocFileUpload(e, 'aadhaarFileUrl')}
                              className="hidden"
                            />
                          </label>
                          {vendorEditForm.aadhaarFileUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: `Aadhaar Card (${vendorEditForm.aadhaarNumber || 'Verified'})`, url: vendorEditForm.aadhaarFileUrl, type: 'doc' })}
                              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                              title="Preview Aadhaar Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Business License / Shop Proof */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-slate-800 text-xs block">3. Business License / Shop Act (Optional)</label>
                        {vendorEditForm.businessLicenseUrl ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {uploadedDocNames.businessLicenseUrl ? `✓ Attached: ${uploadedDocNames.businessLicenseUrl}` : '✓ Document Attached'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Optional</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-[11px]">Upload Shop & Establishment license, Trade license, or Udyam MSME certificate.</p>
                      
                      {uploadingDocField === 'businessLicenseUrl' ? (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-blue-100/80 border border-blue-300 text-[#003893] font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin text-[#003893]" />
                          <span>Uploading License to AWS EC2...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <label className="flex-1 py-2 px-3 rounded-xl bg-white border border-dashed border-blue-400 hover:bg-blue-50/80 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>{vendorEditForm.businessLicenseUrl ? 'Change License Document' : 'Upload Business License Proof'}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                              onChange={(e) => handleDocFileUpload(e, 'businessLicenseUrl')}
                              className="hidden"
                            />
                          </label>
                          {vendorEditForm.businessLicenseUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: `Business License (${vendorEditForm.shopName})`, url: vendorEditForm.businessLicenseUrl, type: 'doc' })}
                              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                              title="Preview Business License"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* GST Certificate */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-slate-800 text-xs block">4. GST Certificate (Optional)</label>
                        {vendorEditForm.gstFileUrl ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {uploadedDocNames.gstFileUrl ? `✓ Attached: ${uploadedDocNames.gstFileUrl}` : '✓ Document Attached'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Optional</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={vendorEditForm.gstNumber}
                        onChange={(e) => setVendorEditForm({ ...vendorEditForm, gstNumber: e.target.value.toUpperCase() })}
                        placeholder="Enter 15-Digit GSTIN (e.g. 36AAAPL1234C1Z5)"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                      />
                      
                      {uploadingDocField === 'gstFileUrl' ? (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-blue-100/80 border border-blue-300 text-[#003893] font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin text-[#003893]" />
                          <span>Uploading GST Certificate to AWS EC2...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <label className="flex-1 py-2 px-3 rounded-xl bg-white border border-dashed border-blue-400 hover:bg-blue-50/80 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>{vendorEditForm.gstFileUrl ? 'Change GST Certificate' : 'Upload GST Certificate (PDF / Image)'}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                              onChange={(e) => handleDocFileUpload(e, 'gstFileUrl')}
                              className="hidden"
                            />
                          </label>
                          {vendorEditForm.gstFileUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal({ title: `GST Certificate (${vendorEditForm.gstNumber || vendorEditForm.shopName})`, url: vendorEditForm.gstFileUrl, type: 'doc' })}
                              className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                              title="Preview GST Certificate"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>

              {/* SECTION 3: Shop Photos & Premises Gallery */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base font-heading">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Shop Photos & Storefront Gallery</span>
                  </div>
                  {isEditingVendorProfile && (
                    uploadingDocField === 'shopPhotos' ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-indigo-100 text-indigo-800 font-extrabold text-xs flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        <span>Uploading Photo to AWS...</span>
                      </div>
                    ) : (
                      <label className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95">
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Shop Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                          onChange={handleAddShopPhoto}
                          className="hidden"
                        />
                      </label>
                    )
                  )}
                </div>

                {!isEditingVendorProfile ? (
                  /* View Mode Photos */
                  (() => {
                    const photos: { title: string; url: string }[] = [];
                    if (currentVendorObj.shopPhotos && currentVendorObj.shopPhotos.length > 0) {
                      currentVendorObj.shopPhotos.forEach((img: string, i: number) => {
                        if (img) photos.push({ title: `Storefront / Shop Photo ${i + 1}`, url: img });
                      });
                    }

                    if (photos.length > 0) {
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {photos.map((p, i) => (
                            <div
                              key={i}
                              onClick={() => setPreviewDocModal({ title: p.title, url: p.url, type: 'image' })}
                              className="relative group rounded-2xl overflow-hidden border border-slate-200 shadow-xs cursor-pointer bg-slate-100 aspect-video sm:aspect-square"
                            >
                              <img
                                src={p.url}
                                alt={p.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="w-4 h-4" /> View
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1 text-slate-500 text-xs">
                        <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                        <div className="font-bold text-slate-700">No Storefront Photos Uploaded</div>
                        <p className="text-slate-400 text-[11px]">Click "Edit Business Profile" above to attach real photos of your shop front and inventory.</p>
                      </div>
                    );
                  })()
                ) : (
                  /* Edit Mode Photos */
                  <div className="space-y-3">
                    {vendorEditForm.shopPhotos && vendorEditForm.shopPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {vendorEditForm.shopPhotos.map((photoUrl, idx) => (
                          <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video sm:aspect-square group bg-slate-100">
                            <img src={photoUrl} alt={`Shop Photo ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setVendorEditForm((prev) => ({
                                  ...prev,
                                  shopPhotos: prev.shopPhotos.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-transform active:scale-95 cursor-pointer text-[10px] font-bold"
                              title="Delete photo"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-blue-50/40 border border-dashed border-blue-300 text-center space-y-1 text-xs">
                        <Camera className="w-6 h-6 text-blue-500 mx-auto" />
                        <div className="font-bold text-slate-800">No Additional Shop Photos Added</div>
                        <p className="text-slate-500 text-[11px]">Use "+ Add Shop Photo" above to upload photos of your shop exterior, billing counter, and inventory.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Sticky Save Action Bar in Edit Mode */}
              {isEditingVendorProfile && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
                  <div className="text-xs">
                    <span className="font-bold text-white block">Ready to apply profile changes?</span>
                    <span className="text-[11px] text-blue-200">Your profile will immediately update across all financer matching searches.</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditingVendorProfile(false)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveVendorProfile}
                      disabled={isSavingVendorProfile}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSavingVendorProfile ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Save & Apply</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

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
        )
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
      <div className="fixed bottom-0 sm:bottom-5 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t sm:border border-slate-200/90 py-1.5 sm:py-3.5 px-2 sm:px-10 flex items-center justify-between sm:justify-around w-full max-w-md sm:max-w-3xl lg:max-w-4xl mx-auto shadow-2xl rounded-t-2xl sm:rounded-3xl transition-all">
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

      {/* Document & Photo Preview Modal */}
      {previewDocModal && (() => {
        const targetUrl = resolveDocumentUrl(previewDocModal.url);
        const isPdf = isPdfDocument(previewDocModal.url);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="font-extrabold text-slate-900 text-base flex items-center gap-2 font-heading">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {previewDocModal.title}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-[70vh] flex items-center justify-center bg-slate-900 p-2">
                {isPdf ? (
                  <iframe
                    src={targetUrl}
                    title={previewDocModal.title}
                    className="w-full h-[65vh] rounded-xl bg-white"
                  />
                ) : (
                  <img
                    src={targetUrl}
                    alt={previewDocModal.title}
                    className="max-h-[65vh] w-auto object-contain rounded-xl"
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                <div className="text-xs text-slate-500 font-medium">
                  Official KYC Document • Stored securely on AWS
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadDocumentFile(targetUrl, previewDocModal.title.replace(/[^a-zA-Z0-9_-]/g, '_'))}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDocModal(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
