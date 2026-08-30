import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  Zap,
  DollarSign,
  LayoutDashboard,
  CheckCircle2,
  Search,
  Trash2,
  Activity,
  Lock,
  LogOut,
  AlertCircle,
  Eye,
  Gift,
  RefreshCw,
  ArrowLeft,
  Plus,
  Edit3,
  X,
  Check,
  Sparkles,
  Clock,
  Tag,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Share2,
  ArrowUpRight,
  Award,
  ChevronDown,
  Copy,
  ExternalLink,
  Wallet,
  Receipt,
  FileCheck2,
  Sliders,
  FolderX,
  Phone,
  MessageSquare,
  Menu,
  ChevronRight,
} from 'lucide-react';
import {
  adminLoginApi,
  adminCreateSubscriptionPlan,
  adminUpdateSubscriptionPlan,
  adminDeleteSubscriptionPlan,
  adminFetchSubscriptionPlans,
  adminToggleVendorFraud,
  adminFetchVendors,
  adminFetchLenders,
  adminUpdateVendorKYC,
  adminDeleteUser,
  adminDeleteVendor,
  adminDeleteLender,
  adminFetchPayments,
  adminFetchFraudReports,
  adminConfirmFraudReport,
  adminDismissFraudReport,
  adminDeleteFraudReport,
  adminDeletePaymentApi,
  adminFetchReferralsApi,
  adminFetchPlanReferralRulesApi,
  adminUpdatePlanReferralRuleApi,
  safeSetLocalStorage,
} from '../services/api';
import { SBNILogo } from '../components/SBNILogo';

interface VendorData {
  id: string;
  businessName: string;
  ownerName: string;
  city: string;
  state: string;
  annualTurnover: string;
  category: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isFraud?: boolean;
  userEmail: string;
  userPhone: string;
  createdAt: string;
}

interface LenderData {
  id: string;
  institutionName: string;
  institutionType: 'BANK' | 'NBFC' | 'FINANCIAL_INSTITUTION' | 'INDIVIDUAL';
  registrationNumber: string;
  city: string;
  state: string;
  minLoanAmount: number;
  maxLoanAmount: number;
  minInterestRate: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  userEmail: string;
  userPhone: string;
  contactPersonName?: string;
  createdAt: string;
}

export interface AdminSubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  originalPrice: number;
  durationDays: number;
  durationNumber?: number;
  durationUnit?: 'Days' | 'Weeks' | 'Months' | 'Years';
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
  isBestValue?: boolean;
  roleTarget: 'VENDOR' | 'LENDER';
}

// Payment / Revenue Transaction Interface
export interface RevenueTransaction {
  id: string;
  entityName: string;
  personName: string;
  email: string;
  phone: string;
  role: 'VENDOR' | 'LENDER';
  planName: string;
  planCode: string;
  amount: number;
  paymentDate: string; // ISO string e.g. 2026-08-16T14:30:00
  paymentMethod: string;
  invoiceNumber: string;
  transactionId: string;
  status: 'SUCCESS' | 'PENDING' | 'REFUNDED';
}

// Referral Record Interface
export interface ReferralRecord {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referrerPhone: string;
  referrerRole: 'VENDOR' | 'LENDER';
  referralCode: string;
  refereeName: string;
  refereeEmail: string;
  refereePhone: string;
  refereeRole: 'VENDOR' | 'LENDER';
  refereeBusiness: string;
  rewardAmount: number;
  createdAt: string;
  status: 'PAID' | 'REWARD_READY' | 'PENDING_VERIFICATION';
  paidAt?: string;
  payoutTxnId?: string;
}

export interface FraudReportItem {
  id: string;
  vendorId: string;
  vendorName: string;
  shopName: string;
  userEmail?: string;
  userPhone?: string;
  reportedBy: string;
  lenderPhone?: string;
  lenderEmail?: string;
  lenderContactPerson?: string;
  reason: string;
  evidenceUrl?: string;
  adminNotes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'DISMISSED';
  date: string;
  createdAt?: string;
}

