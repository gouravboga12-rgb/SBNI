import React, { useState, useRef, useEffect } from 'react';
import { VendorVerificationRequest } from '../types';
import { BannerCarousel, BannerSlide } from '../components/BannerCarousel';
import {
  fetchVendorProfilesForLender,
  updateLenderProfileApi,
  getMyProfileApi,
  submitFraudReportApi,
  updateLeadStatusApi,
  deleteLenderLeadApi,
  fetchLenderLeadsApi,
  safeSetLocalStorage,
  uploadFileToEc2Api,
  checkSubscriptionStatus,
  cancelAutoPayApi,
} from '../services/api';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { getGoogleMapsNavigationUrl } from '../services/mapboxService';
import {
  generatePanCardDataUrl,
  generateAadhaarCardDataUrl,
  generateShopLicenseDataUrl,
  generateGstCertDataUrl,
  downloadDocumentFile,
  resolveDocumentUrl,
  isPdfDocument,
} from '../utils/documentGenerators';
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
  AlertTriangle,
  Navigation,
  Compass,
  MessageCircle,
  Edit3,
  Save,
  Loader2,
  TrendingUp,
  Coins,
  Lock,
  Info,
  MessageSquare,
  X,
  ExternalLink,
  Shield,
  Trash2,
  Repeat,
  Sparkles,
  Zap,
  CalendarCheck,
  Gift,
} from 'lucide-react';
import { ReferAndEarnModal } from '../components/ReferAndEarnModal';

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

const DEFAULT_VENDOR_REQUESTS: VendorVerificationRequest[] = [];

interface LenderDashboardProps {
  onOpenSubscription?: () => void;
  onLogout?: (roleTarget?: 'VENDOR' | 'LENDER') => void;
  activeTab?: 'home' | 'businesses' | 'reports' | 'profile';
  onTabChange?: (tab: 'home' | 'businesses' | 'reports' | 'profile') => void;
  currentUser?: any | null;
  onOpenAuth?: () => void;
}

function resolveInitialLenderDetails(currentUser: any) {
  if (!currentUser) return null;
  try {
    const u = currentUser;
    const profile = u.lenderProfile || (() => {
      try {
        const p = localStorage.getItem('sbni_lender_profile');
        const parsed = p ? JSON.parse(p) : null;
        if (parsed && u?.email && parsed.email && parsed.email !== u.email) {
          return null; // Don't use a profile from another account
        }
        return parsed;
      } catch {
        return null;
      }
    })();

    let officer = profile?.contactPersonName || u?.name || u?.fullName || '';
    if (!officer || officer.includes('@') || officer === 'Credit Officer' || officer === 'Business Money Financer') {
      const email = u?.email || profile?.email || '';
      if (email) {
        const handle = email.split('@')[0].replace(/[0-9_.-]/g, ' ').trim();
        officer = handle ? handle.split(' ').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Credit Officer';
      } else {
        officer = 'Credit Officer';
      }
    }

    let financerName = profile?.institutionName || '';
    if (!financerName || financerName === 'Business Money Financer' || financerName.includes('@')) {
      financerName = `${officer} Money Financer`;
    } else if (!financerName.toLowerCase().includes('money financer')) {
      financerName = `${financerName} Money Financer`;
    }

    return {
      name: financerName,
      contactPerson: officer,
      phone: u?.phone || profile?.phone || 'Not provided',
      email: u?.email || profile?.email || 'lender@justpaisa.com',
      city: profile?.city || 'Hyderabad',
      state: profile?.state || 'Telangana',
      regNo: profile?.registrationNumber || 'REG-FIN-1001',
      institutionType: 'Money Financer',
      minLoan: profile?.minLoanAmount ?? 10000,
      maxLoan: profile?.maxLoanAmount ?? 100000,
      minRate: profile?.minInterestRate || 9.5,
      lendingRadius: profile?.lendingRadiusKm || 50,
      successRate: profile?.successRate || '80% - 90%',
    };
  } catch (e) {
    return null;
  }
}

