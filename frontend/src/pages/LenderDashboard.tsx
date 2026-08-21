import React, { useState, useRef, useEffect } from 'react';
import { VendorVerificationRequest } from '../types';
import { BannerCarousel, BannerSlide } from '../components/BannerCarousel';
import {
  fetchVendorProfilesForLender,
  updateLenderProfileApi,
  getMyProfileApi,
  submitFraudReportApi,
  updateLeadStatusApi,
  fetchLenderLeadsApi,
} from '../services/api';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { getGoogleMapsNavigationUrl } from '../services/mapboxService';
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

const DEFAULT_VENDOR_REQUESTS: VendorVerificationRequest[] = [];

interface LenderDashboardProps {
  onOpenSubscription?: () => void;
  onLogout?: (roleTarget?: 'VENDOR' | 'LENDER') => void;
  activeTab?: 'home' | 'businesses' | 'reports' | 'profile';
  onTabChange?: (tab: 'home' | 'businesses' | 'reports' | 'profile') => void;
}

function resolveInitialLenderDetails() {
  try {
    const u = localStorage.getItem('sbni_user');
    const p = localStorage.getItem('sbni_lender_profile');
    const user = u ? JSON.parse(u) : null;
    const profile = p ? JSON.parse(p) : null;

    let officer = profile?.contactPersonName || user?.name || user?.fullName || '';
    if (!officer || officer.includes('@') || officer === 'Credit Officer' || officer === 'Business Money Financer') {
      const email = user?.email || profile?.email || '';
      if (email.toLowerCase().includes('gourav')) {
        officer = 'Gourav';
      } else if (email) {
        const handle = email.split('@')[0].replace(/[0-9_.-]/g, ' ').trim();
        officer = handle ? handle.split(' ').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Gourav';
      } else {
        officer = 'Gourav';
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
      phone: user?.phone || profile?.phone || '+91 98200 11223',
      email: user?.email || profile?.email || 'lender@justpaisa.com',
      city: profile?.city || 'Hyderabad',
      state: profile?.state || 'Telangana',
      regNo: profile?.registrationNumber || 'REG-FIN-1001',
      institutionType: 'Money Financer',
      minLoan: profile?.minLoanAmount ?? 5000,
      maxLoan: profile?.maxLoanAmount ?? 100000,
      minRate: profile?.minInterestRate || 9.5,
      lendingRadius: profile?.lendingRadiusKm || 50,
      successRate: profile?.successRate || '80% - 90%',
    };
  } catch (e) {
    return {
      name: 'Gourav Money Financer',
      contactPerson: 'Gourav',
      phone: '+91 98200 11223',
      email: 'lender@justpaisa.com',
      city: 'Hyderabad',
      state: 'Telangana',
      regNo: 'REG-FIN-1001',
      institutionType: 'Money Financer',
      minLoan: 5000,
      maxLoan: 100000,
      minRate: 9.5,
      lendingRadius: 50,
      successRate: '80% - 90%',
    };
  }
}

export const LenderDashboard: React.FC<LenderDashboardProps> = ({
  onOpenSubscription,
  onLogout,
  activeTab: controlledActiveTab,
  onTabChange,
}) => {
  const [selectedVendor, setSelectedVendor] = useState<VendorVerificationRequest | null>(null);
  const [requests, setRequests] = useState<VendorVerificationRequest[]>([]);
  const [actionFeedback, setActionFeedback] = useState('');
  const [internalActiveTab, setInternalActiveTab] = useState<'home' | 'businesses' | 'reports' | 'profile'>('home');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab = (tab: 'home' | 'businesses' | 'reports' | 'profile') => {
    setInternalActiveTab(tab);
    if (onTabChange) onTabChange(tab);
    if (tab === 'profile') setSelectedVendor(null);
  };
  const [businessFilterStatus, setBusinessFilterStatus] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ALL'>('PENDING');
  const [businessSearchQuery, setBusinessSearchQuery] = useState('');
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; url: string; type: 'image' | 'doc' } | null>(null);

  const [reportingFraudVendor, setReportingFraudVendor] = useState<VendorVerificationRequest | null>(null);
  const [fraudReason, setFraudReason] = useState('');

  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    return (
      localStorage.getItem('sbni_lender_subscribed') === 'true' ||
      localStorage.getItem('sbni_subscribed') === 'true' ||
      localStorage.getItem('sbni_vendor_subscribed') === 'true'
    );
  });

  const [currentUserObj, setCurrentUserObj] = useState(resolveInitialLenderDetails);
  const [lenderAvatarUrl, setLenderAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('sbni_lender_avatar') || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200';
  });

  const [nearbyBusinesses, setNearbyBusinesses] = useState<any[]>([]);
  const [nearbySearchQuery, setNearbySearchQuery] = useState('');
  const [reportsFilterStatus, setReportsFilterStatus] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FRAUD' | 'ALL'>('PENDING');
  const [reportsSearchQuery, setReportsSearchQuery] = useState('');

  const loadNearbyBusinessesList = async () => {
    try {
      const list = await fetchVendorProfilesForLender();
      if (Array.isArray(list)) {
        setNearbyBusinesses(list);
      }
    } catch (e) {
      console.error('Failed to load nearby businesses:', e);
    }
  };

  // Fetch live profile from server on mount
  useEffect(() => {
    async function loadFreshProfile() {
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
              officer = handle ? handle.split(' ').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Gourav';
            } else officer = 'Gourav';
          }

          let financer = lp?.institutionName || '';
          if (!financer || financer === 'Business Money Financer' || financer.includes('@')) {
            financer = `${officer} Money Financer`;
          } else if (!financer.toLowerCase().includes('money financer')) {
            financer = `${financer} Money Financer`;
          }

          if (lp?.avatarUrl || lp?.logoUrl) {
            setLenderAvatarUrl(lp.avatarUrl || lp.logoUrl);
            localStorage.setItem('sbni_lender_avatar', lp.avatarUrl || lp.logoUrl);
          }

          const freshData = {
            name: financer,
            contactPerson: officer,
            phone: u.phone || lp?.phone || '+91 98200 11223',
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
          localStorage.setItem('sbni_user', JSON.stringify({ ...u, name: officer, fullName: officer }));
          if (lp) {
            localStorage.setItem('sbni_lender_profile', JSON.stringify({ ...lp, institutionName: financer, contactPersonName: officer, successRate: lp?.successRate || '80% - 90%' }));
          }
        }
      } catch (err) {
        console.error('Failed to load fresh profile:', err);
      }
    }
    loadFreshProfile();
    loadNearbyBusinessesList();

    const handleGlobalSync = () => {
      loadFreshProfile();
      loadNearbyBusinessesList();
    };
    window.addEventListener('sbni_vendor_profile_updated', handleGlobalSync);
    window.addEventListener('storage', handleGlobalSync);
    return () => {
      window.removeEventListener('sbni_vendor_profile_updated', handleGlobalSync);
      window.removeEventListener('storage', handleGlobalSync);
    };
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setLenderAvatarUrl(dataUrl);
      localStorage.setItem('sbni_lender_avatar', dataUrl);

      // Persist to backend lender profile so all vendors immediately see this brand avatar
      try {
        await updateLenderProfileApi({
          avatarUrl: dataUrl,
          logoUrl: dataUrl,
          institutionName: currentUserObj.name,
          contactPersonName: currentUserObj.contactPerson,
          minLoanAmount: currentUserObj.minLoan,
          maxLoanAmount: currentUserObj.maxLoan,
          lendingRadiusKm: currentUserObj.lendingRadius,
          successRate: currentUserObj.successRate,
          city: currentUserObj.city,
          state: currentUserObj.state,
        } as any);
        window.dispatchEvent(new CustomEvent('sbni_lender_profile_updated'));
      } catch (err) {
        console.error('Failed to sync lender avatar to backend:', err);
      }
    };
    reader.readAsDataURL(file);
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

      // 1. Update local storage
      const uStr = localStorage.getItem('sbni_user') || '{}';
      const lpStr = localStorage.getItem('sbni_lender_profile') || '{}';
      const u = JSON.parse(uStr);
      const lp = JSON.parse(lpStr);

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
        registrationNumber: lenderEditForm.regNo,
        minLoanAmount: Number(lenderEditForm.minLoan),
        maxLoanAmount: Number(lenderEditForm.maxLoan),
        lendingRadiusKm: Number(lenderEditForm.lendingRadius),
        successRate: lenderEditForm.successRate || '80% - 90%',
        avatarUrl: lenderAvatarUrl || undefined,
        logoUrl: lenderAvatarUrl || undefined,
      };

      localStorage.setItem('sbni_user', JSON.stringify(mergedUser));
      localStorage.setItem('sbni_lender_profile', JSON.stringify(mergedLp));

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

  const [lenderLocation, setLenderLocation] = useState<{
    place: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    lendingRadiusKm: number;
  }>(() => {
    try {
      const p = localStorage.getItem('sbni_lender_profile');
      if (p) {
        const parsed = JSON.parse(p);
        return {
          place: parsed.place || 'Dilsukhnagar',
          city: parsed.city || 'Hyderabad',
          state: parsed.state || 'Telangana',
          country: parsed.country || 'India',
          latitude: parsed.latitude ? Number(parsed.latitude) : 17.3688,
          longitude: parsed.longitude ? Number(parsed.longitude) : 78.5247,
          lendingRadiusKm: parsed.lendingRadiusKm ? Number(parsed.lendingRadiusKm) : 50,
        };
      }
    } catch (e) {}
    return {
      place: 'Dilsukhnagar',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      latitude: 17.3688,
      longitude: 78.5247,
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
      place: loc.place,
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
      localStorage.setItem('sbni_lender_profile', JSON.stringify(merged));
    } catch (e) {}

    // Save to AWS Backend
    try {
      await updateLenderProfileApi(updated);
      setLocationSuccessMsg(`✅ Lending area updated to ${loc.place}, ${loc.city} (${updated.lendingRadiusKm} KM radius)`);
      setTimeout(() => setLocationSuccessMsg(null), 4000);
    } catch (e) {
      console.error('Failed to sync lender profile location to backend:', e);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadVendorRequests = async () => {
    // 1. Local requests submitted specifically to THIS lender
    let localReqs: VendorVerificationRequest[] = [];
    try {
      const dynamicStr = localStorage.getItem('sbni_vendor_requests');
      if (dynamicStr) {
        const parsed = JSON.parse(dynamicStr);
        if (Array.isArray(parsed)) {
          localReqs = parsed.filter((r) => {
            if (!r) return false;
            // Filter out dummy static IDs or demo names
            if (r.id === 'req-1' || r.id === 'req-2' || r.id === 'REQ-9842' || r.id === 'REQ-4410') return false;
            if (r.vendorName === 'Rajesh Sharma' || r.vendorName === 'Priya Patel') return false;

            // Must match THIS lender
            const lenderReg = (currentUserObj as any).regNo || '';
            const lenderId = (currentUserObj as any).id || '';
            if (r.lenderId && (r.lenderId === lenderReg || r.lenderId === lenderId)) return true;
            if (r.lenderName && currentUserObj.name) {
              const reqLender = r.lenderName.toLowerCase().replace(/money financer/g, '').trim();
              const currLender = currentUserObj.name.toLowerCase().replace(/money financer/g, '').trim();
              const officer = (currentUserObj.contactPerson || '').toLowerCase().trim();
              if (reqLender && currLender && (reqLender.includes(currLender) || currLender.includes(reqLender))) return true;
              if (officer && reqLender && (reqLender.includes(officer) || officer.includes(reqLender))) return true;
            }
            return false;
          });
        }
      }
    } catch (e) {}

    // 2. Real AWS Backend leads submitted to this lender
    let awsReqs: VendorVerificationRequest[] = [];
    try {
      const leadsList = await fetchLenderLeadsApi();
      if (Array.isArray(leadsList)) {
        awsReqs = leadsList.map((lead: any) => {
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
            shopType: snapshot.shopType || v.category || v.registrationType || 'Retail & Business',
            yearsInBusiness: snapshot.yearsInBusiness || v.yearsInBusiness || 'Established',
            requiredAmount: lead.amount ? `₹ ${lead.amount.toLocaleString('en-IN')}` : (snapshot.requiredAmount || '₹ 5,00,000'),
            monthlyIncome: snapshot.monthlyIncome || (v.annualTurnover ? `₹ ${v.annualTurnover}` : '₹ 50,000 - 1 Lakh'),
            isFraud: !!v.isFraud,
            avatarUrl: snapshot.avatarUrl || v.avatarUrl || null,
            liveSelfieUrl: snapshot.liveSelfieUrl || v.liveSelfieUrl || null,
            shopPhotoUrl: snapshot.shopPhotoUrl || v.shopPhotoUrl || null,
            panFileUrl: snapshot.panFileUrl || panDoc?.fileUrl || v.panFileUrl || null,
            aadhaarFileUrl: snapshot.aadhaarFileUrl || aadhaarDoc?.fileUrl || v.aadhaarFileUrl || null,
            shopLicensePdf: snapshot.shopLicensePdf || licenseDoc?.fileUrl || null,
            gstCertificatePdf: snapshot.gstCertificatePdf || gstDoc?.fileUrl || null,
            shopImages: snapshot.shopImages || (Array.isArray(v.shopImages) ? v.shopImages : []),
            lenderId: lead.lenderId,
          };
        });
      }
    } catch (e) {
      console.error('loadVendorRequests leads API error:', e);
    }

    const deletedVendorIds = (() => {
      try {
        return JSON.parse(localStorage.getItem('sbni_deleted_vendors') || '[]');
      } catch (e) {
        return [];
      }
    })();

    const combined = [...localReqs, ...awsReqs];
    const deduplicated = combined.filter(
      (item, idx, arr) =>
        idx === arr.findIndex((t) => t.id === item.id || (t.vendorName === item.vendorName && t.shopName === item.shopName))
    );

    const activeReqs = deduplicated.filter((v) => {
      if (!v) return false;
      const isDeleted =
        deletedVendorIds.includes(v.id) ||
        deletedVendorIds.includes(v.emailId) ||
        deletedVendorIds.includes(v.vendorName) ||
        v.id === 'req-1' ||
        v.id === 'req-2' ||
        v.vendorName === 'Rajesh Sharma' ||
        v.vendorName === 'Priya Patel';
      return !isDeleted;
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
      const data = await fetchVendorProfilesForLender();
      let mapped: any[] = [];
      if (Array.isArray(data) && data.length > 0) {
        mapped = data.map((vp: any) => {
          const u = vp.user || {};
          const kycDocs = u.kycDocuments || [];
          const panDoc = kycDocs.find((d: any) => d.docType === 'PAN');
          const aadhaarDoc = kycDocs.find((d: any) => d.docType === 'AADHAAR');
          const licenseDoc = kycDocs.find((d: any) => d.docType === 'BUSINESS_PROOF');
          const gstDoc = kycDocs.find((d: any) => d.docType === 'GST_CERTIFICATE');

          const vLat = vp.latitude ? Number(vp.latitude) : 17.3688;
          const vLng = vp.longitude ? Number(vp.longitude) : 78.5247;
          const distKm = calculateDistanceKm(lenderLocation.latitude, lenderLocation.longitude, vLat, vLng);

          return {
            id: vp.id || vp.userId,
            vendorName: vp.ownerName || u.name || 'Local Shop Owner',
            shopName: vp.businessName || 'Local Enterprise',
            shopAddress: vp.address || `${vp.place || 'Dilsukhnagar'}, ${vp.city || 'Hyderabad'}`,
            city: vp.city || 'Hyderabad',
            state: vp.state || 'Telangana',
            place: vp.place || 'Dilsukhnagar',
            category: vp.category || 'Retail Shop Business',
            annualTurnover: vp.annualTurnover || '10-50 Lakhs',
            monthlyIncome: vp.monthlyIncome || '₹ 50,000 / month',
            mobileNumber: u.phone || vp.phone || '+91 98765 43210',
            emailId: u.email || vp.email || 'vendor@example.com',
            dateOfBirth: vp.dateOfBirth || 'Not specified',
            panNumber: vp.panNumber || panDoc?.documentNumber || 'ABCDE1234F',
            aadhaarNumber: vp.aadhaarNumber || aadhaarDoc?.documentNumber || 'XXXX-XXXX-9012',
            gstNumber: vp.gstNumber || gstDoc?.documentNumber || null,
            isFraud: !!vp.isFraud,
            avatarUrl: vp.avatarUrl || null,
            liveSelfieUrl: vp.avatarUrl || null,
            panFileUrl: panDoc?.fileUrl || null,
            aadhaarFileUrl: aadhaarDoc?.fileUrl || null,
            shopLicensePdf: licenseDoc?.fileUrl || null,
            gstCertificatePdf: gstDoc?.fileUrl || null,
            shopImages: [],
            distanceKm: distKm,
            isWithinRadius: distKm <= (lenderLocation.lendingRadiusKm || 50),
          };
        });
      }

      // Default high quality nearby local shops if database vendor table has only test records
      if (mapped.length === 0) {
        mapped = [
          {
            id: 'biz-101',
            vendorName: 'Gourav Boga',
            shopName: 'Gourav Electronics & Mobile Store',
            shopAddress: 'Shop #12, Chaitanya Puri Main Road, Dilsukhnagar, Hyderabad, Telangana - 500060',
            city: 'Hyderabad',
            state: 'Telangana',
            place: 'Dilsukhnagar',
            category: 'Retail Shop Business',
            annualTurnover: '10-50 Lakhs',
            monthlyIncome: '₹ 85,000 / month',
            mobileNumber: '7337401590',
            emailId: 'bogagourav69@gmail.com',
            dateOfBirth: '1995-06-15',
            panNumber: 'ABCDE1234F',
            aadhaarNumber: 'XXXX-XXXX-9012',
            gstNumber: '36AAAPL1234C1Z5',
            isFraud: false,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
            liveSelfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
            panFileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            aadhaarFileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            shopLicensePdf: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            gstCertificatePdf: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            shopImages: [],
            distanceKm: 0.8,
            isWithinRadius: true,
          },
          {
            id: 'biz-102',
            vendorName: 'Srinivas Rao',
            shopName: 'Sri Lakshmi Textiles & Sarees',
            shopAddress: 'Plot 45, Kothapet Main Road, Hyderabad - 500035',
            city: 'Hyderabad',
            state: 'Telangana',
            place: 'Kothapet',
            category: 'Textiles & Garments',
            annualTurnover: '50 Lakhs - 1 Crore',
            monthlyIncome: '₹ 1,20,000 / month',
            mobileNumber: '+91 98480 22334',
            emailId: 'srilakshmi.textiles@gmail.com',
            dateOfBirth: '1988-11-20',
            panNumber: 'FGHIJ5678K',
            aadhaarNumber: 'XXXX-XXXX-4512',
            gstNumber: '36BBBPK5678D1Z8',
            isFraud: false,
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
            liveSelfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
            panFileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            aadhaarFileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            shopLicensePdf: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            gstCertificatePdf: null,
            shopImages: [],
            distanceKm: 2.1,
            isWithinRadius: true,
          },
          {
            id: 'biz-103',
            vendorName: 'Venkatesh Murthy',
            shopName: 'Sai Balaji Supermarket & Provisions',
            shopAddress: 'Road No 3, LB Nagar, Hyderabad - 500074',
            city: 'Hyderabad',
            state: 'Telangana',
            place: 'LB Nagar',
            category: 'Food & Grocery',
            annualTurnover: '50 Lakhs - 1 Crore',
            monthlyIncome: '₹ 95,000 / month',
            mobileNumber: '+91 97011 55667',
            emailId: 'saibalaji.mart@gmail.com',
            dateOfBirth: '1990-04-10',
            panNumber: 'KLMNO9012P',
            aadhaarNumber: 'XXXX-XXXX-7823',
            gstNumber: '36CCCPM9012E1Z2',
            isFraud: false,
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
            liveSelfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
            panFileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            aadhaarFileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            shopLicensePdf: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            gstCertificatePdf: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=600',
            shopImages: [],
            distanceKm: 3.8,
            isWithinRadius: true,
          }
        ];
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
      setIsSubscribed(
        localStorage.getItem('sbni_lender_subscribed') === 'true' ||
        localStorage.getItem('sbni_subscribed') === 'true' ||
        localStorage.getItem('sbni_vendor_subscribed') === 'true'
      );
    };

    window.addEventListener('sbni_request_submitted', handleSync);
    window.addEventListener('sbni_subscription_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('sbni_request_submitted', handleSync);
      window.removeEventListener('sbni_subscription_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [lenderLocation]);

  const checkVendorIsFraud = (vendor: VendorVerificationRequest | null | undefined): boolean => {
    if (!vendor) return false;
    if (vendor.isFraud) return true;
    try {
      const storedFraud = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');
      if (storedFraud[vendor.id] || (vendor.emailId && storedFraud[vendor.emailId])) {
        return true;
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

  const handleReportsClick = (filter: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FRAUD' | 'ALL' = 'PENDING') => {
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
          localStorage.setItem('sbni_vendor_requests', JSON.stringify(updatedList));
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

  const submitFraudReportToAdmin = async () => {
    if (!reportingFraudVendor) return;
    try {
      const storedFraud = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');
      storedFraud[reportingFraudVendor.id] = true;
      if (reportingFraudVendor.emailId) storedFraud[reportingFraudVendor.emailId] = true;
      localStorage.setItem('sbni_fraud_vendors', JSON.stringify(storedFraud));

      const lenderReports = JSON.parse(localStorage.getItem('sbni_lender_reported_frauds') || '[]');
      const newReportEntry = {
        id: 'fraud-' + Date.now(),
        vendorId: reportingFraudVendor.id,
        vendorName: reportingFraudVendor.vendorName,
        shopName: reportingFraudVendor.shopName,
        reportedBy: currentUserObj.name,
        reason: fraudReason || 'Suspicious financial activity or fraudulent documents',
        status: 'PENDING',
        date: new Date().toISOString(),
      };
      lenderReports.push(newReportEntry);
      localStorage.setItem('sbni_lender_reported_frauds', JSON.stringify(lenderReports));

      // Asynchronously submit to AWS backend /api/v1/admin/fraud-reports
      submitFraudReportApi({
        vendorId: reportingFraudVendor.id,
        lenderId: currentUserObj.regNo || undefined,
        reportedBy: currentUserObj.name,
        reason: fraudReason || 'Suspicious financial activity or fraudulent documents',
      }).catch((err) => console.error('Failed to submit fraud report to backend:', err));

      window.dispatchEvent(new Event('sbni_fraud_reported'));
    } catch (e) {
      console.error('Error submitting fraud report:', e);
    }

    setRequests(
      requests.map((r) => (r.id === reportingFraudVendor.id ? { ...r, isFraud: true } : r))
    );

    setActionFeedback(`🚨 Fraud report submitted for ${reportingFraudVendor.vendorName}. JustPaisa Admin will review manually.`);
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                
                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Total Shop Businesses</div>
                    <div className="text-2xl font-extrabold text-slate-900 font-heading mt-0.5">{requests.length}</div>
                    <button
                      onClick={() => handleReportsClick('ALL')}
                      className="text-xs text-blue-600 font-bold mt-1 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      View All <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Accepted Requests</div>
                    <div className="text-2xl font-extrabold text-emerald-700 font-heading mt-0.5">{acceptedCount}</div>
                    <button
                      onClick={() => handleReportsClick('ACCEPTED')}
                      className="text-xs text-emerald-600 font-bold mt-1 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      View Reports <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="card-white p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Pending Requests</div>
                    <div className="text-2xl font-extrabold text-amber-600 font-heading mt-0.5">{pendingCount}</div>
                    <button
                      onClick={() => handleReportsClick('PENDING')}
                      className="text-xs text-amber-600 font-bold mt-1 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      View Reports <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <Clock className="w-5 h-5" />
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
                  <button onClick={() => handleReportsClick('ALL')} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">
                    View All
                  </button>
                </div>

                {requests.length === 0 ? (
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
                  <h3 className="text-lg font-extrabold text-slate-900 font-heading">No Businesses Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
                    No shop businesses matched your search query. Try searching by city or category.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNearbyBusinesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="card-white p-5 space-y-4 hover:shadow-xl transition-all border border-slate-200 rounded-3xl flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Header Box */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-extrabold text-slate-700 shrink-0 shadow-xs">
                            {biz.avatarUrl ? (
                              <img src={biz.avatarUrl} alt={biz.shopName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{biz.shopName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-base font-heading group-hover:text-emerald-700 transition-colors truncate">
                              {biz.shopName}
                            </h4>
                            <div className="text-xs text-slate-500 font-medium truncate">Owner: {biz.vendorName}</div>
                          </div>
                        </div>

                        <span className="badge-verified-green shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      </div>

                      {/* Distance & Location Pill */}
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 text-xs text-slate-700 font-medium flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{biz.distanceKm} KM away • {biz.place}, {biz.city}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                          Inside Radius
                        </span>
                      </div>

                      {/* Business Summary Info */}
                      <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2.5">
                        <div className="flex justify-between text-slate-600">
                          <span>Category:</span>
                          <span className="font-bold text-slate-800">{biz.category}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Monthly Income:</span>
                          <span className="font-bold text-emerald-700">{biz.monthlyIncome || '₹ 50,000 / month'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Annual Turnover:</span>
                          <span className="font-bold text-slate-800">{biz.annualTurnover || '10-50 Lakhs'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inspect KYC Action Button */}
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleVendorSelect(biz)}
                        className="w-full py-2.5 rounded-xl bg-[#003893] hover:bg-[#002366] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-white" />
                        <span>Inspect All 6 KYC Files & Connect</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REPORTS TAB - FULL REQUESTS TRACKING & FRAUD AUDIT */}
        {!selectedVendor && activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Financing Requests & Reports</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Manage customer financing requests, approve or reject applications, and report fraudulent accounts
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl w-fit flex-wrap gap-1">
                <button
                  onClick={() => setReportsFilterStatus('PENDING')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
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
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
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
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
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
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    reportsFilterStatus === 'FRAUD'
                      ? 'bg-rose-700 text-white shadow-md'
                      : 'text-rose-700 hover:text-rose-900 hover:bg-rose-100/60'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Fraud Alert Reports ({fraudCount})</span>
                </button>

                <button
                  onClick={() => setReportsFilterStatus('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reportsFilterStatus === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All ({requests.length})
                </button>
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

                          <div className="shrink-0 flex flex-col items-end gap-1">
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
                            <span>Monthly Income:</span>
                            <span className="font-bold text-emerald-700">{vendor.monthlyIncome || '₹ 50,000'}</span>
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
        )}

        {/* VIEW: VENDOR VERIFICATION REVIEW PAGE */}
        {selectedVendor && (
          <div className="space-y-6">
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
                  <h4 className="font-bold text-slate-900 text-base font-heading">Identity Documents</h4>
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm hover:border-slate-300 transition-colors">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          PAN Card
                        </div>
                        <div className="text-slate-500 font-mono mt-0.5">{selectedVendor.panNumber || 'Pending Verification'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedVendor.panNumber ? (
                          <span className="badge-verified-green">Verified</span>
                        ) : (
                          <span className="badge-pending-amber">Pending Upload</span>
                        )}
                        {selectedVendor.panFileUrl && (
                          <button
                            onClick={() => setPreviewDocModal({ title: `PAN Card (${selectedVendor.panNumber || ''})`, url: selectedVendor.panFileUrl!, type: 'doc' })}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm hover:border-slate-300 transition-colors">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Aadhaar Card
                        </div>
                        <div className="text-slate-500 font-mono mt-0.5">{selectedVendor.aadhaarNumber || 'Pending Verification'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedVendor.aadhaarNumber ? (
                          <span className="badge-verified-green">Verified</span>
                        ) : (
                          <span className="badge-pending-amber">Pending Upload</span>
                        )}
                        {selectedVendor.aadhaarFileUrl && (
                          <button
                            onClick={() => setPreviewDocModal({ title: `Aadhaar Card (${selectedVendor.aadhaarNumber || ''})`, url: selectedVendor.aadhaarFileUrl!, type: 'doc' })}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                        )}
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
                  <h4 className="font-bold text-slate-900 text-base font-heading">Shop Photos & Premises</h4>
                  {(() => {
                    const photos: { title: string; url: string }[] = [];
                    if (selectedVendor.shopPhotoUrl) photos.push({ title: 'Shop / Startup Business Photo', url: selectedVendor.shopPhotoUrl });
                    if (selectedVendor.liveSelfieUrl) photos.push({ title: 'Live Photo in Front of Shop / Business', url: selectedVendor.liveSelfieUrl });
                    if (selectedVendor.avatarUrl && !photos.some(p => p.url === selectedVendor.avatarUrl)) photos.push({ title: 'Passport / Profile Photo', url: selectedVendor.avatarUrl });
                    if (selectedVendor.shopImages && selectedVendor.shopImages.length > 0) {
                      selectedVendor.shopImages.forEach((img, i) => photos.push({ title: `Shop Photo ${i + 1}`, url: img }));
                    }
                    if (selectedVendor.shopPhotos && Array.isArray(selectedVendor.shopPhotos) && selectedVendor.shopPhotos.length > 0) {
                      selectedVendor.shopPhotos.forEach((img: string, i: number) => {
                        if (img && !photos.some(p => p.url === img)) photos.push({ title: `Storefront / Premises ${i + 1}`, url: img });
                      });
                    }

                    if (photos.length > 0) {
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {photos.map((p, i) => (
                            <div
                              key={i}
                              className="relative group rounded-2xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer bg-slate-100"
                              onClick={() => setPreviewDocModal({ title: `${p.title} (${selectedVendor.vendorName})`, url: p.url, type: 'image' })}
                            >
                              <img
                                src={p.url}
                                alt={p.title}
                                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 p-2 text-center">
                                <Eye className="w-5 h-5 text-white" />
                                <span>{p.title}</span>
                              </div>
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-2 text-[10px] text-white font-semibold truncate">
                                {p.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1 text-slate-500 text-xs">
                        <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                        <div className="font-bold text-slate-700">No Premises Photos Uploaded</div>
                        <p className="text-slate-400 text-[11px]">Vendor has not attached shop photos to this verification request yet.</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Additional Documents */}
                <div className="card-white p-5 space-y-4">
                  <h4 className="font-bold text-slate-900 text-base font-heading">Additional Business Documents</h4>
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">Business License / Shop & Establishment</div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                            {selectedVendor.shopLicensePdf ? 'Uploaded Document' : 'Optional / Not Uploaded'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedVendor.shopLicensePdf ? (
                          <>
                            <span className="badge-verified-green text-[10px]">Uploaded</span>
                            <button
                              onClick={() => setPreviewDocModal({
                                title: `Business License (${selectedVendor.shopName})`,
                                url: selectedVendor.shopLicensePdf!,
                                type: 'doc',
                              })}
                              className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                          </>
                        ) : (
                          <span className="badge-pending-amber text-[10px]">Not Uploaded</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs md:text-sm hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">GST Registration Certificate</div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                            {selectedVendor.gstCertificatePdf ? 'Uploaded Document' : 'Optional / Not Uploaded'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedVendor.gstCertificatePdf ? (
                          <>
                            <span className="badge-verified-green text-[10px]">Uploaded</span>
                            <button
                              onClick={() => setPreviewDocModal({
                                title: `GST Certificate (${selectedVendor.shopName})`,
                                url: selectedVendor.gstCertificatePdf!,
                                type: 'doc',
                              })}
                              className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                          </>
                        ) : (
                          <span className="badge-pending-amber text-[10px]">Not Uploaded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => handleReject(selectedVendor.id)}
                    className="py-3 px-4 rounded-xl border border-rose-500 text-rose-600 font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Request</span>
                  </button>

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
                      onClick={() => {
                        setActionFeedback('ℹ️ Request for additional documents sent to vendor.');
                        setTimeout(() => setActionFeedback(''), 2500);
                      }}
                      className="py-3 px-4 rounded-xl border border-amber-500 text-amber-600 font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Request Info</span>
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
                    className={`py-3 px-4 text-xs md:text-sm justify-center font-bold flex items-center gap-2 rounded-xl transition-all cursor-pointer ${
                      checkVendorIsFraud(selectedVendor)
                        ? 'bg-rose-900/40 text-rose-300 border border-rose-800 cursor-not-allowed opacity-60'
                        : 'btn-sbni-green'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{checkVendorIsFraud(selectedVendor) ? 'Disabled (Fraud Account)' : (selectedVendor.status === 'Accepted' || selectedVendor.status === 'Verified') ? '✓ Request Accepted' : 'Accept & Unlock Navigation'}</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* VIEW 3: LENDER PROFILE VIEW */}
        {!selectedVendor && activeTab === 'profile' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Header Title & Edit Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading">Business Money Financer Profile & Security</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Manage financer credentials, credit officer contact details, and session status
                </p>
              </div>

              {!isEditingLenderProfile ? (
                <button
                  type="button"
                  onClick={startEditingLender}
                  className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#003893] border border-blue-200 font-extrabold text-xs flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer w-fit"
                >
                  <Edit3 className="w-4 h-4 text-[#003893]" />
                  <span>Edit Financer Profile</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingLenderProfile(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLenderProfile}
                    disabled={isSavingLenderProfile}
                    className="px-5 py-2.5 rounded-xl bg-[#003893] hover:bg-[#002366] text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {isSavingLenderProfile ? (
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
            {lenderSaveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{lenderSaveSuccess}</span>
              </div>
            )}

            <div className="card-white p-6 sm:p-8 space-y-6 shadow-md border border-slate-200/90 rounded-3xl">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-100">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-lg border-4 border-white ring-2 ring-emerald-100 bg-emerald-50 flex items-center justify-center">
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
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="lender-profile-avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div className="text-center sm:text-left space-y-1 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                    <h3 className="text-2xl font-extrabold text-slate-900 font-heading">
                      {isEditingLenderProfile ? lenderEditForm.institutionName || currentUserObj.name : currentUserObj.name}
                    </h3>
                    <span className="badge-verified-green w-fit mx-auto sm:mx-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Business Financer
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 flex items-center justify-center sm:justify-start gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Money Financer</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Credit Officer: {isEditingLenderProfile ? lenderEditForm.contactPerson || currentUserObj.contactPerson : currentUserObj.contactPerson}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium pt-1">
                    Registration No: <span className="font-mono text-slate-700 font-bold">{isEditingLenderProfile ? lenderEditForm.regNo || currentUserObj.regNo : currentUserObj.regNo}</span>
                  </p>

                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                    <label
                      htmlFor="lender-profile-avatar-input"
                      className="text-xs font-bold text-[#007a33] hover:text-emerald-900 cursor-pointer flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 transition-colors"
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
                  <h4 className="font-extrabold text-slate-900 text-sm font-heading">Credit Officer Account Information</h4>
                  {isEditingLenderProfile && (
                    <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      ✏️ Edit Mode Active
                    </span>
                  )}
                </div>

                {!isEditingLenderProfile ? (
                  /* View Mode */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Chief Credit Officer</span>
                      <div className="font-extrabold text-slate-900 text-sm">{currentUserObj.contactPerson}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Mobile / WhatsApp</span>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{currentUserObj.phone}</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Email Address</span>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>{currentUserObj.email}</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">Office Location</span>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
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
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between gap-3 shadow-lg">
                  <div className="text-xs">
                    <span className="font-bold text-white block">Ready to apply financer profile changes?</span>
                    <span className="text-[11px] text-blue-200">Your profile, avatar photo, and ticket limits will instantly update across the platform.</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditingLenderProfile(false)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLenderProfile}
                      disabled={isSavingLenderProfile}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
          onClick={() => handleReportsClick('PENDING')}
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
                {previewDocModal.title}
              </div>
              <button onClick={() => setPreviewDocModal(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-[70vh] flex items-center justify-center bg-slate-900 p-2">
              <img src={previewDocModal.url} alt={previewDocModal.title} className="max-h-[65vh] w-auto object-contain rounded-xl" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setPreviewDocModal(null)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer">
                Close Preview
              </button>
            </div>
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

    </div>
  );
};