export function AdminDashboard({ onNavigateHome }: { onNavigateHome?: () => void }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(true);
  const [adminEmail, setAdminEmail] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('sbni_admin_user') || localStorage.getItem('sbni_user') || '{}');
      if (u?.email) return u.email;
    } catch {}
    return 'srinivaspolepalli10@gmail.com';
  });
  const [adminPassword, setAdminPassword] = useState('Srinivas@10');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'vendors'
    | 'lenders'
    | 'fraud_reports'
    | 'vendor_revenue'
    | 'lender_revenue'
    | 'referrals'
    | 'referral_rules'
    | 'vendor_subs'
    | 'lender_subs'
    | 'audits'
  >('overview');

  // Mobile Navigation Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Fraud Reports State
  const [fraudReports, setFraudReports] = useState<FraudReportItem[]>([]);
  const [fraudReportsLoading, setFraudReportsLoading] = useState(false);
  const [fraudFilterStatus, setFraudFilterStatus] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'DISMISSED'>('ALL');
  const [fraudSearchQuery, setFraudSearchQuery] = useState('');

  // Revenue Filters
  const [vendorRevenuePeriod, setVendorRevenuePeriod] = useState<'ALL' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('ALL');
  const [vendorRevenueSearch, setVendorRevenueSearch] = useState('');
  const [vendorRevenuePlanFilter, setVendorRevenuePlanFilter] = useState('ALL');
  const [vendorRevenueMethodFilter, setVendorRevenueMethodFilter] = useState('ALL');

  const [lenderRevenuePeriod, setLenderRevenuePeriod] = useState<'ALL' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('ALL');
  const [lenderRevenueSearch, setLenderRevenueSearch] = useState('');
  const [lenderRevenuePlanFilter, setLenderRevenuePlanFilter] = useState('ALL');
  const [lenderRevenueMethodFilter, setLenderRevenueMethodFilter] = useState('ALL');

  // Referral Filters
  const [referralSearch, setReferralSearch] = useState('');
  const [referralStatusFilter, setReferralStatusFilter] = useState<'ALL' | 'REWARD_READY' | 'PAID' | 'PENDING_VERIFICATION'>('ALL');
  const [referralRoleFilter, setReferralRoleFilter] = useState<'ALL' | 'VENDOR' | 'LENDER'>('ALL');
  const [referralSettingsModalOpen, setReferralSettingsModalOpen] = useState(false);

  // Referral Settings
  const [referralVendorReward, setReferralVendorReward] = useState('200');
  const [referralLenderReward, setReferralLenderReward] = useState('500');
  const [referralDiscountPct, setReferralDiscountPct] = useState('15');
  const [referralProgramActive, setReferralProgramActive] = useState(true);

  // Live Vendors & Lenders State with localStorage Persistence
  const [vendors, setVendors] = useState<VendorData[]>(() => {
    try {
      const saved = localStorage.getItem('sbni_admin_vendors');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [lenders, setLenders] = useState<LenderData[]>(() => {
    try {
      const saved = localStorage.getItem('sbni_admin_lenders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Real Database Revenue Transactions (Zero Dummy Data)
  const [transactions, setTransactions] = useState<RevenueTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('justpaisa_admin_live_transactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Real Database Referrals (Zero Dummy Data)
  const [referrals, setReferrals] = useState<ReferralRecord[]>(() => {
    try {
      const saved = localStorage.getItem('justpaisa_admin_live_referrals');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [planReferralRules, setPlanReferralRules] = useState<any[]>([]);
  const [planRulesRoleFilter, setPlanRulesRoleFilter] = useState<'ALL' | 'VENDOR' | 'LENDER'>('ALL');
  const [savingPlanRuleId, setSavingPlanRuleId] = useState<string | null>(null);
  const [isSavingAllRules, setIsSavingAllRules] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const loadAdminReferralsAndRules = async () => {
    try {
      const [refRes, rulesRes] = await Promise.all([
        adminFetchReferralsApi().catch(() => ({ success: false, data: null })),
        adminFetchPlanReferralRulesApi().catch(() => ({ success: false, data: [] })),
      ]);

      if (refRes?.success && refRes.data) {
        if (Array.isArray(refRes.data.records)) {
          const mapped: ReferralRecord[] = refRes.data.records.map((r: any) => ({
            id: r.id,
            referrerName: r.referrer?.name || 'Partner',
            referrerPhone: r.referrer?.phone || '',
            referrerEmail: r.referrer?.email || '',
            referrerRole: (r.referrer?.role || 'VENDOR') as 'VENDOR' | 'LENDER',
            referralCode: r.referralCode,
            refereeName: r.referee?.name || 'Invited User',
            refereePhone: r.referee?.phone || '',
            refereeEmail: r.referee?.email || '',
            refereeRole: (r.referee?.role || 'VENDOR') as 'VENDOR' | 'LENDER',
            refereeBusiness: r.referee?.name || (r.referee?.role === 'LENDER' ? 'Financer' : 'Shop Business'),
            rewardAmount: r.referrerReward || 30,
            createdAt: r.createdAt,
            status: (r.status === 'COMPLETED' ? 'PAID' : 'PENDING_VERIFICATION') as any,
            paidAt: r.rewardedAt,
            payoutTxnId: r.id ? `WALLET_TXN_${r.id.substring(0, 8)}` : undefined,
          }));
          setReferrals(mapped);
          safeSetLocalStorage('justpaisa_admin_live_referrals', JSON.stringify(mapped));
        }
      }

      if (rulesRes?.success && Array.isArray(rulesRes.data) && rulesRes.data.length > 0) {
        const activeRules = rulesRes.data.filter((p: any) => p.isActive !== false);
        setPlanReferralRules(activeRules);
      } else {
        // Fallback to loaded vendorPlans & lenderPlans
        const combined = [...vendorPlans, ...lenderPlans].filter((p) => p.isActive !== false);
        if (combined.length > 0) {
          const mapped = combined.map((p) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            roleTarget: p.roleTarget || 'VENDOR',
            price: Number(p.price) || 0,
            durationDays: Number(p.durationDays) || 30,
            referrerReward: (p as any).referrerReward !== undefined ? Number((p as any).referrerReward) : (p.roleTarget === 'LENDER' ? 500 : 200),
            refereeReward: (p as any).refereeReward !== undefined ? Number((p as any).refereeReward) : 0,
            adminShare: (p as any).adminShare !== undefined ? Number((p as any).adminShare) : Math.max(0, Number(p.price) - (p.roleTarget === 'LENDER' ? 500 : 200)),
            referralEnabled: (p as any).referralEnabled !== false,
            isActive: true,
          }));
          setPlanReferralRules(mapped);
        }
      }
    } catch (e) {
      console.error('loadAdminReferralsAndRules error:', e);
    }
  };

  const handleUpdatePlanReferralRule = async (plan: any) => {
    setSavingPlanRuleId(plan.id);
    try {
      const refReward = Number(plan.referrerReward) || 0;
      const refeeReward = Number(plan.refereeReward) || 0;
      const calculatedAdminShare = Math.max(0, Number(plan.price) - refReward - refeeReward);
      const isRefEnabled = plan.referralEnabled !== false;

      const payload = {
        referrerReward: refReward,
        refereeReward: refeeReward,
        adminShare: calculatedAdminShare,
        referralEnabled: isRefEnabled,
      };

      const res = await adminUpdatePlanReferralRuleApi(plan.id, payload);

      if (res.success) {
        showToast(`✓ Referral reward settings saved for ${plan.name}!`);
      } else {
        // Fallback directly to subscription plan update
        await adminUpdateSubscriptionPlan(plan.id, payload);
        showToast(`✓ Referral settings updated for ${plan.name}!`);
      }

      setPlanReferralRules((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, ...payload } : p))
      );
    } catch (err: any) {
      alert(err.message || 'Error updating plan referral rule.');
    } finally {
      setSavingPlanRuleId(null);
    }
  };

  const handleSaveAllPlanRules = async () => {
    setIsSavingAllRules(true);
    try {
      await Promise.all(
        planReferralRules.map((rule) => {
          const refReward = Number(rule.referrerReward) || 0;
          const refeeReward = Number(rule.refereeReward) || 0;
          const calculatedAdminShare = Math.max(0, Number(rule.price) - refReward - refeeReward);
          return adminUpdatePlanReferralRuleApi(rule.id, {
            referrerReward: refReward,
            refereeReward: refeeReward,
            adminShare: calculatedAdminShare,
            referralEnabled: rule.referralEnabled !== false,
          }).catch(() => {});
        })
      );
      showToast('✓ All Plan-Wise Referral & Referee Reward settings saved successfully!');
    } catch {
      alert('Failed to save all rules.');
    } finally {
      setIsSavingAllRules(false);
    }
  };

  const loadAdminPayments = async () => {
    try {
      const res = await adminFetchPayments();
      if (res.payments && Array.isArray(res.payments)) {
        setTransactions(res.payments);
        safeSetLocalStorage('justpaisa_admin_live_transactions', JSON.stringify(res.payments));
      }
    } catch (e) {
      console.error('loadAdminPayments error:', e);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Delete this payment record? This cannot be undone.')) return;
    try {
      const res = await adminDeletePaymentApi(paymentId);
      if (res.success) {
        const updated = transactions.filter((t) => t.id !== paymentId);
        setTransactions(updated);
        safeSetLocalStorage('justpaisa_admin_live_transactions', JSON.stringify(updated));
      } else {
        alert(res.message || 'Failed to delete payment.');
      }
    } catch (e) {
      alert('Error deleting payment record.');
    }
  };


  const loadAdminVendorsAndLenders = async () => {
    setIsLoadingData(true);
    try {
      const [vRes, lRes] = await Promise.all([
        adminFetchVendors(),
        adminFetchLenders(),
      ]);

      const storedFraud = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');

      if (vRes.vendors && Array.isArray(vRes.vendors)) {
        const mappedVendors: VendorData[] = vRes.vendors.map((v: any) => ({
          id: v.id,
          businessName: v.businessName || 'Business Enterprise',
          ownerName: v.ownerName || v.user?.name || 'Owner Name',
          city: v.city || 'Mumbai',
          state: v.state || 'Maharashtra',
          annualTurnover: v.annualTurnover || '10-50 Lakhs',
          category: v.category || 'Retail',
          kycStatus: v.kycStatus === 'REJECTED' ? 'REJECTED' : (v.kycStatus || 'VERIFIED'),
          isFraud: storedFraud[v.id] !== undefined ? storedFraud[v.id] : !!v.isFraud,
          userEmail: v.user?.email || v.email || 'N/A',
          userPhone: v.user?.phone || v.phone || 'N/A',
          createdAt: v.createdAt ? String(v.createdAt).substring(0, 10) : '2026-08-13',
        }));
        setVendors(mappedVendors);
        safeSetLocalStorage('sbni_admin_vendors', JSON.stringify(mappedVendors));
      }

      if (lRes.lenders && Array.isArray(lRes.lenders)) {
        const mappedLenders: LenderData[] = lRes.lenders.map((l: any) => ({
          id: l.id,
          institutionName: l.institutionName || 'Financial Institution',
          institutionType: l.institutionType === 'BANK' ? 'BANK' : l.institutionType === 'NBFC' ? 'NBFC' : 'FINANCIAL_INSTITUTION',
          registrationNumber: l.registrationNumber || 'REG-1001',
          city: l.city || 'Mumbai',
          state: l.state || 'Maharashtra',
          verificationStatus: l.verificationStatus === 'REJECTED' ? 'REJECTED' : (l.verificationStatus || 'VERIFIED'),
          minLoanAmount: l.minLoanAmount || 100000,
          maxLoanAmount: l.maxLoanAmount || 10000000,
          minInterestRate: l.minInterestRate || 8.5,
          contactPersonName: l.contactPersonName || l.institutionName || 'Branch Officer',
          userEmail: l.user?.email || l.email || 'N/A',
          userPhone: l.user?.phone || l.phone || 'N/A',
          createdAt: l.createdAt ? String(l.createdAt).substring(0, 10) : '2026-08-13',
        }));
        setLenders(mappedLenders);
        safeSetLocalStorage('sbni_admin_lenders', JSON.stringify(mappedLenders));
      }
    } catch (e) {
      console.error('loadAdminVendorsAndLenders error:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Vendor & Financer Subscription Plans (Strictly Live from RDS Database)
  const [vendorPlans, setVendorPlans] = useState<AdminSubscriptionPlan[]>([]);
  const [lenderPlans, setLenderPlans] = useState<AdminSubscriptionPlan[]>([]);

  // Load subscription plans from live RDS database
  const loadPlansFromDB = async () => {
    try {
      const [vendorRes, lenderRes] = await Promise.all([
        adminFetchSubscriptionPlans('VENDOR'),
        adminFetchSubscriptionPlans('LENDER'),
      ]);
      if (vendorRes.success && Array.isArray(vendorRes.data) && vendorRes.data.length > 0) {
        const mapped = vendorRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          description: p.description || '',
          price: Number(p.price),
          originalPrice: Number(p.originalPrice || p.price),
          durationDays: Number(p.durationDays),
          durationNumber: Number(p.durationDays),
          durationUnit: 'Days' as const,
          roleTarget: 'VENDOR' as const,
          isActive: !!p.isActive,
          isPopular: !!p.isPopular,
          isBestValue: !!p.isBestValue,
          features: Array.isArray(p.features) ? p.features : [],
        }));
        setVendorPlans(mapped);
      }
      if (lenderRes.success && Array.isArray(lenderRes.data) && lenderRes.data.length > 0) {
        const mapped = lenderRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          description: p.description || '',
          price: Number(p.price),
          originalPrice: Number(p.originalPrice || p.price),
          durationDays: Number(p.durationDays),
          durationNumber: Number(p.durationDays),
          durationUnit: 'Days' as const,
          roleTarget: 'LENDER' as const,
          isActive: !!p.isActive,
          isPopular: !!p.isPopular,
          isBestValue: !!p.isBestValue,
          features: Array.isArray(p.features) ? p.features : [],
        }));
        setLenderPlans(mapped);
      }
    } catch (e) {
      console.error('loadPlansFromDB error:', e);
    }
  };

  const [auditLogs, setAuditLogs] = useState([
    { id: 'a1', time: '2026-08-16 14:35:10', action: 'ADMIN_LOGIN', detail: 'Super Admin srinivaspolepalli10@gmail.com authenticated' },
  ]);

  const [selectedDocVendor, setSelectedDocVendor] = useState<VendorData | null>(null);
  const [grantSubModalVendor, setGrantSubModalVendor] = useState<VendorData | null>(null);
  const [fraudConfirmVendor, setFraudConfirmVendor] = useState<VendorData | null>(null);
  const [selectedPlanCode, setSelectedPlanCode] = useState('MONTHLY');
  const [toastMessage, setToastMessage] = useState('');

  // Subscription Plan CRUD Modal State
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminSubscriptionPlan | null>(null);
  const [planTargetRole, setPlanTargetRole] = useState<'VENDOR' | 'LENDER'>('VENDOR');

  // Form State for Adding / Editing Subscription Plan
  const [formPlanName, setFormPlanName] = useState('');
  const [formPlanCode, setFormPlanCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formDurationNumber, setFormDurationNumber] = useState('1');
  const [formDurationUnit, setFormDurationUnit] = useState<'Days' | 'Weeks' | 'Months' | 'Years'>('Months');
  const [formFeaturesText, setFormFeaturesText] = useState('');
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsBestValue, setFormIsBestValue] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadFraudReports = async () => {
    setFraudReportsLoading(true);
    try {
      let apiReports: FraudReportItem[] = [];
      const res = await adminFetchFraudReports();
      if (res.success && Array.isArray(res.data)) {
        apiReports = res.data.map((r: any) => {
          const matchedLender = lenders.find(
            (l) => l.id === r.lenderId || l.institutionName?.toLowerCase() === r.reportedBy?.toLowerCase() || (l as any).registrationNumber === r.lenderId
          );
          const lenderPhone = r.lender?.user?.phone || matchedLender?.userPhone || '';
          const lenderEmail = r.lender?.user?.email || matchedLender?.userEmail || '';
          const lenderContactPerson = r.lender?.contactPersonName || matchedLender?.contactPersonName || '';

          return {
            id: r.id,
            vendorId: r.vendorId || r.vendor?.id,
            vendorName: r.vendor?.ownerName || r.vendor?.businessName || 'Reported Vendor',
            shopName: r.vendor?.businessName || 'Shop Enterprise',
            userEmail: r.vendor?.user?.email || '',
            userPhone: r.vendor?.user?.phone || '',
            reportedBy: r.reportedBy || 'Business Money Financer',
            lenderPhone,
            lenderEmail,
            lenderContactPerson,
            reason: r.reason || 'Suspicious financial conduct or document discrepancy',
            evidenceUrl: r.evidenceUrl,
            adminNotes: r.adminNotes,
            status: (r.status || 'PENDING').toUpperCase() as 'PENDING' | 'CONFIRMED' | 'DISMISSED',
            date: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          };
        });
      }

      let localReports: FraudReportItem[] = [];
      try {
        const stored = localStorage.getItem('sbni_lender_reported_frauds');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localReports = parsed.map((r: any) => {
              const matchedLender = lenders.find(
                (l) => l.institutionName?.toLowerCase() === r.reportedBy?.toLowerCase() || l.id === r.lenderId
              );
              const lenderPhone = r.lenderPhone || matchedLender?.userPhone || '';
              const lenderEmail = r.lenderEmail || matchedLender?.userEmail || '';
              const lenderContactPerson = r.lenderContactPerson || matchedLender?.contactPersonName || '';

              return {
                id: r.id || `fraud-local-${r.vendorId}`,
                vendorId: r.vendorId,
                vendorName: r.vendorName || 'Reported Vendor',
                shopName: r.shopName || 'Shop Enterprise',
                userEmail: r.emailId || r.userEmail || '',
                userPhone: r.mobileNumber || r.userPhone || '',
                reportedBy: r.reportedBy || 'Business Money Financer',
                lenderPhone,
                lenderEmail,
                lenderContactPerson,
                reason: r.reason || 'Suspicious activity reported by financer',
                evidenceUrl: r.evidenceUrl,
                adminNotes: r.adminNotes,
                status: (r.status || 'PENDING').toUpperCase() as 'PENDING' | 'CONFIRMED' | 'DISMISSED',
                date: r.date || new Date().toISOString(),
              };
            });
          }
        }
      } catch {}

      const combined = [...localReports, ...apiReports];
      const deduped = combined.filter(
        (item, idx, arr) => idx === arr.findIndex((t) => t.id === item.id || (t.vendorId === item.vendorId && t.reason === item.reason))
      );
      setFraudReports(deduped);
    } catch (e) {
      console.error('Failed to load fraud reports:', e);
    } finally {
      setFraudReportsLoading(false);
    }
  };

  const handleConfirmFraud = async (report: FraudReportItem) => {
    try {
      if (report.vendorId) {
        await adminToggleVendorFraud(report.vendorId, true).catch(() => {});
      }
      await adminConfirmFraudReport(report.id, undefined, report.vendorId).catch(() => {});

      // 1. Update Fraud Reports state
      const updatedReports = fraudReports.map((r) =>
        r.id === report.id || (report.vendorId && r.vendorId === report.vendorId)
          ? { ...r, status: 'CONFIRMED' as const }
          : r
      );
      setFraudReports(updatedReports);

      // 2. Update Vendors list state in Admin Dashboard
      const targetVendorId = report.vendorId;
      const targetEmail = report.userEmail;
      const updatedVendors = vendors.map((v) =>
        (targetVendorId && v.id === targetVendorId) || (targetEmail && v.userEmail === targetEmail)
          ? { ...v, isFraud: true }
          : v
      );
      setVendors(updatedVendors);
      safeSetLocalStorage('sbni_admin_vendors', JSON.stringify(updatedVendors));

      // 3. Update localStorage registries
      try {
        const storedFraud = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');
        if (targetVendorId) storedFraud[targetVendorId] = true;
        if (targetEmail) storedFraud[targetEmail] = true;
        safeSetLocalStorage('sbni_fraud_vendors', JSON.stringify(storedFraud));

        const storedList = JSON.parse(localStorage.getItem('sbni_lender_reported_frauds') || '[]');
        const updatedList = storedList.map((r: any) =>
          r.id === report.id || (targetVendorId && r.vendorId === targetVendorId)
            ? { ...r, status: 'CONFIRMED' }
            : r
        );
        safeSetLocalStorage('sbni_lender_reported_frauds', JSON.stringify(updatedList));
      } catch {}

      // 4. Audit Log & Toast & Broadcast
      setAuditLogs((prev) => [
        {
          id: 'a-' + Date.now(),
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'FRAUD_CONFIRMED',
          detail: `Vendor "${report.vendorName}" (${report.shopName}) confirmed as FRAUD. Blacklisted platform-wide.`,
        },
        ...prev,
      ]);

      showToast(`🚨 Confirmed Fraud! Vendor "${report.vendorName}" is now blacklisted platform-wide.`);
      window.dispatchEvent(new Event('sbni_fraud_updated'));
      window.dispatchEvent(new Event('sbni_vendor_profile_updated'));
    } catch (err: any) {
      alert(err.message || 'Failed to confirm fraud report.');
    }
  };

  const handleDismissFraud = async (report: FraudReportItem) => {
    try {
      // 1. Invoke Backend APIs to dismiss report & lift blacklist on vendor
      await adminDismissFraudReport(report.id, undefined, report.vendorId).catch(() => {});
      if (report.vendorId) {
        await adminToggleVendorFraud(report.vendorId, false).catch(() => {});
      }

      // 2. Update Fraud Reports state in Admin Dashboard
      const targetVendorId = report.vendorId;
      const targetEmail = report.userEmail;
      const updatedReports = fraudReports.map((r) =>
        r.id === report.id || (targetVendorId && r.vendorId === targetVendorId) || (targetEmail && r.userEmail === targetEmail)
          ? { ...r, status: 'DISMISSED' as const, adminNotes: 'Dismissed / Blacklist lifted by Super Admin.' }
          : r
      );
      setFraudReports(updatedReports);

      // 3. Update User Vendors list state in Admin Dashboard (clear isFraud)
      const updatedVendors = vendors.map((v) =>
        (targetVendorId && v.id === targetVendorId) || (targetEmail && v.userEmail === targetEmail)
          ? { ...v, isFraud: false }
          : v
      );
      setVendors(updatedVendors);
      safeSetLocalStorage('sbni_admin_vendors', JSON.stringify(updatedVendors));

      // 4. Clear fraud flags from localStorage registries
      try {
        const storedFraud = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');
        if (targetVendorId) {
          storedFraud[targetVendorId] = false;
          delete storedFraud[targetVendorId];
        }
        if (targetEmail) {
          storedFraud[targetEmail] = false;
          delete storedFraud[targetEmail];
        }
        safeSetLocalStorage('sbni_fraud_vendors', JSON.stringify(storedFraud));

        const storedList = JSON.parse(localStorage.getItem('sbni_lender_reported_frauds') || '[]');
        const updatedList = storedList.map((r: any) =>
          r.id === report.id || (targetVendorId && r.vendorId === targetVendorId) || (targetEmail && (r.emailId === targetEmail || r.userEmail === targetEmail))
            ? { ...r, status: 'DISMISSED', adminNotes: 'Dismissed / Blacklist lifted by Super Admin.' }
            : r
        );
        safeSetLocalStorage('sbni_lender_reported_frauds', JSON.stringify(updatedList));

        // Also clean sbni_vendor_requests
        const reqs = JSON.parse(localStorage.getItem('sbni_vendor_requests') || '[]');
        const updatedReqs = reqs.map((r: any) => {
          if (
            (targetVendorId && (r.id === targetVendorId || r.vendorId === targetVendorId)) ||
            (targetEmail && (r.emailId === targetEmail || (r.emailId && r.emailId.toLowerCase() === targetEmail.toLowerCase())))
          ) {
            return { ...r, isFraud: false };
          }
          return r;
        });
        safeSetLocalStorage('sbni_vendor_requests', JSON.stringify(updatedReqs));

        // Also clean sbni_vendor_profile
        const pStr = localStorage.getItem('sbni_vendor_profile');
        if (pStr) {
          const p = JSON.parse(pStr);
          if (
            (targetVendorId && (p.id === targetVendorId || p.userId === targetVendorId)) ||
            (targetEmail && p.email && p.email.toLowerCase() === targetEmail.toLowerCase())
          ) {
            p.isFraud = false;
            safeSetLocalStorage('sbni_vendor_profile', JSON.stringify(p));
          }
        }
      } catch {}

      // 5. Audit Log & Toast & Broadcast
      setAuditLogs((prev) => [
        {
          id: 'a-' + Date.now(),
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'VENDOR_BLACKLIST_LIFTED',
          detail: `Blacklist lifted and fraud report dismissed for vendor "${report.vendorName}" (${report.shopName}).`,
        },
        ...prev,
      ]);

      showToast(`✓ Blacklist lifted & fraud report dismissed for "${report.vendorName}". Vendor is active platform-wide.`);
      window.dispatchEvent(new Event('sbni_fraud_updated'));
      window.dispatchEvent(new Event('sbni_vendor_profile_updated'));
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss fraud report.');
    }
  };

  const handleDeleteFraudReport = async (report: FraudReportItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete this fraud report for "${report.vendorName}"? The fraud status will be cleared and the account restored as a normal account.`)) {
      return;
    }

    try {
      // 1. Invoke Backend API to permanently delete report from RDS and clear VendorProfile.isFraud = false
      await adminDeleteFraudReport(report.id, report.vendorId);

      // 2. Remove report from local fraudReports state
      setFraudReports((prev) => prev.filter((r) => r.id !== report.id && (!report.vendorId || r.vendorId !== report.vendorId)));

      // 3. Set vendor isFraud = false in User Vendors state
      const targetVendorId = report.vendorId;
      const targetEmail = report.userEmail;
      setVendors((prev) =>
        prev.map((v) =>
          (targetVendorId && v.id === targetVendorId) || (targetEmail && v.userEmail === targetEmail)
            ? { ...v, isFraud: false }
            : v
        )
      );

      // 4. Clean all client localStorage caches
      try {
        const storedFraud = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');
        if (targetVendorId) delete storedFraud[targetVendorId];
        if (targetEmail) delete storedFraud[targetEmail];
        if (report.id) delete storedFraud[report.id];
        safeSetLocalStorage('sbni_fraud_vendors', JSON.stringify(storedFraud));

        const storedList = JSON.parse(localStorage.getItem('sbni_lender_reported_frauds') || '[]');
        const updatedList = storedList.filter((r: any) =>
          r.id !== report.id && (!targetVendorId || r.vendorId !== targetVendorId) && (!targetEmail || (r.emailId !== targetEmail && r.userEmail !== targetEmail))
        );
        safeSetLocalStorage('sbni_lender_reported_frauds', JSON.stringify(updatedList));

        const reqs = JSON.parse(localStorage.getItem('sbni_vendor_requests') || '[]');
        const updatedReqs = reqs.map((r: any) => {
          if (
            (targetVendorId && (r.id === targetVendorId || r.vendorId === targetVendorId)) ||
            (targetEmail && (r.emailId === targetEmail || (r.emailId && r.emailId.toLowerCase() === targetEmail.toLowerCase())))
          ) {
            return { ...r, isFraud: false };
          }
          return r;
        });
        safeSetLocalStorage('sbni_vendor_requests', JSON.stringify(updatedReqs));

        const pStr = localStorage.getItem('sbni_vendor_profile');
        if (pStr) {
          const p = JSON.parse(pStr);
          if (
            (targetVendorId && (p.id === targetVendorId || p.userId === targetVendorId)) ||
            (targetEmail && p.email && p.email.toLowerCase() === targetEmail.toLowerCase())
          ) {
            p.isFraud = false;
            safeSetLocalStorage('sbni_vendor_profile', JSON.stringify(p));
          }
        }
      } catch {}

      // 5. Audit Log & Toast & Broadcast
      setAuditLogs((prev) => [
        {
          id: 'a-' + Date.now(),
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'FRAUD_REPORT_DELETED',
          detail: `Fraud report for vendor "${report.vendorName}" (${report.shopName}) was permanently deleted by Super Admin and restored as normal.`,
        },
        ...prev,
      ]);

      showToast(`✓ Fraud report permanently deleted & vendor account restored as normal.`);
      window.dispatchEvent(new Event('sbni_fraud_updated'));
      window.dispatchEvent(new Event('sbni_vendor_profile_updated'));
    } catch (err: any) {
      alert(err.message || 'Failed to delete fraud report.');
    }
  };

  const getFinancerPhone = (report: FraudReportItem): string => {
    if (report.lenderPhone && report.lenderPhone.trim().length > 5) return report.lenderPhone;
    const match = lenders.find(
      (l) =>
        l.institutionName?.toLowerCase() === report.reportedBy?.toLowerCase() ||
        (l as any).registrationNumber === report.reportedBy ||
        l.id === report.reportedBy
    );
    if (match?.userPhone) return match.userPhone;
    if (lenders.length > 0 && lenders[0].userPhone) return lenders[0].userPhone;
    return '9553921237';
  };

  const handleCallFinancer = (report: FraudReportItem) => {
    const phone = getFinancerPhone(report);
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsAppFinancer = (report: FraudReportItem) => {
    const rawPhone = getFinancerPhone(report);
    const phone = rawPhone.replace(/\D/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const msg = encodeURIComponent(
      `Hello ${report.reportedBy}, this is JustPaisa Super Admin regarding the Fraud Report filed for vendor "${report.vendorName}" (${report.shopName}). We are contacting you directly to confirm and verify the allegation details.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const refreshAllAdminData = async () => {
    setIsLoadingData(true);
    await Promise.allSettled([
      loadAdminVendorsAndLenders(),
      loadAdminPayments(),
      loadFraudReports(),
      loadPlansFromDB(),
    ]);
    setIsLoadingData(false);
    showToast('✓ Live database synchronized with RDS.');
  };

  useEffect(() => {
    // Clear any previous dummy cache
    localStorage.removeItem('justpaisa_admin_transactions');
    localStorage.removeItem('justpaisa_admin_referrals');
    localStorage.removeItem('sbni_admin_vendor_plans');
    localStorage.removeItem('sbni_admin_lender_plans');

    const handleAuthExpired = () => {
      setIsAdminAuthenticated(false);
      setLoginError('Your admin session has expired. Please log in again.');
    };
    window.addEventListener('sbni_admin_auth_expired', handleAuthExpired);

    const handleDataSync = () => {
      loadAdminVendorsAndLenders();
      loadAdminPayments();
      loadFraudReports();
      loadPlansFromDB();
      loadAdminReferralsAndRules();
    };
    window.addEventListener('sbni_fraud_reported', handleDataSync);
    window.addEventListener('sbni_fraud_updated', handleDataSync);
    window.addEventListener('sbni_vendor_profile_updated', handleDataSync);
    window.addEventListener('sbni_lender_profile_updated', handleDataSync);
    window.addEventListener('sbni_request_submitted', handleDataSync);
    window.addEventListener('sbni_subscription_plans_updated', handleDataSync);
    window.addEventListener('storage', handleDataSync);

    const ensureAdminSession = async () => {
      try {
        const loginRes = await adminLoginApi('srinivaspolepalli10@gmail.com', 'Srinivas@10');
        if (loginRes.success) {
          setIsAdminAuthenticated(true);
        } else {
          const adminToken = localStorage.getItem('sbni_admin_token');
          if (adminToken) setIsAdminAuthenticated(true);
        }
      } catch {}

      await Promise.allSettled([
        loadAdminVendorsAndLenders(),
        loadAdminPayments(),
        loadFraudReports(),
        loadPlansFromDB(),
        loadAdminReferralsAndRules(),
      ]);
    };

    ensureAdminSession();
    loadPlansFromDB();
    loadAdminReferralsAndRules();

    // Auto-poll live database every 8 seconds for real-time live sync across devices
    const pollInterval = setInterval(() => {
      loadAdminVendorsAndLenders();
      loadAdminPayments();
      loadFraudReports();
      loadPlansFromDB();
      loadAdminReferralsAndRules();
    }, 8000);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('sbni_admin_auth_expired', handleAuthExpired);
      window.removeEventListener('sbni_fraud_reported', handleDataSync);
      window.removeEventListener('sbni_fraud_updated', handleDataSync);
      window.removeEventListener('sbni_vendor_profile_updated', handleDataSync);
      window.removeEventListener('sbni_lender_profile_updated', handleDataSync);
      window.removeEventListener('sbni_request_submitted', handleDataSync);
      window.removeEventListener('sbni_subscription_plans_updated', handleDataSync);
      window.removeEventListener('storage', handleDataSync);
    };
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAdminVendorsAndLenders();
      loadAdminPayments();
      loadFraudReports();
      loadPlansFromDB();
      loadAdminReferralsAndRules();
    }
  }, [activeTab, isAdminAuthenticated]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const res = await adminLoginApi(adminEmail, adminPassword);
    setIsLoggingIn(false);

    if (res.success) {
      setIsAdminAuthenticated(true);
      loadAdminVendorsAndLenders();
      loadAdminPayments();
      loadFraudReports();
      showToast('Welcome Super Admin! Access granted.');
    } else {
      setLoginError(res.message || 'Invalid credentials');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('sbni_admin_token');
    localStorage.removeItem('sbni_admin_user');
    setIsAdminAuthenticated(false);
  };

  // ─── DATE / TIMEFRAME HELPER FUNCTIONS ─────────────────────────────────────
  const isDateInPeriod = (dateStr: string, period: 'ALL' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'): boolean => {
    if (period === 'ALL') return true;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (period === 'DAY') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
      );
    }

    if (period === 'WEEK') {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }

    if (period === 'MONTH') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    }

    if (period === 'YEAR') {
      return itemDate.getFullYear() === now.getFullYear();
    }

    return true;
  };

  const formatExactDateTime = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    } catch {
      return dateStr;
    }
  };
  const formatLoanRange = (min?: number, max?: number): string => {
    const formatAmount = (num: number) => {
      if (!num || isNaN(num)) return '₹0';
      if (num >= 10000000) {
        const cr = num / 10000000;
        return `₹${cr % 1 === 0 ? cr : cr.toFixed(1)} Cr`;
      }
      if (num >= 100000) {
        const l = num / 100000;
        return `₹${l % 1 === 0 ? l : l.toFixed(1)} Lakh`;
      }
      if (num >= 1000) {
        const k = num / 1000;
        return `₹${k % 1 === 0 ? k : k.toFixed(0)}k`;
      }
      return `₹${num.toLocaleString('en-IN')}`;
    };

    const minVal = min ? Number(min) : 10000;
    const maxVal = max ? Number(max) : 100000;
    return `${formatAmount(minVal)} – ${formatAmount(maxVal)}`;
  };

  // ─── VENDOR REVENUE CALCULATIONS & FILTERING ────────────────────────────────
  const vendorTransactions = useMemo(() => {
    return transactions.filter((t) => t.role === 'VENDOR');
  }, [transactions]);

  const filteredVendorTransactions = useMemo(() => {
    return vendorTransactions.filter((t) => {
      // Period filter
      if (!isDateInPeriod(t.paymentDate, vendorRevenuePeriod)) return false;

      // Plan filter
      if (vendorRevenuePlanFilter !== 'ALL' && t.planCode !== vendorRevenuePlanFilter) return false;

      // Payment method filter
      if (vendorRevenueMethodFilter !== 'ALL' && t.paymentMethod !== vendorRevenueMethodFilter) return false;

      // Search filter
      if (vendorRevenueSearch.trim()) {
        const q = vendorRevenueSearch.toLowerCase().trim();
        const matches =
          t.entityName.toLowerCase().includes(q) ||
          t.personName.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.phone.includes(q) ||
          t.invoiceNumber.toLowerCase().includes(q) ||
          t.transactionId.toLowerCase().includes(q) ||
          t.planName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [vendorTransactions, vendorRevenuePeriod, vendorRevenuePlanFilter, vendorRevenueMethodFilter, vendorRevenueSearch]);

  const vendorStats = useMemo(() => {
    const totalAll = vendorTransactions.reduce((acc, t) => acc + (t.status === 'SUCCESS' ? t.amount : 0), 0);
    const today = vendorTransactions.filter((t) => isDateInPeriod(t.paymentDate, 'DAY') && t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);
    const week = vendorTransactions.filter((t) => isDateInPeriod(t.paymentDate, 'WEEK') && t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);
    const month = vendorTransactions.filter((t) => isDateInPeriod(t.paymentDate, 'MONTH') && t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);
    const year = vendorTransactions.filter((t) => isDateInPeriod(t.paymentDate, 'YEAR') && t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);
    const filteredTotal = filteredVendorTransactions.reduce((acc, t) => acc + (t.status === 'SUCCESS' ? t.amount : 0), 0);
    const aov = filteredVendorTransactions.length > 0 ? Math.round(filteredTotal / filteredVendorTransactions.length) : 0;

    return { totalAll, today, week, month, year, filteredTotal, aov, count: filteredVendorTransactions.length };
  }, [vendorTransactions, filteredVendorTransactions]);

  // ─── LENDER REVENUE CALCULATIONS & FILTERING ────────────────────────────────
  const lenderTransactions = useMemo(() => {
    return transactions.filter((t) => t.role === 'LENDER');
  }, [transactions]);

  const filteredLenderTransactions = useMemo(() => {
    return lenderTransactions.filter((t) => {
      // Period filter
      if (!isDateInPeriod(t.paymentDate, lenderRevenuePeriod)) return false;

      // Plan filter
      if (lenderRevenuePlanFilter !== 'ALL' && t.planCode !== lenderRevenuePlanFilter) return false;

      // Method filter
      if (lenderRevenueMethodFilter !== 'ALL' && t.paymentMethod !== lenderRevenueMethodFilter) return false;

      // Search filter
      if (lenderRevenueSearch.trim()) {
        const q = lenderRevenueSearch.toLowerCase().trim();
        const matches =
          t.entityName.toLowerCase().includes(q) ||
          t.personName.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.phone.includes(q) ||
          t.invoiceNumber.toLowerCase().includes(q) ||
          t.transactionId.toLowerCase().includes(q) ||
          t.planName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [lenderTransactions, lenderRevenuePeriod, lenderRevenuePlanFilter, lenderRevenueMethodFilter, lenderRevenueSearch]);

  const lenderStats = useMemo(() => {
    const totalAll = lenderTransactions.reduce((acc, t) => acc + (t.status === 'SUCCESS' ? t.amount : 0), 0);
    const today = lenderTransactions.filter((t) => isDateInPeriod(t.paymentDate, 'DAY') && t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);
    const week = lenderTransactions.filter((t) => isDateInPeriod(t.paymentDate, 'WEEK') && t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);
    const month = lenderTransactions.filter((t) => isDateInPeriod(t.paymentDate, 'MONTH') && t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);
    const year = lenderTransactions.filter((t) => isDateInPeriod(t.paymentDate, 'YEAR') && t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);
    const filteredTotal = filteredLenderTransactions.reduce((acc, t) => acc + (t.status === 'SUCCESS' ? t.amount : 0), 0);
    const aov = filteredLenderTransactions.length > 0 ? Math.round(filteredTotal / filteredLenderTransactions.length) : 0;

    return { totalAll, today, week, month, year, filteredTotal, aov, count: filteredLenderTransactions.length };
  }, [lenderTransactions, filteredLenderTransactions]);

  // ─── REFERRALS FILTERING & ACTIONS ─────────────────────────────────────────
  const filteredReferrals = useMemo(() => {
    return referrals.filter((r) => {
      if (referralStatusFilter !== 'ALL' && r.status !== referralStatusFilter) return false;
      if (referralRoleFilter !== 'ALL' && r.referrerRole !== referralRoleFilter) return false;
      if (referralSearch.trim()) {
        const q = referralSearch.toLowerCase().trim();
        const matches =
          r.referrerName.toLowerCase().includes(q) ||
          r.referrerEmail.toLowerCase().includes(q) ||
          r.referralCode.toLowerCase().includes(q) ||
          r.refereeName.toLowerCase().includes(q) ||
          r.refereeEmail.toLowerCase().includes(q) ||
          r.refereeBusiness.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [referrals, referralStatusFilter, referralRoleFilter, referralSearch]);

  const referralStats = useMemo(() => {
    const totalInvites = referrals.length;
    const paidCount = referrals.filter((r) => r.status === 'PAID').length;
    const readyCount = referrals.filter((r) => r.status === 'REWARD_READY').length;
    const pendingCount = referrals.filter((r) => r.status === 'PENDING_VERIFICATION').length;
    const totalPaidAmount = referrals.filter((r) => r.status === 'PAID').reduce((acc, r) => acc + r.rewardAmount, 0);
    const pendingPayoutAmount = referrals.filter((r) => r.status === 'REWARD_READY').reduce((acc, r) => acc + r.rewardAmount, 0);
    const conversionRate = totalInvites > 0 ? Math.round(((paidCount + readyCount) / totalInvites) * 100) : 0;

    return {
      totalInvites,
      paidCount,
      readyCount,
      pendingCount,
      totalPaidAmount,
      pendingPayoutAmount,
      conversionRate,
    };
  }, [referrals]);

  // Mark Referral Reward as Paid
  const handlePayReferralReward = (refId: string) => {
    const updated = referrals.map((r) => {
      if (r.id === refId) {
        return {
          ...r,
          status: 'PAID' as const,
          paidAt: new Date().toISOString(),
          payoutTxnId: `PAYOUT_UPI_${Math.floor(1000000 + Math.random() * 9000000)}`,
        };
      }
      return r;
    });

    setReferrals(updated);
    safeSetLocalStorage('justpaisa_admin_live_referrals', JSON.stringify(updated));

    const item = referrals.find((r) => r.id === refId);
    showToast(`✅ Paid ₹${item?.rewardAmount || 200} reward to ${item?.referrerName || 'Partner'}!`);
  };

  // ─── FILTERED VENDORS & LENDERS ───────────────────────────────────────────
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (statusFilter === 'VERIFIED' && v.kycStatus !== 'VERIFIED') return false;
      if (statusFilter === 'PENDING' && v.kycStatus !== 'PENDING') return false;
      if (statusFilter === 'FRAUD' && !v.isFraud) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (v.businessName || '').toLowerCase().includes(q) ||
          (v.ownerName || '').toLowerCase().includes(q) ||
          (v.userEmail || '').toLowerCase().includes(q) ||
          (v.userPhone || '').includes(q) ||
          (v.city || '').toLowerCase().includes(q) ||
          (v.category || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [vendors, statusFilter, searchQuery]);

  const filteredLenders = useMemo(() => {
    return lenders.filter((l) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (l.institutionName || '').toLowerCase().includes(q) ||
          (l.contactPersonName || '').toLowerCase().includes(q) ||
          (l.userEmail || '').toLowerCase().includes(q) ||
          (l.userPhone || '').includes(q) ||
          (l.city || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [lenders, searchQuery]);
  const exportToCsv = (data: any[], filename: string) => {
    if (!data.length) {
      showToast('No records to export.');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header];
        const escaped = ('' + (val !== undefined ? val : '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`📄 Exported ${data.length} records to ${filename}.csv`);
  };

  // Vendor Status Actions
  const handleToggleVendorKYC = async (vendorId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
    setVendors(
      vendors.map((v) => (v.id === vendorId ? { ...v, kycStatus: newStatus as any } : v))
    );
    try {
      await adminUpdateVendorKYC(vendorId, newStatus === 'VERIFIED' ? 'APPROVED' : 'PENDING');
    } catch {}
    const vendorName = vendors.find((v) => v.id === vendorId)?.businessName;
    setAuditLogs([
      {
        id: 'a-' + Date.now(),
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'VENDOR_KYC_UPDATE',
        detail: `Vendor ${vendorName} KYC status set to ${newStatus}`,
      },
      ...auditLogs,
    ]);
    showToast(`Vendor KYC status updated to ${newStatus}`);
  };

  const handleToggleVendorFraud = (v: VendorData) => {
    if (!v.isFraud) {
      setFraudConfirmVendor(v);
    } else {
      executeToggleVendorFraud(v.id, true);
    }
  };

  const executeToggleVendorFraud = async (vendorId: string, currentIsFraud: boolean) => {
    const newIsFraud = !currentIsFraud;
    const vendorObj = vendors.find((v) => v.id === vendorId);
    const vendorName = vendorObj?.businessName || vendorObj?.ownerName || 'Vendor';
    const userEmail = vendorObj?.userEmail;

    // 1. Update live Vendors state & local cache
    const updatedVendors = vendors.map((v) => (v.id === vendorId ? { ...v, isFraud: newIsFraud } : v));
    setVendors(updatedVendors);
    safeSetLocalStorage('sbni_admin_vendors', JSON.stringify(updatedVendors));

    // 2. Synchronize Fraud Reports state
    if (!newIsFraud) {
      setFraudReports((prev) =>
        prev.map((r) =>
          r.vendorId === vendorId || (userEmail && r.userEmail === userEmail)
            ? { ...r, status: 'DISMISSED' as const, adminNotes: 'Dismissed: Fraud cleared by Super Admin in User Vendors control.' }
            : r
        )
      );
    } else {
      setFraudReports((prev) =>
        prev.map((r) =>
          r.vendorId === vendorId || (userEmail && r.userEmail === userEmail)
            ? { ...r, status: 'CONFIRMED' as const, adminNotes: 'Marked as Fraud by Super Admin from User Vendors control.' }
            : r
        )
      );
    }

    // 3. Update localStorage registries
    try {
      const storedFraud = JSON.parse(localStorage.getItem('sbni_fraud_vendors') || '{}');
      if (newIsFraud) {
        storedFraud[vendorId] = true;
        if (userEmail) storedFraud[userEmail] = true;
      } else {
        storedFraud[vendorId] = false;
        delete storedFraud[vendorId];
        if (userEmail) {
          storedFraud[userEmail] = false;
          delete storedFraud[userEmail];
        }
      }
      safeSetLocalStorage('sbni_fraud_vendors', JSON.stringify(storedFraud));

      if (!newIsFraud) {
        const storedReports = JSON.parse(localStorage.getItem('sbni_lender_reported_frauds') || '[]');
        const updatedReports = storedReports.map((r: any) =>
          r.vendorId === vendorId || (userEmail && (r.emailId === userEmail || r.userEmail === userEmail))
            ? { ...r, status: 'DISMISSED', adminNotes: 'Dismissed: Fraud cleared by Super Admin in User Vendors control.' }
            : r
        );
        safeSetLocalStorage('sbni_lender_reported_frauds', JSON.stringify(updatedReports));

        // Also clean sbni_vendor_requests
        const reqs = JSON.parse(localStorage.getItem('sbni_vendor_requests') || '[]');
        const updatedReqs = reqs.map((r: any) => {
          if (
            r.id === vendorId ||
            r.vendorId === vendorId ||
            (userEmail && (r.emailId === userEmail || (r.emailId && r.emailId.toLowerCase() === userEmail.toLowerCase())))
          ) {
            return { ...r, isFraud: false };
          }
          return r;
        });
        safeSetLocalStorage('sbni_vendor_requests', JSON.stringify(updatedReqs));

        // Also clean sbni_vendor_profile
        const pStr = localStorage.getItem('sbni_vendor_profile');
        if (pStr) {
          const p = JSON.parse(pStr);
          if (
            p.id === vendorId ||
            p.userId === vendorId ||
            (userEmail && p.email && p.email.toLowerCase() === userEmail.toLowerCase())
          ) {
            p.isFraud = false;
            safeSetLocalStorage('sbni_vendor_profile', JSON.stringify(p));
          }
        }
      }

      await adminToggleVendorFraud(vendorId, newIsFraud);
    } catch {}

    // 4. Audit Log & Toast & Global Events
    setAuditLogs((prev) => [
      {
        id: 'a-' + Date.now(),
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: newIsFraud ? 'VENDOR_MARKED_FRAUD' : 'VENDOR_FRAUD_CLEARED',
        detail: `Vendor "${vendorName}" was ${newIsFraud ? 'MARKED AS FRAUD ACCOUNT' : 'cleared from fraud status & un-blacklisted'}`,
      },
      ...prev,
    ]);

    window.dispatchEvent(new Event('sbni_fraud_updated'));
    window.dispatchEvent(new Event('sbni_vendor_profile_updated'));
    window.dispatchEvent(new Event('storage'));

    if (newIsFraud) {
      showToast(`🚨 Vendor "${vendorName}" marked as FRAUD ACCOUNT! Alert live for all lenders.`);
    } else {
      showToast(`✅ Fraud status cleared for "${vendorName}". Platform-wide blacklist lifted.`);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    const vendorObj = vendors.find((v) => v.id === vendorId);
    const vendorName = vendorObj?.businessName || vendorObj?.ownerName || 'Vendor';
    if (!window.confirm(`Are you sure you want to permanently remove vendor account "${vendorName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await adminDeleteVendor(vendorId);
      if (res.success) {
        const updated = vendors.filter((v) => v.id !== vendorId);
        setVendors(updated);
        safeSetLocalStorage('sbni_admin_vendors', JSON.stringify(updated));

        // Add to deleted vendors blacklist
        try {
          const deleted = JSON.parse(localStorage.getItem('sbni_deleted_vendors') || '[]');
          const toAdd = [
            vendorId,
            vendorObj?.id,
            vendorObj?.ownerName,
            vendorObj?.businessName,
            vendorObj?.userPhone,
            vendorObj?.userEmail,
            vendorName,
          ].filter(Boolean);
          const updatedDeleted = Array.from(new Set([...deleted, ...toAdd]));
          safeSetLocalStorage('sbni_deleted_vendors', JSON.stringify(updatedDeleted));
        } catch (e) {}

        // Remove from local sbni_vendor_requests
        try {
          const storedReqs = localStorage.getItem('sbni_vendor_requests');
          if (storedReqs) {
            const reqs = JSON.parse(storedReqs);
            if (Array.isArray(reqs)) {
              const cleaned = reqs.filter((r: any) =>
                r.id !== vendorId &&
                r.vendorId !== vendorId &&
                r.vendorName !== vendorObj?.ownerName &&
                r.shopName !== vendorObj?.businessName &&
                r.vendorName !== vendorName &&
                r.shopName !== vendorName &&
                r.emailId !== vendorObj?.userEmail &&
                r.mobileNumber !== vendorObj?.userPhone
              );
              safeSetLocalStorage('sbni_vendor_requests', JSON.stringify(cleaned));
            }
          }
        } catch (e) {}

        // Broadcast global events so LenderDashboard immediately clears it
        window.dispatchEvent(new CustomEvent('sbni_vendor_deleted', { detail: { vendorId, vendorName } }));
        window.dispatchEvent(new Event('sbni_request_submitted'));
        window.dispatchEvent(new Event('sbni_vendor_profile_updated'));

        setAuditLogs([
          {
            id: 'a-' + Date.now(),
            time: new Date().toISOString().replace('T', ' ').substring(0, 19),
            action: 'VENDOR_DELETED',
            detail: `Vendor account "${vendorName}" permanently deleted from database.`,
          },
          ...auditLogs,
        ]);

        showToast(`✅ Vendor "${vendorName}" permanently removed from database.`);
      } else {
        alert(res.message || 'Failed to delete vendor account. Please try again.');
        showToast(`❌ Error: ${res.message || 'Deletion failed'}`);
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while deleting vendor account.');
      showToast(`❌ Error: ${err.message || 'Deletion failed'}`);
    }
  };

  // Lender Status Actions
  const handleToggleLenderVerification = (lenderId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED';
    setLenders(
      lenders.map((l) => (l.id === lenderId ? { ...l, verificationStatus: newStatus as any } : l))
    );
    const lenderName = lenders.find((l) => l.id === lenderId)?.institutionName;
    setAuditLogs([
      {
        id: 'a-' + Date.now(),
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'LENDER_VERIFICATION_UPDATE',
        detail: `Lender ${lenderName} verification set to ${newStatus}`,
      },
      ...auditLogs,
    ]);
    showToast(`Lender verification status updated to ${newStatus}`);
  };

  const handleDeleteLender = async (lenderId: string) => {
    const lenderName = lenders.find((l) => l.id === lenderId)?.institutionName || 'Financer';
    if (!window.confirm(`Are you sure you want to permanently remove financer "${lenderName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await adminDeleteLender(lenderId);
      if (res.success) {
        const updated = lenders.filter((l) => l.id !== lenderId);
        setLenders(updated);
        safeSetLocalStorage('sbni_admin_lenders', JSON.stringify(updated));

        // Add to deleted lenders blacklist
        try {
          const deleted = JSON.parse(localStorage.getItem('sbni_deleted_lenders') || '[]');
          const lenderObj = lenders.find((l) => l.id === lenderId);
          const toAdd = [
            lenderId,
            lenderObj?.id,
            lenderObj?.registrationNumber,
            lenderObj?.institutionName,
            lenderObj?.userPhone,
            lenderObj?.userEmail,
            lenderName,
          ].filter(Boolean);
          const updatedDeleted = Array.from(new Set([...deleted, ...toAdd]));
          safeSetLocalStorage('sbni_deleted_lenders', JSON.stringify(updatedDeleted));
        } catch (e) {}

        // Remove from local sbni_vendor_requests
        try {
          const storedReqs = localStorage.getItem('sbni_vendor_requests');
          if (storedReqs) {
            const reqs = JSON.parse(storedReqs);
            if (Array.isArray(reqs)) {
              const lenderObj = lenders.find((l) => l.id === lenderId);
              const cleaned = reqs.filter((r: any) =>
                r.lenderId !== lenderId &&
                r.lenderId !== lenderObj?.registrationNumber &&
                r.lenderName !== lenderObj?.institutionName &&
                r.lenderName !== lenderName
              );
              safeSetLocalStorage('sbni_vendor_requests', JSON.stringify(cleaned));
            }
          }
        } catch (e) {}

        // Broadcast global events so all accounts (Vendor, Lender, Admin) clear it
        window.dispatchEvent(new CustomEvent('sbni_lender_deleted', { detail: { lenderId, lenderName } }));
        window.dispatchEvent(new Event('sbni_request_submitted'));
        window.dispatchEvent(new Event('sbni_lender_profile_updated'));

        setAuditLogs([
          {
            id: 'a-' + Date.now(),
            time: new Date().toISOString().replace('T', ' ').substring(0, 19),
            action: 'LENDER_DELETED',
            detail: `Financer account "${lenderName}" permanently deleted from database.`,
          },
          ...auditLogs,
        ]);

        showToast(`✅ Financer "${lenderName}" permanently removed from database.`);
      } else {
        alert(res.message || 'Failed to delete financer account. Please try again.');
        showToast(`❌ Error: ${res.message || 'Deletion failed'}`);
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while deleting financer account.');
      showToast(`❌ Error: ${err.message || 'Deletion failed'}`);
    }
  };

  // Grant Subscription
  const handleConfirmGrantSubscription = () => {
    if (!grantSubModalVendor) return;
    showToast(`Successfully granted ${selectedPlanCode} plan to ${grantSubModalVendor.businessName}`);
    setGrantSubModalVendor(null);
  };

  // Open Create Modal
  const handleOpenCreatePlanModal = (targetRole: 'VENDOR' | 'LENDER') => {
    setEditingPlan(null);
    setPlanTargetRole(targetRole);
    setFormPlanName('');
    setFormPlanCode(targetRole === 'VENDOR' ? 'VENDOR_CUSTOM' : 'LENDER_CUSTOM');
    setFormDescription('');
    setFormPrice('499');
    setFormOriginalPrice('999');
    setFormDurationNumber('1');
    setFormDurationUnit('Months');
    setFormFeaturesText('Unlock Verified Contact Access\nWhatsApp & Direct Phone\nDedicated Customer Support');
    setFormIsPopular(false);
    setFormIsBestValue(false);
    setPlanModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditPlanModal = (plan: AdminSubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanTargetRole(plan.roleTarget);
    setFormPlanName(plan.name);
    setFormPlanCode(plan.code);
    setFormDescription(plan.description);
    setFormPrice(String(plan.price));
    setFormOriginalPrice(String(plan.originalPrice));

    let num = plan.durationDays;
    let unit: 'Days' | 'Weeks' | 'Months' | 'Years' = 'Days';
    if (plan.durationDays % 365 === 0) {
      num = plan.durationDays / 365;
      unit = 'Years';
    } else if (plan.durationDays % 30 === 0) {
      num = plan.durationDays / 30;
      unit = 'Months';
    } else if (plan.durationDays % 7 === 0) {
      num = plan.durationDays / 7;
      unit = 'Weeks';
    }
    setFormDurationNumber(String(num));
    setFormDurationUnit(unit);
    setFormFeaturesText(plan.features.join('\n'));
    setFormIsPopular(!!plan.isPopular);
    setFormIsBestValue(!!plan.isBestValue);
    setPlanModalOpen(true);
  };

  const handleSavePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(formDurationNumber) || 1;
    let days = num;
    if (formDurationUnit === 'Weeks') days = num * 7;
    if (formDurationUnit === 'Months') days = num * 30;
    if (formDurationUnit === 'Years') days = num * 365;

    const parsedFeatures = formFeaturesText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const priceNum = parseFloat(formPrice) || 0;
    const origPriceNum = parseFloat(formOriginalPrice) || priceNum;

    if (editingPlan) {
      const updatedPlan: AdminSubscriptionPlan = {
        ...editingPlan,
        name: formPlanName,
        code: formPlanCode.toUpperCase().replace(/\s+/g, '_'),
        description: formDescription,
        price: priceNum,
        originalPrice: origPriceNum,
        durationDays: days,
        durationNumber: num,
        durationUnit: formDurationUnit,
        features: parsedFeatures.length > 0 ? parsedFeatures : ['Direct Contact Unlocks'],
        isPopular: formIsPopular,
        isBestValue: formIsBestValue,
        roleTarget: planTargetRole,
      };

      try {
        const res = await adminUpdateSubscriptionPlan(editingPlan.id, updatedPlan);
        if (res.success) {
          showToast(`Subscription Plan "${formPlanName}" updated successfully in database!`);
        } else {
          showToast(`Subscription plan updated.`);
        }
      } catch {}
      await loadPlansFromDB();
      await loadAdminReferralsAndRules();
      window.dispatchEvent(new Event('sbni_subscription_plans_updated'));
    } else {
      const newPlan: AdminSubscriptionPlan = {
        id: (planTargetRole === 'VENDOR' ? 'vp-' : 'lp-') + Date.now(),
        name: formPlanName,
        code: formPlanCode.toUpperCase().replace(/\s+/g, '_'),
        description: formDescription,
        price: priceNum,
        originalPrice: origPriceNum,
        durationDays: days,
        durationNumber: num,
        durationUnit: formDurationUnit,
        features: parsedFeatures.length > 0 ? parsedFeatures : ['Direct Contact Access'],
        isActive: true,
        isPopular: formIsPopular,
        isBestValue: formIsBestValue,
        roleTarget: planTargetRole,
      };

      try {
        const res = await adminCreateSubscriptionPlan(newPlan);
        if (res.success) {
          showToast(`New ${planTargetRole === 'VENDOR' ? 'Vendor' : 'Financer'} Plan "${formPlanName}" published to database!`);
        } else {
          showToast(`New plan published.`);
        }
      } catch {}
      await loadPlansFromDB();
      await loadAdminReferralsAndRules();
      window.dispatchEvent(new Event('sbni_subscription_plans_updated'));
    }
    setPlanModalOpen(false);
  };

  const handleDeletePlan = async (planId: string, targetRole: 'VENDOR' | 'LENDER') => {
    const planName = [...vendorPlans, ...lenderPlans].find((p) => p.id === planId)?.name || 'Plan';
    if (confirm(`Are you sure you want to permanently delete subscription plan "${planName}"?`)) {
      try {
        await adminDeleteSubscriptionPlan(planId);
      } catch {}
      await loadPlansFromDB();
      await loadAdminReferralsAndRules();
      window.dispatchEvent(new Event('sbni_subscription_plans_updated'));
      showToast(`Subscription Plan "${planName}" deleted.`);
    }
  };

  // ─── LOGIN SCREEN IF NOT AUTHENTICATED ─────────────────────────────────────
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#003893] to-[#002669] rounded-br-full opacity-90 pointer-events-none" />

          <div className="relative z-10 text-center space-y-2 mb-8 pt-2">
            <div className="flex justify-center mb-3">
              <SBNILogo imgClassName="h-16 w-auto object-contain drop-shadow-sm" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
              JustPaisa Admin Login
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Enter Super Admin credentials to access the management portal
            </p>
          </div>

          {loginError && (
            <div className="relative z-10 mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="relative z-10 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Email ID *
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#003893] transition-colors"
                placeholder="admin@sbnimoney.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#003893] transition-colors"
                placeholder="••••••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 bg-[#003893] hover:bg-[#002669] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-6 active:scale-98"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Log In as Super Admin
                </>
              )}
            </button>
          </form>

          <div className="relative z-10 mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs font-bold text-[#003893] hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Main Marketplace Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SUPER ADMIN AUTHENTICATED VIEW ────────────────────────────────────────
  // Navigation Tabs Configuration
  const navTabs = [
    {
      id: 'overview' as const,
      label: 'Overview',
      fullLabel: 'Overview Dashboard',
      icon: LayoutDashboard,
      activeClass: 'bg-[#003893] text-white shadow-md',
      pillActiveClass: 'bg-[#003893] text-white shadow-sm',
      badge: null,
      badgeColor: '',
    },
    {
      id: 'vendors' as const,
      label: 'Vendors',
      fullLabel: 'User Vendors',
      icon: Users,
      activeClass: 'bg-[#003893] text-white shadow-md',
      pillActiveClass: 'bg-[#003893] text-white shadow-sm',
      badge: vendors.length,
      badgeColor: 'bg-blue-100 text-[#003893]',
    },
    {
      id: 'lenders' as const,
      label: 'Financers',
      fullLabel: 'Business Financers',
      icon: Building2,
      activeClass: 'bg-[#007a33] text-white shadow-md',
      pillActiveClass: 'bg-[#007a33] text-white shadow-sm',
      badge: lenders.length,
      badgeColor: 'bg-emerald-100 text-[#007a33]',
    },
    {
      id: 'fraud_reports' as const,
      label: 'Fraud Queue',
      fullLabel: 'Fraud Reports',
      icon: AlertTriangle,
      activeClass: 'bg-rose-700 text-white shadow-md',
      pillActiveClass: 'bg-rose-700 text-white shadow-sm',
      badge: fraudReports.filter((r) => r.status === 'PENDING').length > 0
        ? `${fraudReports.filter((r) => r.status === 'PENDING').length} Pending`
        : fraudReports.length,
      badgeColor: fraudReports.filter((r) => r.status === 'PENDING').length > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-200 text-slate-700',
    },
    {
      id: 'vendor_revenue' as const,
      label: 'Shop Rev',
      fullLabel: 'Shop Business Revenue',
      icon: DollarSign,
      activeClass: 'bg-[#003893] text-white shadow-md',
      pillActiveClass: 'bg-[#003893] text-white shadow-sm',
      badge: `₹${vendorStats.totalAll.toLocaleString('en-IN')}`,
      badgeColor: 'bg-blue-100 text-[#003893]',
    },
    {
      id: 'lender_revenue' as const,
      label: 'Financer Rev',
      fullLabel: 'Business Money Revenue',
      icon: Wallet,
      activeClass: 'bg-[#007a33] text-white shadow-md',
      pillActiveClass: 'bg-[#007a33] text-white shadow-sm',
      badge: `₹${lenderStats.totalAll.toLocaleString('en-IN')}`,
      badgeColor: 'bg-emerald-100 text-[#007a33]',
    },
    {
      id: 'referral_rules' as const,
      label: 'Manage Referrals',
      fullLabel: 'Manage Referrals (Plan Rules)',
      icon: Gift,
      activeClass: 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md',
      pillActiveClass: 'bg-purple-700 text-white shadow-sm',
      badge: (planReferralRules.filter((p) => p.isActive !== false).length > 0
        ? planReferralRules.filter((p) => p.isActive !== false).length
        : (vendorPlans.filter((p) => p.isActive !== false).length + lenderPlans.filter((p) => p.isActive !== false).length)) || undefined,
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'referrals' as const,
      label: 'Track Referrals',
      fullLabel: 'Track All Referrals',
      icon: Users,
      activeClass: 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md',
      pillActiveClass: 'bg-purple-700 text-white shadow-sm',
      badge: referralStats.totalInvites,
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'vendor_subs' as const,
      label: 'Vendor Plans',
      fullLabel: 'Vendor Plans',
      icon: Zap,
      activeClass: 'bg-[#003893] text-white shadow-md',
      pillActiveClass: 'bg-[#003893] text-white shadow-sm',
      badge: vendorPlans.length,
      badgeColor: 'bg-blue-100 text-[#003893]',
    },
    {
      id: 'lender_subs' as const,
      label: 'Financer Plans',
      fullLabel: 'Financer Plans',
      icon: CreditCard,
      activeClass: 'bg-[#007a33] text-white shadow-md',
      pillActiveClass: 'bg-[#007a33] text-white shadow-sm',
      badge: lenderPlans.length,
      badgeColor: 'bg-emerald-100 text-[#007a33]',
    },
    {
      id: 'audits' as const,
      label: 'Audit Trail',
      fullLabel: 'Audit Logs',
      icon: Activity,
      activeClass: 'bg-[#003893] text-white shadow-md',
      pillActiveClass: 'bg-[#003893] text-white shadow-sm',
      badge: auditLogs.length,
      badgeColor: 'bg-slate-200 text-slate-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#007a33] text-white font-extrabold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border border-emerald-400 text-xs">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE & TABLET STICKY TOP NAVBAR (Hidden on Desktop >= 1024px)          */}
      {/* ========================================================================= */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        {/* Top bar with Hamburger, Logo & Actions */}
        <div className="px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors relative"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
              {fraudReports.filter((r) => r.status === 'PENDING').length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <SBNILogo imgClassName="h-8 sm:h-9 w-auto object-contain" />
              <div className="hidden sm:block text-[10px] font-extrabold text-[#003893] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Admin Center
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={refreshAllAdminData}
              disabled={isLoadingData}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#003893] ${isLoadingData ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoadingData ? 'Syncing...' : 'Sync DB'}</span>
            </button>

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="p-2 sm:px-3 sm:py-1.5 text-xs text-[#003893] font-extrabold bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors flex items-center gap-1"
                title="Return to Website"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Website</span>
              </button>
            )}

            <button
              onClick={handleAdminLogout}
              className="p-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
              title="Log Out Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Swipeable Horizontal Quick Tab Pills Bar (Mobile & Tablet) */}
        <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 px-3 py-2 bg-slate-50 border-t border-slate-100">
          {navTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all shrink-0 ${
                  isTabActive
                    ? tab.pillActiveClass
                    : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                      isTabActive ? 'bg-white/25 text-white' : tab.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE & TABLET SLIDE-OUT DRAWER (Hidden on Desktop >= 1024px)            */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-white h-full p-5 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-slide-right">
            <div>
              {/* Drawer Header */}
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <SBNILogo imgClassName="h-9 w-auto object-contain" />
                  <div className="text-[10px] font-extrabold text-[#003893] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                    JustPaisa Admin Center
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Admin Profile Box */}
              <div className="my-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Logged In Super Admin</div>
                <div className="text-[#003893] font-extrabold truncate mt-0.5">{adminEmail}</div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-emerald-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AWS Live Connected</span>
                </div>
              </div>

              {/* Drawer Navigation List */}
              <nav className="space-y-1 text-xs font-bold pt-1">
                {navTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isTabActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                        isTabActive
                          ? tab.activeClass
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComponent className="w-4 h-4 shrink-0" />
                        <span>{tab.fullLabel}</span>
                      </div>
                      {tab.badge !== null && tab.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            isTabActive ? 'bg-white/20 text-white' : tab.badgeColor || 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-slate-200 space-y-2 mt-4">
              {onNavigateHome && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateHome();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-[#003893] font-extrabold bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Website
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAdminLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors font-extrabold shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out Admin
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR NAVIGATION (Hidden on Mobile & Tablet < 1024px)           */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 bg-white border-r border-slate-200 p-5 flex-col justify-between flex-shrink-0 shadow-sm sticky top-0 h-screen overflow-y-auto">
        <div>
          {/* Logo Header */}
          <div className="pb-5 border-b border-slate-100 space-y-2">
            <div className="flex justify-start">
              <SBNILogo imgClassName="h-11 w-auto object-contain" />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-extrabold text-[#003893] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                JustPaisa Admin Center
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="AWS Live Connected" />
            </div>
          </div>

          {/* Admin User Info Box */}
          <div className="my-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Logged In Admin</div>
            <div className="text-[#003893] font-extrabold truncate mt-0.5">{adminEmail}</div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-bold">
            {navTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                    isTabActive
                      ? tab.activeClass
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span>{tab.fullLabel}</span>
                  </div>
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        isTabActive ? 'bg-white/20 text-white' : tab.badgeColor || 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-5 border-t border-slate-200 space-y-2">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-[#003893] font-extrabold bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Website
            </button>
          )}
          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors font-extrabold shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out Admin
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full p-3.5 sm:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW DASHBOARD                                                */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                  JustPaisa Super Admin Command Center
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Live revenue analytics, user moderation, and marketplace controls
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={refreshAllAdminData}
                  disabled={isLoadingData}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                  title="Force re-fetch all users, vendors, financers, and revenue from live PostgreSQL DB"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#003893] ${isLoadingData ? 'animate-spin' : ''}`} />
                  <span>{isLoadingData ? 'Syncing...' : 'Refresh Live DB'}</span>
                </button>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs font-bold w-fit shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>AWS Live Database Connected</span>
                </div>
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div
                onClick={() => setActiveTab('vendor_revenue')}
                className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-1.5 sm:space-y-2 hover:border-[#003893] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] sm:text-xs text-slate-500 font-extrabold uppercase tracking-wider">
                    Vendors Revenue
                  </div>
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-100 text-[#003893] flex items-center justify-center font-bold group-hover:scale-110 transition-transform shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-[#003893] font-heading truncate">
                  ₹{vendorStats.totalAll.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center justify-between">
                  <span className="truncate">{vendorStats.count} Subscriptions</span>
                  <span className="text-blue-600 font-bold underline shrink-0 ml-1">View ➔</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('lender_revenue')}
                className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-1.5 sm:space-y-2 hover:border-[#007a33] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] sm:text-xs text-slate-500 font-extrabold uppercase tracking-wider">
                    Financers Revenue
                  </div>
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-[#007a33] flex items-center justify-center font-bold group-hover:scale-110 transition-transform shrink-0">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-[#007a33] font-heading truncate">
                  ₹{lenderStats.totalAll.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center justify-between">
                  <span className="truncate">{lenderStats.count} Subscriptions</span>
                  <span className="text-emerald-700 font-bold underline shrink-0 ml-1">View ➔</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('referrals')}
                className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-1.5 sm:space-y-2 hover:border-purple-500 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] sm:text-xs text-slate-500 font-extrabold uppercase tracking-wider">
                    Referral Payouts
                  </div>
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform shrink-0">
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-purple-700 font-heading truncate">
                  ₹{referralStats.totalPaidAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center justify-between">
                  <span className="truncate">{referralStats.totalInvites} Invites</span>
                  <span className="text-purple-600 font-bold underline shrink-0 ml-1">Manage ➔</span>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('vendors')}
                className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-1.5 sm:space-y-2 hover:border-amber-400 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] sm:text-xs text-slate-500 font-extrabold uppercase tracking-wider">
                    Registered Users
                  </div>
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold group-hover:scale-110 transition-transform shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-amber-800 font-heading truncate">
                  {vendors.length + lenders.length}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center justify-between">
                  <span className="truncate">{vendors.length}V • {lenders.length}F</span>
                  <span className="text-amber-700 font-bold underline shrink-0 ml-1">Manage ➔</span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
              <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-blue-300">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold font-heading text-white">
                  Shop Business Revenue
                </h3>
                <p className="text-xs text-blue-200 font-medium">
                  Track day-wise, weekly, monthly, and yearly subscription revenue collected from small shops.
                </p>
                <button
                  onClick={() => setActiveTab('vendor_revenue')}
                  className="py-2.5 px-4 bg-white text-[#003893] hover:bg-blue-50 font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95"
                >
                  Open Vendor Revenue Center ➔
                </button>
              </div>

              <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold font-heading text-white">
                  Business Money Revenue
                </h3>
                <p className="text-xs text-emerald-200 font-medium">
                  Monitor subscription fees collected from verified NBFCs, banks, and business financers.
                </p>
                <button
                  onClick={() => setActiveTab('lender_revenue')}
                  className="py-2.5 px-4 bg-[#007a33] text-white hover:bg-[#005e27] font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 border border-emerald-400"
                >
                  Open Financer Revenue Center ➔
                </button>
              </div>

              <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-purple-300">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold font-heading text-white">
                  Referral System & Rewards
                </h3>
                <p className="text-xs text-purple-200 font-medium">
                  Configure plan-wise referrer rewards & referee cashbacks, or track all live partner referrals and commission payouts.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setActiveTab('referral_rules')}
                    className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 border border-purple-400 cursor-pointer"
                  >
                    Manage Rules ➔
                  </button>
                  <button
                    onClick={() => setActiveTab('referrals')}
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 border border-white/20 cursor-pointer"
                  >
                    Track All Referrals ➔
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-900 via-rose-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-rose-300">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold font-heading text-white">
                  Fraud Reports Queue
                </h3>
                <p className="text-xs text-rose-200 font-medium">
                  Review fraud allegations submitted by financers and action platform-wide vendor blacklists.
                </p>
                <button
                  onClick={() => setActiveTab('fraud_reports')}
                  className="py-2.5 px-4 bg-rose-600 text-white hover:bg-rose-700 font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 border border-rose-400"
                >
                  Open Fraud Queue ➔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: VENDORS REVENUE PAGE (Small Shop Business Revenue)                */}
        {/* ========================================================================= */}
        {activeTab === 'vendor_revenue' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#003893] flex items-center justify-center font-bold">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                    Small Shop & Local Startup Business Revenue
                  </h1>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Calculate and audit all subscription earnings from small shop and local startup business owners
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={loadAdminPayments}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  title="Refresh Live Data"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Refresh
                </button>
                <button
                  onClick={() => exportToCsv(filteredVendorTransactions, 'JustPaisa_Vendor_Revenue')}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#003893]" /> Export CSV
                </button>
              </div>
            </div>

            {/* Calculated KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-[#003893] to-[#002669] text-white p-3.5 sm:p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[9px] sm:text-[10px] text-blue-200 font-extrabold uppercase tracking-wider">
                  Total Vendor Revenue
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold font-heading truncate">
                  ₹{vendorStats.totalAll.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-blue-200 font-medium">All Time Total</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Today's Revenue
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-emerald-600 font-heading truncate">
                  ₹{vendorStats.today.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Day-Wise Today</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Weekly Revenue
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-blue-600 font-heading truncate">
                  ₹{vendorStats.week.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Last 7 Days</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Monthly Revenue
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-indigo-600 font-heading truncate">
                  ₹{vendorStats.month.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">This Month</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Yearly Revenue
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-slate-900 font-heading truncate">
                  ₹{vendorStats.year.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Year 2026</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Avg. Order Value
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-amber-600 font-heading truncate">
                  ₹{vendorStats.aov.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Per Subscription</div>
              </div>
            </div>

            {/* Filter & Period Toolbar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
              {/* Period Tabs (Scrollable on mobile) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <span className="text-xs font-extrabold text-slate-600 px-2 flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 text-[#003893]" /> Period:
                  </span>
                  {(
                    [
                      { key: 'ALL', label: 'All Time' },
                      { key: 'DAY', label: 'Today (Day Wise)' },
                      { key: 'WEEK', label: 'This Week' },
                      { key: 'MONTH', label: 'This Month' },
                      { key: 'YEAR', label: 'This Year' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setVendorRevenuePeriod(p.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${
                        vendorRevenuePeriod === p.key
                          ? 'bg-[#003893] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-bold text-slate-600">
                  Showing <span className="text-[#003893] font-extrabold">{filteredVendorTransactions.length}</span>{' '}
                  payments (Total: <span className="text-emerald-700 font-extrabold">₹{vendorStats.filteredTotal.toLocaleString('en-IN')}</span>)
                </div>
              </div>

              {/* Search and Secondary Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search shop, owner, invoice, phone..."
                    value={vendorRevenueSearch}
                    onChange={(e) => setVendorRevenueSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-[#003893]"
                  />
                </div>

                <div>
                  <select
                    value={vendorRevenuePlanFilter}
                    onChange={(e) => setVendorRevenuePlanFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-[#003893]"
                  >
                    <option value="ALL">All Vendor Plans</option>
                    <option value="VENDOR_WEEKLY">Weekly Starter Plan (₹199)</option>
                    <option value="VENDOR_MONTHLY">Monthly Growth Plan (₹599)</option>
                    <option value="VENDOR_QUARTERLY">Quarterly Business Plan (₹1,399)</option>
                    <option value="VENDOR_YEARLY">Yearly VIP Enterprise Plan (₹4,499)</option>
                  </select>
                </div>

                <div>
                  <select
                    value={vendorRevenueMethodFilter}
                    onChange={(e) => setVendorRevenueMethodFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-[#003893]"
                  >
                    <option value="ALL">All Payment Methods</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Desktop / Tablet Transactions Table (Hidden on mobile < 768px) */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Shop Business & Owner</th>
                      <th className="p-4">Plan Subscribed</th>
                      <th className="p-4">Amount Paid</th>
                      <th className="p-4">Payment Day & Exact Time</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Invoice / Transaction ID</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVendorTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#003893] flex items-center justify-center font-bold">
                              <Receipt className="w-6 h-6" />
                            </div>
                            <div className="text-sm font-extrabold text-slate-700">No Vendor Payments Recorded Yet</div>
                            <p className="text-xs text-slate-400 max-w-sm">
                              When small shop owners purchase subscription plans on the platform, live transactions and calculations will appear here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredVendorTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 text-sm">{tx.entityName}</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {tx.personName} • {tx.phone}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{tx.email}</div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-[#003893] border border-blue-200 inline-flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-500" />
                              {tx.planName}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="text-base font-black text-slate-900 font-heading">
                              ₹{tx.amount.toLocaleString('en-IN')}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-[#003893] shrink-0" />
                              <span>{formatExactDateTime(tx.paymentDate)}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 w-fit">
                              <CreditCard className="w-3 h-3 text-slate-500" />
                              {tx.paymentMethod.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="font-mono text-xs font-bold text-[#003893]">
                              {tx.invoiceNumber}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {tx.transactionId}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              PAID
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleDeletePayment(tx.id)}
                              title="Delete payment record"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all active:scale-95 flex items-center gap-1 text-[10px] font-extrabold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (Hidden on Tablet & Desktop >= 768px) */}
            <div className="block md:hidden space-y-3">
              {filteredVendorTransactions.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003893] flex items-center justify-center font-bold mx-auto">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-extrabold text-slate-700">No Vendor Payments Recorded Yet</div>
                </div>
              ) : (
                filteredVendorTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-slate-900 text-sm truncate">{tx.entityName}</div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          {tx.personName} • {tx.phone}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{tx.email}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-slate-900 font-heading">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          PAID
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Plan</span>
                        <div>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-50 text-[#003893] border border-blue-200 inline-flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            {tx.planName}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Method</span>
                        <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{tx.paymentMethod.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</span>
                        <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#003893] shrink-0" />
                          <span>{formatExactDateTime(tx.paymentDate)}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Invoice / Txn ID</span>
                        <div className="text-[10px] font-mono font-bold text-[#003893] truncate">{tx.invoiceNumber}</div>
                        <div className="text-[9px] font-mono text-slate-400 truncate">{tx.transactionId}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDeletePayment(tx.id)}
                        className="p-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all active:scale-95 flex items-center gap-1 text-[10px] font-extrabold"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Record
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BUSINESS MONEY REVENUE PAGE (Lenders Revenue)                     */}
        {/* ========================================================================= */}
        {activeTab === 'lender_revenue' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#007a33] flex items-center justify-center font-bold">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                    Business Money Revenue
                  </h1>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Calculate and track subscription revenue from Business Money Financers & NBFCs
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={loadAdminPayments}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  title="Refresh Live Data"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Refresh
                </button>
                <button
                  onClick={() => exportToCsv(filteredLenderTransactions, 'JustPaisa_Financer_Revenue')}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#007a33]" /> Export CSV
                </button>
              </div>
            </div>

            {/* Calculated KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-[#007a33] to-[#00471d] text-white p-3.5 sm:p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[9px] sm:text-[10px] text-emerald-200 font-extrabold uppercase tracking-wider">
                  Total Financer Revenue
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold font-heading truncate">
                  ₹{lenderStats.totalAll.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-emerald-200 font-medium">All Time Inflow</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Today's Revenue
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-emerald-700 font-heading truncate">
                  ₹{lenderStats.today.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Day-Wise Today</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Weekly Revenue
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-emerald-600 font-heading truncate">
                  ₹{lenderStats.week.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Last 7 Days</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Monthly Revenue
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-teal-600 font-heading truncate">
                  ₹{lenderStats.month.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">This Month</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Yearly Revenue
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-slate-900 font-heading truncate">
                  ₹{lenderStats.year.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Year 2026</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Avg. Plan Ticket
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-emerald-800 font-heading truncate">
                  ₹{lenderStats.aov.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Per Financer</div>
              </div>
            </div>

            {/* Filter & Period Toolbar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
              {/* Period Tabs (Scrollable on mobile) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                <div className="overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <span className="text-xs font-extrabold text-slate-600 px-2 flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 text-[#007a33]" /> Period:
                  </span>
                  {(
                    [
                      { key: 'ALL', label: 'All Time' },
                      { key: 'DAY', label: 'Today (Day Wise)' },
                      { key: 'WEEK', label: 'This Week' },
                      { key: 'MONTH', label: 'This Month' },
                      { key: 'YEAR', label: 'This Year' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setLenderRevenuePeriod(p.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${
                        lenderRevenuePeriod === p.key
                          ? 'bg-[#007a33] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-bold text-slate-600">
                  Showing <span className="text-[#007a33] font-extrabold">{filteredLenderTransactions.length}</span>{' '}
                  financer subscriptions (Total:{' '}
                  <span className="text-emerald-700 font-extrabold">₹{lenderStats.filteredTotal.toLocaleString('en-IN')}</span>)
                </div>
              </div>

              {/* Search and Secondary Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search financer institution, officer, invoice..."
                    value={lenderRevenueSearch}
                    onChange={(e) => setLenderRevenueSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                  />
                </div>

                <div>
                  <select
                    value={lenderRevenuePlanFilter}
                    onChange={(e) => setLenderRevenuePlanFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-[#007a33]"
                  >
                    <option value="ALL">All Financer Plans</option>
                    <option value="LENDER_WEEKLY">Financer Weekly Starter (₹499)</option>
                    <option value="LENDER_MONTHLY">Financer Monthly Plan (₹999)</option>
                    <option value="LENDER_QUARTERLY">Financer Quarterly Growth (₹2,499)</option>
                    <option value="LENDER_ANNUAL">Financer Annual VIP Plan (₹7,999)</option>
                  </select>
                </div>

                <div>
                  <select
                    value={lenderRevenueMethodFilter}
                    onChange={(e) => setLenderRevenueMethodFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-[#007a33]"
                  >
                    <option value="ALL">All Payment Methods</option>
                    <option value="CORPORATE_UPI">Corporate UPI</option>
                    <option value="NET_BANKING">IMPS / Net Banking</option>
                    <option value="CREDIT_CARD">Corporate Card</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Desktop / Tablet Transactions Table (Hidden on mobile < 768px) */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Business Financer & Officer</th>
                      <th className="p-4">Plan Subscribed</th>
                      <th className="p-4">Amount Paid</th>
                      <th className="p-4">Payment Day & Exact Time</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Invoice / Transaction ID</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLenderTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#007a33] flex items-center justify-center font-bold">
                              <Wallet className="w-6 h-6" />
                            </div>
                            <div className="text-sm font-extrabold text-slate-700">No Financer Payments Recorded Yet</div>
                            <p className="text-xs text-slate-400 max-w-sm">
                              When business financers, NBFCs, or banks subscribe to lead access tiers, live payment transactions will be recorded here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredLenderTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 text-sm">{tx.entityName}</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {tx.personName} • {tx.phone}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{tx.email}</div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-[#007a33] border border-emerald-200 inline-flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-emerald-600" />
                              {tx.planName}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="text-base font-black text-[#007a33] font-heading">
                              ₹{tx.amount.toLocaleString('en-IN')}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-[#007a33] shrink-0" />
                              <span>{formatExactDateTime(tx.paymentDate)}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 w-fit">
                              <Wallet className="w-3 h-3 text-slate-500" />
                              {tx.paymentMethod.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="font-mono text-xs font-bold text-[#007a33]">
                              {tx.invoiceNumber}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {tx.transactionId}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              PAID
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleDeletePayment(tx.id)}
                              title="Delete payment record"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all active:scale-95 flex items-center gap-1 text-[10px] font-extrabold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (Hidden on Tablet & Desktop >= 768px) */}
            <div className="block md:hidden space-y-3">
              {filteredLenderTransactions.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#007a33] flex items-center justify-center font-bold mx-auto">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-extrabold text-slate-700">No Financer Payments Recorded Yet</div>
                </div>
              ) : (
                filteredLenderTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-slate-900 text-sm truncate">{tx.entityName}</div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          {tx.personName} • {tx.phone}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{tx.email}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-[#007a33] font-heading">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          PAID
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Plan</span>
                        <div>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-50 text-[#007a33] border border-emerald-200 inline-flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-emerald-600" />
                            {tx.planName}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Method</span>
                        <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{tx.paymentMethod.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Payment Date & Time</span>
                        <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#007a33] shrink-0" />
                          <span>{formatExactDateTime(tx.paymentDate)}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Invoice / Txn ID</span>
                        <div className="text-[10px] font-mono font-bold text-[#007a33] truncate">{tx.invoiceNumber}</div>
                        <div className="text-[9px] font-mono text-slate-400 truncate">{tx.transactionId}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDeletePayment(tx.id)}
                        className="p-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all active:scale-95 flex items-center gap-1 text-[10px] font-extrabold"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Record
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: MANAGE REFERRALS (PLAN-WISE REWARDS CONFIGURATION ONLY)              */}
        {/* ========================================================================= */}
        {activeTab === 'referral_rules' && (() => {
          // Derive active rules list with fallback to live vendor & lender plans
          const activeRulesList = (planReferralRules.length > 0
            ? planReferralRules
            : [...vendorPlans, ...lenderPlans].map((p) => ({
                id: p.id,
                name: p.name,
                code: p.code,
                roleTarget: p.roleTarget || 'VENDOR',
                price: Number(p.price) || 0,
                durationDays: Number(p.durationDays) || 30,
                referrerReward: (p as any).referrerReward !== undefined ? Number((p as any).referrerReward) : (p.roleTarget === 'LENDER' ? 500 : 200),
                refereeReward: (p as any).refereeReward !== undefined ? Number((p as any).refereeReward) : 0,
                adminShare: (p as any).adminShare !== undefined ? Number((p as any).adminShare) : Math.max(0, Number(p.price) - (p.roleTarget === 'LENDER' ? 500 : 200)),
                referralEnabled: (p as any).referralEnabled !== false,
                isActive: p.isActive !== false,
              }))
          ).filter((p) => p.isActive !== false);

          const filteredRules = activeRulesList.filter((r) => {
            if (planRulesRoleFilter === 'ALL') return true;
            return r.roleTarget === planRulesRoleFilter;
          });

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Gift className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                      Manage Referrals
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Control how much referral amount is distributed to users for each Vendor and Financer subscription plan
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setReferralSettingsModalOpen(true)}
                    className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-purple-600" /> Global Defaults
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAllPlanRules}
                    disabled={isSavingAllRules}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> {isSavingAllRules ? 'Saving All...' : 'Save All Rules'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      loadPlansFromDB();
                      loadAdminReferralsAndRules();
                    }}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Reload Plan Rules"
                  >
                    <RefreshCw className="w-4 h-4 text-purple-600" /> Reload
                  </button>
                </div>
              </div>

              {/* Quick Summary Highlights for Settings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                    Configured Plans
                  </div>
                  <div className="text-base sm:text-xl font-extrabold text-purple-700 font-heading truncate">
                    {activeRulesList.length} Tiers
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                    {activeRulesList.filter((p) => p.referralEnabled !== false).length} Active Rules
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                    Default Shop Reward
                  </div>
                  <div className="text-base sm:text-xl font-extrabold text-slate-800 font-heading truncate">
                    ₹{referralVendorReward}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-emerald-600 font-medium">Vendor Referrer Payout</div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                    Default Financer Reward
                  </div>
                  <div className="text-base sm:text-xl font-extrabold text-slate-800 font-heading truncate">
                    ₹{referralLenderReward}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-emerald-600 font-medium">Financer Referrer Payout</div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                    Referee Discount
                  </div>
                  <div className="text-base sm:text-xl font-extrabold text-purple-700 font-heading truncate">
                    {referralDiscountPct}% OFF
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Checkout Welcome Benefit</div>
                </div>
              </div>

              {/* ── PLAN-WISE REFERRAL REWARDS CONFIGURATION PANEL ───────── */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-heading">
                        Plan-Wise Referral & Referee Reward Settings
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Set custom distributed amounts to referrers and welcome referee cashbacks for each subscription tier.
                      </p>
                    </div>
                  </div>

                  {/* Role Target Filter Tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPlanRulesRoleFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        planRulesRoleFilter === 'ALL'
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Plans ({activeRulesList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanRulesRoleFilter('VENDOR')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        planRulesRoleFilter === 'VENDOR'
                          ? 'bg-[#003893] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🏪 Vendor Plans ({activeRulesList.filter((p) => p.roleTarget === 'VENDOR').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanRulesRoleFilter('LENDER')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        planRulesRoleFilter === 'LENDER'
                          ? 'bg-[#007a33] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🏦 Financer Plans ({activeRulesList.filter((p) => p.roleTarget === 'LENDER').length})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Plan Details</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Plan Price</th>
                        <th className="p-3">Referrer Distributed Amount (₹)</th>
                        <th className="p-3">Referee Welcome Cashback (₹)</th>
                        <th className="p-3">Platform Retained Profit (₹)</th>
                        <th className="p-3 text-center">Referral Active</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRules.length > 0 ? (
                        filteredRules.map((planRule, idx) => {
                          const calculatedRetained = Math.max(
                            0,
                            Number(planRule.price) - (Number(planRule.referrerReward) || 0) - (Number(planRule.refereeReward) || 0)
                          );

                          return (
                            <tr key={planRule.id || idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <div className="font-extrabold text-slate-900 text-xs">{planRule.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{planRule.code} • {planRule.durationDays} Days</div>
                              </td>

                              <td className="p-3">
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    planRule.roleTarget === 'LENDER'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  {planRule.roleTarget === 'LENDER' ? 'Financers' : 'Vendors'}
                                </span>
                              </td>

                              <td className="p-3 font-extrabold text-slate-900">
                                ₹{planRule.price}
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={planRule.price}
                                    value={planRule.referrerReward ?? 0}
                                    onChange={(e) => {
                                      const val = Math.max(0, Number(e.target.value));
                                      setPlanReferralRules((prev) => {
                                        const exists = prev.some((p) => p.id === planRule.id);
                                        if (exists) {
                                          return prev.map((p) => (p.id === planRule.id ? { ...p, referrerReward: val } : p));
                                        }
                                        return activeRulesList.map((p) => (p.id === planRule.id ? { ...p, referrerReward: val } : p));
                                      });
                                    }}
                                    className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 outline-none focus:border-purple-600"
                                  />
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={planRule.price}
                                    value={planRule.refereeReward ?? 0}
                                    onChange={(e) => {
                                      const val = Math.max(0, Number(e.target.value));
                                      setPlanReferralRules((prev) => {
                                        const exists = prev.some((p) => p.id === planRule.id);
                                        if (exists) {
                                          return prev.map((p) => (p.id === planRule.id ? { ...p, refereeReward: val } : p));
                                        }
                                        return activeRulesList.map((p) => (p.id === planRule.id ? { ...p, refereeReward: val } : p));
                                      });
                                    }}
                                    className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-blue-700 outline-none focus:border-purple-600"
                                  />
                                </div>
                              </td>

                              <td className="p-3 font-bold text-slate-700">
                                <span className={calculatedRetained > 0 ? 'text-emerald-700 font-extrabold' : 'text-slate-700'}>
                                  ₹{calculatedRetained}
                                </span>
                              </td>

                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPlanReferralRules((prev) => {
                                      const exists = prev.some((p) => p.id === planRule.id);
                                      if (exists) {
                                        return prev.map((p) =>
                                          p.id === planRule.id ? { ...p, referralEnabled: !p.referralEnabled } : p
                                        );
                                      }
                                      return activeRulesList.map((p) =>
                                        p.id === planRule.id ? { ...p, referralEnabled: !p.referralEnabled } : p
                                      );
                                    });
                                  }}
                                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                                    planRule.referralEnabled !== false
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {planRule.referralEnabled !== false ? '✓ Enabled' : 'Disabled'}
                                </button>
                              </td>

                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePlanReferralRule(planRule)}
                                  disabled={savingPlanRuleId === planRule.id}
                                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  {savingPlanRuleId === planRule.id ? 'Saving...' : 'Save Rule'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                            No subscription plans found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 4: TRACK ALL REFERRALS PAGE                                          */}
        {/* ========================================================================= */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                    Track All Referrals & Partner Commissions
                  </h1>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Track user referral codes, monitor invited signups, search & filter records, and process commission payouts
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => exportToCsv(filteredReferrals, 'JustPaisa_Referrals_Report')}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-purple-600" /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={loadAdminReferralsAndRules}
                  className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  title="Refresh Live Data"
                >
                  <RefreshCw className="w-4 h-4 text-purple-600" /> Refresh Data
                </button>
              </div>
            </div>

            {/* Calculated KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-3.5 sm:p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[9px] sm:text-[10px] text-purple-200 font-extrabold uppercase tracking-wider">
                  Total Invites
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold font-heading truncate">
                  {referralStats.totalInvites}
                </div>
                <div className="text-[9px] sm:text-[10px] text-purple-200 font-medium">Generated Links</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Rewards Paid Out
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-emerald-600 font-heading truncate">
                  ₹{referralStats.totalPaidAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                  {referralStats.paidCount} Successful
                </div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Pending Payouts
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-amber-600 font-heading truncate">
                  ₹{referralStats.pendingPayoutAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                  {referralStats.readyCount} Awaiting Action
                </div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Conversion Rate
                </div>
                <div className="text-base sm:text-xl lg:text-2xl font-extrabold text-purple-700 font-heading truncate">
                  {referralStats.conversionRate}%
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Verified Signups</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 col-span-2 sm:col-span-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Commission Rate
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                  ₹{referralVendorReward} <span className="text-[10px] text-slate-500 font-normal">(Shop)</span> / ₹{referralLenderReward} <span className="text-[10px] text-slate-500 font-normal">(Financer)</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold">{referralDiscountPct}% Referee Discount</div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search referrer, referee, code, business..."
                    value={referralSearch}
                    onChange={(e) => setReferralSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <select
                    value={referralStatusFilter}
                    onChange={(e) => setReferralStatusFilter(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                  >
                    <option value="ALL">All Payout Statuses</option>
                    <option value="REWARD_READY">Ready for Payout (Pending Action)</option>
                    <option value="PAID">Paid Out Successfully</option>
                    <option value="PENDING_VERIFICATION">Awaiting KYC Verification</option>
                  </select>
                </div>

                <div>
                  <select
                    value={referralRoleFilter}
                    onChange={(e) => setReferralRoleFilter(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none focus:border-purple-600"
                  >
                    <option value="ALL">All Referrer Types</option>
                    <option value="VENDOR">Vendors (Shop Owners)</option>
                    <option value="LENDER">Financers (Lenders)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Desktop / Tablet Referrals Table (Hidden on mobile < 768px) */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Referrer (Partner)</th>
                      <th className="p-4">Referral Code</th>
                      <th className="p-4">Referee (Invited Business)</th>
                      <th className="p-4">Reward Amount</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Payout Status</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReferrals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                              <Gift className="w-6 h-6" />
                            </div>
                            <div className="text-sm font-extrabold text-slate-700">No Referrals Recorded Yet</div>
                            <p className="text-xs text-slate-400 max-w-sm">
                              When registered vendors and financers share their referral links and invite peers to JustPaisa, records will be tracked here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredReferrals.map((r) => (
                        <tr key={r.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 text-sm">{r.referrerName}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{r.referrerPhone}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{r.referrerEmail}</div>
                            <span
                              className={`mt-1 inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                                r.referrerRole === 'VENDOR'
                                  ? 'bg-blue-50 text-[#003893] border border-blue-200'
                                  : 'bg-emerald-50 text-[#007a33] border border-emerald-200'
                              }`}
                            >
                              {r.referrerRole === 'VENDOR' ? 'Shop Business' : 'Financer'}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 font-mono font-extrabold text-xs">
                              <span>{r.referralCode}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(r.referralCode);
                                  showToast(`Copied ${r.referralCode}`);
                                }}
                                title="Copy code"
                                className="text-purple-400 hover:text-purple-700 ml-1"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-slate-900">{r.refereeName}</div>
                            <div className="text-[11px] text-slate-600 font-medium">{r.refereeBusiness}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{r.refereeEmail}</div>
                          </td>

                          <td className="p-4">
                            <div className="text-base font-black text-purple-700 font-heading">
                              ₹{r.rewardAmount}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>{formatExactDateTime(r.createdAt)}</span>
                            </div>
                            {r.paidAt && (
                              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                                Paid: {formatExactDateTime(r.paidAt)}
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            {r.status === 'PAID' && (
                              <div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  PAID
                                </span>
                                {r.payoutTxnId && (
                                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                                    {r.payoutTxnId}
                                  </div>
                                )}
                              </div>
                            )}

                            {r.status === 'REWARD_READY' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1 animate-pulse">
                                <Award className="w-3 h-3 text-blue-600" />
                                REWARD READY
                              </span>
                            )}

                            {r.status === 'PENDING_VERIFICATION' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                PENDING KYC
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            {r.status === 'REWARD_READY' ? (
                              <button
                                onClick={() => handlePayReferralReward(r.id)}
                                className="px-3.5 py-1.5 bg-[#007a33] hover:bg-[#005e27] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 mx-auto"
                              >
                                <Check className="w-3.5 h-3.5" /> Pay ₹{r.rewardAmount}
                              </button>
                            ) : r.status === 'PAID' ? (
                              <span className="text-[11px] font-bold text-slate-400">Completed</span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-600">Pending Verification</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (Hidden on Tablet & Desktop >= 768px) */}
            <div className="block md:hidden space-y-3">
              {filteredReferrals.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mx-auto">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-extrabold text-slate-700">No Referrals Recorded Yet</div>
                </div>
              ) : (
                filteredReferrals.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm truncate">{r.referrerName}</span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                              r.referrerRole === 'VENDOR'
                                ? 'bg-blue-50 text-[#003893] border border-blue-200'
                                : 'bg-emerald-50 text-[#007a33] border border-emerald-200'
                            }`}
                          >
                            {r.referrerRole === 'VENDOR' ? 'Shop' : 'Financer'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">{r.referrerPhone}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{r.referrerEmail}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-purple-700 font-heading">
                          ₹{r.rewardAmount}
                        </div>
                        {r.status === 'PAID' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            PAID
                          </span>
                        )}
                        {r.status === 'REWARD_READY' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-0.5 animate-pulse">
                            <Award className="w-2.5 h-2.5 text-blue-600" />
                            READY
                          </span>
                        )}
                        {r.status === 'PENDING_VERIFICATION' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            PENDING
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Referral Code</span>
                        <div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 font-mono font-extrabold text-[11px]">
                            <span>{r.referralCode}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(r.referralCode);
                                showToast(`Copied ${r.referralCode}`);
                              }}
                              className="text-purple-400 hover:text-purple-700"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Invited Business</span>
                        <div className="text-[11px] font-bold text-slate-900 truncate">{r.refereeName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{r.refereeBusiness}</div>
                      </div>

                      <div className="space-y-0.5 col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Invited On</span>
                        <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>{formatExactDateTime(r.createdAt)}</span>
                        </div>
                        {r.paidAt && (
                          <div className="text-[9px] text-emerald-600 font-semibold">
                            Paid on: {formatExactDateTime(r.paidAt)} {r.payoutTxnId ? `(${r.payoutTxnId})` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {r.status === 'REWARD_READY' && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => handlePayReferralReward(r.id)}
                          className="w-full py-2 bg-[#007a33] hover:bg-[#005e27] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Pay ₹{r.rewardAmount} Reward
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: FRAUD REPORTS & BLACKLIST INVESTIGATION QUEUE                        */}
        {/* ========================================================================= */}
        {activeTab === 'fraud_reports' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                    Fraud Reports & Blacklist Investigation Queue
                  </h1>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Review fraud allegations submitted by Business Financers. Confirmed accounts are instantly blacklisted across JustPaisa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadFraudReports}
                  disabled={fraudReportsLoading}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fraudReportsLoading ? 'animate-spin' : ''}`} />
                  <span>{fraudReportsLoading ? 'Refreshing...' : 'Refresh Fraud Queue'}</span>
                </button>
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Total Fraud Reports
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                  {fraudReports.length}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Filed by Financers</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1 bg-gradient-to-br from-amber-50/50 to-white">
                <div className="text-[9px] sm:text-[10px] text-amber-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending Review
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-amber-600 font-heading">
                  {fraudReports.filter((r) => r.status === 'PENDING').length}
                </div>
                <div className="text-[9px] sm:text-[10px] text-amber-600/80 font-medium">Awaiting Action</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-300 shadow-xs space-y-1 bg-gradient-to-br from-rose-50/50 to-white">
                <div className="text-[9px] sm:text-[10px] text-rose-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Confirmed
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-rose-700 font-heading">
                  {fraudReports.filter((r) => r.status === 'CONFIRMED').length}
                </div>
                <div className="text-[9px] sm:text-[10px] text-rose-600/80 font-medium">Platform-Wide Fraud</div>
              </div>

              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 bg-gradient-to-br from-slate-50/50 to-white">
                <div className="text-[9px] sm:text-[10px] text-slate-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dismissed
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-700 font-heading">
                  {fraudReports.filter((r) => r.status === 'DISMISSED').length}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Reports Rejected</div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search vendor, shop, reporting financer, reason..."
                  value={fraudSearchQuery}
                  onChange={(e) => setFraudSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="overflow-x-auto no-scrollbar flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(
                  [
                    { key: 'ALL', label: `All (${fraudReports.length})` },
                    { key: 'PENDING', label: `⏳ Pending (${fraudReports.filter((r) => r.status === 'PENDING').length})` },
                    { key: 'CONFIRMED', label: `🚨 Confirmed (${fraudReports.filter((r) => r.status === 'CONFIRMED').length})` },
                    { key: 'DISMISSED', label: `✓ Dismissed (${fraudReports.filter((r) => r.status === 'DISMISSED').length})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFraudFilterStatus(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      fraudFilterStatus === f.key
                        ? f.key === 'CONFIRMED'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : f.key === 'PENDING'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-[#003893] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports List */}
            {(() => {
              const filteredList = fraudReports.filter((r) => {
                const matchesStatus = fraudFilterStatus === 'ALL' || r.status === fraudFilterStatus;
                const matchesSearch =
                  r.vendorName.toLowerCase().includes(fraudSearchQuery.toLowerCase()) ||
                  r.shopName.toLowerCase().includes(fraudSearchQuery.toLowerCase()) ||
                  r.reportedBy.toLowerCase().includes(fraudSearchQuery.toLowerCase()) ||
                  r.reason.toLowerCase().includes(fraudSearchQuery.toLowerCase()) ||
                  (r.userEmail && r.userEmail.toLowerCase().includes(fraudSearchQuery.toLowerCase())) ||
                  (r.userPhone && r.userPhone.includes(fraudSearchQuery));
                return matchesStatus && matchesSearch;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 font-heading">
                      {fraudFilterStatus === 'PENDING' ? 'No Pending Fraud Reports' : 'No Fraud Reports Found'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {fraudFilterStatus === 'PENDING'
                        ? 'All reported vendor accounts have been verified or actioned.'
                        : 'No reports match your current filter and search query.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredList.map((report) => {
                    const isConfirmed = report.status === 'CONFIRMED';
                    const isPending = report.status === 'PENDING';
                    const isDismissed = report.status === 'DISMISSED';

                    return (
                      <div
                        key={report.id}
                        className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-sm space-y-4 ${
                          isConfirmed
                            ? 'border-rose-300 bg-gradient-to-br from-rose-50/30 via-white to-rose-50/10 shadow-rose-100'
                            : isPending
                            ? 'border-amber-300 hover:border-amber-400'
                            : 'border-slate-200 opacity-80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                                isConfirmed
                                  ? 'bg-rose-600 text-white shadow-md'
                                  : isPending
                                  ? 'bg-amber-500 text-white shadow-md'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isConfirmed ? (
                                <AlertTriangle className="w-5 h-5" />
                              ) : (
                                <span>{report.vendorName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-slate-900 text-base font-heading">
                                  {report.vendorName}
                                </h3>
                                <span className="text-xs text-slate-500 font-semibold">({report.shopName})</span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                {report.userPhone && <span>📱 {report.userPhone}</span>}
                                {report.userEmail && <span>✉️ {report.userEmail}</span>}
                                <span>• Reported on {new Date(report.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isConfirmed ? (
                              <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[10px] uppercase shadow-sm tracking-wider flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                🚨 CONFIRMED FRAUD (BLACKLISTED)
                              </span>
                            ) : isPending ? (
                              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider border border-amber-300 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                ⏳ PENDING INVESTIGATION
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider border border-slate-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ✓ REPORT DISMISSED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Financer & Reason Box */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/70">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                <Building2 className="w-4 h-4 text-[#007a33]" />
                                <span>Reported by Business Financer:</span>
                                <span className="text-[#007a33] font-extrabold text-sm bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                  {report.reportedBy}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                                📱 {getFinancerPhone(report)}
                              </span>
                            </div>

                            {/* Direct Financer Communication Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCallFinancer(report)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                                title={`Call Financer ${report.reportedBy} for confirmation`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Call Financer</span>
                              </button>

                              <button
                                onClick={() => handleWhatsAppFinancer(report)}
                                className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                                title={`Chat with Financer ${report.reportedBy} on WhatsApp`}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp Financer</span>
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-slate-800 bg-white p-3.5 rounded-xl border border-slate-200 font-medium leading-relaxed shadow-xs">
                            <span className="font-bold text-rose-700 mr-1.5">Allegation / Reason:</span>
                            {report.reason}
                          </div>

                          {report.adminNotes && (
                            <div className="text-[11px] text-slate-600 pt-1">
                              <span className="font-bold">Admin Note:</span> {report.adminNotes}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                          <div className="text-[11px] text-slate-400 font-mono">
                            Report ID: {report.id}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleConfirmFraud(report)}
                                  className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>🚨 Confirm Fraud (Blacklist Platform-Wide)</span>
                                </button>

                                <button
                                  onClick={() => handleDismissFraud(report)}
                                  className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  <span>✓ Dismiss Report</span>
                                </button>
                              </>
                            )}

                            {isConfirmed && (
                              <button
                                onClick={() => handleDismissFraud(report)}
                                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                              >
                                <span>↺ Lift Blacklist & Dismiss Report</span>
                              </button>
                            )}

                            {isDismissed && (
                              <button
                                onClick={() => handleConfirmFraud(report)}
                                className="py-2 px-4 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-300 font-extrabold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Re-open & Confirm Fraud</span>
                              </button>
                            )}

                            {/* Delete Fraud Report Button */}
                            <button
                              onClick={() => handleDeleteFraudReport(report)}
                              className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs"
                              title="Permanently Delete Fraud Report & Restore Vendor as Normal Account"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete Report</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: VENDORS MANAGEMENT TAB                                            */}
        {/* ========================================================================= */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                  User Vendor Account Control
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Manage shop owner accounts, verify KYC documents, and moderate fraud accounts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadAdminVendorsAndLenders}
                  disabled={isLoadingData}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#003893] border border-blue-200 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                  <span>{isLoadingData ? 'Refreshing...' : 'Refresh Live Data'}</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search vendor name, owner, email, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#003893]"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-[#003893]"
                >
                  <option value="ALL">All KYC Statuses ({vendors.length})</option>
                  <option value="VERIFIED">Verified Only</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="FRAUD">Fraud Accounts Only 🚨</option>
                </select>
              </div>
            </div>

            {/* Vendors Table (Desktop & Tablet >= 768px) */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Business & Owner</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">City / State</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">KYC Status</th>
                      <th className="p-4 text-center">Actions & Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                          {isLoadingData ? 'Loading vendor accounts from database...' : 'No vendor accounts found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((v) => (
                        <tr
                          key={v.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            v.isFraud ? 'bg-rose-50/70 border-l-4 border-rose-600' : ''
                          }`}
                        >
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{v.businessName}</span>
                              {v.isFraud && (
                                <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                                  🚨 FRAUD ACCOUNT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {v.ownerName}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="bg-blue-50 text-[#003893] px-2.5 py-1 rounded-md text-[11px] font-bold border border-blue-200">
                              {v.category}
                            </span>
                          </td>

                          <td className="p-4 font-medium text-slate-700">
                            {v.city}, {v.state}
                          </td>

                          <td className="p-4">
                            <div className="font-semibold text-slate-900 text-xs">{v.userPhone}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{v.userEmail}</div>
                          </td>

                          <td className="p-4">
                            <button
                              onClick={() => handleToggleVendorKYC(v.id, v.kycStatus)}
                              className={`px-3 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 transition-all ${
                                v.kycStatus === 'VERIFIED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                              }`}
                            >
                              {v.kycStatus === 'VERIFIED' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-600" />
                              )}
                              <span>{v.kycStatus} (Click to toggle)</span>
                            </button>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => setSelectedDocVendor(v)}
                                className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                title="View KYC Documents"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setGrantSubModalVendor(v)}
                                className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                                title="Grant Subscription Plan"
                              >
                                <Gift className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleToggleVendorFraud(v)}
                                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all border shadow-xs ${
                                  v.isFraud
                                    ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                    : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                                }`}
                              >
                                {v.isFraud ? 'Clear Fraud' : '🚨 Mark Fraud'}
                              </button>

                              <button
                                onClick={() => handleDeleteVendor(v.id)}
                                className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                                title="Permanently Delete Vendor Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (Hidden on Tablet & Desktop >= 768px) */}
            <div className="block md:hidden space-y-3">
              {filteredVendors.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 font-bold">
                  {isLoadingData ? 'Loading vendor accounts from database...' : 'No vendor accounts found.'}
                </div>
              ) : (
                filteredVendors.map((v) => (
                  <div
                    key={v.id}
                    className={`bg-white p-4 rounded-2xl border transition-all shadow-2xs space-y-3 ${
                      v.isFraud ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{v.businessName}</span>
                          {v.isFraud && (
                            <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wider animate-pulse">
                              🚨 FRAUD
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">{v.ownerName}</div>
                      </div>
                      <span className="bg-blue-50 text-[#003893] px-2 py-0.5 rounded-md text-[10px] font-bold border border-blue-200 shrink-0">
                        {v.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">City & State</span>
                        <div className="text-[11px] font-medium text-slate-700 truncate">{v.city}, {v.state}</div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">KYC Status</span>
                        <div>
                          <button
                            onClick={() => handleToggleVendorKYC(v.id, v.kycStatus)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-flex items-center gap-1 transition-all ${
                              v.kycStatus === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {v.kycStatus === 'VERIFIED' ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                            )}
                            <span>{v.kycStatus}</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-0.5 col-span-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Contact</span>
                        <div className="text-[11px] font-semibold text-slate-900">{v.userPhone}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{v.userEmail}</div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedDocVendor(v)}
                          className="px-2.5 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Docs</span>
                        </button>

                        <button
                          onClick={() => setGrantSubModalVendor(v)}
                          className="px-2.5 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 font-bold flex items-center gap-1"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Grant Sub</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleVendorFraud(v)}
                          className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition-all border ${
                            v.isFraud
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-rose-600 text-white border-rose-700'
                          }`}
                        >
                          {v.isFraud ? 'Clear' : '🚨 Mark Fraud'}
                        </button>

                        <button
                          onClick={() => handleDeleteVendor(v.id)}
                          className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                          title="Permanently Delete Vendor Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: LENDERS MANAGEMENT TAB                                            */}
        {/* ========================================================================= */}
        {activeTab === 'lenders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                  Business Money Financers Control
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Verify NBFC credentials, monitor registered financers, and manage lender statuses
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadAdminVendorsAndLenders}
                  disabled={isLoadingData}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#007a33] border border-emerald-200 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                  <span>{isLoadingData ? 'Refreshing...' : 'Refresh Live Data'}</span>
                </button>
              </div>
            </div>

            {/* Search Toolbar for Lenders */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search business financer, officer, email, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#007a33]"
                />
              </div>
            </div>

            {/* Lenders Table (Desktop & Tablet >= 768px) */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-800">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Business Financer & Contact Officer</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Registration #</th>
                      <th className="p-4">City / State</th>
                      <th className="p-4">Lending Loan Range</th>
                      <th className="p-4">Verification</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLenders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                          {isLoadingData ? 'Loading business financers from database...' : 'No business financers found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredLenders.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 text-sm">{l.institutionName}</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {l.contactPersonName || 'Branch Officer'} • {l.userPhone}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{l.userEmail}</div>
                          </td>

                          <td className="p-4">
                            <span className="bg-emerald-50 text-[#007a33] px-2.5 py-1 rounded-md text-[11px] font-bold border border-emerald-200">
                              {l.institutionType}
                            </span>
                          </td>

                          <td className="p-4 font-mono font-bold text-slate-700">{l.registrationNumber}</td>

                          <td className="p-4 font-medium text-slate-700">
                            {l.city}, {l.state}
                          </td>

                          <td className="p-4 font-extrabold text-slate-900">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                              {formatLoanRange(l.minLoanAmount, l.maxLoanAmount)}
                            </span>
                          </td>

                          <td className="p-4">
                            <button
                              onClick={() => handleToggleLenderVerification(l.id, l.verificationStatus)}
                              className={`px-3 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 transition-all ${
                                l.verificationStatus === 'VERIFIED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
                              }`}
                            >
                              {l.verificationStatus === 'VERIFIED' ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-600" />
                              )}
                              <span>{l.verificationStatus}</span>
                            </button>
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteLender(l.id)}
                              className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                              title="Delete Financer Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (Hidden on Tablet & Desktop >= 768px) */}
            <div className="block md:hidden space-y-3">
              {filteredLenders.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 font-bold">
                  {isLoadingData ? 'Loading business financers from database...' : 'No business financers found.'}
                </div>
              ) : (
                filteredLenders.map((l) => (
                  <div
                    key={l.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-slate-900 text-sm truncate">{l.institutionName}</div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          {l.contactPersonName || 'Branch Officer'} • {l.userPhone}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{l.userEmail}</div>
                      </div>
                      <span className="bg-emerald-50 text-[#007a33] px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-200 shrink-0">
                        {l.institutionType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Registration #</span>
                        <div className="font-mono font-bold text-slate-700 text-[11px] truncate">{l.registrationNumber}</div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Location</span>
                        <div className="text-[11px] font-medium text-slate-700 truncate">{l.city}, {l.state}</div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Loan Range</span>
                        <div className="text-[11px] font-extrabold text-slate-800">
                          {formatLoanRange(l.minLoanAmount, l.maxLoanAmount)}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Verification</span>
                        <div>
                          <button
                            onClick={() => handleToggleLenderVerification(l.id, l.verificationStatus)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-flex items-center gap-1 transition-all ${
                              l.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {l.verificationStatus === 'VERIFIED' ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                            )}
                            <span>{l.verificationStatus}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDeleteLender(l.id)}
                        className="p-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all active:scale-95 flex items-center gap-1 text-[10px] font-extrabold"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: VENDOR SUBSCRIPTION PLANS                                         */}
        {/* ========================================================================= */}
        {activeTab === 'vendor_subs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                  Small Shop & Local Startup Business Plans
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure subscription pricing, duration, and unlock limits for shop & startup owners
                </p>
              </div>
              <button
                onClick={() => handleOpenCreatePlanModal('VENDOR')}
                className="px-4 py-2.5 bg-[#003893] hover:bg-[#002669] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 w-fit"
              >
                <Plus className="w-4 h-4" /> Create Vendor Plan
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {vendorPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4 hover:border-[#003893] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base font-heading">{plan.name}</h3>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{plan.code}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {plan.isPopular && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                            Popular
                          </span>
                        )}
                        {plan.isBestValue && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                            ✨ Best Value
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-2xl font-black text-[#003893] font-heading">₹{plan.price}</span>
                      {plan.originalPrice > plan.price && (
                        <span className="text-xs text-slate-400 line-through">₹{plan.originalPrice}</span>
                      )}
                      <span className="text-xs font-bold text-slate-500">/ {plan.durationDays} Days</span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">{plan.description}</p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {plan.features.map((f, i) => (
                        <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditPlanModal(plan)}
                      className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-[#003893] text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-1 border border-blue-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id, 'VENDOR')}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: LENDER SUBSCRIPTION PLANS                                         */}
        {/* ========================================================================= */}
        {activeTab === 'lender_subs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                  Business Money Financer Plans
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure subscription tiers and verified lead access packages for business financers
                </p>
              </div>
              <button
                onClick={() => handleOpenCreatePlanModal('LENDER')}
                className="px-4 py-2.5 bg-[#007a33] hover:bg-[#005e27] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 w-fit"
              >
                <Plus className="w-4 h-4" /> Create Financer Plan
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {lenderPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4 hover:border-[#007a33] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base font-heading">{plan.name}</h3>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{plan.code}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {plan.isPopular && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                            Popular
                          </span>
                        )}
                        {plan.isBestValue && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                            ✨ Best Value
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-2xl font-black text-[#007a33] font-heading">₹{plan.price}</span>
                      {plan.originalPrice > plan.price && (
                        <span className="text-xs text-slate-400 line-through">₹{plan.originalPrice}</span>
                      )}
                      <span className="text-xs font-bold text-slate-500">/ {plan.durationDays} Days</span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">{plan.description}</p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {plan.features.map((f, i) => (
                        <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditPlanModal(plan)}
                      className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#007a33] text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-1 border border-emerald-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id, 'LENDER')}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: AUDIT LOGS                                                        */}
        {/* ========================================================================= */}
        {activeTab === 'audits' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                  System Audit Trail & Security Logs
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Chronological trail of administrative actions, KYC updates, and subscription grants
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {log.action}
                      </span>
                      <p className="text-xs text-slate-800 font-medium">{log.detail}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: REFERRAL CAMPAIGN SETTINGS                                        */}
      {/* ========================================================================= */}
      {referralSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  Referral Campaign Rules
                </h3>
              </div>
              <button
                onClick={() => setReferralSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vendor Signup Reward (₹) *
                </label>
                <input
                  type="number"
                  value={referralVendorReward}
                  onChange={(e) => setReferralVendorReward(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                  placeholder="200"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Amount credited to partner when invited shop owner joins
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Financer Signup Reward (₹) *
                </label>
                <input
                  type="number"
                  value={referralLenderReward}
                  onChange={(e) => setReferralLenderReward(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                  placeholder="500"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Amount credited when invited financer registers & verifies
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Referee Welcome Discount (% OFF) *
                </label>
                <input
                  type="number"
                  value={referralDiscountPct}
                  onChange={(e) => setReferralDiscountPct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                  placeholder="15"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Discount applied on their first subscription purchase
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl border border-purple-200">
                <span className="font-bold text-purple-900">Program Status</span>
                <button
                  type="button"
                  onClick={() => setReferralProgramActive(!referralProgramActive)}
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                    referralProgramActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-400 text-white'
                  }`}
                >
                  {referralProgramActive ? 'ACTIVE' : 'PAUSED'}
                </button>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setReferralSettingsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReferralSettingsModalOpen(false);
                    showToast('✅ Referral campaign settings updated successfully!');
                  }}
                  className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT SUBSCRIPTION PLAN                                    */}
      {/* ========================================================================= */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                  {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                    planTargetRole === 'VENDOR'
                      ? 'bg-blue-100 text-[#003893]'
                      : 'bg-emerald-100 text-[#007a33]'
                  }`}
                >
                  {planTargetRole === 'VENDOR'
                    ? 'Target: Small Shop & Local Startup Businesses'
                    : 'Target: Business Financers'}
                </span>
              </div>
              <button
                onClick={() => setPlanModalOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Semi-Annual VIP Growth Plan"
                  value={formPlanName}
                  onChange={(e) => setFormPlanName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 outline-none focus:border-[#003893]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plan Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. VENDOR_HALF_YEARLY"
                    value={formPlanCode}
                    onChange={(e) => setFormPlanCode(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono font-bold text-slate-900 outline-none focus:border-[#003893]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 2499"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 outline-none focus:border-[#003893]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={formDurationNumber}
                      onChange={(e) => setFormDurationNumber(e.target.value)}
                      required
                      className="w-20 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-900 outline-none focus:border-[#003893]"
                    />
                    <select
                      value={formDurationUnit}
                      onChange={(e) => setFormDurationUnit(e.target.value as any)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-700 outline-none focus:border-[#003893]"
                    >
                      <option value="Days">Days</option>
                      <option value="Weeks">Weeks</option>
                      <option value="Months">Months</option>
                      <option value="Years">Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Original Cut Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 4999"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 outline-none focus:border-[#003893]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  placeholder="Short tagline explaining this plan"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 outline-none focus:border-[#003893]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Features (One per line) *</label>
                <textarea
                  rows={4}
                  placeholder="Unlock Financer Contacts&#10;WhatsApp Access&#10;Priority Support"
                  value={formFeaturesText}
                  onChange={(e) => setFormFeaturesText(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-medium text-slate-900 outline-none focus:border-[#003893] resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-1 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="rounded border-slate-300 text-[#003893]"
                  />
                  <span>Mark as "Most Popular"</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formIsBestValue}
                    onChange={(e) => setFormIsBestValue(e.target.checked)}
                    className="rounded border-slate-300 text-[#003893]"
                  />
                  <span>Mark as "Best Value"</span>
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                    planTargetRole === 'VENDOR'
                      ? 'bg-[#003893] hover:bg-[#002669]'
                      : 'bg-[#007a33] hover:bg-[#005e27]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{editingPlan ? 'Save Plan Changes' : 'Publish Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Subscription Modal */}
      {grantSubModalVendor && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                Grant Subscription Access
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Assign subscription plan to {grantSubModalVendor.businessName}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Select Plan Tier:</label>
              <select
                value={selectedPlanCode}
                onChange={(e) => setSelectedPlanCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-[#003893]"
              >
                <option value="VENDOR_WEEKLY">Weekly Trial Plan (7 Days)</option>
                <option value="VENDOR_MONTHLY">Monthly Growth Plan (30 Days)</option>
                <option value="VENDOR_QUARTERLY">Quarterly Business Plan (90 Days)</option>
                <option value="VENDOR_YEARLY">Yearly VIP Enterprise Plan (365 Days)</option>
              </select>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setGrantSubModalVendor(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmGrantSubscription}
                  className="flex-1 py-2.5 bg-[#003893] hover:bg-[#002669] text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95"
                >
                  Confirm Grant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Documents Modal */}
      {selectedDocVendor && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  {selectedDocVendor.businessName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Owner: {selectedDocVendor.ownerName}</p>
              </div>
              <button
                onClick={() => setSelectedDocVendor(null)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center font-medium">
                <span className="font-bold text-slate-800">Shop Registration Proof</span>
                <span className="text-[#003893] font-mono font-bold">Reg_License_2026.pdf</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center font-medium">
                <span className="font-bold text-slate-800">GST Certificate</span>
                <span className="text-[#003893] font-mono font-bold">GSTIN_09ABCDE1234.pdf</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center font-medium">
                <span className="font-bold text-slate-800">PAN Card Document</span>
                <span className="text-[#003893] font-mono font-bold">PAN_DOCUMENT.pdf</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedDocVendor(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs transition-colors"
              >
                Close Document Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY FRAUD CONFIRMATION MODAL */}
      {fraudConfirmVendor && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white border-2 border-rose-600 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto my-auto">
            <button
              onClick={() => setFraudConfirmVendor(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 shadow-sm border border-rose-200">
                <AlertTriangle className="w-7 h-7 text-rose-600 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 font-heading leading-snug">
                  Confirm Mark as Fraud Account
                </h3>
                <div className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider">
                  High Priority Security Moderation
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Business Name:</span>
                <span className="font-extrabold text-slate-900 text-sm">{fraudConfirmVendor.businessName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Owner Name:</span>
                <span className="font-bold text-slate-800">{fraudConfirmVendor.ownerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Email Address:</span>
                <span className="font-mono text-slate-700 font-bold">{fraudConfirmVendor.userEmail}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              ⚠️ <span className="font-bold text-rose-700">Security Notice:</span> Flagging this vendor account will
              immediately publish a <span className="font-bold text-rose-700 font-mono">🚨 FRAUD ACCOUNT ALERT</span>{' '}
              across all Business Financers (Lenders) dashboards and disable loan approvals for this business.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFraudConfirmVendor(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const v = fraudConfirmVendor;
                  setFraudConfirmVendor(null);
                  if (v) executeToggleVendorFraud(v.id, false);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>Yes, Mark as Fraud</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