export const LenderDashboard: React.FC<LenderDashboardProps> = ({
  onOpenSubscription,
  onLogout,
  activeTab: controlledActiveTab,
  onTabChange,
  currentUser,
  onOpenAuth,
}) => {
  const [selectedVendor, setSelectedVendor] = useState<VendorVerificationRequest | null>(null);
  const [requests, setRequests] = useState<VendorVerificationRequest[]>([]);
  const [actionFeedback, setActionFeedback] = useState('');
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<VendorVerificationRequest | null>(null);
  const [internalActiveTab, setInternalActiveTab] = useState<'home' | 'businesses' | 'reports' | 'profile'>('home');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = (tab: 'home' | 'businesses' | 'reports' | 'profile') => {
    setInternalActiveTab(tab);
    if (onTabChange) onTabChange(tab);
    if (tab === 'profile') setSelectedVendor(null);
  };
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; url: string; fallbackUrl?: string; type: 'image' | 'doc'; fileName?: string } | null>(null);
  const [moreInfoModalBiz, setMoreInfoModalBiz] = useState<any | null>(null);

  // Track inspected documents per vendor request (Mandatory Review Compliance)
  const [inspectedDocIds, setInspectedDocIds] = useState<Record<string, { pan?: boolean; aadhaar?: boolean; shopPhotos?: boolean; businessLicense?: boolean; gst?: boolean }>>({});

  const isDocInspected = (vendorId: string, docKey: 'pan' | 'aadhaar' | 'shopPhotos') => {
    return !!(inspectedDocIds[vendorId]?.[docKey]);
  };

  const markDocInspected = (vendorId: string, docKey: 'pan' | 'aadhaar' | 'shopPhotos' | 'businessLicense' | 'gst') => {
    setInspectedDocIds(prev => ({
      ...prev,
      [vendorId]: {
        ...(prev[vendorId] || {}),
        [docKey]: true,
      }
    }));
  };

  const getInspectionProgress = (vendorId: string) => {
    const record = inspectedDocIds[vendorId] || {};
    let count = 0;
    if (record.pan) count++;
    if (record.aadhaar) count++;
    if (record.shopPhotos) count++;
    const total = 3;
    const isComplete = count >= total;
    return { count, total, isComplete };
  };

  const [reportingFraudVendor, setReportingFraudVendor] = useState<VendorVerificationRequest | null>(null);
  const [fraudReason, setFraudReason] = useState('');

  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    return (
      localStorage.getItem('sbni_lender_subscribed') === 'true' ||
      localStorage.getItem('sbni_subscribed') === 'true' ||
      localStorage.getItem('sbni_vendor_subscribed') === 'true'
    );
  });

  const [currentUserObj, setCurrentUserObj] = useState<any>(() => resolveInitialLenderDetails(currentUser));
  const [lenderAvatarUrl, setLenderAvatarUrl] = useState<string>(() => {
    try { localStorage.removeItem('sbni_lender_avatar'); } catch (e) {}
    const direct = currentUser?.lenderProfile?.logoUrl || currentUser?.lenderProfile?.avatarUrl;
    if (direct) return direct;
    if (currentUser?.email) {
      return localStorage.getItem(`sbni_lender_avatar_${currentUser.email}`) || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200';
    }
    return 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200';
  });

  useEffect(() => {
    setCurrentUserObj(resolveInitialLenderDetails(currentUser));
    const direct = currentUser?.lenderProfile?.logoUrl || currentUser?.lenderProfile?.avatarUrl;
    const userKey = currentUser?.email ? `sbni_lender_avatar_${currentUser.email}` : null;
    const saved = userKey ? localStorage.getItem(userKey) : null;
    if (direct || saved) {
      setLenderAvatarUrl(direct || saved || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200');
    }

    // Live query fresh database profile for this authenticated lender
    const fetchFreshProfile = async () => {
      try {
        const res = await getMyProfileApi();
        if (res.success && res.data) {
          const freshUser = res.data;
          const freshLender = freshUser.lenderProfile;
          if (freshLender) {
            const resolved = resolveInitialLenderDetails(freshUser);
            if (resolved) setCurrentUserObj(resolved);
            const freshAvatar = freshLender.logoUrl || freshLender.avatarUrl;
            if (freshAvatar) {
              setLenderAvatarUrl(freshAvatar);
              if (freshUser.email) {
                localStorage.setItem(`sbni_lender_avatar_${freshUser.email}`, freshAvatar);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Could not fetch fresh lender profile:', e);
      }
    };
    fetchFreshProfile();
  }, [currentUser]);

  const [nearbyBusinesses, setNearbyBusinesses] = useState<any[]>([]);
  const [nearbySearchQuery, setNearbySearchQuery] = useState('');
  const [reportsFilterStatus, setReportsFilterStatus] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FRAUD' | 'ALL'>('ALL');
  const [reportsSearchQuery, setReportsSearchQuery] = useState('');
  const [referModalOpen, setReferModalOpen] = useState(false);

  const loadNearbyBusinessesList = async () => {
    await loadNearbyBusinesses();
  };

  // Fetch live profile from server on mount
  useEffect(() => {
    async function loadFreshProfile() {
      if (!currentUser) {
        setCurrentUserObj(null);
        return;
      }
      try {
        const res = await getMyProfileApi();
        if (res?.success && res?.data) {
          const u = res.data;
          const lp = u.lenderProfile;

          let officer = lp?.contactPersonName || u.name || u.fullName || '';
          if (!officer || officer.includes('@') || officer === 'Credit Officer' || officer === 'Business Money Financer') {
            if (u.email?.toLowerCase().includes('gourav')) officer = 'Gourav';
            else if (u.email) {
              const handle = u.email.split('@')[0].replace(/[0-9_.-]/g, ' ').trim();
              officer = handle ? handle.split(' ').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Credit Officer';
            } else officer = 'Credit Officer';
          }

          let financer = lp?.institutionName || '';
          if (!financer || financer === 'Business Money Financer' || financer.includes('@')) {
            financer = `${officer} Money Financer`;
          } else if (!financer.toLowerCase().includes('money financer')) {
            financer = `${financer} Money Financer`;
          }

          if (lp?.avatarUrl || lp?.logoUrl) {
            setLenderAvatarUrl(lp.avatarUrl || lp.logoUrl);
          }

          if (lp?.latitude && lp?.longitude) {
            setLenderLocation({
              place: lp.place || lp.city || 'Office Area',
              city: lp.city || 'Hyderabad',
              state: lp.state || 'Telangana',
              country: lp.country || 'India',
              latitude: Number(lp.latitude),
              longitude: Number(lp.longitude),
              lendingRadiusKm: lp.lendingRadiusKm ? Number(lp.lendingRadiusKm) : 50,
            });
          }

          const freshData = {
            name: financer,
            contactPerson: officer,
            phone: u.phone || lp?.phone || 'Not provided',
            email: u.email || 'lender@justpaisa.com',
            city: lp?.city || 'Hyderabad',
            state: lp?.state || 'Telangana',
            regNo: lp?.registrationNumber || 'REG-FIN-1001',
            institutionType: 'Money Financer',
            minLoan: lp?.minLoanAmount ?? 5000,
            maxLoan: lp?.maxLoanAmount ?? 100000,
            minRate: lp?.minInterestRate || 9.5,
            lendingRadius: lp?.lendingRadiusKm || 50,
            successRate: lp?.successRate || '80% - 90%',
          };

          setCurrentUserObj(freshData);
          safeSetLocalStorage('sbni_user', JSON.stringify({ ...u, name: officer, fullName: officer }));
          if (lp) {
            safeSetLocalStorage('sbni_lender_profile', JSON.stringify({ ...lp, institutionName: financer, contactPersonName: officer, successRate: lp?.successRate || '80% - 90%' }));
          }
        }
      } catch (err) {
        console.error('Failed to load fresh profile:', err);
      }
    }
    if (currentUser) {
      loadFreshProfile();
    } else {
      setCurrentUserObj(null);
    }
    loadNearbyBusinessesList();

    const handleGlobalSync = () => {
      if (currentUser) {
        loadFreshProfile();
      }
      loadNearbyBusinessesList();
    };
    window.addEventListener('sbni_vendor_profile_updated', handleGlobalSync);
    window.addEventListener('sbni_fraud_updated', handleGlobalSync);
    window.addEventListener('storage', handleGlobalSync);
    return () => {
      window.removeEventListener('sbni_vendor_profile_updated', handleGlobalSync);
      window.removeEventListener('sbni_fraud_updated', handleGlobalSync);
      window.removeEventListener('storage', handleGlobalSync);
    };
  }, [currentUser]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size must be less than 5MB.');
      return;
    }
    try {
      const uploadRes = await uploadFileToEc2Api(file, 'avatars', file.name);
      const hostedUrl = uploadRes.fileUrl || uploadRes.fullUrl;
      if (hostedUrl) {
        setLenderAvatarUrl(hostedUrl);
        await updateLenderProfileApi({
          avatarUrl: hostedUrl,
          logoUrl: hostedUrl,
          institutionName: currentUserObj?.name || 'Business Money Financer',
          contactPersonName: currentUserObj?.contactPerson || 'Credit Officer',
          minLoanAmount: currentUserObj?.minLoan || 5000,
          maxLoanAmount: currentUserObj?.maxLoan || 100000,
          lendingRadiusKm: currentUserObj?.lendingRadius || 50,
          successRate: currentUserObj?.successRate || '80% - 90%',
          city: currentUserObj?.city || 'Hyderabad',
          state: currentUserObj?.state || 'Telangana',
        } as any);
        window.dispatchEvent(new CustomEvent('sbni_lender_profile_updated'));
      }
    } catch (err) {
      console.error('Failed to upload financer avatar to AWS EC2 / RDS:', err);
    }
  };

  const [isEditingLenderProfile, setIsEditingLenderProfile] = useState(false);
  const [lenderEditForm, setLenderEditForm] = useState({
    institutionName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    place: '',
    city: '',
    state: '',
    pincode: '',
    regNo: '',
    minLoan: 5000,
    maxLoan: 100000,
    lendingRadius: 50,
    successRate: '80% - 90%',
  });
  const [isSavingLenderProfile, setIsSavingLenderProfile] = useState(false);
  const [lenderSaveSuccess, setLenderSaveSuccess] = useState<string | null>(null);

  const startEditingLender = () => {
    if (!currentUserObj) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    let pObj: any = {};
    try {
      pObj = JSON.parse(localStorage.getItem('sbni_lender_profile') || '{}');
    } catch (e) {}

    setLenderEditForm({
      institutionName: currentUserObj.name,
      contactPerson: currentUserObj.contactPerson,
      phone: currentUserObj.phone,
      email: currentUserObj.email,
      address: pObj.address || 'Office Suite 402, Financial Tower',
      place: pObj.place || 'Dilsukhnagar',
      city: currentUserObj.city || 'Hyderabad',
      state: currentUserObj.state || 'Telangana',
      pincode: pObj.pincode || '500060',
      regNo: currentUserObj.regNo,
      minLoan: currentUserObj.minLoan || 5000,
      maxLoan: currentUserObj.maxLoan || 100000,
      lendingRadius: currentUserObj.lendingRadius || pObj.lendingRadiusKm || 50,
      successRate: currentUserObj.successRate || pObj.successRate || '80% - 90%',
    });
    setIsEditingLenderProfile(true);
  };

  const handleSaveLenderProfile = async () => {
    setIsSavingLenderProfile(true);
    try {
      let instName = lenderEditForm.institutionName.trim();
      if (!instName.toLowerCase().includes('money financer')) {
        instName = `${instName} Money Financer`;
      }

      const updatedUserObj = {
        ...currentUserObj,
        name: instName,
        contactPerson: lenderEditForm.contactPerson,
        phone: lenderEditForm.phone,
        email: lenderEditForm.email,
        city: lenderEditForm.city,
        state: lenderEditForm.state,
        regNo: lenderEditForm.regNo,
        minLoan: Number(lenderEditForm.minLoan),
        maxLoan: Number(lenderEditForm.maxLoan),
        lendingRadius: Number(lenderEditForm.lendingRadius),
        successRate: lenderEditForm.successRate || '80% - 90%',
      };
      setCurrentUserObj(updatedUserObj);

      // 1. Save to localStorage
      let u: any = {};
      let lp: any = {};
      try {
        u = JSON.parse(localStorage.getItem('sbni_user') || '{}');
        lp = JSON.parse(localStorage.getItem('sbni_lender_profile') || '{}');
      } catch (e) {}

      const mergedUser = {
        ...u,
        name: lenderEditForm.contactPerson,
        fullName: lenderEditForm.contactPerson,
        phone: lenderEditForm.phone,
        email: lenderEditForm.email,
      };

      const mergedLp = {
        ...lp,
        institutionName: instName,
        contactPersonName: lenderEditForm.contactPerson,
        phone: lenderEditForm.phone,
        email: lenderEditForm.email,
        address: lenderEditForm.address,
        place: lenderEditForm.place,
        city: lenderEditForm.city,
        state: lenderEditForm.state,
        pincode: lenderEditForm.pincode,
        minLoanAmount: Number(lenderEditForm.minLoan),
        maxLoanAmount: Number(lenderEditForm.maxLoan),
        lendingRadiusKm: Number(lenderEditForm.lendingRadius),
        successRate: lenderEditForm.successRate || '80% - 90%',
        avatarUrl: lenderAvatarUrl || undefined,
        logoUrl: lenderAvatarUrl || undefined,
      };

      safeSetLocalStorage('sbni_user', JSON.stringify(mergedUser));
      safeSetLocalStorage('sbni_lender_profile', JSON.stringify(mergedLp));

      // 2. Call backend API to persist to PostgreSQL on AWS
      const apiRes = await updateLenderProfileApi({
        institutionName: instName,
        contactPersonName: lenderEditForm.contactPerson,
        phone: lenderEditForm.phone,
        email: lenderEditForm.email,
        address: lenderEditForm.address,
        place: lenderEditForm.place,
        city: lenderEditForm.city,
        state: lenderEditForm.state,
        pincode: lenderEditForm.pincode,
        registrationNumber: lenderEditForm.regNo,
        minLoanAmount: Number(lenderEditForm.minLoan),
        maxLoanAmount: Number(lenderEditForm.maxLoan),
        lendingRadiusKm: Number(lenderEditForm.lendingRadius),
        successRate: lenderEditForm.successRate || '80% - 90%',
        avatarUrl: lenderAvatarUrl || undefined,
        logoUrl: lenderAvatarUrl || undefined,
      });

      if (!apiRes.success) {
        alert(apiRes.message || 'Failed to update profile on server.');
        return;
      }

      window.dispatchEvent(new CustomEvent('sbni_lender_profile_updated'));

      setLenderSaveSuccess('✅ Financer profile, portfolio criteria & success rate updated globally!');
      setTimeout(() => setLenderSaveSuccess(null), 4000);
      setIsEditingLenderProfile(false);
    } catch (err: any) {
      console.error('Failed to save lender profile:', err);
      alert('Failed to save profile changes. Please try again.');
    } finally {
      setIsSavingLenderProfile(false);
    }
  };

  // Subscription & AutoPay Management State for Lender
  const [lenderActiveSub, setLenderActiveSub] = useState<any>(null);
  const [loadingLenderSub, setLoadingLenderSub] = useState(false);
  const [cancellingLenderAutoPay, setCancellingLenderAutoPay] = useState(false);
  const [showLenderCancelModal, setShowLenderCancelModal] = useState(false);
  const [lenderSubFeedback, setLenderSubFeedback] = useState('');

  const loadLenderSubscription = async () => {
    setLoadingLenderSub(true);
    try {
      const res = await checkSubscriptionStatus();
      if (res.isActive && res.subscription) {
        setLenderActiveSub(res.subscription);
      } else {
        setLenderActiveSub(null);
      }
    } catch {
      setLenderActiveSub(null);
    } finally {
      setLoadingLenderSub(false);
    }
  };

  useEffect(() => {
    loadLenderSubscription();
    const handleSubSync = () => loadLenderSubscription();
    window.addEventListener('sbni_subscription_updated', handleSubSync);
    window.addEventListener('storage', handleSubSync);
    return () => {
      window.removeEventListener('sbni_subscription_updated', handleSubSync);
      window.removeEventListener('storage', handleSubSync);
    };
  }, []);

  const handleCancelLenderAutoPay = async () => {
    setCancellingLenderAutoPay(true);
    try {
      const res = await cancelAutoPayApi();
      if (res.success) {
        setLenderSubFeedback(res.message || 'AutoPay cancelled. Your plan remains active until expiration.');
        setLenderActiveSub((prev: any) => (prev ? { ...prev, isAutoPay: false } : prev));
        setShowLenderCancelModal(false);
        setTimeout(() => setLenderSubFeedback(''), 4500);
      } else {
        setLenderSubFeedback(res.message || 'Failed to cancel AutoPay.');
        setTimeout(() => setLenderSubFeedback(''), 4500);
      }
    } catch (err: any) {
      setLenderSubFeedback(err.message || 'Error cancelling AutoPay.');
      setTimeout(() => setLenderSubFeedback(''), 4500);
    } finally {
      setCancellingLenderAutoPay(false);
    }
  };

  const [lenderLocation, setLenderLocation] = useState<{
    place: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    lendingRadiusKm: number;
  }>(() => {
    const lp = currentUser?.lenderProfile;
    if (lp && lp.latitude && lp.longitude) {
      return {
        place: lp.place || lp.city || 'Office Area',
        city: lp.city || 'Hyderabad',
        state: lp.state || 'Telangana',
        country: lp.country || 'India',
        latitude: Number(lp.latitude),
        longitude: Number(lp.longitude),
        lendingRadiusKm: lp.lendingRadiusKm ? Number(lp.lendingRadiusKm) : 50,
      };
    }
    try {
      const p = localStorage.getItem('sbni_lender_profile');
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed.latitude && parsed.longitude) {
          return {
            place: parsed.place || parsed.city || 'Office Area',
            city: parsed.city || 'Hyderabad',
            state: parsed.state || 'Telangana',
            country: parsed.country || 'India',
            latitude: Number(parsed.latitude),
            longitude: Number(parsed.longitude),
            lendingRadiusKm: parsed.lendingRadiusKm ? Number(parsed.lendingRadiusKm) : 50,
          };
        }
      }
    } catch (e) {}
    return {
      place: 'Office Area',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      latitude: 17.3850,
      longitude: 78.4867,
      lendingRadiusKm: 50,
    };
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  const handleSaveLenderLocation = async (loc: {
    place: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    lendingRadiusKm?: number;
  }) => {
    const updated = {
      place: loc.place || loc.city,
      city: loc.city,
      state: loc.state,
      country: loc.country,
      latitude: loc.latitude,
      longitude: loc.longitude,
      lendingRadiusKm: loc.lendingRadiusKm || 50,
    };
    setLenderLocation(updated);

    // Save to local storage
    try {
      const pStr = localStorage.getItem('sbni_lender_profile') || '{}';
      const parsed = JSON.parse(pStr);
      const merged = { ...parsed, ...updated };
      safeSetLocalStorage('sbni_lender_profile', JSON.stringify(merged));
    } catch (e) {}

    // Save to AWS Backend
    try {
      await updateLenderProfileApi(updated);
      setLocationSuccessMsg(`✅ Lending area updated to ${loc.place || loc.city}, ${loc.city} (${updated.lendingRadiusKm} KM radius)`);
      setTimeout(() => setLocationSuccessMsg(null), 4000);
      loadNearbyBusinessesList();
    } catch (e) {
      console.error('Failed to sync lender profile location to backend:', e);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadVendorRequests = async () => {
    if (!currentUser || !currentUserObj) {
      setRequests([]);
      return;
    }

    const deletedVendorIds: string[] = (() => {
      try {
        const d1 = JSON.parse(localStorage.getItem('sbni_deleted_vendors') || '[]');
        const d2 = JSON.parse(localStorage.getItem('sbni_deleted_leads') || '[]');
        return [...d1, ...d2].filter((id) => typeof id === 'string' && !id.includes('@') && !id.includes(' '));
      } catch (e) {
        return [];
      }
    })();

    // 1. Local requests submitted specifically to THIS lender
    let localReqs: VendorVerificationRequest[] = [];
    try {
      const dynamicStr = localStorage.getItem('sbni_vendor_requests');
      if (dynamicStr) {
        const parsed = JSON.parse(dynamicStr);
        if (Array.isArray(parsed)) {
          // Clean out specific deleted request ids and dummy seed items
          const cleaned = parsed.filter((r) => {
            if (!r) return false;
            if (deletedVendorIds.includes(r.id)) return false;
            if (r.id === 'req-1' || r.id === 'req-2' || r.id === 'REQ-9842' || r.id === 'REQ-4410') return false;
            if (r.vendorName === 'Rajesh Sharma' || r.vendorName === 'Priya Patel') return false;
            return true;
          });

          safeSetLocalStorage('sbni_vendor_requests', JSON.stringify(cleaned));

          localReqs = cleaned.filter((r) => {
            // Must strictly match THIS specific lender account
            const lenderReg = (currentUserObj as any)?.regNo || '';
            const lenderId = (currentUserObj as any)?.id || (currentUser as any)?.id || (currentUser as any)?.userId || (currentUser as any)?.lenderProfile?.id || '';
            const currLenderName = (currentUserObj?.name || '').toLowerCase().trim();
            const reqLenderName = (r.lenderName || '').toLowerCase().trim();

            if (r.lenderId && (r.lenderId === lenderReg || r.lenderId === lenderId)) return true;
            if (reqLenderName && currLenderName && (
              reqLenderName === currLenderName ||
              currLenderName.includes(reqLenderName) ||
              reqLenderName.includes(currLenderName) ||
              currLenderName.replace(/[^a-z0-9]/g, '') === reqLenderName.replace(/[^a-z0-9]/g, '')
            )) {
              return true;
            }
            return false;
          }).map((r: any) => ({
            ...r,
            isFraud: checkVendorIsFraud(r),
          }));
        }
      }
    } catch (e) {}

    // 2. Real AWS Backend leads submitted to this lender
    let awsReqs: VendorVerificationRequest[] = [];
    try {
      const leadsList = await fetchLenderLeadsApi();
      if (Array.isArray(leadsList)) {
        awsReqs = leadsList
          .filter((lead: any) => {
            if (!lead) return false;
            if (deletedVendorIds.includes(lead.id)) return false;
            return true;
          })
          .map((lead: any) => {
            const v = lead.vendor || {};
            let snapshot: any = {};
            try {
              if (lead.vendorSnapshot) {
                snapshot = typeof lead.vendorSnapshot === 'string' ? JSON.parse(lead.vendorSnapshot) : lead.vendorSnapshot;
              }
            } catch {}

            const kycDocs = v.user?.kycDocuments || [];
            const panDoc = kycDocs.find((d: any) => d.docType === 'PAN');
            const aadhaarDoc = kycDocs.find((d: any) => d.docType === 'AADHAAR');
            const licenseDoc = kycDocs.find((d: any) => d.docType === 'BUSINESS_PROOF');
            const gstDoc = kycDocs.find((d: any) => d.docType === 'GST_CERTIFICATE');

            // Direct live database status from PostgreSQL RDS
            const isFraudStatus = !!(v.isFraud || (lead.vendor && lead.vendor.isFraud));
            const vId = lead.vendorId || v.id || v.userId;
            const vEmail = snapshot.emailId || v.user?.email || v.email;

            if (!isFraudStatus) {
              try {
                const sf = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');
                let sfChanged = false;
                if (vId && sf[vId]) { delete sf[vId]; sfChanged = true; }
                if (vEmail && sf[vEmail]) { delete sf[vEmail]; sfChanged = true; }
                if (sfChanged) safeSetLocalStorage('sbni_fraud_vendors', JSON.stringify(sf));
              } catch {}
            }

            let shopPhotoUrl: string | null = snapshot.shopPhotoUrl || null;
            let shopImages: string[] = Array.isArray(snapshot.shopImages) ? snapshot.shopImages : [];
            if (!shopPhotoUrl && v.shopPhotos) {
              try {
                const spArr = typeof v.shopPhotos === 'string' ? JSON.parse(v.shopPhotos) : v.shopPhotos;
                if (Array.isArray(spArr) && spArr.length > 0) {
                  shopPhotoUrl = spArr[0];
                  if (shopImages.length === 0) shopImages = spArr;
                }
              } catch {}
            }

            return {
              id: lead.id,
              vendorName: snapshot.vendorName || v.ownerName || v.user?.name || 'Applicant Vendor',
              shopName: snapshot.shopName || v.businessName || 'Business Enterprise',
              shopAddress: snapshot.shopAddress || v.address || (v.city ? `${v.city}, ${v.state || ''}` : 'Address pending'),
              city: snapshot.city || v.city || 'Hyderabad',
              state: snapshot.state || v.state || 'Telangana',
              requestedDate: lead.createdAt ? String(lead.createdAt).substring(0, 10) : 'Today',
              requestedTime: lead.createdAt ? new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
              status: lead.status || 'Pending',
              inquiryType: lead.type || 'LOAN_APPLICATION',
              inquiryMessage: lead.notes || (lead.type === 'PHONE_CALL' ? '📞 Vendor initiated a Phone Call inquiry' : lead.type === 'WHATSAPP' ? '💬 Vendor sent a WhatsApp inquiry' : '📝 Loan Application submitted'),
              mobileNumber: snapshot.mobileNumber || v.user?.phone || v.phone || 'Phone pending',
              emailId: snapshot.emailId || v.user?.email || v.email || 'Email pending',
              dateOfBirth: snapshot.dateOfBirth || v.dateOfBirth || 'Not specified',
              panNumber: snapshot.panNumber || v.panNumber || panDoc?.documentNumber || null,
              aadhaarNumber: snapshot.aadhaarNumber || v.aadhaarNumber || aadhaarDoc?.documentNumber || null,
              gstNumber: snapshot.gstNumber || v.gstNumber || gstDoc?.documentNumber || null,
              shopType: snapshot.shopType || v.category || v.registrationType || 'Retail & Business',
              yearsInBusiness: snapshot.yearsInBusiness || v.yearsInBusiness || 'Established',
              requiredAmount: lead.amount ? `₹ ${lead.amount.toLocaleString('en-IN')}` : (snapshot.requiredAmount || '₹ 5,00,000'),
              monthlyIncome: snapshot.monthlyIncome || (v.annualTurnover ? `₹ ${v.annualTurnover}` : '₹ 50,000 - 1 Lakh'),
              isFraud: isFraudStatus,
              avatarUrl: snapshot.avatarUrl || v.avatarUrl || undefined,
              liveSelfieUrl: snapshot.liveSelfieUrl || snapshot.avatarUrl || v.avatarUrl || undefined,
              shopPhotoUrl: shopPhotoUrl || undefined,
              panFileUrl: snapshot.panFileUrl || v.panFileUrl || panDoc?.fileUrl || undefined,
              aadhaarFileUrl: snapshot.aadhaarFileUrl || v.aadhaarFileUrl || aadhaarDoc?.fileUrl || undefined,
              shopLicensePdf: snapshot.shopLicensePdf || v.businessLicenseUrl || licenseDoc?.fileUrl || undefined,
              gstCertificatePdf: snapshot.gstCertificatePdf || v.gstFileUrl || gstDoc?.fileUrl || undefined,
              shopImages: shopImages.length > 0 ? shopImages : (shopPhotoUrl ? [shopPhotoUrl] : []),
              lenderId: lead.lenderId,
            };
          });
      }
    } catch (e) {
      console.error('loadVendorRequests leads API error:', e);
    }

    const combined = [...localReqs, ...awsReqs];
    const deduplicated = combined.filter(
      (item, idx, arr) => idx === arr.findIndex((t) => t.id === item.id)
    );

    const activeReqs = deduplicated.filter((v) => {
      if (!v) return false;
      if (deletedVendorIds.includes(v.id)) return false;
      if (v.id === 'req-1' || v.id === 'req-2' || v.vendorName === 'Rajesh Sharma' || v.vendorName === 'Priya Patel') return false;
      return true;
    });

    setRequests(activeReqs);
  };

  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const loadNearbyBusinesses = async () => {
    try {
      const deletedVendorIds: string[] = (() => {
        try {
          return JSON.parse(localStorage.getItem('sbni_deleted_vendors') || '[]');
        } catch (e) {
          return [];
        }
      })();

      const data = await fetchVendorProfilesForLender();
      let mapped: any[] = [];
      if (Array.isArray(data) && data.length > 0) {
        mapped = data
          .filter((vp: any) => {
            if (!vp) return false;
            const u = vp.user || {};
            const id = vp.id || vp.userId;
            const email = u.email || vp.email;
            const owner = vp.ownerName || u.name;
            const biz = vp.businessName;
            if (
              deletedVendorIds.includes(id) ||
              deletedVendorIds.includes(email) ||
              deletedVendorIds.includes(owner) ||
              deletedVendorIds.includes(biz) ||
              (owner && deletedVendorIds.some((d: string) => d.toLowerCase() === owner.toLowerCase())) ||
              (biz && deletedVendorIds.some((d: string) => d.toLowerCase() === biz.toLowerCase()))
            ) {
              return false;
            }
            // Filter dummy accounts
            if (id === 'biz-101' || id === 'biz-102' || id === 'biz-103') return false;
            if (owner === 'Srinivas Rao' || owner === 'Venkatesh Murthy') return false;
            return true;
          })
          .map((vp: any) => {
            const u = vp.user || {};
            const kycDocs = u.kycDocuments || [];
            const panDoc = kycDocs.find((d: any) => d.docType === 'PAN');
            const aadhaarDoc = kycDocs.find((d: any) => d.docType === 'AADHAAR');
            const licenseDoc = kycDocs.find((d: any) => d.docType === 'BUSINESS_PROOF');
            const gstDoc = kycDocs.find((d: any) => d.docType === 'GST_CERTIFICATE');

            const vLat = vp.latitude ? Number(vp.latitude) : 17.3688;
            const vLng = vp.longitude ? Number(vp.longitude) : 78.5247;
            const distKm = calculateDistanceKm(lenderLocation.latitude, lenderLocation.longitude, vLat, vLng);

            const storedFraud = (() => {
              try { return JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}'); } catch { return {}; }
            })();
            const vId = vp.id || vp.userId;
            const vEmail = (u.email || vp.email || vp.emailId || '').toLowerCase().trim();
            const isFraudStatus = typeof vp.isFraud === 'boolean'
              ? vp.isFraud
              : (vId && storedFraud[vId] === true ? true : (vEmail && storedFraud[vEmail] === true ? true : false));

            const rawOwner = vp.vendorName || vp.ownerName || u.name || (vp.emailId && !vp.emailId.includes('@example.com') ? vp.emailId.split('@')[0] : (u.email ? u.email.split('@')[0] : 'Business Owner'));
            const rawShop = vp.shopName || vp.businessName || (rawOwner && rawOwner !== 'Business Owner' ? `${rawOwner} Store` : 'Business Enterprise');

            return {
              id: vp.id || vp.userId,
              vendorName: rawOwner,
              shopName: rawShop,
              shopAddress: vp.address || vp.shopAddress || `${vp.place || 'Commercial Area'}, ${vp.city || 'Hyderabad'}`,
              city: vp.city || 'Hyderabad',
              state: vp.state || 'Telangana',
              place: vp.place || 'Commercial Area',
              category: vp.category || 'Retail Shop Business',
              annualTurnover: vp.annualTurnover || '10-50 Lakhs',
              monthlyIncome: vp.monthlyIncome || '₹ 50,000 / month',
              mobileNumber: vp.mobileNumber || u.phone || vp.phone || 'Not provided',
              emailId: vp.emailId || u.email || vp.email || 'vendor@example.com',
              dateOfBirth: vp.dateOfBirth || 'Not specified',
              panNumber: vp.panNumber || panDoc?.documentNumber || null,
              aadhaarNumber: vp.aadhaarNumber || aadhaarDoc?.documentNumber || null,
              gstNumber: vp.gstNumber || gstDoc?.documentNumber || null,
              isFraud: isFraudStatus,
              avatarUrl: vp.avatarUrl || null,
              liveSelfieUrl: vp.avatarUrl || null,
              panFileUrl: (vp as any).panFileUrl || panDoc?.fileUrl || null,
              aadhaarFileUrl: (vp as any).aadhaarFileUrl || aadhaarDoc?.fileUrl || null,
              shopLicensePdf: (vp as any).businessLicenseUrl || licenseDoc?.fileUrl || null,
              gstCertificatePdf: (vp as any).gstFileUrl || gstDoc?.fileUrl || null,
              shopPhotos: (vp as any).shopPhotos ? (() => { try { return typeof (vp as any).shopPhotos === 'string' ? JSON.parse((vp as any).shopPhotos) : (vp as any).shopPhotos; } catch { return []; } })() : (vp.avatarUrl ? [vp.avatarUrl] : []),
              shopImages: [],
              distanceKm: distKm,
              isWithinRadius: distKm <= (lenderLocation.lendingRadiusKm || 50),
            };
          });
      }

      setNearbyBusinesses(mapped);
    } catch (e) {
      console.error('loadNearbyBusinesses error:', e);
    }
  };

  useEffect(() => {
    loadVendorRequests();
    loadNearbyBusinesses();

    const handleSync = () => {
      loadVendorRequests();
      loadNearbyBusinesses();
      setSelectedVendor((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isFraud: checkVendorIsFraud(prev),
        };
      });
      setIsSubscribed(
        localStorage.getItem('sbni_lender_subscribed') === 'true' ||
        localStorage.getItem('sbni_subscribed') === 'true' ||
        localStorage.getItem('sbni_vendor_subscribed') === 'true'
      );
    };

    window.addEventListener('sbni_request_submitted', handleSync);
    window.addEventListener('sbni_subscription_updated', handleSync);
    window.addEventListener('sbni_vendor_deleted', handleSync);
    window.addEventListener('sbni_vendor_profile_updated', handleSync);
    window.addEventListener('sbni_fraud_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('sbni_request_submitted', handleSync);
      window.removeEventListener('sbni_subscription_updated', handleSync);
      window.removeEventListener('sbni_vendor_deleted', handleSync);
      window.removeEventListener('sbni_vendor_profile_updated', handleSync);
      window.removeEventListener('sbni_fraud_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [lenderLocation]);

  const checkVendorIsFraud = (vendor: VendorVerificationRequest | null | undefined): boolean => {
    if (!vendor) return false;
    try {
      if (typeof (vendor as any).isFraud === 'boolean') return (vendor as any).isFraud;

      const vId = vendor.id || (vendor as any).vendorId || (vendor as any).userId;
      const vEmail = (vendor.emailId || (vendor as any).userEmail || (vendor as any).email || '').toLowerCase().trim();

      // 1. Check live localStorage fraud map
      const storedFraud = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');
      if (vId && storedFraud[vId] === true) return true;
      if (vEmail && storedFraud[vEmail] === true) return true;
      if (vId && storedFraud[vId] === false) return false;
      if (vEmail && storedFraud[vEmail] === false) return false;

      // 2. Check live report registry (if confirmed by Super Admin)
      const lenderReports = JSON.parse(localStorage.getItem('sbni_lender_reported_frauds') || '[]');
      const targetReport = lenderReports.find((r: any) =>
        (r.vendorId && (r.vendorId === vId || r.vendorId === (vendor as any).vendorId)) ||
        (r.emailId && vEmail && r.emailId.toLowerCase().trim() === vEmail) ||
        (r.userEmail && vEmail && r.userEmail.toLowerCase().trim() === vEmail)
      );
      if (targetReport) {
        if (targetReport.status === 'CONFIRMED') return true;
        if (targetReport.status === 'DISMISSED') return false;
      }

      // 3. Check live admin vendors registry (from RDS)
      const adminVendors = JSON.parse(localStorage.getItem('sbni_admin_vendors') || '[]');
      const adminVendorMatch = adminVendors.find((v: any) =>
        (vId && (v.id === vId || v.userId === vId)) ||
        (v.userEmail && vEmail && v.userEmail.toLowerCase().trim() === vEmail)
      );
      if (adminVendorMatch) {
        return !!adminVendorMatch.isFraud;
      }
    } catch {}

    return false;
  };

  const checkLenderSubscribed = () => {
    const subState =
      localStorage.getItem('sbni_lender_subscribed') === 'true' ||
      localStorage.getItem('sbni_subscribed') === 'true' ||
      localStorage.getItem('sbni_vendor_subscribed') === 'true';

    if (!subState) {
      if (onOpenSubscription) onOpenSubscription();
      return false;
    }
    return true;
  };

  const handleVendorSelect = (req: VendorVerificationRequest) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
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

  const handleBusinessesClick = () => {
    setSelectedVendor(null);
    setActiveTab('businesses');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReportsClick = (filter: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FRAUD' | 'ALL' = 'ALL') => {
    setSelectedVendor(null);
    setReportsFilterStatus(filter);
    setActiveTab('reports');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileClick = () => {
    setSelectedVendor(null);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateRequestStatus = (id: string, newStatus: 'Accepted' | 'Rejected' | 'Pending') => {
    const updated = requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r));
    setRequests(updated);

    try {
      const stored = localStorage.getItem('sbni_vendor_requests');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const updatedList = list.map((r: any) => (r.id === id ? { ...r, status: newStatus } : r));
          safeSetLocalStorage('sbni_vendor_requests', JSON.stringify(updatedList));
        }
      }
    } catch (e) {}

    // Synchronize to backend if backend lead
    updateLeadStatusApi(id, newStatus).catch((err) => console.error('Failed to sync status to backend:', err));

    window.dispatchEvent(new Event('sbni_request_submitted'));
  };

  const handleApprove = (id: string) => {
    if (!checkLenderSubscribed()) return;
    updateRequestStatus(id, 'Accepted');
    setActionFeedback('✅ Financing Request Accepted! Vendor can now navigate to your office on Google Maps.');
    setTimeout(() => {
      setActionFeedback('');
      setSelectedVendor(null);
    }, 1800);
  };

  const handleReject = (id: string) => {
    if (!checkLenderSubscribed()) return;
    updateRequestStatus(id, 'Rejected');
    setActionFeedback('❌ Financing Request Rejected.');
    setTimeout(() => {
      setActionFeedback('');
      setSelectedVendor(null);
    }, 1500);
  };

  const handleReopen = (id: string) => {
    if (!checkLenderSubscribed()) return;
    updateRequestStatus(id, 'Pending');
    setActionFeedback('↺ Request moved back to Pending for re-evaluation.');
    setTimeout(() => {
      setActionFeedback('');
      setSelectedVendor(null);
    }, 1500);
  };

  const promptDeleteRequest = (req: VendorVerificationRequest) => {
    setDeleteConfirmLead(req);
  };

  const handleConfirmDeleteLead = async () => {
    if (!deleteConfirmLead) return;
    const target = deleteConfirmLead;
    const id = target.id;
    const targetLenderId = target.lenderId || (currentUserObj as any)?.id || (currentUserObj as any)?.regNo;
    const targetEmail = target.emailId;
    const targetName = target.vendorName;
    const targetShop = target.shopName;
    const targetPhone = target.mobileNumber;

    try {
      // 1. Immediately update local requests state
      setRequests((prev) =>
        prev.filter((r) => r.id !== id && (targetName ? r.vendorName?.toLowerCase() !== targetName.toLowerCase() : true))
      );

      // 2. Call backend API to delete lead from PostgreSQL RDS
      await deleteLenderLeadApi(id).catch(() => {});

      // 3. Update localStorage sbni_vendor_requests
      try {
        const stored = localStorage.getItem('sbni_vendor_requests');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const updatedList = list.filter((r: any) =>
              r.id !== id &&
              (!targetEmail || r.emailId !== targetEmail) &&
              (!targetName || r.vendorName?.toLowerCase() !== targetName.toLowerCase())
            );
            safeSetLocalStorage('sbni_vendor_requests', JSON.stringify(updatedList));
          }
        }
      } catch (e) {}

      // 4. Clear vendor applied markers for this lender
      try {
        if (targetLenderId) localStorage.removeItem(`sbni_applied_${targetLenderId}`);
        if ((currentUserObj as any)?.id) localStorage.removeItem(`sbni_applied_${(currentUserObj as any).id}`);
        if ((currentUserObj as any)?.regNo) localStorage.removeItem(`sbni_applied_${(currentUserObj as any).regNo}`);
        localStorage.removeItem(`sbni_applied_${id}`);

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sbni_applied_')) {
            const lenderPart = key.replace('sbni_applied_', '');
            if (
              lenderPart === id ||
              lenderPart === targetLenderId ||
              lenderPart === (currentUserObj as any)?.id ||
              lenderPart === (currentUserObj as any)?.regNo ||
              lenderPart.toLowerCase() === (currentUserObj?.name || '').toLowerCase()
            ) {
              localStorage.removeItem(key);
            }
          }
        }
      } catch (e) {}

      // 5. Update deleted ids list so it never re-appears across reloads
      try {
        const delList = JSON.parse(localStorage.getItem('sbni_deleted_leads') || '[]');
        const toAdd = [id, targetEmail, targetName, targetShop, targetPhone].filter(Boolean);
        toAdd.forEach((item) => {
          if (!delList.includes(item)) delList.push(item);
        });
        safeSetLocalStorage('sbni_deleted_leads', JSON.stringify(delList));
      } catch (e) {}

      // 6. If selectedVendor is this request, close the view
      if (selectedVendor && (selectedVendor.id === id || selectedVendor.vendorName === targetName)) {
        setSelectedVendor(null);
      }

      setDeleteConfirmLead(null);
      setActionFeedback('✓ Financing request deleted. Vendor can now re-apply.');
      setTimeout(() => setActionFeedback(''), 3000);

      window.dispatchEvent(new Event('sbni_request_submitted'));
      window.dispatchEvent(new Event('sbni_vendor_deleted'));
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      alert(err.message || 'Failed to delete financing request.');
    }
  };

  const submitFraudReportToAdmin = async () => {
    if (!reportingFraudVendor) return;
    const vendor = reportingFraudVendor;
    const targetVendorId = (vendor as any).vendorId || vendor.id;
    const targetEmail = vendor.emailId || (vendor as any).userEmail || (vendor as any).email;
    const targetName = vendor.vendorName || (vendor as any).ownerName;
    const targetShop = vendor.shopName || (vendor as any).businessName;
    const targetPhone = vendor.mobileNumber || (vendor as any).phone;

    try {
      const storedFraud = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');
      if (vendor.id) storedFraud[vendor.id] = true;
      if (targetVendorId) storedFraud[targetVendorId] = true;
      if (targetEmail) storedFraud[targetEmail.toLowerCase().trim()] = true;
      safeSetLocalStorage('sbni_fraud_vendors', JSON.stringify(storedFraud));

      const lenderReports = JSON.parse(localStorage.getItem('sbni_lender_reported_frauds') || '[]');
      const newReportEntry = {
        id: 'fraud-' + Date.now(),
        vendorId: targetVendorId,
        vendorName: targetName,
        shopName: targetShop,
        emailId: targetEmail,
        mobileNumber: targetPhone,
        reportedBy: currentUserObj.name,
        reason: fraudReason || 'Suspicious financial activity or fraudulent documents',
        status: 'PENDING',
        date: new Date().toISOString(),
      };
      lenderReports.push(newReportEntry);
      safeSetLocalStorage('sbni_lender_reported_frauds', JSON.stringify(lenderReports));

      // Asynchronously submit to AWS backend /api/v1/admin/fraud-reports with complete metadata
      submitFraudReportApi({
        vendorId: targetVendorId,
        vendorEmail: targetEmail,
        vendorName: targetName,
        shopName: targetShop,
        vendorPhone: targetPhone,
        leadId: vendor.id,
        lenderId: (currentUserObj as any)?.id || currentUserObj.regNo || undefined,
        reportedBy: currentUserObj.name,
        reason: fraudReason || 'Suspicious financial activity or fraudulent documents',
      }).catch((err) => console.error('Failed to submit fraud report to backend:', err));

      window.dispatchEvent(new Event('sbni_fraud_reported'));
      window.dispatchEvent(new Event('sbni_fraud_updated'));
    } catch (e) {
      console.error('Error submitting fraud report:', e);
    }

    setRequests(
      requests.map((r) => (r.id === vendor.id || (targetEmail && r.emailId === targetEmail) ? { ...r, isFraud: true } : r))
    );

    setActionFeedback(`🚨 Fraud report submitted for ${targetName || 'vendor'}. JustPaisa Admin will review manually.`);
    setReportingFraudVendor(null);
    setFraudReason('');
    setTimeout(() => setActionFeedback(''), 3500);
  };

  const pendingRequests = requests.filter((r) => !checkVendorIsFraud(r) && r.status !== 'Accepted' && r.status !== 'Verified' && r.status !== 'Rejected');
  const acceptedRequests = requests.filter((r) => !checkVendorIsFraud(r) && (r.status === 'Accepted' || r.status === 'Verified'));
  const rejectedRequests = requests.filter((r) => !checkVendorIsFraud(r) && r.status === 'Rejected');
  const fraudRequests = requests.filter((r) => checkVendorIsFraud(r));

  const pendingCount = pendingRequests.length;
  const acceptedCount = acceptedRequests.length;
  const rejectedCount = rejectedRequests.length;
  const fraudCount = fraudRequests.length;

  const filteredNearbyBusinesses = nearbyBusinesses.filter((b) => {
    // 1. Strict Service Radius enforcement (e.g. 50 KM)
    const maxRadius = Number(lenderLocation.lendingRadiusKm) || 50;
    if (b.distanceKm > maxRadius) {
      return false;
    }

    // 2. Search Query filter
    if (!nearbySearchQuery.trim()) return true;
    const q = nearbySearchQuery.toLowerCase();
    return (
      (b.vendorName && b.vendorName.toLowerCase().includes(q)) ||
      (b.shopName && b.shopName.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q)) ||
      (b.place && b.place.toLowerCase().includes(q)) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.mobileNumber && b.mobileNumber.includes(q))
    );
  });

  const filteredReports = requests.filter((r) => {
    let matchesStatus = true;
    if (reportsFilterStatus === 'PENDING') {
      matchesStatus = !checkVendorIsFraud(r) && r.status !== 'Accepted' && r.status !== 'Verified' && r.status !== 'Rejected';
    } else if (reportsFilterStatus === 'ACCEPTED') {
      matchesStatus = !checkVendorIsFraud(r) && (r.status === 'Accepted' || r.status === 'Verified');
    } else if (reportsFilterStatus === 'REJECTED') {
      matchesStatus = !checkVendorIsFraud(r) && r.status === 'Rejected';
    } else if (reportsFilterStatus === 'FRAUD') {
      matchesStatus = checkVendorIsFraud(r);
    }

    if (!matchesStatus) return false;
    if (!reportsSearchQuery.trim()) return true;

    const q = reportsSearchQuery.toLowerCase();
    return (
      r.vendorName.toLowerCase().includes(q) ||
      r.shopName.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.mobileNumber.includes(q)
    );
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-28 md:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
        
        {/* TAB 1: HOME DASHBOARD */}
        {!selectedVendor && activeTab === 'home' && (
          <div className="space-y-6">
            <BannerCarousel slides={LENDER_BANNER_SLIDES} autoScrollIntervalMs={4000} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              
              {currentUserObj ? (
                <div className="card-blue-header p-5 md:p-6 shadow-lg relative overflow-hidden flex items-center justify-between lg:col-span-2 min-h-[160px]">
                  <div className="space-y-2 z-10">
                    <div className="text-xs text-blue-200 font-medium">Welcome Back,</div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white font-heading">{currentUserObj.name}</h2>
                    <div className="inline-flex px-3.5 py-1 rounded-full bg-emerald-500/25 text-emerald-200 text-xs font-bold border border-emerald-400/40 shadow-sm backdrop-blur-md">
                      Business Money Financer Account
                    </div>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/80 shadow-2xl z-10 shrink-0 cursor-pointer transition-transform hover:scale-105 overflow-hidden group"
                    title="Click to change profile picture"
                  >
                    <img
                      src={lenderAvatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200'}
                      alt={currentUserObj.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="card-blue-header p-5 md:p-6 shadow-lg relative overflow-hidden flex flex-col justify-between lg:col-span-2 min-h-[160px]">
                  <div className="space-y-2 z-10">
                    <div className="text-xs text-blue-200 font-medium uppercase tracking-wider">Business Money Financer Portal</div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white font-heading">Local Business Lending CRM</h2>
                    <p className="text-xs text-blue-100 max-w-lg leading-relaxed">
                      Log in to inspect verified local shop applicants, review KYC documents, and approve working capital requests.
                    </p>
                  </div>
                  <div className="pt-3 z-10">
                    <button
                      onClick={onOpenAuth}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-[#003893] hover:bg-blue-50 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>Financer Sign In / Register</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="card-white splash-highlight-card p-5 md:p-6 space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[160px] bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 max-w-[220px]">
                    <h3 className="font-extrabold text-slate-900 text-base md:text-lg font-heading">
                      Verify Business & Grow Safely
                    </h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Explore nearby shop and startup businesses, inspect their KYC documents, and safely finance local commerce.
                    </p>
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse-subtle">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                </div>

                <button
                  onClick={handleBusinessesClick}
                  className="btn-sbni-green splash-btn-effect text-xs md:text-sm py-2.5 px-4 font-extrabold flex items-center gap-1.5 w-fit shadow-lg cursor-pointer"
                >
                  <span className="font-extrabold tracking-wide">Explore Nearby Businesses</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Overview Metric Cards */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-base font-heading">Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                
                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Total Shop Businesses</div>
                    <div className="text-2xl font-extrabold text-slate-900 font-heading mt-0.5">{filteredNearbyBusinesses.length}</div>
                    <button
                      onClick={handleBusinessesClick}
                      className="text-xs text-blue-600 font-bold mt-1 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Explore Registered</span> <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">{currentUserObj ? 'Accepted Requests' : 'KYC Verification'}</div>
                    <div className="text-2xl font-extrabold text-emerald-700 font-heading mt-0.5">{currentUserObj ? acceptedCount : '6 Files'}</div>
                    <button
                      onClick={() => currentUserObj ? handleReportsClick('ACCEPTED') : handleBusinessesClick()}
                      className="text-xs text-emerald-600 font-bold mt-1 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{currentUserObj ? 'View Reports' : 'Inspect KYC'}</span> <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">{currentUserObj ? 'Pending Requests' : 'Service Radius'}</div>
                    <div className="text-2xl font-extrabold text-amber-600 font-heading mt-0.5">{currentUserObj ? pendingCount : '50 KM'}</div>
                    <button
                      onClick={() => currentUserObj ? handleReportsClick('PENDING') : handleBusinessesClick()}
                      className="text-xs text-amber-600 font-bold mt-1 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{currentUserObj ? 'View Reports' : 'Local Commerce'}</span> <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all border-2 border-purple-200 bg-gradient-to-br from-purple-50/60 to-white">
                  <div>
                    <div className="text-xs text-purple-700 font-extrabold">Refer & Earn</div>
                    <div className="text-xl font-extrabold text-purple-950 font-heading mt-0.5">₹ Rewards</div>
                    <button
                      onClick={() => setReferModalOpen(true)}
                      className="text-xs text-purple-700 font-extrabold mt-1 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Invite Partners</span> <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <Gift className="w-5 h-5" />
                  </div>
                </div>

              </div>
            </div>

            {/* Recent Verification Requests on Home */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base md:text-lg font-heading splash-text-effect">
                    Recent Verification Requests
                  </h3>
                  {currentUserObj && (
                    <button onClick={() => handleReportsClick('ALL')} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">
                      View All
                    </button>
                  )}
                </div>

                {!currentUserObj ? (
                  <div className="card-white p-8 text-center rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#003893]">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-slate-900 font-heading">Financer Sign In Required</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Please log in to your Money Financer account to view recent applicant verification requests.
                      </p>
                    </div>
                    <button
                      onClick={onOpenAuth}
                      className="btn-sbni-blue py-2.5 px-6 text-xs font-extrabold shadow-md mx-auto flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Log In as Money Financer</span>
                    </button>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="card-white p-8 text-center space-y-3">
                    <Clock className="w-10 h-10 text-slate-400 mx-auto" />
                    <div className="font-bold text-slate-700 text-sm">No Recent Applied Requests</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Vendors who submit loan requests specifically to your business money financer account will appear here.
                    </p>
                    <button onClick={handleBusinessesClick} className="btn-sbni-green text-xs py-2 px-4 font-bold mx-auto">
                      Explore All Registered Shop Businesses
                    </button>
                  </div>
                ) : (
                  <div className="card-white splash-highlight-card divide-y divide-slate-100 overflow-hidden shadow-lg bg-white">
                    {requests.slice(0, 5).map((req) => (
                      <div
                        key={req.id}
                        onClick={() => handleVendorSelect(req)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50/40 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-emerald-300 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform shadow-xs flex items-center justify-center font-bold text-slate-700">
                            {req.avatarUrl || req.liveSelfieUrl ? (
                              <img
                                src={req.avatarUrl || req.liveSelfieUrl}
                                alt={req.vendorName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{req.vendorName.charAt(0).toUpperCase()}</span>
                            )}
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
                          {checkVendorIsFraud(req) ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[10px] uppercase shadow-md animate-pulse">
                              🚨 FRAUD ACCOUNT
                            </span>
                          ) : (
                            <span className={req.status === 'Verified' ? 'badge-verified-green' : 'badge-pending-amber'}>
                              {req.status}
                            </span>
                          )}
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions Panel */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-base font-heading">Quick Navigation</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={handleBusinessesClick}
                    className="card-white p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all active:scale-95"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Search className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Nearby Businesses</span>
                  </div>

                  <div
                    onClick={() => handleReportsClick('PENDING')}
                    className="card-white p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all active:scale-95"
                  >
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Pending Requests</span>
                  </div>

                  <div
                    onClick={() => handleReportsClick('ALL')}
                    className="card-white p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all active:scale-95"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">All Reports</span>
                  </div>

                  <div
                    onClick={handleProfileClick}
                    className="card-white p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all active:scale-95"
                  >
                    <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Financer Profile</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: BUSINESSES TAB - ALL NEARBY BUSINESSES DISCOVERY */}
        {!selectedVendor && activeTab === 'businesses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Discovered Small Shop & Startup Businesses</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Browse all registered shop businesses located within and near your service area ({lenderLocation.place}, {lenderLocation.city})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300 shadow-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lenderLocation.lendingRadiusKm} KM Active Service Radius</span>
                </span>
              </div>
            </div>

            {/* Search Input for Nearby Businesses */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search by shop name, owner name, business category, or location..."
                value={nearbySearchQuery}
                onChange={(e) => setNearbySearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>

            {/* Nearby Businesses Cards Grid */}
            {filteredNearbyBusinesses.length === 0 ? (
              <div className="card-white p-12 text-center rounded-3xl border border-slate-200/90 shadow-sm space-y-4 max-w-xl mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                    {nearbySearchQuery.trim() ? 'No Businesses Found Matching Search' : 'No Registered Businesses in Range'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
                    {nearbySearchQuery.trim()
                      ? `No shop businesses matched "${nearbySearchQuery}". Try clearing your search.`
                      : `There are currently no registered shop businesses within your ${lenderLocation.lendingRadiusKm} KM service area in ${lenderLocation.city}. Registered vendors will appear here.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNearbyBusinesses.map((biz) => {
                  const isBizFraud = checkVendorIsFraud(biz) || !!biz.isFraud;
                  return (
                    <div
                      key={biz.id}
                      className={`card-white p-5 space-y-4 hover:shadow-xl transition-all border rounded-3xl flex flex-col justify-between group relative overflow-hidden ${
                        isBizFraud
                          ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-200'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header Box */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-12 h-12 rounded-2xl border overflow-hidden flex items-center justify-center font-extrabold shrink-0 shadow-xs ${
                              isBizFraud ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}>
                              {biz.avatarUrl ? (
                                <img src={biz.avatarUrl} alt={biz.shopName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{biz.shopName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className={`font-extrabold text-base font-heading transition-colors truncate ${
                                isBizFraud ? 'text-rose-900 group-hover:text-rose-700' : 'text-slate-900 group-hover:text-emerald-700'
                              }`}>
                                {biz.shopName}
                              </h4>
                              <div className="text-xs text-slate-500 font-medium truncate">Owner: {biz.vendorName}</div>
                            </div>
                          </div>

                          {isBizFraud ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[11px] shadow-xs flex items-center gap-1 shrink-0 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Fraud Account</span>
                            </span>
                          ) : (
                            <span className="badge-verified-green shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>

                        {/* Fraud Warning Banner inside Card */}
                        {isBizFraud && (
                          <div className="px-3 py-2 rounded-xl bg-rose-100/90 border border-rose-300 text-rose-900 text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>⚠️ Confirmed Fraud Account (Blacklisted)</span>
                          </div>
                        )}

                        {/* Distance & Location Pill */}
                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 text-xs text-slate-700 font-medium flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px] truncate">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{biz.distanceKm} KM away • {biz.place}, {biz.city}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                            biz.distanceKm <= (Number(lenderLocation.lendingRadiusKm) || 50)
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}>
                            {biz.distanceKm <= (Number(lenderLocation.lendingRadiusKm) || 50) ? 'Inside Radius' : 'Outside Radius'}
                          </span>
                        </div>

                        {/* Business Summary Info */}
                        <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2.5">
                          <div className="flex justify-between text-slate-600">
                            <span>Business Name:</span>
                            <span className="font-bold text-slate-900">{biz.shopName}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Annual Income:</span>
                            <span className="font-bold text-slate-800">{biz.annualTurnover || biz.annualIncome || 'Under 2 Lakhs'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Call, WhatsApp, More Info */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Call Button */}
                          <button
                            onClick={() => {
                              if (!checkLenderSubscribed()) return;
                              if (biz.mobileNumber && biz.mobileNumber !== 'Not provided') {
                                window.location.href = `tel:${biz.mobileNumber}`;
                              } else {
                                alert('Contact phone number is currently not provided for this business.');
                              }
                            }}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </button>

                          {/* WhatsApp Button */}
                          <button
                            onClick={() => {
                              if (!checkLenderSubscribed()) return;
                              if (biz.mobileNumber && biz.mobileNumber !== 'Not provided') {
                                const cleanPhone = biz.mobileNumber.replace(/\D/g, '');
                                const msg = encodeURIComponent(`Hello ${biz.vendorName}, I saw your business "${biz.shopName}" on JustPaisa and would like to discuss business financing options.`);
                                window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
                              } else {
                                alert('WhatsApp contact number is currently not provided for this business.');
                              }
                            }}
                            className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </div>

                        {/* More Info Button */}
                        <button
                          onClick={() => setMoreInfoModalBiz(biz)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80"
                        >
                          <Info className="w-3.5 h-3.5 text-[#003893]" />
                          <span>More Info & Location</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REPORTS TAB - FULL REQUESTS TRACKING & FRAUD AUDIT */}
        {!selectedVendor && activeTab === 'reports' && (
          !currentUserObj ? (
            <div className="card-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-5 max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#003893] shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 font-heading">Financer Login Required</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Please log in to your Business Money Financer account to access your loan inspection history and applicant verification reports.
                </p>
              </div>
              <button
                onClick={onOpenAuth}
                className="btn-sbni-blue py-3 px-8 text-xs font-extrabold shadow-lg mx-auto flex items-center gap-2 cursor-pointer"
              >
                <span>Log In as Business Money Financer</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Financing Requests & Reports</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Manage customer financing requests, approve or reject applications, and report fraudulent accounts
                  </p>
                </div>

                {/* Status Filter Buttons - Single line with horizontal scrolling on mobile */}
                <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-1 px-1">
                  <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl w-max flex-nowrap gap-1">
                    <button
                      onClick={() => setReportsFilterStatus('ALL')}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        reportsFilterStatus === 'ALL'
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>All ({requests.length})</span>
                    </button>

                    <button
                      onClick={() => setReportsFilterStatus('PENDING')}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        reportsFilterStatus === 'PENDING'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending Requests ({pendingCount})</span>
                    </button>

                    <button
                      onClick={() => setReportsFilterStatus('ACCEPTED')}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        reportsFilterStatus === 'ACCEPTED'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accepted Requests ({acceptedCount})</span>
                    </button>

                    <button
                      onClick={() => setReportsFilterStatus('REJECTED')}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        reportsFilterStatus === 'REJECTED'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rejected ({rejectedCount})</span>
                    </button>

                    <button
                      onClick={() => setReportsFilterStatus('FRAUD')}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        reportsFilterStatus === 'FRAUD'
                          ? 'bg-rose-700 text-white shadow-md'
                          : 'text-rose-700 hover:text-rose-900 hover:bg-rose-100/60'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Fraud Alert Reports ({fraudCount})</span>
                    </button>
                  </div>
                </div>
            </div>

            {/* Action Feedback Banner */}
            {actionFeedback && (
              <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-sm font-bold text-center animate-bounce">
                {actionFeedback}
              </div>
            )}

            {/* Search Input for Reports */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search vendor name, shop name, city, or phone number..."
                value={reportsSearchQuery}
                onChange={(e) => setReportsSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>

            {/* Requests Cards & Table */}
            {filteredReports.length === 0 ? (
              <div className="card-white p-12 text-center rounded-3xl border border-slate-200/90 shadow-sm space-y-4 max-w-xl mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                    {reportsFilterStatus === 'PENDING' && 'No Pending Requests'}
                    {reportsFilterStatus === 'ACCEPTED' && 'No Accepted Requests Yet'}
                    {reportsFilterStatus === 'REJECTED' && 'No Rejected Requests'}
                    {reportsFilterStatus === 'FRAUD' && 'No Fraud Alert Reports'}
                    {reportsFilterStatus === 'ALL' && 'No Requests Found'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
                    {reportsFilterStatus === 'PENDING' && 'When small shop businesses apply for financing, call you, or send WhatsApp inquiries, they will appear here.'}
                    {reportsFilterStatus === 'ACCEPTED' && 'Requests you accept will appear here. Accepted vendors can navigate directly to your office on Google Maps.'}
                    {reportsFilterStatus === 'REJECTED' && 'Requests you reject will be stored here for audit history.'}
                    {reportsFilterStatus === 'FRAUD' && 'Vendors that are reported or flagged for fraudulent activity will be listed here.'}
                    {reportsFilterStatus === 'ALL' && 'No requests match your current search filters.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((vendor) => {
                  const isAccepted = vendor.status === 'Accepted' || vendor.status === 'Verified';
                  const isRejected = vendor.status === 'Rejected';

                  return (
                    <div
                      key={vendor.id}
                      className="card-white p-5 space-y-4 hover:shadow-xl transition-all border border-slate-200 rounded-3xl flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="space-y-3">
                        {/* Top Header with Avatar & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-extrabold text-slate-700 shrink-0 shadow-xs">
                              {vendor.avatarUrl || vendor.liveSelfieUrl ? (
                                <img src={vendor.avatarUrl || vendor.liveSelfieUrl} alt={vendor.vendorName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{vendor.vendorName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-900 text-base font-heading group-hover:text-emerald-700 transition-colors truncate">
                                {vendor.vendorName}
                              </h4>
                              <div className="text-xs text-slate-500 font-medium truncate">{vendor.shopName}</div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {checkVendorIsFraud(vendor) ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[9px] uppercase shadow-sm animate-pulse">
                                🚨 FRAUD
                              </span>
                            ) : isAccepted ? (
                              <span className="badge-verified-green">✓ Accepted</span>
                            ) : isRejected ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px]">
                                ✗ Rejected
                              </span>
                            ) : (
                              <span className="badge-pending-amber">⏳ Pending</span>
                            )}

                            {/* Delete Request Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                promptDeleteRequest(vendor);
                              }}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-xs active:scale-90"
                              title="Delete Financing Request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inquiry Source Badge */}
                        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-slate-700 font-medium flex items-center gap-2">
                          {vendor.inquiryType === 'PHONE_CALL' ? (
                            <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : vendor.inquiryType === 'WHATSAPP' ? (
                            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <span className="text-[11px] font-semibold text-slate-800 line-clamp-1">
                            {vendor.inquiryMessage || (vendor.inquiryType === 'PHONE_CALL' ? '📞 Vendor initiated a Phone Call inquiry' : vendor.inquiryType === 'WHATSAPP' ? '💬 Vendor sent a WhatsApp inquiry' : '📝 Loan Application submitted')}
                          </span>
                        </div>

                        {/* Business Summary Info */}
                        <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2.5">
                          <div className="flex justify-between text-slate-600">
                            <span>Location:</span>
                            <span className="font-bold text-slate-800">{vendor.city}, {vendor.state}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Annual Income:</span>
                            <span className="font-bold text-slate-800">{vendor.annualTurnover || vendor.annualIncome || 'Under 2 Lakhs'}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Mobile Contact:</span>
                            <span className="font-mono font-bold text-slate-800">{vendor.mobileNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Section */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <button
                          onClick={() => handleVendorSelect(vendor)}
                          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Inspect All 6 KYC Files & Photos</span>
                        </button>

                        {/* Action buttons depending on state */}
                        {!isAccepted && !isRejected && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(vendor.id);
                              }}
                              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept Request</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(vendor.id);
                              }}
                              className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {isAccepted && (
                          <div className="space-y-1.5">
                            <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200 text-center font-semibold">
                              ✓ Accepted · Vendor Office Navigation Unlocked
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportingFraudVendor(vendor);
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Report Fraud Account</span>
                            </button>
                          </div>
                        )}

                        {isRejected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReopen(vendor.id);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          >
                            <span>↺ Move Back to Pending</span>
                          </button>
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

        {/* VIEW: VENDOR VERIFICATION REVIEW PAGE */}
        {selectedVendor && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Shop Business Verification</h2>
                  <div className="text-xs text-slate-500">Review shop business details and documents for approval</div>
                </div>
              </div>

              <button
                onClick={() => promptDeleteRequest(selectedVendor)}
                className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Delete Financing Request"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Delete Request</span>
              </button>
            </div>

            {/* FRAUD WARNING ALERT BANNER FOR BUSINESS FINANCERS */}
            {checkVendorIsFraud(selectedVendor) && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-600 text-white shadow-xl flex items-center gap-3.5 border-2 border-rose-800 animate-pulse">
                <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                    🚨 FRAUD ACCOUNT ALERT (FLAGGED BY JUSTPAISA ADMIN)
                  </div>
                  <div className="text-xs text-rose-100 font-bold mt-0.5 leading-relaxed">
                    This vendor user account ({selectedVendor.vendorName} - {selectedVendor.shopName}) has been reported and marked as a FRAUD ACCOUNT by JustPaisa Admin. Do not approve credit or disburse funds!
                  </div>
                </div>
              </div>
            )}

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
                    <div className="w-14 h-14 rounded-full bg-slate-200 border-2 border-slate-300 overflow-hidden flex-shrink-0 flex items-center justify-center font-extrabold text-xl text-slate-700">
                      {selectedVendor.avatarUrl || selectedVendor.liveSelfieUrl ? (
                        <img
                          src={selectedVendor.avatarUrl || selectedVendor.liveSelfieUrl}
                          alt={selectedVendor.vendorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#003893] to-[#002669] text-white flex items-center justify-center font-extrabold text-xl font-heading">
                          {selectedVendor.vendorName?.charAt(0).toUpperCase() || 'V'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg font-heading">{selectedVendor.vendorName}</h3>
                      <div className="text-xs text-slate-600 font-medium">{selectedVendor.shopName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{selectedVendor.shopAddress}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Requested on {selectedVendor.requestedDate}, {selectedVendor.requestedTime}</div>
                    </div>
                  </div>

                  {checkVendorIsFraud(selectedVendor) ? (
                    <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold uppercase shadow-md animate-pulse">
                      🚨 FRAUD ACCOUNT FLAGGED
                    </span>
                  ) : (
                    <span className={selectedVendor.status === 'Verified' ? 'badge-verified-green' : 'badge-pending-amber'}>
                      {selectedVendor.status}
                    </span>
                  )}
                </div>

                {/* Annual Income Card */}
                <div className="card-white p-5 bg-gradient-to-r from-[#003893] to-[#001f54] text-white rounded-2xl shadow-md space-y-2">
                  <div className="border-b border-white/20 pb-2">
                    <div>
                      <div className="text-[10px] text-blue-200 uppercase font-extrabold tracking-wider">Annual Income</div>
                      <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-heading mt-0.5">
                        {selectedVendor.annualIncome || selectedVendor.annualTurnover || (selectedVendor.monthlyIncome ? `₹ ${selectedVendor.monthlyIncome}` : 'Under 2 Lakhs')}
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
                      <span className="font-semibold text-slate-900">{selectedVendor.dateOfBirth || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Address</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.shopAddress || 'Address pending'}</span>
                    </div>
                  </div>
                </div>

                {/* Identity Documents */}
                <div className="card-white p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-base font-heading">Identity Documents</h4>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Mandatory Financer Review
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* PAN Card Card */}
                    {(() => {
                      const hasPanFile = Boolean(selectedVendor.panFileUrl && selectedVendor.panFileUrl.trim().length > 10);
                      const isInspected = isDocInspected(selectedVendor.id, 'pan');
                      const panFileName = `PAN_Card_${(selectedVendor.panNumber || selectedVendor.vendorName).replace(/\s+/g, '_')}`;

                      return (
                        <div className={`p-3.5 rounded-xl border transition-all ${
                          isInspected ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                        }`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span>PAN Card</span>
                                {isInspected ? (
                                  <span className="badge-verified-green text-[10px]">✓ Inspected</span>
                                ) : (
                                  <span className="badge-pending-amber text-[10px] animate-pulse">Required Review</span>
                                )}
                              </div>
                              <div className="text-slate-600 font-mono font-bold text-xs mt-0.5">
                                {selectedVendor.panNumber || 'No PAN Number Provided'}
                              </div>
                            </div>
                            {hasPanFile ? (
                              <span className="badge-verified-green">File Uploaded</span>
                            ) : selectedVendor.panNumber ? (
                              <span className="badge-pending-amber">Number Provided</span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">Not Provided</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                            {hasPanFile ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    markDocInspected(selectedVendor.id, 'pan');
                                    const fallbackPan = generatePanCardDataUrl(selectedVendor.vendorName, selectedVendor.panNumber || '', selectedVendor.dateOfBirth);
                                    setPreviewDocModal({
                                      title: `PAN Card (${selectedVendor.panNumber || selectedVendor.vendorName})`,
                                      url: selectedVendor.panFileUrl || fallbackPan,
                                      fallbackUrl: fallbackPan,
                                      type: 'doc',
                                      fileName: panFileName,
                                    });
                                  }}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View & Inspect</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    markDocInspected(selectedVendor.id, 'pan');
                                    downloadDocumentFile(selectedVendor.panFileUrl!, panFileName);
                                  }}
                                  className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                                  title="Download PAN Card"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markDocInspected(selectedVendor.id, 'pan')}
                                className={`flex-1 py-1.5 px-3 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                  isInspected
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                                }`}
                              >
                                <span>{isInspected ? '✓ PAN Record Inspected' : '✓ Mark PAN Inspected'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Aadhaar Card Card */}
                    {(() => {
                      const hasAadhaarFile = Boolean(selectedVendor.aadhaarFileUrl && selectedVendor.aadhaarFileUrl.trim().length > 10);
                      const isInspected = isDocInspected(selectedVendor.id, 'aadhaar');
                      const aadhaarFileName = `Aadhaar_Card_${(selectedVendor.aadhaarNumber || selectedVendor.vendorName).replace(/\s+/g, '_')}`;

                      return (
                        <div className={`p-3.5 rounded-xl border transition-all ${
                          isInspected ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                        }`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span>Aadhaar Card</span>
                                {isInspected ? (
                                  <span className="badge-verified-green text-[10px]">✓ Inspected</span>
                                ) : (
                                  <span className="badge-pending-amber text-[10px] animate-pulse">Required Review</span>
                                )}
                              </div>
                              <div className="text-slate-600 font-mono font-bold text-xs mt-0.5">
                                {selectedVendor.aadhaarNumber || 'No Aadhaar Number Provided'}
                              </div>
                            </div>
                            {hasAadhaarFile ? (
                              <span className="badge-verified-green">File Uploaded</span>
                            ) : selectedVendor.aadhaarNumber ? (
                              <span className="badge-pending-amber">Number Provided</span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">Not Provided</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                            {hasAadhaarFile ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    markDocInspected(selectedVendor.id, 'aadhaar');
                                    const fallbackAadhaar = generateAadhaarCardDataUrl(selectedVendor.vendorName, selectedVendor.aadhaarNumber || '', selectedVendor.shopAddress);
                                    setPreviewDocModal({
                                      title: `Aadhaar Card (${selectedVendor.aadhaarNumber || selectedVendor.vendorName})`,
                                      url: selectedVendor.aadhaarFileUrl || fallbackAadhaar,
                                      fallbackUrl: fallbackAadhaar,
                                      type: 'doc',
                                      fileName: aadhaarFileName,
                                    });
                                  }}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View & Inspect</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    markDocInspected(selectedVendor.id, 'aadhaar');
                                    downloadDocumentFile(selectedVendor.aadhaarFileUrl!, aadhaarFileName);
                                  }}
                                  className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                                  title="Download Aadhaar Card"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markDocInspected(selectedVendor.id, 'aadhaar')}
                                className={`flex-1 py-1.5 px-3 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                  isInspected
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                                }`}
                              >
                                <span>{isInspected ? '✓ Aadhaar Record Inspected' : '✓ Mark Aadhaar Inspected'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
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

                {/* Shop Information & GPS Navigation */}
                <div className="card-white p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-bold text-slate-900 text-base font-heading">Shop Information & Location</h4>
                    <a
                      href={getGoogleMapsNavigationUrl(
                        selectedVendor.latitude || 17.3688,
                        selectedVendor.longitude || 78.5247,
                        `${selectedVendor.shopName} (${selectedVendor.vendorName})`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>🧭 Navigate (Google Maps)</span>
                    </a>
                  </div>
                  <div className="space-y-3 text-xs md:text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Shop Name</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.shopName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Shop Address</span>
                      <span className="font-semibold text-slate-900 text-right">{selectedVendor.shopAddress}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">City / State</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.city}, {selectedVendor.state}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Shop Type</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.shopType || 'Retail & Business'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Years in Business</span>
                      <span className="font-semibold text-slate-900">{selectedVendor.yearsInBusiness || 'Established'}</span>
                    </div>
                  </div>
                </div>

                {/* Shop Images Grid */}
                <div className="card-white p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-base font-heading">Shop Photos & Premises</h4>
                    {isDocInspected(selectedVendor.id, 'shopPhotos') ? (
                      <span className="badge-verified-green text-[10px]">✓ Premises Inspected</span>
                    ) : (
                      <span className="badge-pending-amber text-[10px] animate-pulse">Required Review</span>
                    )}
                  </div>
                  {(() => {
                    const photos: { title: string; url: string }[] = [];
                    if (Array.isArray(selectedVendor.shopPhotos) && selectedVendor.shopPhotos.length > 0) {
                      selectedVendor.shopPhotos.forEach((img: string, i: number) => {
                        if (img && img.trim().length > 10 && !img.includes('/avatars/')) photos.push({ title: `Storefront / Premises ${i + 1}`, url: img });
                      });
                    }
                    if (Array.isArray(selectedVendor.shopImages) && selectedVendor.shopImages.length > 0) {
                      selectedVendor.shopImages.forEach((img, i) => {
                        if (img && img.trim().length > 10 && !img.includes('/avatars/') && !photos.some(p => p.url === img)) photos.push({ title: `Shop Photo ${i + 1}`, url: img });
                      });
                    }
                    if (selectedVendor.shopPhotoUrl && selectedVendor.shopPhotoUrl.trim().length > 10 && !selectedVendor.shopPhotoUrl.includes('/avatars/') && !photos.some(p => p.url === selectedVendor.shopPhotoUrl)) {
                      photos.push({ title: 'Shop / Startup Business Photo', url: selectedVendor.shopPhotoUrl });
                    }

                    if (photos.length > 0) {
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {photos.map((p, i) => {
                            const photoFileName = `Shop_Premises_${selectedVendor.shopName.replace(/\s+/g, '_')}_${i + 1}`;
                            return (
                              <div
                                key={i}
                                className="relative group rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 aspect-video sm:aspect-square"
                              >
                                <img
                                  src={p.url}
                                  alt={p.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-2 p-2 text-center">
                                  <span className="text-[11px] truncate max-w-[90%]">{p.title}</span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        markDocInspected(selectedVendor.id, 'shopPhotos');
                                        setPreviewDocModal({
                                          title: `${p.title} (${selectedVendor.vendorName})`,
                                          url: p.url,
                                          type: 'image',
                                          fileName: photoFileName,
                                        });
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-xs"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        markDocInspected(selectedVendor.id, 'shopPhotos');
                                        downloadDocumentFile(p.url, photoFileName);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-xs"
                                      title="Download Photo"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-2 text-[10px] text-white font-semibold truncate">
                                  {p.title}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 text-slate-500 text-xs">
                        <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                        <div>
                          <div className="font-bold text-slate-700">No Storefront Photos Uploaded</div>
                          <p className="text-slate-400 text-[11px] mt-0.5">Vendor has not attached premises photos to this application yet.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => markDocInspected(selectedVendor.id, 'shopPhotos')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isDocInspected(selectedVendor.id, 'shopPhotos')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isDocInspected(selectedVendor.id, 'shopPhotos') ? '✓ Premises Acknowledged' : '✓ Acknowledge (No Photos)'}
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Additional Documents */}
                <div className="card-white p-5 space-y-4">
                  <h4 className="font-bold text-slate-900 text-base font-heading">Additional Business Documents</h4>
                  <div className="space-y-3">
                    {/* Business License */}
                    {(() => {
                      const hasLicenseFile = Boolean(selectedVendor.shopLicensePdf && selectedVendor.shopLicensePdf.trim().length > 10);
                      const licenseFileName = `Business_License_${selectedVendor.shopName.replace(/\s+/g, '_')}`;

                      return (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm hover:border-slate-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">Business License / Shop & Establishment</div>
                              <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                                {hasLicenseFile ? 'Uploaded Document File' : 'Optional / Not Uploaded by vendor'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasLicenseFile ? (
                              <>
                                <span className="badge-verified-green text-[10px]">Uploaded</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    markDocInspected(selectedVendor.id, 'businessLicense');
                                    const fallbackLic = generateShopLicenseDataUrl(selectedVendor.shopName, selectedVendor.vendorName, selectedVendor.shopType, selectedVendor.shopAddress);
                                    setPreviewDocModal({
                                      title: `Business License (${selectedVendor.shopName})`,
                                      url: selectedVendor.shopLicensePdf || fallbackLic,
                                      fallbackUrl: fallbackLic,
                                      type: 'doc',
                                      fileName: licenseFileName,
                                    });
                                  }}
                                  className="p-1.5 px-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-blue-200"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    markDocInspected(selectedVendor.id, 'businessLicense');
                                    downloadDocumentFile(selectedVendor.shopLicensePdf!, licenseFileName);
                                  }}
                                  className="p-1.5 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                                  title="Download License"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-md">
                                Not Uploaded
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* GST Certificate */}
                    {(() => {
                      const hasGstFile = Boolean(selectedVendor.gstCertificatePdf && selectedVendor.gstCertificatePdf.trim().length > 10);
                      const gstFileName = `GST_Certificate_${selectedVendor.shopName.replace(/\s+/g, '_')}`;

                      return (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm hover:border-slate-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">GST Registration Certificate</div>
                              <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                                {hasGstFile ? 'Uploaded Document File' : selectedVendor.gstNumber ? `GSTIN: ${selectedVendor.gstNumber}` : 'Optional / Not Uploaded by vendor'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasGstFile ? (
                              <>
                                <span className="badge-verified-green text-[10px]">Uploaded</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    markDocInspected(selectedVendor.id, 'gst');
                                    const fallbackGst = generateGstCertDataUrl(selectedVendor.shopName, selectedVendor.vendorName, selectedVendor.gstNumber || '', selectedVendor.shopAddress);
                                    setPreviewDocModal({
                                      title: `GST Certificate (${selectedVendor.shopName})`,
                                      url: selectedVendor.gstCertificatePdf || fallbackGst,
                                      fallbackUrl: fallbackGst,
                                      type: 'doc',
                                      fileName: gstFileName,
                                    });
                                  }}
                                  className="p-1.5 px-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-blue-200"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    markDocInspected(selectedVendor.id, 'gst');
                                    downloadDocumentFile(selectedVendor.gstCertificatePdf!, gstFileName);
                                  }}
                                  className="p-1.5 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                                  title="Download GST Certificate"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : selectedVendor.gstNumber ? (
                              <span className="badge-pending-amber text-[10px]">GSTIN Added</span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-md">
                                Not Uploaded
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {(selectedVendor.status === 'Accepted' || selectedVendor.status === 'Verified') ? (
                    <button
                      onClick={() => setReportingFraudVendor(selectedVendor)}
                      className="py-3 px-4 rounded-xl border border-rose-600 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Report Fraud Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReject(selectedVendor.id)}
                      className="py-3 px-4 rounded-xl border border-rose-500 text-rose-600 font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Request</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (checkVendorIsFraud(selectedVendor)) {
                        setActionFeedback('❌ Cannot accept account marked as FRAUD by Admin!');
                        setTimeout(() => setActionFeedback(''), 2500);
                        return;
                      }

                      handleApprove(selectedVendor.id);
                    }}
                    disabled={checkVendorIsFraud(selectedVendor)}
                    className={`py-3 px-4 text-xs md:text-sm justify-center font-extrabold flex items-center gap-2 rounded-xl transition-all cursor-pointer ${
                      checkVendorIsFraud(selectedVendor)
                        ? 'bg-rose-900/40 text-rose-300 border border-rose-800 cursor-not-allowed opacity-60'
                        : (selectedVendor.status === 'Accepted' || selectedVendor.status === 'Verified')
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'btn-sbni-green shadow-lg'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {checkVendorIsFraud(selectedVendor)
                        ? 'Disabled (Fraud Account)'
                        : (selectedVendor.status === 'Accepted' || selectedVendor.status === 'Verified')
                        ? '✓ Request Accepted'
                        : 'Accept & Approve Request'}
                    </span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* VIEW 3: LENDER PROFILE VIEW */}
        {!selectedVendor && activeTab === 'profile' && (
          !currentUserObj ? (
            <div className="card-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-5 max-w-lg mx-auto my-12">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#003893] shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 font-heading">Financer Login Required</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Please log in to your Business Money Financer account to view or edit your lending institution details, interest rates, and service radius.
                </p>
              </div>
              <button
                onClick={onOpenAuth}
                className="btn-sbni-blue py-3 px-8 text-xs font-extrabold shadow-lg mx-auto flex items-center gap-2 cursor-pointer"
              >
                <span>Log In as Business Money Financer</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
              
              {/* Header Title & Edit Mode Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">Business Money Financer Profile & Security</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Manage financer credentials, credit officer contact details, and session status
                  </p>
                </div>

                {!isEditingLenderProfile ? (
                  <button
                    type="button"
                    onClick={startEditingLender}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#003893] border border-blue-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-[#003893]" />
                    <span>Edit Financer Profile</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditingLenderProfile(false)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLenderProfile}
                      disabled={isSavingLenderProfile}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#003893] hover:bg-[#002366] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      {isSavingLenderProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-emerald-400" />
                          <span>Save Financer Details</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

            {/* Save Success Banner */}
            {lenderSaveSuccess && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{lenderSaveSuccess}</span>
              </div>
            )}

            {/* ── LENDER MEMBERSHIP & AUTOPAY BILLING SECTION ─────────────── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-slate-50 border border-emerald-200/90 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold shrink-0 shadow-xs">
                    <Zap className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700">
                      Financer Membership & Billing
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 font-heading flex items-center gap-2">
                      <span>{lenderActiveSub?.plan?.name || (lenderActiveSub ? 'Active Financer Plan' : 'No Active Membership')}</span>
                      {lenderActiveSub?.isAutoPay && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Repeat className="w-3 h-3 text-emerald-600" /> AutoPay: Active
                        </span>
                      )}
                      {!lenderActiveSub?.isAutoPay && lenderActiveSub?.endDate && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                          AutoPay: Off
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {lenderActiveSub?.isAutoPay && (
                    <button
                      type="button"
                      onClick={() => setShowLenderCancelModal(true)}
                      disabled={cancellingLenderAutoPay}
                      className="px-3.5 py-2 text-xs font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-xs active:scale-95"
                    >
                      {cancellingLenderAutoPay ? 'Cancelling...' : 'Cancel AutoPay'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onOpenSubscription}
                    className="btn-sbni-green px-4 py-2 text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{lenderActiveSub ? 'Upgrade Plan' : 'Activate Plan'}</span>
                  </button>
                </div>
              </div>

              {lenderSubFeedback && (
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs text-center animate-bounce">
                  {lenderSubFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Plan Status</span>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{lenderActiveSub ? 'Verified Financer Active' : 'Free Preview Mode'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Valid Until</span>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{lenderActiveSub?.endDate ? new Date(lenderActiveSub.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Auto-Renewal</span>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Repeat className={`w-4 h-4 ${lenderActiveSub?.isAutoPay ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{lenderActiveSub?.isAutoPay ? 'Continuous Auto-Renewal (UPI/Card)' : 'Manual Renewal'}</span>
                  </div>
                </div>
              </div>

              {/* Cancel AutoPay Confirmation Modal for Lender */}
              {showLenderCancelModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                        Turn Off Financer AutoPay?
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                        Your subscription will not be charged again. You will continue to have full access to verified shop leads until{' '}
                        <span className="font-extrabold text-slate-900">
                          {lenderActiveSub?.endDate ? new Date(lenderActiveSub.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'the end of your current cycle'}
                        </span>
                        .
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowLenderCancelModal(false)}
                        disabled={cancellingLenderAutoPay}
                        className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Keep AutoPay
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelLenderAutoPay}
                        disabled={cancellingLenderAutoPay}
                        className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                      >
                        {cancellingLenderAutoPay ? 'Cancelling...' : 'Yes, Turn Off'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card-white p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-md border border-slate-200/90 rounded-2xl sm:rounded-3xl">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pb-5 sm:pb-6 border-b border-slate-100">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-lg border-4 border-white ring-2 ring-emerald-100 bg-emerald-50 flex items-center justify-center">
                    <img
                      src={lenderAvatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200'}
                      alt="Business Financer Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label
                    htmlFor="lender-profile-avatar-input"
                    className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#007a33] text-white hover:bg-[#005e27] cursor-pointer shadow-md transition-transform active:scale-95 flex items-center justify-center"
                    title="Change Profile Photo"
                  >
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </label>
                  <input
                    id="lender-profile-avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div className="text-center sm:text-left space-y-1 flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading break-words">
                      {isEditingLenderProfile ? lenderEditForm.institutionName || currentUserObj.name : currentUserObj.name}
                    </h3>
                    <span className="badge-verified-green w-fit mx-auto sm:mx-0 text-[10px] sm:text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Business Financer
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Money Financer</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Credit Officer: {isEditingLenderProfile ? lenderEditForm.contactPerson || currentUserObj.contactPerson : currentUserObj.contactPerson}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium pt-0.5">
                    Registration No: <span className="font-mono text-slate-700 font-bold">{isEditingLenderProfile ? lenderEditForm.regNo || currentUserObj.regNo : currentUserObj.regNo}</span>
                  </p>

                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                    <label
                      htmlFor="lender-profile-avatar-input"
                      className="text-xs font-bold text-[#007a33] hover:text-emerald-900 cursor-pointer flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 transition-colors active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{lenderAvatarUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Credit Officer Details Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base font-heading">Credit Officer Account Information</h4>
                  {isEditingLenderProfile && (
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      ✏️ Edit Active
                    </span>
                  )}
                </div>

                {!isEditingLenderProfile ? (
                  /* View Mode */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Chief Credit Officer</span>
                      <div className="font-extrabold text-slate-900 text-sm break-words">{currentUserObj.contactPerson}</div>
                    </div>
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Mobile / WhatsApp</span>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{currentUserObj.phone}</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Email Address</span>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 break-all">
                        <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{currentUserObj.email}</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Office Location</span>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 break-words">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{currentUserObj.city}, {currentUserObj.state}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode Inputs */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    
                    {/* Institution Name */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Financer Institution Name *</label>
                      <input
                        type="text"
                        value={lenderEditForm.institutionName}
                        onChange={(e) => setLenderEditForm({ ...lenderEditForm, institutionName: e.target.value })}
                        placeholder="e.g. Gourav Money Financer"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Chief Credit Officer */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Chief Credit Officer Name *</label>
                      <input
                        type="text"
                        value={lenderEditForm.contactPerson}
                        onChange={(e) => setLenderEditForm({ ...lenderEditForm, contactPerson: e.target.value })}
                        placeholder="e.g. Gourav Boga"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Mobile / WhatsApp */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Mobile / WhatsApp Number *</label>
                      <input
                        type="tel"
                        value={lenderEditForm.phone}
                        onChange={(e) => setLenderEditForm({ ...lenderEditForm, phone: e.target.value })}
                        placeholder="e.g. 7337401590"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Email */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Email Address *</label>
                      <input
                        type="email"
                        value={lenderEditForm.email}
                        onChange={(e) => setLenderEditForm({ ...lenderEditForm, email: e.target.value })}
                        placeholder="e.g. financer@example.com"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* Registration No */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Registration Number</label>
                      <input
                        type="text"
                        value={lenderEditForm.regNo}
                        onChange={(e) => setLenderEditForm({ ...lenderEditForm, regNo: e.target.value })}
                        placeholder="e.g. REG-572787"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {/* City & State */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">City & State *</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={lenderEditForm.city}
                          onChange={(e) => setLenderEditForm({ ...lenderEditForm, city: e.target.value })}
                          placeholder="City"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={lenderEditForm.state}
                          onChange={(e) => setLenderEditForm({ ...lenderEditForm, state: e.target.value })}
                          placeholder="State"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Street Address */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5 sm:col-span-2">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Full Office Address</label>
                      <textarea
                        rows={2}
                        value={lenderEditForm.address}
                        onChange={(e) => setLenderEditForm({ ...lenderEditForm, address: e.target.value })}
                        placeholder="e.g. Suite 402, Financial Plaza, Main Road, Hyderabad, Telangana - 500060"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      />
                    </div>

                  </div>
                )}

              </div>

              {/* Lending Portfolio Limits & Success Rate Section */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="font-extrabold text-slate-900 text-sm font-heading">Lending Portfolio Ticket Size & Success Rate</h4>
                
                {!isEditingLenderProfile ? (
                  /* View Mode */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                      <span className="text-slate-500 font-medium block">Approved Minimum Ticket Size</span>
                      <span className="font-extrabold text-emerald-900 text-sm mt-0.5 block">
                        ₹ {Number(currentUserObj.minLoan).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
                      <span className="text-slate-500 font-medium block">Approved Maximum Ticket Size</span>
                      <span className="font-extrabold text-blue-900 text-sm mt-0.5 block">
                        ₹ {Number(currentUserObj.maxLoan).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 sm:col-span-2">
                      <span className="text-slate-500 font-medium block">Lending Approval Success Rate</span>
                      <span className="font-extrabold text-emerald-800 text-sm mt-1 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>{currentUserObj.successRate || '80% - 90%'} Success Rate on Borrowing Money</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode Inputs */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Min Ticket Size (₹) *</label>
                      <input
                        type="number"
                        value={lenderEditForm.minLoan}
                        onChange={(e) => setLenderEditForm({ ...lenderEditForm, minLoan: Number(e.target.value) })}
                        placeholder="5000"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Max Ticket Size (₹) *</label>
                      <input
                        type="number"
                        value={lenderEditForm.maxLoan}
                        onChange={(e) => setLenderEditForm({ ...lenderEditForm, maxLoan: Number(e.target.value) })}
                        placeholder="100000"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5 sm:col-span-2">
                      <label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider block">Lending Approval Success Rate *</label>
                      <select
                        value={['80% - 90%', '85% - 95%', '90% - 98%', '75% - 85%', '95% - 100%'].includes(lenderEditForm.successRate) ? lenderEditForm.successRate : 'CUSTOM'}
                        onChange={(e) => {
                          if (e.target.value !== 'CUSTOM') {
                            setLenderEditForm({ ...lenderEditForm, successRate: e.target.value });
                          } else {
                            setLenderEditForm({ ...lenderEditForm, successRate: 'Custom Rate' });
                          }
                        }}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="80% - 90%">80% - 90% Success Rate (Recommended)</option>
                        <option value="85% - 95%">85% - 95% Success Rate</option>
                        <option value="90% - 98%">90% - 98% Success Rate</option>
                        <option value="75% - 85%">75% - 85% Success Rate</option>
                        <option value="95% - 100%">95% - 100% Success Rate</option>
                        <option value="CUSTOM">✏️ Custom Success Rate Percentage...</option>
                      </select>
                      {!['80% - 90%', '85% - 95%', '90% - 98%', '75% - 85%', '95% - 100%'].includes(lenderEditForm.successRate) && (
                        <input
                          type="text"
                          placeholder="e.g. 88% or 80% - 90%"
                          value={lenderEditForm.successRate === 'Custom Rate' ? '' : lenderEditForm.successRate}
                          onChange={(e) => setLenderEditForm({ ...lenderEditForm, successRate: e.target.value })}
                          className="w-full mt-1.5 px-3 py-2 bg-white rounded-xl border-2 border-[#003893] font-bold text-slate-900 text-xs focus:outline-none"
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mapbox Lending Area & Service Radius Section */}
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm font-heading flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#003893]" />
                      <span>Lending Area & Geographic Service Radius</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Set your office coordinates and active loan coverage radius using Mapbox
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#003893] border border-blue-200 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Edit Lending Area & Radius</span>
                  </button>
                </div>

                {locationSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#007a33] text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{locationSuccessMsg}</span>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {lenderLocation.place}, {lenderLocation.city}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {lenderLocation.state}, {lenderLocation.country}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-[#003893] text-white px-3 py-1 rounded-full text-xs font-black shadow-xs">
                        ⚡ {lenderLocation.lendingRadiusKm} KM Service Radius
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-slate-600 font-mono flex-wrap gap-2">
                    <span>
                      GPS: <strong>{Number(lenderLocation.latitude).toFixed(4)}</strong>,{' '}
                      <strong>{Number(lenderLocation.longitude).toFixed(4)}</strong>
                    </span>
                    <span className="text-emerald-700 font-bold font-sans">
                      ✓ Active & matching small businesses within {lenderLocation.lendingRadiusKm} KM
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Save Action Bar in Edit Mode */}
              {isEditingLenderProfile && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
                  <div className="text-xs">
                    <span className="font-bold text-white block">Ready to apply financer profile changes?</span>
                    <span className="text-[11px] text-blue-200">Your profile, avatar photo, and ticket limits will instantly update across the platform.</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditingLenderProfile(false)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLenderProfile}
                      disabled={isSavingLenderProfile}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSavingLenderProfile ? (
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
        )
      )}

      </div>

      {/* Location Picker Modal for Lender Service Area */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSave={handleSaveLenderLocation}
        initialLocation={lenderLocation}
        mode="LENDER_RADIUS"
        title="Configure Lending Area & Service Radius"
        subtitle="Small businesses within this radius will discover your financer profile"
      />

      {/* Bottom Sticky Navigation Bar */}
      <div className="fixed bottom-0 sm:bottom-5 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t sm:border border-slate-200/90 py-1.5 sm:py-3.5 px-2 sm:px-10 flex items-center justify-between sm:justify-around w-full max-w-md sm:max-w-3xl lg:max-w-4xl mx-auto shadow-2xl rounded-t-2xl sm:rounded-3xl transition-all">
        <button
          onClick={handleHomeClick}
          className={`flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'home' ? 'text-[#059669] bg-emerald-50/90 shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6 text-[#059669]" />
          <span>Home</span>
        </button>

        <button
          onClick={handleBusinessesClick}
          className={`flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'businesses' ? 'text-[#059669] bg-emerald-50/90 shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          <span>Businesses</span>
        </button>

        {/* Floating Green Action Button */}
        <button
          onClick={handleBusinessesClick}
          className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all -mt-5 sm:-mt-9 border-3 sm:border-4 border-white shrink-0 mx-1 cursor-pointer"
        >
          <Plus className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </button>

        <button
          onClick={() => handleReportsClick('ALL')}
          className={`flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'reports' ? 'text-[#059669] bg-emerald-50/90 shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          <span>Reports</span>
        </button>

        <button
          onClick={handleProfileClick}
          className={`flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-extrabold py-1 px-1 sm:px-6 rounded-xl sm:rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'profile' ? 'text-[#059669] bg-emerald-50/90 shadow-2xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          <span>Profile</span>
        </button>
      </div>

      {/* Document Viewer Modal */}
      {previewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-extrabold text-slate-900 text-base flex items-center gap-2 font-heading">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>{previewDocModal.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocModal(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {(() => {
              const fallbackUrl = previewDocModal.fallbackUrl;
              const isDirectData = previewDocModal.url.startsWith('data:') || previewDocModal.url.startsWith('blob:');
              const targetUrl = isDirectData ? previewDocModal.url : resolveDocumentUrl(previewDocModal.url);
              const isPdf = !isDirectData && isPdfDocument(previewDocModal.url);

              return (
                <>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-[70vh] min-h-[320px] flex items-center justify-center bg-slate-900 p-2">
                    {isDirectData ? (
                      <img
                        src={targetUrl}
                        alt={previewDocModal.title}
                        className="max-h-[65vh] w-full object-contain rounded-xl bg-white"
                      />
                    ) : isPdf ? (
                      <object
                        data={targetUrl}
                        type="application/pdf"
                        className="w-full h-[65vh] rounded-xl bg-white"
                      >
                        {fallbackUrl ? (
                          <img
                            src={fallbackUrl}
                            alt={previewDocModal.title}
                            className="max-h-[65vh] w-full object-contain rounded-xl bg-white"
                          />
                        ) : (
                          <div className="p-8 text-center text-white space-y-3">
                            <p className="text-sm font-semibold">PDF preview not supported by this browser.</p>
                            <button
                              type="button"
                              onClick={() => downloadDocumentFile(targetUrl, previewDocModal.fileName || 'document.pdf')}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                            >
                              Download PDF
                            </button>
                          </div>
                        )}
                      </object>
                    ) : (
                      <img
                        src={targetUrl}
                        alt={previewDocModal.title}
                        onError={(e) => {
                          if (fallbackUrl) {
                            (e.target as HTMLImageElement).src = fallbackUrl;
                          }
                        }}
                        className="max-h-[65vh] w-auto object-contain rounded-xl"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                      <span>Official Digital Verified Record • Just Paisa Financial Network</span>
                      {fallbackUrl && !isDirectData && (
                        <button
                          type="button"
                          onClick={() => setPreviewDocModal({ ...previewDocModal, url: fallbackUrl })}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer ml-1"
                        >
                          Switch to Verified Digital Certificate
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadDocumentFile(targetUrl, previewDocModal.fileName || previewDocModal.title.replace(/[^a-zA-Z0-9_-]/g, '_'))}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Document</span>
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
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Report Fraud Modal */}
      {reportingFraudVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-rose-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-extrabold text-rose-700 text-base flex items-center gap-2 font-heading">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Report Fraud Account to Admin
              </div>
              <button onClick={() => setReportingFraudVendor(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 font-medium">
                You are submitting a fraud report against <strong className="font-bold">{reportingFraudVendor.vendorName}</strong> ({reportingFraudVendor.shopName}). JustPaisa Admin will manually verify and flag this vendor as Fraud.
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Reason for Fraud Report:</label>
                <textarea
                  rows={3}
                  value={fraudReason}
                  onChange={(e) => setFraudReason(e.target.value)}
                  placeholder="E.g., Fraudulent PAN/Aadhaar documents, false shop address, non-payment history..."
                  className="w-full p-3 rounded-2xl border border-slate-300 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setReportingFraudVendor(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitFraudReportToAdmin}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Submit Fraud Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More Info & Non-Sensitive Shop Details Modal */}
      {moreInfoModalBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 overflow-hidden flex items-center justify-center font-extrabold text-blue-800 shrink-0 text-xl shadow-inner">
                  {moreInfoModalBiz.avatarUrl ? (
                    <img src={moreInfoModalBiz.avatarUrl} alt={moreInfoModalBiz.shopName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{moreInfoModalBiz.shopName?.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-lg font-heading">
                      {moreInfoModalBiz.shopName}
                    </h3>
                    {checkVendorIsFraud(moreInfoModalBiz) || !!moreInfoModalBiz.isFraud ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[11px] shadow-xs flex items-center gap-1 shrink-0 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Fraud Account
                      </span>
                    ) : (
                      <span className="badge-verified-green text-[10px] py-0.5 px-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Owner: <span className="text-slate-800 font-bold">{moreInfoModalBiz.vendorName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMoreInfoModalBiz(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fraud Warning Banner in Modal */}
            {(checkVendorIsFraud(moreInfoModalBiz) || !!moreInfoModalBiz.isFraud) && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 space-y-1 shadow-sm">
                <div className="font-extrabold flex items-center gap-1.5 text-rose-800 text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>🚨 CONFIRMED FRAUD ACCOUNT WARNING</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed font-medium">
                  This business / vendor account has been reported and confirmed as FRAUD by Super Admin. Exercise extreme caution and do not disburse funds without verified security.
                </p>
              </div>
            )}

            {/* Location & Radius Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-emerald-50/80 border border-blue-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{moreInfoModalBiz.place || 'Commercial Area'}, {moreInfoModalBiz.city}, {moreInfoModalBiz.state}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                  {moreInfoModalBiz.distanceKm} KM away
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                <strong className="text-slate-700">Shop Address: </strong>
                {moreInfoModalBiz.address || `${moreInfoModalBiz.place || 'Market Area'}, ${moreInfoModalBiz.city}`}
              </div>
              <div className="pt-1">
                <a
                  href={getGoogleMapsNavigationUrl(
                    moreInfoModalBiz.latitude || 17.3688,
                    moreInfoModalBiz.longitude || 78.5247,
                    `Shop: ${moreInfoModalBiz.shopName}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#003893] hover:underline"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open Directions on Google Maps</span>
                </a>
              </div>
            </div>

            {/* Non-Sensitive Business Highlights */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Profile Highlights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Business / Shop Name</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{moreInfoModalBiz.shopName}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Annual Income</span>
                  <span className="font-extrabold text-emerald-700 text-sm mt-0.5 block">{moreInfoModalBiz.annualTurnover || moreInfoModalBiz.annualIncome || 'Under 2 Lakhs'}</span>
                </div>
              </div>
            </div>

            {/* KYC Privacy Shield Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <Shield className="w-4 h-4 text-amber-700" />
                <span>JustPaisa KYC Privacy Shield Active</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Government documents (PAN, Aadhaar, Business Licenses) are secured and locked. Full 6 KYC document inspection unlocks automatically when this shop owner submits a loan application to your financer account.
              </p>
            </div>

            {/* Modal Actions: Call, WhatsApp, Close */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  if (!checkLenderSubscribed()) return;
                  if (moreInfoModalBiz.mobileNumber && moreInfoModalBiz.mobileNumber !== 'Not provided') {
                    window.location.href = `tel:${moreInfoModalBiz.mobileNumber}`;
                  } else {
                    alert('Contact phone number is currently not provided.');
                  }
                }}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call Shop Owner</span>
              </button>

              <button
                onClick={() => {
                  if (!checkLenderSubscribed()) return;
                  if (moreInfoModalBiz.mobileNumber && moreInfoModalBiz.mobileNumber !== 'Not provided') {
                    const cleanPhone = moreInfoModalBiz.mobileNumber.replace(/\D/g, '');
                    const msg = encodeURIComponent(`Hello ${moreInfoModalBiz.vendorName}, I saw your business "${moreInfoModalBiz.shopName}" on JustPaisa and would like to discuss business financing options.`);
                    window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
                  } else {
                    alert('WhatsApp contact number is currently not provided.');
                  }
                }}
                className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Financing Request Confirmation Modal */}
      {deleteConfirmLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 border border-rose-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="font-extrabold text-rose-700 text-base flex items-center gap-2 font-heading">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span>Delete Financing Request</span>
              </div>
              <button
                onClick={() => setDeleteConfirmLead(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 leading-relaxed font-medium">
                Are you sure you want to permanently delete the financing request from <strong className="font-bold">{deleteConfirmLead.vendorName}</strong> ({deleteConfirmLead.shopName})?
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                This will remove the applicant from your dashboard and reset the vendor's status so they can submit a new application if needed.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmLead(null)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLead}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refer & Earn Rewards Modal */}
      <ReferAndEarnModal
        isOpen={referModalOpen}
        onClose={() => setReferModalOpen(false)}
        userRole="LENDER"
      />

    </div>
  );
};
